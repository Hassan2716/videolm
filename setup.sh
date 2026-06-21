#!/usr/bin/env bash
set -e
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  VideoLM — AI Video Summarization Tool   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

command -v python3 >/dev/null || { echo "❌ python3 required"; exit 1; }
command -v node    >/dev/null || { echo "❌ node required"; exit 1; }
command -v ffmpeg  >/dev/null || echo "⚠️  ffmpeg not found — install it first"
command -v tesseract >/dev/null || echo "⚠️  tesseract not found — install it first"

[ ! -f ".env" ] && cp .env.example .env && echo "✅ .env created"

echo ""
echo "📦 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
pip install --upgrade pip -q
pip install -r requirements.txt -q
cd ..
echo "✅ Backend ready"

echo ""
echo "📦 Setting up frontend..."
cd frontend && npm install --silent && cd ..
echo "✅ Frontend ready"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Setup Complete!                         ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Backend:   cd backend && uvicorn app.main:app --reload"
echo "║  Frontend:  cd frontend && npm run dev"
echo "║                                          ║"
echo "║  App:       http://localhost:3000        ║"
echo "║  API Docs:  http://localhost:8000/docs   ║"
echo "╚══════════════════════════════════════════╝"
