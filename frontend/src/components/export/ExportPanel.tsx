"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, File, Code, Archive, CheckSquare, Square, Loader2, Check, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const FORMATS=[{id:"pdf",label:"PDF Report",icon:FileText,desc:"Cover page, all sections, professional layout",color:"#ef4444",ext:".pdf"},
  {id:"docx",label:"Word Document",icon:File,desc:"Editable DOCX with headings and timestamps",color:"#2563eb",ext:".docx"},
  {id:"txt",label:"Plain Text",icon:FileText,desc:"Clean timestamped transcript",color:"#64748b",ext:".txt"},
  {id:"srt",label:"SRT Subtitles",icon:FileText,desc:"Standard subtitle format",color:"#8b5cf6",ext:".srt"},
  {id:"json",label:"JSON Export",icon:Code,desc:"All data in structured JSON",color:"#10b981",ext:".json"},
  {id:"csv",label:"CSV Transcript",icon:FileText,desc:"Spreadsheet-ready transcript",color:"#f59e0b",ext:".csv"},
  {id:"zip",label:"Full Bundle",icon:Archive,desc:"PDF + DOCX + TXT + JSON + SRT in one ZIP",color:"#ec4899",ext:".zip",recommended:true}];
const SECTIONS=[
  {id:"short_summary",label:"Short Summary",group:"Summaries"},{id:"medium_summary",label:"Study Notes",group:"Summaries"},
  {id:"detailed_summary",label:"Detailed Notes",group:"Summaries"},{id:"bullet_summary",label:"Bullet Points",group:"Summaries"},
  {id:"transcript",label:"Full Transcript",group:"Content"},{id:"frame_captions",label:"Frame Captions",group:"Content"},
  {id:"key_timestamps",label:"Key Timestamps",group:"Content"},{id:"flashcards",label:"Flashcards",group:"Study"},
  {id:"quiz",label:"Quiz Questions",group:"Study"},{id:"cover",label:"Cover Page",group:"Other"},
  {id:"metadata",label:"Video Metadata",group:"Other"}];
const GROUPS=["Summaries","Content","Study","Other"];
export default function ExportPanel({projectId}:{projectId:string}) {
  const [fmt,setFmt]=useState("pdf");
  const [secs,setSecs]=useState(["cover","metadata","medium_summary","transcript","frame_captions"]);
  const [status,setStatus]=useState<"idle"|"pending"|"processing"|"complete"|"failed">("idle");
  const [exportId,setExportId]=useState<string|null>(null);
  const [dlUrl,setDlUrl]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [progress,setProgress]=useState(0);
  useEffect(()=>{
    if(!exportId) return;
    const iv=setInterval(async()=>{
      try{const j=await fetch(`${API}/api/export/${exportId}/status`).then(r=>r.json());
        setProgress(j.progress||0);
        if(j.status==="complete"){clearInterval(iv);setStatus("complete");setDlUrl(`${API}/api/export/${exportId}/download`);}
        else if(j.status==="failed"){clearInterval(iv);setStatus("failed");setError("Export failed. Try again or use a different format.");}
        else setStatus("processing");
      } catch{clearInterval(iv);setStatus("failed");}
    },1500);
    return()=>clearInterval(iv);
  },[exportId]);
  const toggle=(id:string)=>setSecs(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const selectGroup=(g:string,all:boolean)=>{const gs=SECTIONS.filter(s=>s.group===g).map(s=>s.id);setSecs(p=>all?[...new Set([...p,...gs])]:p.filter(id=>!gs.includes(id)));};
  const start=async()=>{
    if(!secs.length){setError("Select at least one section");return;}
    setStatus("pending");setDlUrl(null);setError("");setProgress(0);
    try{const j=await fetch(`${API}/api/export/`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({project_id:projectId,format:fmt,content_types:secs})}).then(r=>r.json());setExportId(j.id);}
    catch{setStatus("failed");setError("Backend error — check server is running.");}
  };
  const reset=()=>{setStatus("idle");setExportId(null);setDlUrl(null);setError("");setProgress(0);};
  const cf=FORMATS.find(f=>f.id===fmt)!;
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Export Center</h2><p className="text-xs text-slate-400 mt-0.5">All selected sections are guaranteed to appear</p></div>
        <div className="flex gap-2">
          <button onClick={()=>setSecs(SECTIONS.map(s=>s.id))} className="text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg">Select All</button>
          <button onClick={()=>setSecs([])} className="text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg">Clear All</button>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Format</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FORMATS.map(f=>(
                <button key={f.id} onClick={()=>{setFmt(f.id);reset();}} className="relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center"
                  style={fmt===f.id?{borderColor:f.color+"60",background:f.color+"12"}:{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.07)",color:"#64748b"}}>
                  {f.recommended&&<span className="absolute -top-2 -right-2 text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-bold">BEST</span>}
                  <f.icon className="w-5 h-5" style={{color:fmt===f.id?f.color:"#64748b"}}/>
                  <span className="text-xs font-semibold" style={{color:fmt===f.id?"#fff":"#64748b"}}>{f.label}</span>
                  <span className="text-[10px] opacity-40">{f.ext}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Sections ({secs.length} selected)</p>
            {GROUPS.map(g=>{const gs=SECTIONS.filter(s=>s.group===g);const all=gs.every(s=>secs.includes(s.id));return(
              <div key={g} className="mb-4">
                <div className="flex items-center justify-between mb-2"><p className="text-xs font-semibold text-slate-400">{g}</p><button onClick={()=>selectGroup(g,!all)} className="text-[10px] text-slate-500 hover:text-blue-400">{all?"Deselect all":"Select all"}</button></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {gs.map(s=>{const active=secs.includes(s.id);return(
                    <button key={s.id} onClick={()=>toggle(s.id)} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all text-left",active?"bg-blue-600/12 border-blue-500/30 text-blue-300":"bg-white/2 border-white/7 text-slate-500 hover:text-slate-300")}>
                      {active?<CheckSquare className="w-3.5 h-3.5 text-blue-400 flex-shrink-0"/>:<Square className="w-3.5 h-3.5 text-slate-600 flex-shrink-0"/>}{s.label}
                    </button>);})}
                </div>
              </div>);
            })}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-3">Summary</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400"><span>Format</span><span className="text-white font-medium">{cf.label}</span></div>
              <div className="flex justify-between text-slate-400"><span>Sections</span><span className="text-white font-medium">{secs.length}</span></div>
              <div className="border-t border-white/5 pt-2 flex flex-wrap gap-1">
                {secs.slice(0,6).map(id=><span key={id} className="bg-white/5 text-slate-400 px-2 py-0.5 rounded-md text-[10px]">{SECTIONS.find(s=>s.id===id)?.label}</span>)}
                {secs.length>6&&<span className="text-slate-500 text-[10px] px-2">+{secs.length-6} more</span>}
              </div>
            </div>
          </div>
          <button onClick={start} disabled={status==="pending"||status==="processing"||!secs.length}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50">
            {status==="pending"||status==="processing"?<><Loader2 className="w-4 h-4 animate-spin"/>Generating…</>:<><Download className="w-4 h-4"/>Generate Export</>}
          </button>
          {(status==="pending"||status==="processing")&&<div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" animate={{width:`${progress||30}%`}} transition={{duration:0.5}}/></div>}
          <AnimatePresence>
            {status==="complete"&&dlUrl&&(
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-2">
                <a href={dlUrl} download className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 py-3 rounded-xl font-medium text-sm">
                  <Download className="w-4 h-4"/>Download {cf.label}<ExternalLink className="w-3.5 h-3.5 opacity-60"/>
                </a>
                <button onClick={reset} className="w-full text-xs text-slate-500 hover:text-white py-2 flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3"/>Export Again</button>
              </motion.div>
            )}
          </AnimatePresence>
          {status==="failed"&&<div className="flex gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/><div><p className="font-medium">Failed</p><p className="text-xs text-red-300/70 mt-0.5">{error}</p><button onClick={reset} className="text-xs text-red-400 mt-2">Try again →</button></div></div>}
        </div>
      </div>
    </motion.div>
  );
}
