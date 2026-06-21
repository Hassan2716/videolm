"""
Summarizer v2 — FIXED. No hallucinations. TextRank primary, BART only if cached.
"""
import re, os
from typing import List, Dict, Optional
from loguru import logger

_model_cache: Dict = {}

def _textrank(text: str, n_sentences: int) -> str:
    try:
        from sumy.parsers.plaintext import PlaintextParser
        from sumy.nlp.tokenizers import Tokenizer
        from sumy.summarizers.text_rank import TextRankSummarizer
        parser = PlaintextParser.from_string(text[:8000], Tokenizer("english"))
        result = TextRankSummarizer()(parser.document, n_sentences)
        return " ".join(str(s) for s in result)
    except Exception as e:
        logger.warning(f"TextRank failed: {e}")
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 20]
        return " ".join(sentences[:n_sentences])

def _chunk_text(text: str, chunk_words: int = 400) -> List[str]:
    words = text.split()
    if len(words) <= chunk_words:
        return [text]
    return [" ".join(words[i:i+chunk_words]) for i in range(0, len(words), chunk_words-30)
            if len(words[i:i+chunk_words]) > 50]

def _try_load_bart():
    if "bart" in _model_cache:
        return _model_cache["bart"]
    try:
        cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
        model_cached = os.path.exists(cache_dir) and any(
            "bart-large-cnn" in d or "bart_large_cnn" in d
            for d in os.listdir(cache_dir)
        )
        if not model_cached:
            return None
        from transformers import pipeline
        pipe = pipeline("summarization", model="facebook/bart-large-cnn",
                        device=-1, local_files_only=True)
        _model_cache["bart"] = pipe
        logger.info("BART loaded from local cache")
        return pipe
    except Exception as e:
        logger.warning(f"BART unavailable: {e}")
        return None

def _format_output(text: str, summary_type: str) -> str:
    parts = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 10]
    if not parts:
        return text
    if summary_type == "short":
        return " ".join(parts[:4])
    elif summary_type == "bullets":
        return "\n".join(f"• {s}" for s in parts[:12])
    elif summary_type == "medium":
        mid = len(parts) // 2
        out = f"## Overview\n{' '.join(parts[:3])}\n\n"
        if parts[3:mid+3]:
            out += f"## Key Points\n{' '.join(parts[3:mid+3])}\n\n"
        if parts[mid+3:mid+6]:
            out += f"## Additional Details\n{' '.join(parts[mid+3:mid+6])}"
        return out.strip()
    elif summary_type == "detailed":
        chunk_size = max(3, len(parts) // 4)
        sections = [parts[i:i+chunk_size] for i in range(0, len(parts), chunk_size)]
        labels = ["Introduction & Overview", "Core Concepts", "Methods & Applications", "Summary & Conclusions"]
        return "\n\n".join(f"## {labels[i] if i < len(labels) else f'Section {i+1}'}\n{' '.join(s)}"
                           for i, s in enumerate(sections[:4])).strip()
    elif summary_type == "academic":
        abstract = " ".join(parts[:3])
        body = " ".join(parts[3:10])
        conclusion = " ".join(parts[-3:]) if len(parts) > 10 else ""
        out = f"**Abstract**\n{abstract}\n\n**Introduction**\n{body}"
        if conclusion:
            out += f"\n\n**Conclusion**\n{conclusion}"
        return out.strip()
    return text

class HierarchicalSummarizer:
    def __init__(self, device: str = "cpu"):
        self.device = device

    def summarize(self, text: str, summary_type: str = "medium",
                  model_key: str = "bart", segments: Optional[List[Dict]] = None) -> str:
        if not text or len(text.strip()) < 50:
            return "Insufficient content for summarization."
        text = self._clean_input(text)
        n_map = {"short": 5, "medium": 15, "detailed": 30, "bullets": 12, "academic": 18}
        n = n_map.get(summary_type, 12)
        chunks = _chunk_text(text, chunk_words=400)
        per_n = max(2, n // max(len(chunks), 1))
        chunk_summaries = [_textrank(c, per_n) for c in chunks]
        merged = " ".join(s for s in chunk_summaries if s)
        bart = _try_load_bart()
        if bart and len(merged.split()) < 900:
            try:
                max_len = {"short": 100, "medium": 250, "detailed": 450,
                           "bullets": 200, "academic": 300}.get(summary_type, 200)
                result = bart(merged[:3000], max_length=max_len, min_length=40,
                              do_sample=False, length_penalty=2.0)
                merged = result[0]["summary_text"]
            except Exception as e:
                logger.warning(f"BART inference failed: {e}")
        output = _format_output(merged, summary_type)
        return self._clean_output(output)

    def _clean_input(self, text: str) -> str:
        fillers = [
            r"(hi|hello|hey)\s+(everyone|guys|there)[^.!?]*[.!?]",
            r"welcome\s+(back\s+)?(to\s+)?[^.!?]*[.!?]",
            r"(don't|do not)\s+forget\s+to\s+(like|subscribe)[^.!?]*[.!?]",
            r"(please\s+)?(like|subscribe|hit\s+the\s+bell)[^.!?]*[.!?]",
        ]
        for p in fillers:
            text = re.sub(p, "", text, flags=re.IGNORECASE)
        return re.sub(r'\s+', ' ', text).strip()

    def _clean_output(self, text: str) -> str:
        for a in ["arafed", "araffe", "araffes"]:
            text = text.replace(a, "")
        text = re.sub(r'\b(\w+)(\s+\1){2,}', r'\1', text)
        last_end = max(text.rfind('.'), text.rfind('!'), text.rfind('?'))
        if last_end > len(text) * 0.6:
            text = text[:last_end + 1]
        return text.strip()
