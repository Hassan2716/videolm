"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Youtube, FileVideo, Trash2, Clock, CheckCircle2, AlertCircle, Loader2, BarChart3, ArrowRight, Play } from "lucide-react";
import { listProjects, deleteProject, submitYouTube, uploadVideo, getYouTubeInfo } from "@/lib/api";
import { cn, isValidYouTube, formatDuration, formatRelative, STATUS_COLORS } from "@/lib/utils";
import type { Project } from "@/types";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

function StatusIcon({ s }: { s: string }) {
  if (s === "complete")   return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (s === "failed")     return <AlertCircle   className="w-4 h-4 text-red-400" />;
  if (s === "processing") return <Loader2       className="w-4 h-4 text-blue-400 animate-spin" />;
  return <Clock className="w-4 h-4 text-slate-500" />;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [ytUrl, setYtUrl] = useState("");
  const [ytInfo, setYtInfo] = useState<Record<string, unknown> | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"youtube"|"upload">("youtube");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await listProjects();
      setProjects(data);
    } catch { /* api not running */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const handleYtChange = async (url: string) => {
    setYtUrl(url); setYtInfo(null);
    if (isValidYouTube(url)) {
      setYtLoading(true);
      try { const i = await getYouTubeInfo(url); setYtInfo(i); } catch { }
      finally { setYtLoading(false); }
    }
  };

  const handleYtSubmit = async () => {
    if (!isValidYouTube(ytUrl)) return setError("Invalid YouTube URL");
    setSubmitting(true); setError("");
    try {
      const p = await submitYouTube(ytUrl);
      router.push(`/process/${p.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally { setSubmitting(false); }
  };

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: { "video/*": [".mp4",".avi",".mov",".webm",".mkv"] },
    maxFiles: 1,
  });

  const handleFileSubmit = async () => {
    if (!acceptedFiles[0]) return;
    setSubmitting(true); setError("");
    try {
      const p = await uploadVideo(acceptedFiles[0]);
      router.push(`/process/${p.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-dark flex">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/5 flex flex-col p-4 fixed h-full z-10">
        <Link href="/" className="flex items-center gap-2.5 mb-8 px-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm">🎬</div>
          <span className="font-semibold tracking-tight">VideoLM</span>
        </Link>

        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-2 mb-2">Recent Projects</p>
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {projects.slice(0, 15).map(p => (
            <div
              key={p.id}
              onClick={() => p.status === "complete" ? router.push(`/results/${p.id}`) : router.push(`/process/${p.id}`)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all group"
            >
              <StatusIcon s={p.status} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">
                  {p.title || p.source_url?.slice(-30) || p.source_filename || "Video"}
                </p>
                <p className="text-[10px] text-slate-600">{formatRelative(p.created_at)}</p>
              </div>
            </div>
          ))}
          {!loading && projects.length === 0 && (
            <p className="text-xs text-slate-600 px-3 py-2">No projects yet</p>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 p-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-bold gradient-text mb-2">New Analysis</h1>
            <p className="text-slate-400 text-sm">Paste a YouTube URL or upload a video to begin AI analysis.</p>
          </div>

          {/* Input card */}
          <div className="glass rounded-2xl overflow-hidden mb-8">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {(["youtube","upload"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all",
                    tab === t ? "text-white border-b-2 border-blue-500 bg-white/3" : "text-slate-500 hover:text-slate-300")}>
                  {t === "youtube" ? <Youtube className="w-4 h-4" /> : <FileVideo className="w-4 h-4" />}
                  {t === "youtube" ? "YouTube URL" : "Upload Video"}
                </button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {tab === "youtube" ? (
                  <motion.div key="yt" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-4">
                    <div className="relative">
                      <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        value={ytUrl} onChange={e => handleYtChange(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full bg-slate-900 border border-white/8 focus:border-blue-500/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
                      />
                      {ytLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />}
                    </div>

                    {ytUrl && <p className={cn("text-xs", isValidYouTube(ytUrl) ? "text-emerald-400" : "text-red-400")}>
                      {isValidYouTube(ytUrl) ? "✓ Valid YouTube URL" : "✗ Invalid URL"}
                    </p>}

                    {ytInfo && (
                      <div className="bg-slate-900 rounded-xl p-4 flex gap-3">
                        {ytInfo.thumbnail && <img src={ytInfo.thumbnail as string} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{ytInfo.title as string}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{ytInfo.uploader as string}</p>
                          {ytInfo.duration && <p className="text-xs text-slate-500">{formatDuration(ytInfo.duration as number)}</p>}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="up" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                    <div {...getRootProps()} className={cn(
                      "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
                      isDragActive ? "border-blue-500 bg-blue-500/5" : "border-white/10 hover:border-blue-500/40"
                    )}>
                      <input {...getInputProps()} />
                      <FileVideo className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                      {acceptedFiles[0] ? (
                        <p className="text-sm text-white font-medium">{acceptedFiles[0].name}</p>
                      ) : (
                        <>
                          <p className="text-sm text-slate-300">Drop video here or <span className="text-blue-400">browse</span></p>
                          <p className="text-xs text-slate-600 mt-1">MP4 · AVI · MOV · WebM · MKV · Max 2GB</p>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <div className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{error}</div>}

              <button
                onClick={tab === "youtube" ? handleYtSubmit : handleFileSubmit}
                disabled={submitting || (tab === "youtube" && !isValidYouTube(ytUrl)) || (tab === "upload" && !acceptedFiles[0])}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Play className="w-4 h-4 fill-white" />Start AI Analysis</>}
              </button>
            </div>
          </div>

          {/* Recent projects table */}
          {projects.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">All Projects</p>
              <div className="space-y-2">
                {projects.map((p, i) => {
                  const sc = STATUS_COLORS[p.status];
                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => p.status === "complete" ? router.push(`/results/${p.id}`) : router.push(`/process/${p.id}`)}
                      className="glass rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:border-white/15 transition-all group">
                      <StatusIcon s={p.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-white truncate max-w-sm">
                            {p.title || p.source_url || p.source_filename || "Untitled"}
                          </p>
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", sc.text, sc.bg, sc.border)}>
                            {p.status}
                          </span>
                        </div>
                        {p.status === "processing" && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{p.progress}%</span>
                          </div>
                        )}
                        {p.status !== "processing" && (
                          <p className="text-xs text-slate-500">
                            {p.source_type === "youtube" ? "YouTube" : "Local"} · {formatRelative(p.created_at)}
                            {p.duration_seconds ? ` · ${formatDuration(p.duration_seconds)}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.status === "complete" && <ArrowRight className="w-4 h-4 text-blue-400" />}
                        <button onClick={e => handleDelete(p.id, e)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
