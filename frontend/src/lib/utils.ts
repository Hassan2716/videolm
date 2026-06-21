import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export function formatRelative(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024**2) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024**2).toFixed(1)} MB`;
}

export function isValidYouTube(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/.test(url);
}

export const STATUS_COLORS = {
  pending:    { text: "text-slate-400",  bg: "bg-slate-400/10",  border: "border-slate-400/20" },
  processing: { text: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20"  },
  complete:   { text: "text-emerald-400",bg: "bg-emerald-400/10",border: "border-emerald-400/20"},
  failed:     { text: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20"   },
};

export const MODEL_INFO = {
  bart:    { name: "BART-large-CNN", color: "#3b82f6", desc: "Best for news/lecture summarization" },
  t5:      { name: "T5-base",        color: "#8b5cf6", desc: "Versatile instruction-following" },
  pegasus: { name: "PEGASUS-XSum",   color: "#06b6d4", desc: "Best for abstractive summaries" },
  t5small: { name: "T5-small",       color: "#10b981", desc: "Lightweight, fast inference" },
};
