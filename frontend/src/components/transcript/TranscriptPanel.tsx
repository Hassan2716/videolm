"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Copy, Check, Download, X } from "lucide-react";
import type { Transcript } from "@/types";
export default function TranscriptPanel({ transcript }: { transcript: Transcript | null }) {
  const [search, setSearch] = useState(""); const [copied, setCopied] = useState(false);
  if (!transcript) return <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Transcript not available</div>;
  const filtered = transcript.segments.filter(s => !search || s.text.toLowerCase().includes(search.toLowerCase()));
  const copy = () => { navigator.clipboard.writeText(transcript.full_text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const dl = () => {
    const c = transcript.segments.map(s => { const m=Math.floor(s.start/60),sec=Math.floor(s.start%60); return `[${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}] ${s.text.trim()}`; }).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([c],{type:"text/plain"})); a.download = "transcript.txt"; a.click();
  };
  return (
    <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Transcript</h2>
          <p className="text-xs text-slate-400 mt-0.5">{transcript.word_count.toLocaleString()} words · {transcript.language.toUpperCase()}{search ? ` · ${filtered.length} matches` : ""}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-all">
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400"/>Copied</> : <><Copy className="w-3.5 h-3.5"/>Copy All</>}
          </button>
          <button onClick={dl} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-all"><Download className="w-3.5 h-3.5"/>Download</button>
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transcript…"
          className="w-full bg-slate-900 border border-white/8 focus:border-blue-500/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-colors"/>
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>}
      </div>
      <div className="bg-slate-900/40 border border-white/7 rounded-2xl p-5 max-h-[65vh] overflow-y-auto space-y-1">
        {filtered.map((seg, i) => {
          const m=Math.floor(seg.start/60),s=Math.floor(seg.start%60);
          return (
            <div key={i} className="flex gap-3 hover:bg-white/3 px-2 py-2 rounded-xl transition-colors group">
              <span className="text-xs font-mono text-blue-400/70 group-hover:text-blue-400 flex-shrink-0 mt-0.5 min-w-[42px]">{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {search ? seg.text.split(new RegExp(`(${search})`,"gi")).map((p,j) =>
                  p.toLowerCase()===search.toLowerCase() ? <mark key={j} className="bg-amber-400/25 text-amber-200 rounded px-0.5">{p}</mark> : p
                ) : seg.text}
              </p>
            </div>
          );
        })}
        {filtered.length===0 && <p className="text-center text-slate-500 text-sm py-8">No matches for "{search}"</p>}
      </div>
    </motion.div>
  );
}
