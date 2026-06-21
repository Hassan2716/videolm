"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Youtube, FileVideo, Brain, MessageSquare, Search, Download, Mic, BookOpen, Zap, Shield, ChevronRight } from "lucide-react";

const FEATURES = [
  { icon: Brain,        title: "Multi-Model Summarization",   desc: "BART, T5, PEGASUS compared side-by-side with extractive + abstractive modes" },
  { icon: Mic,          title: "Whisper Transcription",        desc: "Word-level timestamps, speaker detection, 90+ language support" },
  { icon: MessageSquare,title: "Chat with Video",             desc: "RAG-powered Q&A grounded in your video content with timestamp citations" },
  { icon: Search,       title: "Semantic Search",             desc: "FAISS vector search across transcript, captions, and OCR text" },
  { icon: BookOpen,     title: "Study Tools",                 desc: "Auto-generated flashcards, quizzes, mind maps, and revision notes" },
  { icon: Download,     title: "Export Everything",           desc: "PDF, DOCX, SRT, VTT, JSON, CSV — or bundle all as a ZIP" },
  { icon: FileVideo,    title: "Frame Captioning",            desc: "BLIP-2 visual descriptions + Tesseract OCR from slides and diagrams" },
  { icon: Zap,          title: "GPU Optimized",               desc: "Works on GTX 1650+. Efficient batching and model caching" },
];

const PIPELINE = [
  { step: "01", label: "Input",       desc: "YouTube URL or local video" },
  { step: "02", label: "Audio",       desc: "FFmpeg extraction + normalization" },
  { step: "03", label: "Transcribe",  desc: "Whisper STT + timestamps" },
  { step: "04", label: "Vision",      desc: "BLIP-2 captions + OCR" },
  { step: "05", label: "NLP",         desc: "Chunking + keyphrase extraction" },
  { step: "06", label: "Summarize",   desc: "BART/T5/PEGASUS comparison" },
  { step: "07", label: "Index",       desc: "FAISS vector embeddings" },
  { step: "08", label: "Output",      desc: "Chat, export, study tools" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 bg-grid-dark text-slate-100 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm">🎬</div>
            <span className="font-semibold tracking-tight">VideoLM</span>
            <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-semibold">BETA</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
            <a href="#models" className="hover:text-white transition-colors">Models</a>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all">
            Open App <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/3 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-3xl pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-4 py-1.5 rounded-full mb-8 font-medium">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full pulse-dot" />
            Final Year Project — Free & Open-Source Models Only
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
            <span className="gradient-text">Understand Any Video</span>
            <br />
            <span className="text-white">With AI Intelligence</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste a YouTube URL. Get transcripts, summaries, frame captions, semantic search,
            flashcards, and a NotebookLM-style chat — all powered by free open-source AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:scale-105">
              <Youtube className="w-5 h-5" />
              Analyze a Video
            </Link>
            <a href="#pipeline" className="flex items-center gap-2 glass text-slate-300 font-medium px-6 py-3.5 rounded-xl transition-all hover:bg-white/5">
              See how it works <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        {/* Demo screenshot placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mt-20 max-w-5xl mx-auto"
        >
          <div className="glass rounded-2xl p-1 shadow-2xl shadow-black/50">
            <div className="bg-slate-900 rounded-xl overflow-hidden h-80 flex items-center justify-center relative">
              {/* Fake UI preview */}
              <div className="absolute inset-0 p-6 flex gap-4">
                <div className="w-56 bg-slate-800/60 rounded-xl p-4 flex flex-col gap-3">
                  <div className="h-3 bg-blue-500/40 rounded w-3/4" />
                  <div className="h-2 bg-slate-600/40 rounded w-full" />
                  <div className="h-2 bg-slate-600/40 rounded w-5/6" />
                  <div className="h-24 bg-slate-700/40 rounded-lg mt-2" />
                  <div className="h-2 bg-slate-600/30 rounded w-full" />
                  <div className="h-2 bg-slate-600/30 rounded w-4/5" />
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex gap-2">
                    {["Transcript","Summary","Chat","Frames","Export"].map(t => (
                      <div key={t} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${t === "Summary" ? "bg-blue-600 text-white" : "bg-slate-700/60 text-slate-400"}`}>{t}</div>
                    ))}
                  </div>
                  <div className="flex-1 bg-slate-800/40 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-blue-400/40 rounded w-5/6" />
                        <div className="h-2 bg-slate-600/40 rounded w-full" />
                        <div className="h-2 bg-slate-600/40 rounded w-4/5" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-violet-400/40 rounded w-3/4" />
                        <div className="h-2 bg-slate-600/40 rounded w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
              <span className="relative text-slate-500 text-sm font-medium z-10 mt-32">Dashboard Preview</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-blue-400 font-semibold tracking-widest uppercase mb-3">Capabilities</p>
            <h2 className="text-4xl font-bold gradient-text mb-4">Everything in one platform</h2>
            <p className="text-slate-400 max-w-xl mx-auto">A complete multimodal AI pipeline from URL to insights.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="glass rounded-2xl p-5 hover:border-blue-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-violet-400 font-semibold tracking-widest uppercase mb-3">Architecture</p>
            <h2 className="text-4xl font-bold gradient-text mb-4">8-Stage AI Pipeline</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {PIPELINE.map((p, i) => (
              <motion.div key={p.step} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="glass rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-500/40 font-mono mb-2">{p.step}</div>
                <div className="text-xs font-semibold text-white mb-1">{p.label}</div>
                <div className="text-[10px] text-slate-500">{p.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Models */}
      <section id="models" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-emerald-400 font-semibold tracking-widest uppercase mb-3">Models</p>
          <h2 className="text-4xl font-bold gradient-text mb-10">100% Free & Open-Source</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[["Whisper","Speech-to-Text","#3b82f6"],["BART-large","Summarization","#8b5cf6"],
              ["FLAN-T5","Question Answering","#06b6d4"],["BLIP-2","Frame Captioning","#10b981"],
              ["MiniLM","Embeddings","#f59e0b"],["FAISS","Vector Search","#ef4444"],
              ["Tesseract","OCR","#6366f1"],["KeyBERT","Keyphrases","#ec4899"]].map(([name, role, color]) => (
              <div key={name} className="glass rounded-xl p-4">
                <div className="text-sm font-semibold text-white mb-1">{name}</div>
                <div className="text-xs" style={{ color }}>{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5 text-center">
        <h2 className="text-4xl font-bold gradient-text mb-4">Start analyzing videos</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">Paste a YouTube URL and get full AI analysis in minutes.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-10 py-4 rounded-xl hover:scale-105 transition-all shadow-lg shadow-blue-600/20">
          Open VideoLM <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-600">
        VideoLM © {new Date().getFullYear()} — Final Year Project · Free Open-Source Models
      </footer>
    </div>
  );
}
