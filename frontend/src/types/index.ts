export type ProjectStatus = "pending" | "processing" | "complete" | "failed";

export interface Project {
  id: string;
  title?: string;
  source_type: "youtube" | "local";
  source_url?: string;
  source_filename?: string;
  duration_seconds?: number;
  language: string;
  status: ProjectStatus;
  progress: number;
  current_stage: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface Transcript {
  id: string;
  project_id: string;
  full_text: string;
  language: string;
  word_count: number;
  segments: TranscriptSegment[];
  created_at: string;
}

export interface Summary {
  id: string;
  project_id: string;
  summary_type: string;
  model_used: string;
  content: string;
  word_count: number;
  created_at: string;
}

export interface Frame {
  id: string;
  project_id: string;
  frame_path: string;
  timestamp_seconds: number;
  timestamp_label: string;
  scene_index: number;
  caption?: string;
  ocr_text?: string;
  visual_type?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  created_at: string;
}

export interface Citation {
  timestamp?: string;
  text: string;
  source: string;
}

export interface SearchResult {
  text: string;
  source: string;
  timestamp?: string;
  score: number;
}

export interface StudyAsset {
  id: string;
  project_id: string;
  asset_type: string;
  content: Record<string, unknown>;
  created_at: string;
}

export interface ExportJob {
  id: string;
  project_id: string;
  format: string;
  status: string;
  file_path?: string;
  download_url?: string;
}
