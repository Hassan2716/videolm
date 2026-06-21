"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, Download, ChevronDown, Loader2, BarChart3, BookOpen, FileText, AlignLeft, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Summary } from "@/types";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TYPES = [
  {id:"short",label:"Executive",icon:AlignLeft,desc:"100-150 words"},
  {id:"medium",label:"Study Notes",icon:BookOpen,desc:"300-500 words"},
  {id:"detailed",label:"Full Notes",icon:FileText,desc:"1000+ words"},
  {id:"bullets",label:"Bullets",icon:AlignLeft,desc:"Key points"},
  {id:"academic",label:"Academic",icon:GraduationCap,desc:"Formal style"},
];
const MODELS = [
  {id:"bart",name:"BART-CNN",color:"#3b82f6",desc:"News-style"},
  {id:"t5",name:"T5-Base",color:"#8b5cf6",desc:"Versatile"},
  {id:"pegasus",name:"PEGASUS",color:"#10b981",desc:"Abstractive"},
  {id:"flan",name:"FLAN-T5",color:"#f59e0b",desc:"Educational"},
];
export default function SummaryPanel({projectId,existingSummaries}:{projectId:string;existingSummaries:Summary[]}) {
  const [activeType,setActiveType]=useState("medium");
  const [activeModel,setActiveModel]=useState("bart");
  const [summaries,setSummaries]=useState<Summary[]>(existingSummaries);
  const [generating,setGenerating]=useState(false);
  const [jobId,setJobId]=useState<string|null>(null);
  const [progress,setProgress]=useState(0);
  const [statusMsg,setStatusMsg]=useState("");
  const [copied,setCopied]=useState(false);
  const [showCompare,setShowCompare]=useState(false);
  const current=summaries.find(s=>s.summary_type===activeType&&s.model_used===activeModel)||summaries.find(s=>s.summary_type===activeType);
  useEffect(()=>{
    if(!jobId) return;
    const iv=setInterval(async()=>{
      try {
        const res=await fetch(`${API}/api/generate/status/${jobId}`);
        const job=await res.json();
        setProgress(job.progress||0); setStatusMsg(job.message||"");
        if(job.status==="complete"){
          const sr=await fetch(`${API}/api/summary/${projectId}`);
          setSummaries(await sr.json());
          setGenerating(false); setJobId(null); clearInterval(iv);
        } else if(job.status==="failed"){
          setStatusMsg(`Error: ${job.error||"Unknown"}`);
          setGenerating(false); setJobId(null); clearInterval(iv);
        }
      } catch { clearInterval(iv); setGenerating(false); }
    },1500);
    return ()=>clearInterval(iv);
  },[jobId,projectId]);
  const generate=async()=>{
    setGenerating(true); setProgress(0); setStatusMsg("Starting…");
    try {
      const res=await fetch(`${API}/api/generate/${projectId}/summary`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({summary_type:activeType,model_key:activeModel})});
      const {job_id}=await res.json(); setJobId(job_id);
    } catch { setGenerating(false); setStatusMsg("Failed to start"); }
  };
  const copy=()=>{if(current){navigator.clipboard.writeText(current.content);setCopied(true);setTimeout(()=>setCopied(false),2000);}};
  const download=()=>{
    if(!current) return;
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([current.content],{type:"text/plain"}));
    a.download=`summary_${activeType}.txt`; a.click();
  };
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">AI Summaries</h2>
        <button onClick={()=>setShowCompare(!showCompare)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-2 rounded-xl transition-all">
          <BarChart3 className="w-3.5 h-3.5"/>Compare Models<ChevronDown className={cn("w-3 h-3 transition-transform",showCompare&&"rotate-180")}/>
        </button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {TYPES.map(t=>(
          <button key={t.id} onClick={()=>setActiveType(t.id)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
              activeType===t.id?"bg-blue-600/20 border-blue-500/40 text-blue-300":"bg-white/3 border-white/8 text-slate-400 hover:text-white")}>
            <t.icon className="w-3.5 h-3.5"/>{t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap mb-5">
        {MODELS.map(m=>(
          <button key={m.id} onClick={()=>setActiveModel(m.id)}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              activeModel===m.id?"text-white":"bg-white/3 border-white/8 text-slate-500 hover:text-slate-300")}
            style={activeModel===m.id?{borderColor:m.color+"60",background:m.color+"18",color:m.color}:{}}>
            <div className="w-2 h-2 rounded-full" style={{background:m.color}}/>{m.name}
          </button>
        ))}
      </div>
      {generating&&(
        <div className="mb-5 bg-blue-600/8 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-2">
            <Loader2 className="w-4 h-4 animate-spin"/>{statusMsg}
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
              animate={{width:`${progress}%`}} transition={{duration:0.5}}/>
          </div>
        </div>
      )}
      {current?(
        <div className="bg-slate-900/60 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400"/>
              <span className="text-sm font-medium text-white capitalize">{TYPES.find(t=>t.id===current.summary_type)?.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{background:(MODELS.find(m=>m.id===current.model_used)?.color||"#3b82f6")+"20",
                        color:MODELS.find(m=>m.id===current.model_used)?.color||"#3b82f6"}}>
                {MODELS.find(m=>m.id===current.model_used)?.name||current.model_used}
              </span>
              <span className="text-xs text-slate-500">{current.word_count}w</span>
            </div>
            <div className="flex gap-2">
              <button onClick={copy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg">
                {copied?<><Check className="w-3.5 h-3.5 text-emerald-400"/>Copied</>:<><Copy className="w-3.5 h-3.5"/>Copy</>}
              </button>
              <button onClick={download} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg">
                <Download className="w-3.5 h-3.5"/>Save
              </button>
              <button onClick={generate} disabled={generating}
                className="flex items-center gap-1.5 text-xs bg-blue-600/20 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-lg disabled:opacity-40">
                <Sparkles className="w-3.5 h-3.5"/>Regenerate
              </button>
            </div>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <SummaryContent content={current.content}/>
          </div>
        </div>
      ):(
        <div className="bg-slate-900/40 border border-dashed border-white/10 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-slate-300 font-medium mb-2">No {TYPES.find(t=>t.id===activeType)?.label} summary yet</p>
          <p className="text-slate-500 text-sm mb-6">Uses TextRank + optional BART — no hallucinations</p>
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-2 mx-auto bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50">
            {generating?<Loader2 className="w-4 h-4 animate-spin"/>:<Sparkles className="w-4 h-4"/>}
            Generate {TYPES.find(t=>t.id===activeType)?.label} Summary
          </button>
        </div>
      )}
      <AnimatePresence>
        {showCompare&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="mt-5 overflow-hidden">
            <h3 className="text-sm font-semibold text-white mb-3">Model Comparison — {activeType}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {MODELS.map(model=>{
                const s=summaries.find(x=>x.summary_type===activeType&&x.model_used===model.id);
                return (
                  <div key={model.id} className="bg-slate-900/60 border rounded-xl p-4" style={{borderColor:model.color+"30"}}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:model.color}}/>
                      <span className="text-sm font-semibold" style={{color:model.color}}>{model.name}</span>
                      {s&&<span className="ml-auto text-xs text-slate-500">{s.word_count}w</span>}
                    </div>
                    {s?<p className="text-xs text-slate-400 line-clamp-4">{s.content}</p>
                      :<button onClick={()=>{setActiveModel(model.id);generate();}} className="text-xs text-slate-500 hover:text-white">Generate with {model.name} →</button>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
function SummaryContent({content}:{content:string}) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {content.split("\n").map((line,i)=>{
        if(!line.trim()) return <div key={i} className="h-2"/>;
        if(line.startsWith("## ")) return <h3 key={i} className="text-blue-300 font-bold text-base mt-4 mb-1">{line.replace("## ","")}</h3>;
        if(line.startsWith("# ")) return <h2 key={i} className="text-white font-bold text-lg mt-4 mb-1">{line.replace("# ","")}</h2>;
        if(line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-white font-semibold">{line.replace(/\*\*/g,"")}</p>;
        if(line.startsWith("• ")||line.startsWith("- ")) return (
          <div key={i} className="flex gap-2.5 text-slate-300">
            <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
            <span>{line.replace(/^[•-]\s/,"")}</span>
          </div>
        );
        return <p key={i} className="text-slate-300">{line}</p>;
      })}
    </div>
  );
}
