"use client";
import { useState, useEffect, useRef, useCallback } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export type JobStatus = "idle"|"pending"|"running"|"complete"|"failed";
export interface GenerationJob {
  jobId: string|null; status: JobStatus; progress: number;
  message: string; result: unknown; error: string|null;
  start: (endpoint: string, body: Record<string,unknown>) => Promise<void>;
  reset: () => void;
}
export function useGenerationJob(onComplete?: (result: unknown) => void): GenerationJob {
  const [jobId, setJobId] = useState<string|null>(null);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string|null>(null);
  const iv = useRef<ReturnType<typeof setInterval>|null>(null);
  useEffect(() => {
    if (!jobId || status === "complete" || status === "failed") return;
    iv.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/generate/status/${jobId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const job = await res.json();
        setProgress(job.progress||0); setMessage(job.message||"Processing…");
        if (job.status === "complete") {
          setStatus("complete"); setResult(job.result);
          clearInterval(iv.current!); onComplete?.(job.result);
        } else if (job.status === "failed") {
          setStatus("failed"); setError(job.error||"Failed");
          clearInterval(iv.current!);
        } else { setStatus("running"); }
      } catch (e) {
        setStatus("failed"); setError("Connection error"); clearInterval(iv.current!);
      }
    }, 1500);
    return () => { if (iv.current) clearInterval(iv.current); };
  }, [jobId, status]); // eslint-disable-line
  const start = useCallback(async (endpoint: string, body: Record<string,unknown>) => {
    setStatus("pending"); setProgress(0); setMessage("Starting…");
    setError(null); setResult(null); setJobId(null);
    try {
      const res = await fetch(`${API}${endpoint}`,{method:"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setJobId(data.job_id);
    } catch(e) { setStatus("failed"); setError(e instanceof Error ? e.message : "Failed"); }
  }, []);
  const reset = useCallback(() => {
    if (iv.current) clearInterval(iv.current);
    setJobId(null); setStatus("idle"); setProgress(0);
    setMessage(""); setResult(null); setError(null);
  }, []);
  return { jobId, status, progress, message, result, error, start, reset };
}
interface PBProps { status: JobStatus; progress: number; message: string; error: string|null; }
export function JobProgressBar({ status, progress, message, error }: PBProps) {
  if (status === "idle") return null;
  const fail = status === "failed";
  return (
    <div className="rounded-xl border px-4 py-3 text-sm mt-3"
      style={{background:fail?"rgba(239,68,68,0.08)":"rgba(37,99,235,0.08)",
              borderColor:fail?"rgba(239,68,68,0.2)":"rgba(37,99,235,0.2)"}}>
      <div className="flex items-center justify-between mb-2">
        <span style={{color:fail?"#f87171":"#60a5fa"}}>
          {fail ? `Error: ${error}` : message}
        </span>
        {!fail && <span className="text-xs opacity-60" style={{color:"#60a5fa"}}>{progress}%</span>}
      </div>
      {!fail && (
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{width:`${progress}%`,background:"linear-gradient(90deg,#3b82f6,#8b5cf6)"}}/>
        </div>
      )}
    </div>
  );
}
