export type ExportPresetId =
  | "youtube-shorts"
  | "instagram-reels"
  | "facebook-reels"
  | "tiktok"
  | "youtube-1080p"
  | "youtube-1440p"
  | "youtube-4k"
  | "facebook-landscape"
  | "square"
  | "portrait-feed"
  | "custom";

export type ExportQuality = "draft" | "standard" | "high" | "maximum";
export type ExportCodec = "h264";

export interface ExportConfig {
  presetId: ExportPresetId;
  width: number;
  height: number;
  fps: 24 | 30 | 60;
  quality: ExportQuality;
  codec: ExportCodec;
  filename: string;
}

export interface AudioConfig {
  enabled: boolean;
  assetId: string | null;
  fileName: string | null;
  mimeType: "audio/mpeg" | "audio/wav" | null;
  durationSeconds: number | null;
  startOffsetSeconds: number;
  trimStartSeconds: number;
  trimEndSeconds: number | null;
  volume: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  loop: boolean;
}

export type RenderJobStatus =
  | "queued"
  | "preparing"
  | "rendering"
  | "encoding"
  | "finalizing"
  | "completed"
  | "failed"
  | "cancelled";

export interface RenderJob {
  id: string;
  projectId: string;
  projectName: string;
  status: RenderJobStatus;
  progress: number;
  stage: string;
  config: ExportConfig;
  durationSeconds: number;
  frameCount: number;
  outputPath?: string;
  outputBytes?: number;
  error?: string;
  warnings: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  renderDurationMs?: number;
}
