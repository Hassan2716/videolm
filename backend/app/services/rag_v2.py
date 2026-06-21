"""RAG v2 — TF-IDF retrieval. No sentence_transformers needed."""
import os, re, pickle
from typing import List, Dict, Any, Tuple, Optional
from loguru import logger
from app.core.config import settings

_indexes: Dict = {}

class TFIDFRetriever:
    def __init__(self):
        self.docs = []; self.tfidf_matrix = None; self.vectorizer = None

    def build(self, docs: List[Dict]):
        self.docs = docs
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.vectorizer = TfidfVectorizer(max_features=5000, stop_words="english", ngram_range=(1,2))
            self.tfidf_matrix = self.vectorizer.fit_transform([d["text"] for d in docs])
            logger.info(f"TF-IDF built: {len(docs)} docs")
        except Exception as e:
            logger.warning(f"TF-IDF build failed: {e}")

    def search(self, query: str, top_k: int = 6) -> List[Dict]:
        if self.vectorizer is None:
            return self._keyword(query, top_k)
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np
            q = self.vectorizer.transform([query])
            scores = cosine_similarity(q, self.tfidf_matrix).flatten()
            idxs = np.argsort(scores)[::-1][:top_k]
            return [{**self.docs[i], "score": float(scores[i])} for i in idxs if scores[i] > 0.01]
        except Exception as e:
            logger.warning(f"TF-IDF search failed: {e}")
            return self._keyword(query, top_k)

    def _keyword(self, query: str, top_k: int) -> List[Dict]:
        qw = set(re.findall(r'\b\w{3,}\b', query.lower()))
        scored = []
        for doc in self.docs:
            dw = set(re.findall(r'\b\w{3,}\b', doc["text"].lower()))
            overlap = len(qw & dw)
            if overlap > 0:
                scored.append({**doc, "score": overlap / max(len(qw), 1)})
        return sorted(scored, key=lambda x: x["score"], reverse=True)[:top_k]

def _ts(s) -> str:
    try:
        s = float(s); h,m,sec = int(s//3600),int((s%3600)//60),int(s%60)
        return f"{h:02d}:{m:02d}:{sec:02d}" if h else f"{m:02d}:{sec:02d}"
    except: return "00:00"

def _chunk_segs(segments, target=150, overlap=20):
    result, cur, cur_start, cur_end = [], [], None, 0
    for seg in segments:
        words = seg.get("text","").split()
        if cur_start is None: cur_start = seg.get("start",0)
        cur.extend(words); cur_end = seg.get("end", cur_start)
        if len(cur) >= target:
            result.append({"text":" ".join(cur),"start":cur_start,"end":cur_end})
            cur = cur[-overlap:]; cur_start = seg.get("start", cur_end)
    if len(cur) > 20:
        result.append({"text":" ".join(cur),"start":cur_start,"end":cur_end})
    return result

def build_index(project_id, full_text, segments, frames, chunks=None):
    docs = []
    seg_chunks = _chunk_segs(segments, 150, 20) if segments else []
    if seg_chunks:
        for c in seg_chunks:
            docs.append({"text":c["text"],"source":"transcript",
                         "start":c["start"],"end":c["end"],"timestamp":_ts(c["start"])})
    else:
        words = full_text.split()
        for i in range(0, len(words), 150):
            docs.append({"text":" ".join(words[i:i+150]),"source":"transcript",
                         "start":None,"end":None,"timestamp":None})
    for f in frames:
        if f.get("caption") and len(f["caption"]) > 15:
            docs.append({"text":f["caption"],"source":"frame_caption",
                         "start":f.get("ts",0),"end":f.get("ts",0),"timestamp":_ts(f.get("ts",0))})
        if f.get("ocr") and len(f["ocr"]) > 20:
            docs.append({"text":f["ocr"],"source":"slide_text",
                         "start":f.get("ts",0),"end":f.get("ts",0),"timestamp":_ts(f.get("ts",0))})
    if not docs: return
    r = TFIDFRetriever(); r.build(docs); _indexes[project_id] = r
    path = os.path.join(settings.faiss_index_dir, project_id)
    os.makedirs(path, exist_ok=True)
    try:
        with open(os.path.join(path,"tfidf.pkl"),"wb") as f:
            pickle.dump({"docs":r.docs,"vectorizer":r.vectorizer,"tfidf_matrix":r.tfidf_matrix},f)
    except Exception as e:
        logger.warning(f"Could not save index: {e}")

def retrieve(project_id, query, top_k=6):
    r = _indexes.get(project_id)
    if r is None:
        path = os.path.join(settings.faiss_index_dir, project_id, "tfidf.pkl")
        if os.path.exists(path):
            try:
                with open(path,"rb") as f: data = pickle.load(f)
                r = TFIDFRetriever(); r.docs=data["docs"]
                r.vectorizer=data["vectorizer"]; r.tfidf_matrix=data["tfidf_matrix"]
                _indexes[project_id] = r
            except Exception as e:
                logger.warning(f"Index load failed: {e}")
    if r is None: return _db_fallback(project_id, query, top_k)
    return r.search(query, top_k)

def _db_fallback(project_id, query, top_k):
    try:
        from app.core.database import SessionLocal, Transcript
        db = SessionLocal()
        t = db.query(Transcript).filter(Transcript.project_id==project_id).first()
        db.close()
        if not t or not t.full_text: return []
        sents = re.split(r'(?<=[.!?])\s+', t.full_text)
        qw = set(re.findall(r'\b\w{3,}\b', query.lower()))
        scored = []
        for s in sents:
            ow = len(qw & set(re.findall(r'\b\w{3,}\b', s.lower())))
            if ow > 0: scored.append({"text":s,"source":"transcript","start":None,
                                       "timestamp":None,"score":ow/max(len(qw),1)})
        return sorted(scored, key=lambda x:x["score"], reverse=True)[:top_k]
    except Exception as e:
        logger.error(f"DB fallback failed: {e}"); return []

_qa_model = None
def _get_qa():
    global _qa_model
    if _qa_model: return _qa_model
    try:
        from transformers import pipeline
        _qa_model = pipeline("text2text-generation",model="google/flan-t5-base",device=-1)
        logger.info("FLAN-T5 loaded for chat")
        return _qa_model
    except Exception as e:
        logger.warning(f"FLAN-T5 failed: {e}"); return None

ANSWER_PROMPT = """Based on these excerpts from a video, answer the question clearly and educationally.
Mention timestamps when available. Only use the provided context.

Context:
{context}

Question: {question}

Answer:"""

async def generate_answer(project_id, question, include_citations=True):
    results = retrieve(project_id, question, top_k=6)
    if not results:
        return ("I couldn't find relevant content. Make sure the video is fully processed "
                "and try rephrasing with different keywords.", [])
    context = "\n\n".join(
        f"[{r['timestamp']}] {r['text']}" if r.get("timestamp") else r["text"]
        for r in results[:5]
    )
    answer = _gen_answer(question, context)
    citations = []
    if include_citations:
        for r in results[:3]:
            if r.get("timestamp"):
                citations.append({"timestamp":r["timestamp"],
                                   "text":r["text"][:150],"source":r.get("source","transcript"),
                                   "score":round(r.get("score",0),3)})
    return answer, citations

def _gen_answer(question, context):
    pipe = _get_qa()
    if pipe:
        try:
            prompt = ANSWER_PROMPT.format(context=context[:2000], question=question)
            result = pipe(prompt, max_new_tokens=300, do_sample=False, repetition_penalty=1.3)
            text = result[0].get("generated_text","")
            if "Answer:" in text: text = text.split("Answer:")[-1].strip()
            if text and len(text) > 10: return text
        except Exception as e:
            logger.warning(f"FLAN answer failed: {e}")
    return f"Based on the video content: {context[:400]}..."
