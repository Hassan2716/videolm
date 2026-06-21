import axios from "axios";
import type { Project, Transcript, Summary, Frame, ChatMessage, SearchResult, StudyAsset, ExportJob } from "@/types";

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 120000,
});

export const getFrameUrl = (framePath: string) =>
  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/outputs/${framePath}`;

// Projects
export const uploadVideo = async (file: File): Promise<Project> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await API.post<Project>("/api/projects/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000,
  });
  return data;
};

export const submitYouTube = async (url: string): Promise<Project> => {
  const { data } = await API.post<Project>("/api/youtube/", { url });
  return data;
};

export const getYouTubeInfo = async (url: string) => {
  const { data } = await API.get("/api/youtube/info", { params: { url } });
  return data;
};

export const getProject = async (id: string): Promise<Project> => {
  const { data } = await API.get<Project>(`/api/projects/${id}`);
  return data;
};

export const listProjects = async (): Promise<Project[]> => {
  const { data } = await API.get<Project[]>("/api/projects/");
  return data;
};

export const deleteProject = async (id: string) => API.delete(`/api/projects/${id}`);

// Transcript
export const getTranscript = async (projectId: string): Promise<Transcript> => {
  const { data } = await API.get<Transcript>(`/api/transcript/${projectId}`);
  return data;
};

export const getTranscriptSRT = async (projectId: string): Promise<string> => {
  const { data } = await API.get<string>(`/api/transcript/${projectId}/srt`);
  return data;
};

// Summaries
export const getSummaries = async (projectId: string, type?: string): Promise<Summary[]> => {
  const { data } = await API.get<Summary[]>(`/api/summary/${projectId}`, {
    params: type ? { summary_type: type } : {},
  });
  return data;
};

export const generateSummary = async (projectId: string, type: string, model: string) => {
  return API.post(`/api/summary/${projectId}/generate`, null, {
    params: { summary_type: type, model },
  });
};

export const compareSummaries = async (projectId: string) => {
  const { data } = await API.get(`/api/summary/${projectId}/compare`);
  return data;
};

// Frames
export const getFrames = async (projectId: string): Promise<Frame[]> => {
  const { data } = await API.get<Frame[]>(`/api/frames/${projectId}`);
  return data;
};

// Chat
export const sendChat = async (projectId: string, message: string): Promise<ChatMessage> => {
  const { data } = await API.post<ChatMessage>("/api/chat/", {
    project_id: projectId, message, include_citations: true,
  });
  return data;
};

export const getChatHistory = async (projectId: string): Promise<ChatMessage[]> => {
  const { data } = await API.get<ChatMessage[]>(`/api/chat/${projectId}/history`);
  return data;
};

export const clearChat = async (projectId: string) =>
  API.delete(`/api/chat/${projectId}/history`);

// Search
export const semanticSearch = async (projectId: string, query: string, topK = 5): Promise<SearchResult[]> => {
  const { data } = await API.post<SearchResult[]>("/api/search/", {
    project_id: projectId, query, top_k: topK, search_type: "semantic",
  });
  return data;
};

// Study
export const getStudyAssets = async (projectId: string, type?: string): Promise<StudyAsset[]> => {
  const { data } = await API.get<StudyAsset[]>(`/api/study/${projectId}`, {
    params: type ? { asset_type: type } : {},
  });
  return data;
};

export const generateStudyAsset = async (projectId: string, type: string) =>
  API.post(`/api/study/${projectId}/generate`, null, { params: { asset_type: type } });

// Export
export const createExport = async (projectId: string, format: string, contentTypes: string[]): Promise<ExportJob> => {
  const { data } = await API.post<ExportJob>("/api/export/", {
    project_id: projectId, format, content_types: contentTypes,
  });
  return data;
};

export const getExportStatus = async (exportId: string): Promise<ExportJob> => {
  const { data } = await API.get<ExportJob>(`/api/export/${exportId}/status`);
  return data;
};

export const getDownloadUrl = (exportId: string) =>
  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/export/${exportId}/download`;
