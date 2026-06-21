"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Circle, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { getProject } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";
import Link from "next/link";

const STAGES = [
  { key: "download",   label: "Download",    icon: "⬇️",  keywords: ["download","input","queued"] },
  { key: "audio",      label: "Audio",       icon: "🎵",  keywords: ["audio","extract"] },
  { key: "transcribe", label: "Transcribe",  icon: "🎙️", keywords: ["whisper","transcrib"] },
  { key: "frames",     label: "Frames",      icon: "🎬",  keywords: ["frame","keyframe","scene"] },
  { key: "caption",    label: "Captions",    icon: "🖼️", keywords: ["caption","blip","visual"] },
  { key: "nlp",        label: "NLP",         icon: "🧠",  keywords: ["nlp","chunk","process"] },
  { key: "summary",    label: "Summaries",   icon: "📝",  keywords: ["summar"] },
  { key: "index",      label: "Index",       icon: "🔍",  keywords: ["index","search","faiss"] },
];

function getStageIdx(stage: string) {
  const s = stage.toLowerCase();
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGES[i].keywords.some(k => s.includes(k))) return i;
  }
  if (s.includes("complete")) return STAGES.length;
  return 0;
}

export default function ProcessPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let stopped = false;
    const poll = async () => {
      while (!stopped) {
        try {
          const p = await getProject(id);
          setProject(p);
          if (p.status === "complete") {
            setTimeout(() => router.push(`/results/${id}`), 1500);
            return;
          }
          if (p.status === "failed") {
            setError(p.error_message || "Processing failed");
            return;
          }
        } catch { setError("Connection lost"); return; }
        await new Promise(r => setTimeout(r, 1500));
      }
    };
    poll();
    return () => { stopped = true; };
  }, [id, router]);

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="glass rounded-2xl p-12 max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-3">Processing Failed</h2>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <Link href="/dashboard" className="flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );

  const activeIdx = project ? getStageIdx(project.current_stage) : -1;

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-dark flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold gradient-text mb-1">Analyzing Video</h1>
              {project && <p className="text-sm text-slate-400 truncate max-w-sm">{project.source_url || project.source_filename}</p>}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{project?.progress ?? 0}%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Progress</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-8">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full shimmer-bar"
              animate={{ width: `${project?.progress ?? 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Stage cards */}
          <div className="grid grid-cols-4 gap-3">
            {STAGES.map((stage, i) => {
              const done = i < activeIdx;
              const active = i === activeIdx && project?.status === "processing";
              return (
                <div key={stage.key} className={cn(
                  "rounded-xl p-3 border text-center transition-all",
                  done   && "bg-emerald-500/5 border-emerald-500/20",
                  active && "bg-blue-600/10 border-blue-500/30",
                  !done && !active && "bg-white/2 border-white/5 opacity-35"
                )}>
                  <div className="text-lg mb-1">{stage.icon}</div>
                  <p className={cn("text-[11px] font-semibold",
                    done && "text-emerald-400", active && "text-blue-300", !done && !active && "text-slate-600"
                  )}>{stage.label}</p>
                  <div className="flex justify-center mt-1">
                    {done   ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> :
                     active ? <Loader2 className="w-3 h-3 text-blue-400 animate-spin" /> :
                              <Circle className="w-3 h-3 text-slate-700" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current stage label */}
          <div className="mt-6 flex items-center gap-2 bg-blue-600/8 border border-blue-500/15 rounded-xl px-4 py-3">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
            <p className="text-sm text-blue-300">{project?.current_stage || "Initializing…"}</p>
          </div>

          {project?.status === "complete" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="mt-5 flex items-center justify-between bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-5 py-4">
              <div>
                <p className="font-semibold text-emerald-400">Analysis Complete!</p>
                <p className="text-sm text-slate-400">Redirecting to results…</p>
              </div>
              <button onClick={() => router.push(`/results/${id}`)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-xl">
                View Results <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
