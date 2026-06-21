"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Clock, FileText, Image, Hash, X } from "lucide-react";
import { cn } from "@/lib/utils";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SRC:Record<string,{icon:typeof FileText;color:string;label:string}> = {
  transcript:{icon:FileText,color:"#3b82f6",label:"Transcript"},
  frame_caption:{icon:Image,color:"#8b5cf6",label:"Frame Caption"},
  slide_text:{icon:Hash,color:"#10b981",label:"Slide Text"},
  ocr:{icon:Hash,color:"#f59e0b",label:"OCR Text"},
};
const QUICK=["key concepts","main algorithm","definition","example","conclusion","how does it work","comparison","formula"];
interface Result { text:string; source:string; timestamp:string|null; score:number; }
export default function SearchPanel({projectId}:{projectId:string}) {
  const [query,setQuery]=useState(""); const [results,setResults]=useState<Result[]>([]);
  const [loading,setLoading]=useState(false); const [searched,setSearched]=useState(false);
  const [topK,setTopK]=useState(8); const inputRef=useRef<HTMLInputElement>(null);
  const search=async(q?:string)=>{
    const sq=(q||query).trim(); if(!sq) return;
    setQuery(sq); setLoading(true); setSearched(true);
    try {
      const res=await fetch(`${API}/api/search/`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({project_id:projectId,query:sq,top_k:topK,search_type:"semantic"})});
      setResults(await res.json()||[]);
    } catch { setResults([]); } finally { setLoading(false); }
  };
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">AI Search</h2>
        <p className="text-xs text-slate-400 mt-0.5">Semantic search across transcript, captions, and slide text</p>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&search()}
            placeholder="Search video content… e.g. 'gradient descent', 'neural network'"
            className="w-full bg-slate-900 border border-white/8 focus:border-blue-500/50 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-colors"/>
          {query&&<button onClick={()=>{setQuery("");setResults([]);setSearched(false);inputRef.current?.focus();}} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>}
        </div>
        <button onClick={()=>search()} disabled={!query.trim()||loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-5 rounded-xl font-medium text-sm transition-all">
          {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Search className="w-4 h-4"/>}Search
        </button>
      </div>
      {!searched&&(
        <div className="mb-6">
          <p className="text-xs text-slate-600 mb-2 uppercase tracking-wider">Quick searches</p>
          <div className="flex flex-wrap gap-2">
            {QUICK.map(q=><button key={q} onClick={()=>search(q)} className="text-xs text-slate-400 hover:text-white bg-white/3 hover:bg-white/8 border border-white/5 px-3 py-1.5 rounded-lg transition-all">{q}</button>)}
          </div>
        </div>
      )}
      {searched&&!loading&&(
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            {results.length>0?<><span className="text-white font-medium">{results.length}</span> results for "{query}"</>
              :<span className="text-slate-500">No results — try different keywords</span>}
          </p>
          <select value={topK} onChange={e=>setTopK(Number(e.target.value))}
            className="bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-2 py-1 text-xs outline-none">
            {[5,8,12,20].map(n=><option key={n} value={n}>Top {n}</option>)}
          </select>
        </div>
      )}
      {loading&&<div className="flex flex-col items-center py-12 gap-3"><Loader2 className="w-6 h-6 text-blue-400 animate-spin"/><p className="text-sm text-slate-400">Searching…</p></div>}
      <div className="space-y-3">
        <AnimatePresence>
          {results.map((r,i)=>{
            const src=SRC[r.source]||SRC.transcript;
            const pct=Math.round(r.score*100);
            return (
              <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className="bg-slate-900/60 border border-white/7 rounded-2xl p-5 hover:border-white/15 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{background:src.color+"15",color:src.color}}>
                    <src.icon className="w-3 h-3"/>{src.label}
                  </div>
                  {r.timestamp&&<div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full font-mono"><Clock className="w-3 h-3"/>{r.timestamp}</div>}
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width:`${pct}%`}}/></div>
                    <span className="text-[10px] text-slate-500 font-mono">{pct}%</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {query?r.text.split(new RegExp(`(${query})`,"gi")).map((p,j)=>
                    p.toLowerCase()===query.toLowerCase()?<mark key={j} className="bg-blue-400/20 text-blue-200 rounded px-0.5">{p}</mark>:p)
                  :r.text}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {searched&&!loading&&results.length===0&&(
        <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-4">
          <p className="text-sm text-amber-300 font-medium mb-1">No results found</p>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Try single words instead of phrases</li>
            <li>• Make sure the video has been fully processed</li>
            <li>• The search index builds from transcript + captions + OCR</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
}
