# 🎓 VideoLM — NLP-Based Intelligent Video Summarization & Accessibility Tool

A production-ready multimodal AI platform inspired by NotebookLM, built for educational YouTube videos.

## ✨ Features
- YouTube URL + local video processing
- Whisper speech-to-text with timestamps
- BART/T5/PEGASUS summarization comparison
- BLIP-2 frame captioning integration
- RAG-based chat with video
- Semantic search (FAISS/ChromaDB)
- OCR from slides (Tesseract + EasyOCR)
- AI flashcards, quizzes, mind maps
- Full export system (PDF, DOCX, SRT, JSON, ZIP)
- Accessibility narration (Coqui TTS)
- NotebookLM-style chat interface

## 🚀 Quick Start

### Prerequisites
- Python 3.11+, Node.js 20+, FFmpeg, Tesseract OCR
- GPU: GTX 1650+ (CPU fallback supported)

### Setup
```bash
cp .env.example .env
# Backend
cd backend && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## 📁 Structure
```
videolm/
├── backend/          FastAPI + AI pipeline
├── frontend/         React + Tailwind + ShadCN
├── docker/           Docker Compose
└── docs/             Architecture diagrams
```
