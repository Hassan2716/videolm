"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGenerationJob, JobProgressBar } from "@/hooks/useGenerationJob";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
interface Card { id:string; front:string; back:string; concept:string; }
interface Props { projectId:string; existingData:{flashcards:Card[];total:number}|null; onGenerated:()=>void; }
export default function FlashcardPanel({projectId,existingData,onGenerated}:Props) {
  const [cards,setCards] = useState<Card[]>(existingData?.flashcards||[]);
  const [flipped,setFlipped] = useState<Set<string>>(new Set());
  const [idx,setIdx] = useState(0);
  const [mode,setMode] = useState<"grid"|"study">("grid");
  const job = useGenerationJob((r:unknown)=>{
    const res=r as {flashcards:Card[]};
    if(res?.flashcards){setCards(res.flashcards);onGenerated();}
  });
  const running = job.status==="running"||job.status==="pending";
  const flip=(id:string)=>setFlipped(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Flashcards</h2>
          {cards.length>0&&<p className="text-xs text-slate-400 mt-0.5">{cards.length} cards · click to flip</p>}
        </div>
        <div className="flex gap-2">
          {cards.length>0&&(
            <button onClick={()=>setMode(m=>m==="grid"?"study":"grid")}
              className="text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-all">
              {mode==="grid"?"Study Mode":"Grid Mode"}
            </button>
          )}
          <button onClick={()=>job.start(`/api/generate/${projectId}/flashcards`,{num_cards:20})}
            disabled={running}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50">
            {running?<><Loader2 className="w-4 h-4 animate-spin"/>Generating…</>
                    :<><Sparkles className="w-4 h-4"/>{cards.length?"Regenerate":"Generate Flashcards"}</>}
          </button>
        </div>
      </div>
      <JobProgressBar status={job.status} progress={job.progress} message={job.message} error={job.error}/>
      {cards.length===0&&job.status==="idle"&&(
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/10 py-20">
          <div className="text-center">
            <div className="text-4xl mb-3">🃏</div>
            <p className="text-slate-400 text-sm mb-1">No flashcards yet</p>
            <p className="text-xs text-slate-600">Cards are built from key concepts found in the transcript</p>
          </div>
        </div>
      )}
      {cards.length>0&&mode==="grid"&&(
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card=>(
            <div key={card.id} onClick={()=>flip(card.id)} className="cursor-pointer" style={{perspective:"1000px"}}>
              <motion.div animate={{rotateY:flipped.has(card.id)?180:0}} transition={{duration:0.35}}
                style={{transformStyle:"preserve-3d"}} className="relative min-h-[140px]">
                <div className="absolute inset-0 bg-slate-900 border border-white/8 rounded-2xl p-5 flex flex-col justify-between"
                  style={{backfaceVisibility:"hidden"}}>
                  <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">{card.concept}</span>
                  <p className="text-sm text-white font-medium leading-relaxed">{card.front}</p>
                  <span className="text-[10px] text-slate-600">Click to reveal</span>
                </div>
                <div className="absolute inset-0 bg-blue-600/10 border border-blue-500/25 rounded-2xl p-5 flex flex-col justify-center"
                  style={{backfaceVisibility:"hidden",transform:"rotateY(180deg)"}}>
                  <p className="text-sm text-slate-200 leading-relaxed">{card.back}</p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      )}
      {cards.length>0&&mode==="study"&&(
        <div className="max-w-md mx-auto">
          <p className="text-center text-xs text-slate-400 mb-4">{idx+1} / {cards.length}</p>
          <div onClick={()=>flip(cards[idx].id)} className="cursor-pointer" style={{perspective:"1000px"}}>
            <motion.div animate={{rotateY:flipped.has(cards[idx].id)?180:0}} transition={{duration:0.4}}
              style={{transformStyle:"preserve-3d"}} className="relative h-56">
              <div className="absolute inset-0 bg-slate-900 border border-white/8 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
                style={{backfaceVisibility:"hidden"}}>
                <p className="text-base font-semibold text-white">{cards[idx].front}</p>
                <p className="text-xs text-slate-600 mt-4">Click to flip</p>
              </div>
              <div className="absolute inset-0 bg-blue-600/10 border border-blue-500/25 rounded-2xl p-8 flex items-center justify-center text-center"
                style={{backfaceVisibility:"hidden",transform:"rotateY(180deg)"}}>
                <p className="text-sm text-slate-200 leading-relaxed">{cards[idx].back}</p>
              </div>
            </motion.div>
          </div>
          <div className="flex justify-between mt-5">
            <button onClick={()=>{setIdx(i=>Math.max(0,i-1));setFlipped(new Set());}}
              disabled={idx===0} className="px-5 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30">← Prev</button>
            <button onClick={()=>{setIdx(i=>Math.min(cards.length-1,i+1));setFlipped(new Set());}}
              disabled={idx===cards.length-1}
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
