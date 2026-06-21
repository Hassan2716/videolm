"use client";
/**
 * MindMapViewer — Pure SVG mind map. No reactflow dependency needed.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MNode { id: string; type: string; data: { label: string; level: number }; position: { x: number; y: number }; }
interface MEdge { id: string; source: string; target: string; }
interface Props  { projectId: string; existingData: any; onGenerate: () => Promise<{ job_id: string }>; }

export default function MindMapViewer({ projectId, existingData, onGenerate }: Props) {
  const [nodes, setNodes]       = useState<MNode[]>(existingData?.nodes || []);
  const [edges, setEdges]       = useState<MEdge[]>(existingData?.edges || []);
  const [rootTopic, setRoot]    = useState<string>(existingData?.root_topic || "");
  const [total, setTotal]       = useState<number>(existingData?.total_concepts || 0);
  const [generating, setGen]    = useState(false);
  const [jobId, setJobId]       = useState<string | null>(null);
  const [status, setStatus]     = useState("");
  const [progress, setProgress] = useState(0);
  const [scale, setScale]       = useState(1);

  useEffect(() => {
    if (existingData?.nodes) {
      setNodes(existingData.nodes); setEdges(existingData.edges);
      setRoot(existingData.root_topic || ""); setTotal(existingData.total_concepts || 0);
    }
  }, [existingData]);

  useEffect(() => {
    if (!jobId) return;
    const iv = setInterval(async () => {
      try {
        const job = await fetch(`${API}/api/generate/status/${jobId}`).then(r => r.json());
        setStatus(job.message || ""); setProgress(job.progress || 0);
        if (job.status === "complete" && job.result) {
          setNodes(job.result.nodes || []); setEdges(job.result.edges || []);
          setRoot(job.result.root_topic || ""); setTotal(job.result.total_concepts || 0);
          setGen(false); setJobId(null); clearInterval(iv);
        } else if (job.status === "failed") {
          setStatus(`Failed: ${job.error}`); setGen(false); setJobId(null); clearInterval(iv);
        }
      } catch { clearInterval(iv); setGen(false); }
    }, 1500);
    return () => clearInterval(iv);
  }, [jobId]);

  const handleGenerate = async () => {
    setGen(true); setStatus("Starting…"); setProgress(0);
    try { const { job_id } = await onGenerate(); setJobId(job_id); }
    catch { setGen(false); }
  };

  const hasData = nodes.length > 0;

  // Compute SVG bounds from node positions
  const allX = nodes.map(n => n.position.x);
  const allY = nodes.map(n => n.position.y);
  const minX = Math.min(...allX, 0) - 80;
  const minY = Math.min(...allY, 0) - 50;
  const maxX = Math.max(...allX, 800) + 200;
  const maxY = Math.max(...allY, 500) + 80;
  const vbW  = maxX - minX;
  const vbH  = maxY - minY;

  const nodeById = (id: string) => nodes.find(n => n.id === id);

  const nodeStyle = (type: string) => {
    if (type === "mindmapRoot")   return { fill: "#2563eb", textFill: "#fff", r: 14, fs: 14, fw: "bold" };
    if (type === "mindmapBranch") return { fill: "#7c3aed", textFill: "#fff", r: 10, fs: 12, fw: "600"  };
    return                               { fill: "#1e293b", textFill: "#e2e8f0", r: 8, fs: 10, fw: "400" };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Mind Map
          </h2>
          {hasData && (
            <p className="text-xs text-slate-400 mt-0.5">{rootTopic} · {total} concepts</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasData && (
            <>
              <button onClick={() => setScale(s => Math.min(2, s + 0.2))}
                className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white">
                <ZoomIn className="w-4 h-4"/>
              </button>
              <button onClick={() => setScale(s => Math.max(0.3, s - 0.2))}
                className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white">
                <ZoomOut className="w-4 h-4"/>
              </button>
              <span className="text-xs text-slate-500 font-mono w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
            </>
          )}
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50">
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin"/>Generating…</>
              : <><RefreshCw className="w-4 h-4"/>{hasData ? "Regenerate" : "Generate Mind Map"}</>}
          </button>
        </div>
      </div>

      {/* Progress */}
      {generating && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs text-blue-400 mb-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin"/>{status}
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}/>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      {hasData ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 rounded-2xl overflow-auto border border-white/8 bg-slate-900/60"
          style={{ minHeight: 480 }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left",
                        width: `${vbW}px`, height: `${vbH}px`, minWidth: "100%" }}>
            <svg
              viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
              width={vbW} height={vbH}
              style={{ display: "block" }}
            >
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#475569"/>
                </marker>
              </defs>

              {/* Edges */}
              {edges.map(e => {
                const src = nodeById(e.source);
                const tgt = nodeById(e.target);
                if (!src || !tgt) return null;
                const x1 = src.position.x + 60;
                const y1 = src.position.y + 18;
                const x2 = tgt.position.x + 50;
                const y2 = tgt.position.y + 15;
                const cx = (x1 + x2) / 2;
                return (
                  <path key={e.id}
                    d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                    stroke="#475569" strokeWidth={1.5} fill="none"
                    markerEnd="url(#arrow)" opacity={0.7}/>
                );
              })}

              {/* Nodes */}
              {nodes.map(node => {
                const { fill, textFill, r, fs, fw } = nodeStyle(node.type);
                const nx = node.position.x;
                const ny = node.position.y;
                const label = (node.data.label || "").slice(0, 20);
                const boxW = Math.max(label.length * (fs * 0.6) + 24, 80);
                const boxH = fs * 2 + 8;

                return (
                  <g key={node.id}>
                    <rect
                      x={nx} y={ny} width={boxW} height={boxH}
                      rx={r} fill={fill} opacity={0.92}
                      filter={node.type === "mindmapRoot" ? "drop-shadow(0 4px 12px rgba(37,99,235,0.5))" : undefined}
                    />
                    <text
                      x={nx + boxW / 2} y={ny + boxH / 2}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={textFill} fontSize={fs} fontWeight={fw}
                      fontFamily="Inter, sans-serif"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </motion.div>
      ) : !generating ? (
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/2"
          style={{ minHeight: 400 }}>
          <div className="text-center">
            <div className="text-5xl mb-4">🧠</div>
            <p className="text-slate-400 text-sm font-medium mb-2">No mind map yet</p>
            <p className="text-slate-600 text-xs max-w-xs">
              Click "Generate Mind Map" to create an interactive concept graph from the video.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
