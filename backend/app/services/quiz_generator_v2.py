"""Quiz & Flashcard generator v2 — concept-based, no hallucinations."""
import re, uuid
from typing import List, Dict, Optional
from collections import Counter
from loguru import logger

NON_EDU = [
    r"^(hi|hello|hey|good\s+(morning|afternoon|evening))\b",
    r"\b(subscribe|like\s+and\s+comment|hit\s+the\s+bell)\b",
    r"\b(my\s+name\s+is|i\s+am\s+your\s+host|welcome\s+back)\b",
    r"\b(today\s+we('re| are)\s+going\s+to|in\s+this\s+video)\b",
    r"\b(thank\s+you\s+for\s+watching|see\s+you\s+in\s+the\s+next)\b",
    r"\b(let('s| us)\s+(get\s+started|begin|dive\s+in))\b",
]

def _is_educational(s: str) -> bool:
    if len(s.split()) < 8: return False
    sl = s.lower()
    return not any(re.search(p, sl) for p in NON_EDU)

def _filter_transcript(text: str) -> str:
    return " ".join(s for s in re.split(r'(?<=[.!?])\s+', text) if _is_educational(s))

def extract_concepts(text: str, top_n: int = 20) -> List[str]:
    try:
        from keybert import KeyBERT
        kw = KeyBERT()
        kws = kw.extract_keywords(text[:5000], keyphrase_ngram_range=(1,3),
                                   stop_words="english", top_n=top_n*2,
                                   use_maxsum=True, nr_candidates=40)
        concepts = [k[0] for k in kws if k[1] > 0.15]
        if concepts:
            logger.info(f"KeyBERT: {len(concepts)} concepts")
            return concepts[:top_n]
    except Exception:
        pass

    stop = {"the","a","an","and","or","but","in","on","at","to","for","of","with",
            "is","are","was","were","be","been","have","has","had","do","does","did",
            "will","would","could","should","this","that","these","those","i","we",
            "you","he","she","it","they","what","how","when","where","why","very",
            "just","also","so","then","than","as","if","not","no","can","its"}
    words = re.findall(r'\b[a-zA-Z][a-z]{2,}\b', text)
    wl = [w.lower() for w in words if w.lower() not in stop]
    uni = Counter(wl)
    wlist = text.split()
    bigrams = []
    for i in range(len(wlist)-1):
        w1 = re.sub(r'[^a-zA-Z]','',wlist[i]).lower()
        w2 = re.sub(r'[^a-zA-Z]','',wlist[i+1]).lower()
        if w1 and w2 and w1 not in stop and w2 not in stop and len(w1)>3 and len(w2)>3:
            bigrams.append(f"{w1} {w2}")
    bi = Counter(bigrams)
    concepts, seen = [], set()
    for phrase, cnt in bi.most_common(top_n):
        if cnt >= 2 and phrase not in seen:
            concepts.append(phrase)
            seen.add(phrase)
            for w in phrase.split(): seen.add(w)
    for word, cnt in uni.most_common(top_n*2):
        if cnt >= 2 and word not in seen and len(concepts) < top_n:
            concepts.append(word); seen.add(word)
    logger.info(f"TF-IDF: {len(concepts)} concepts")
    return concepts[:top_n]

def _find_definition(text: str, concept: str) -> Optional[str]:
    ce = re.escape(concept)
    sents = re.split(r'(?<=[.!?])\s+', text)
    for s in sents:
        if not _is_educational(s): continue
        if concept.lower() not in s.lower(): continue
        if re.search(rf'\b{ce}\s+(is|are|refers to|means|defined as)', s, re.IGNORECASE):
            return s.strip()
    for s in sents:
        if concept.lower() in s.lower() and _is_educational(s) and len(s.split()) > 12:
            return s.strip()
    return None

def _mcq_template(concept: str, definition: str) -> Dict:
    words = definition.split()
    correct = " ".join(words[:15]) + ("…" if len(words)>15 else "")
    return {
        "type":"mcq","concept":concept,
        "question":f"Which of the following best describes '{concept}'?",
        "options":{"A":correct,"B":f"An approach unrelated to {concept}",
                   "C":f"The opposite of {concept}","D":f"A different technique entirely"},
        "correct":"A","explanation":definition[:200],"difficulty":"medium",
    }

def _tf_template(concept: str, definition: str) -> Dict:
    short = " ".join(definition.split()[:12])
    return {
        "type":"true_false","concept":concept,
        "question":f"True or False: {short}",
        "answer":"true","difficulty":"easy",
        "explanation":f"Correct — this describes {concept} as explained in the video.",
    }

def _fill_template(concept: str, definition: str) -> Dict:
    q = re.sub(re.escape(concept), "_____", definition[:120], count=1, flags=re.IGNORECASE)
    if "_____" not in q: q = f"_____ {definition[len(concept):80]}"
    return {"type":"fill_blank","concept":concept,"question":q,
            "answer":concept,"hint":"A key concept from the video","difficulty":"medium"}

_flan = None
def _get_flan():
    global _flan
    if _flan: return _flan
    try:
        from transformers import pipeline
        _flan = pipeline("text2text-generation",model="google/flan-t5-base",device=-1)
        return _flan
    except Exception: return None

def _mcq_flan(concept: str, context: str) -> Optional[Dict]:
    pipe = _get_flan()
    if not pipe: return None
    prompt = (f"Create a multiple choice question about '{concept}'.\n"
              f"Context: {context[:400]}\n"
              f"Q: [question]\nA) [correct]\nB) [wrong]\nC) [wrong]\nD) [wrong]\n"
              f"Correct: A\nExplanation: [brief]")
    try:
        out = pipe(prompt, max_new_tokens=180, do_sample=False)[0].get("generated_text","")
        lines = [l.strip() for l in out.split("\n") if l.strip()]
        q,opts,correct,expl = "","{}","A",""
        ops = {}
        for l in lines:
            if l.startswith("Q:"): q = l[2:].strip()
            elif l.startswith("A)"): ops["A"] = l[2:].strip()
            elif l.startswith("B)"): ops["B"] = l[2:].strip()
            elif l.startswith("C)"): ops["C"] = l[2:].strip()
            elif l.startswith("D)"): ops["D"] = l[2:].strip()
            elif l.startswith("Correct:"): correct = l.split(":")[-1].strip()
            elif l.startswith("Explanation:"): expl = l[12:].strip()
        if q and len(ops) >= 2:
            return {"type":"mcq","concept":concept,"question":q,"options":ops,
                    "correct":correct,"explanation":expl or context[:150],"difficulty":"medium"}
    except Exception as e:
        logger.debug(f"FLAN MCQ failed: {e}")
    return None

def _valid(q: Dict) -> bool:
    t = q.get("question","")
    if len(t.split()) < 6: return False
    bad = ["what is being described","who is speaking","the speaker",
           "at what timestamp","my name","in this video","the presenter"]
    return not any(b in t.lower() for b in bad)

class QuizGenerator:
    def generate(self, text, segments=None, num_questions=10,
                 difficulty="medium", question_types=None) -> Dict:
        if question_types is None: question_types = ["mcq","true_false","fill_blank"]
        filtered = _filter_transcript(text)
        if len(filtered.split()) < 50: filtered = text
        concepts = extract_concepts(filtered, top_n=num_questions*3)
        if not concepts: return {"questions":[],"error":"No concepts extracted"}
        concept_defs = {}
        for c in concepts:
            d = _find_definition(filtered, c)
            if d: concept_defs[c] = d
        if not concept_defs:
            for c in concepts[:num_questions]:
                sents = [s for s in re.split(r'(?<=[.!?])\s+', filtered)
                         if c.lower() in s.lower() and len(s.split()) > 8]
                if sents: concept_defs[c] = sents[0]
        questions = []
        types = question_types * (num_questions//len(question_types)+1)
        for i,(concept,defn) in enumerate(list(concept_defs.items())[:num_questions]):
            if len(questions) >= num_questions: break
            qt = types[i % len(types)]
            q = None
            try:
                if qt == "mcq":
                    q = _mcq_flan(concept, defn)
                    if not q or not _valid(q): q = _mcq_template(concept, defn)
                elif qt == "true_false": q = _tf_template(concept, defn)
                elif qt == "fill_blank": q = _fill_template(concept, defn)
                if q and _valid(q): questions.append(q)
            except Exception as e:
                logger.warning(f"Q gen failed for {concept}: {e}")
        return {"questions":questions,"total":len(questions),
                "difficulty":difficulty,"concepts_covered":[q.get("concept") for q in questions]}
