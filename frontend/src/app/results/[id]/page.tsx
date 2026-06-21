"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, FileText, Image, MessageSquare, BookOpen, Download, Search, ChevronLeft, Loader2, GitBranch, Mic } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Project, Transcript, Summary, Frame, StudyAsset } from "@/types";
import SummaryPanel    from "@/components/summary/SummaryPanel";
import ChatPanel       from "@/components/chat/ChatPanel";
import QuizPanel       from "@/components/study/QuizPanel";
import ExportPanel     from "@/components/export/ExportPanel";
import MindMapViewer   from "@/components/mindmap/MindMapViewer";
import SearchPanel     from "@/components/search/SearchPanel";
import TranscriptPanel from "@/components/transcript/TranscriptPanel";
import FramesPanel     from "@/components/frames/FramesPanel";
import FlashcardPanel  from "@/components/study/FlashcardPanel";
import AudioPanel      from "@/components/audio/AudioPanel";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TABS=[
  {id:"summary",label:"Summary",icon:Brain},{id:"transcript",label:"Transcript",icon:FileText},
  {id:"frames",label:"Frames",icon:Image},{id:"chat",label:"Chat",icon:MessageSquare,badge:"RAG"},
  {id:"flashcards",label:"Flashcards",icon:BookOpen},{id:"quiz",label:"Quiz",icon:BookOpen},
  {id:"mindmap",label:"Mind Map",icon:GitBranch,badge:"New"},{id:"audio",label:"Audio",icon:Mic},
  {id:"search",label:"Search",icon:Search},{id:"export",label:"Export",icon:Download},
];

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject]       = useState<Project|null>(null);
  const [transcript, setTranscript] = useState<Transcript|null>(null);
  const [summaries, setSummaries]   = useState<Summary[]>([]);
  const [frames, setFrames]         = useState<Frame[]>([]);
  const [studyAssets, setStudyAssets] = useState<StudyAsset[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("summary");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API}/api/projects/${id}`).then(r=>r.json()),
      fetch(`${API}/api/transcript/${id}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`${API}/api/summary/${id}`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/api/frames/${id}`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/api/study/${id}`).then(r=>r.json()).catch(()=>[]),
    ]).then(([p,t,s,f,sa])=>{
      setProject(p); setTranscript(t);
      setSummaries(Array.isArray(s)?s:[]); setFrames(Array.isArray(f)?f:[]);
      setStudyAssets(Array.isArray(sa)?sa:[]);
    }).catch(console.error).finally(()=>setLoading(false));
  }, [id]);

  const refreshStudy = async () => {
    const sa = await fetch(`${API}/api/study/${id}`).then(r=>r.json()).catch(()=>[]);
    setStudyAssets(Array.isArray(sa)?sa:[]);
  };

  const getAsset = (type: string) => studyAssets.find(a=>a.asset_type===type)?.content ?? null;

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3"/><p className="text-slate-400 text-sm">Loading results…</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" style={{fontFamily:"'Inter',sans-serif"}}>
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors flex-shrink-0"><ChevronLeft className="w-3.5 h-3.5"/>Dashboard</Link>
        <div className="h-4 w-px bg-white/10"/>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{project?.title||project?.source_url||project?.source_filename||"Video Analysis"}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {transcript?.word_count&&<span>{transcript.word_count.toLocaleString()} words</span>}
            {project?.duration_seconds&&<span>{Math.floor(project.duration_seconds/60)}:{String(Math.floor(project.duration_seconds%60)).padStart(2,"0")}</span>}
            {frames.length>0&&<span>{frames.length} frames</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full flex-shrink-0">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"/>Ready
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className="w-52 border-r border-white/5 bg-slate-950/50 p-3 flex flex-col gap-1 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left relative",
                tab===t.id?"bg-blue-600/20 text-blue-300 border border-blue-500/30":"text-slate-400 hover:text-white hover:bg-white/5")}>
              <t.icon className="w-4 h-4 flex-shrink-0"/>{t.label}
              {t.badge&&<span className="ml-auto text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-semibold">{t.badge}</span>}
            </button>
          ))}
          <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
            {[{l:"Summaries",v:summaries.length},{l:"Frames",v:frames.length},{l:"Study",v:studyAssets.length}].map(s=>(
              <div key={s.l} className="flex justify-between text-xs px-1"><span className="text-slate-600">{s.l}</span><span className="text-slate-400 font-mono">{s.v}</span></div>
            ))}
          </div>
        </nav>
        <main className="flex-1 overflow-y-auto p-6 min-w-0">
          <AnimatePresence mode="wait">
            {tab==="summary"&&<motion.div key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SummaryPanel projectId={id} existingSummaries={summaries}/></motion.div>}
            {tab==="transcript"&&<motion.div key="t" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><TranscriptPanel transcript={transcript}/></motion.div>}
            {tab==="frames"&&<motion.div key="f" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><FramesPanel frames={frames}/></motion.div>}
            {tab==="chat"&&<motion.div key="c" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ChatPanel projectId={id}/></motion.div>}
            {tab==="flashcards"&&<motion.div key="fl" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><FlashcardPanel projectId={id} existingData={getAsset("flashcard") as any} onGenerated={refreshStudy}/></motion.div>}
            {tab==="quiz"&&<motion.div key="q" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><QuizPanel projectId={id} existingQuiz={getAsset("quiz") as any}/></motion.div>}
            {tab==="mindmap"&&<motion.div key="m" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><MindMapViewer projectId={id} existingData={getAsset("mindmap")} onGenerate={async()=>{const res=await fetch(`${API}/api/generate/${id}/mindmap`,{method:"POST"});const{job_id}=await res.json();await refreshStudy();return{job_id};}}/></motion.div>}
            {tab==="audio"&&<motion.div key="a" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AudioPanel projectId={id}/></motion.div>}
            {tab==="search"&&<motion.div key="se" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SearchPanel projectId={id}/></motion.div>}
            {tab==="export"&&<motion.div key="e" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ExportPanel projectId={id}/></motion.div>}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
