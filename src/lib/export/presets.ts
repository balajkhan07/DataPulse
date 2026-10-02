import type { ExportConfig, ExportPresetId, ExportQuality } from "@/types/export";
import type { SafeAreaConfig } from "@/types/project";

export interface ExportPreset {
  id: ExportPresetId;
  name: string;
  platform: string;
  width: number;
  height: number;
  fps: 24 | 30 | 60;
  safeArea: SafeAreaConfig;
}

const portraitSafeArea: SafeAreaConfig = { top: 120, right: 116, bottom: 220, left: 80 };
const landscapeSafeArea: SafeAreaConfig = { top: 72, right: 120, bottom: 84, left: 120 };

export const exportPresets: ExportPreset[] = [
  { id: "youtube-shorts", name: "YouTube Shorts", platform: "Short-form", width: 1080, height: 1920, fps: 30, safeArea: portraitSafeArea },
  { id: "instagram-reels", name: "Instagram Reels", platform: "Short-form", width: 1080, height: 1920, fps: 30, safeArea: portraitSafeArea },
  { id: "facebook-reels", name: "Facebook Reels", platform: "Short-form", width: 1080, height: 1920, fps: 30, safeArea: portraitSafeArea },
  { id: "tiktok", name: "TikTok", platform: "Short-form", width: 1080, height: 1920, fps: 30, safeArea: portraitSafeArea },
  { id: "youtube-1080p", name: "YouTube 1080p", platform: "Long-form", width: 1920, height: 1080, fps: 30, safeArea: landscapeSafeArea },
  { id: "youtube-1440p", name: "YouTube 1440p", platform: "Long-form", width: 2560, height: 1440, fps: 30, safeArea: { top: 96, right: 160, bottom: 112, left: 160 } },
  { id: "youtube-4k", name: "YouTube 4K", platform: "Long-form", width: 3840, height: 2160, fps: 30, safeArea: { top: 144, right: 240, bottom: 168, left: 240 } },
  { id: "facebook-landscape", name: "Facebook Landscape", platform: "Long-form", width: 1920, height: 1080, fps: 30, safeArea: landscapeSafeArea },
  { id: "square", name: "Square", platform: "Other", width: 1080, height: 1080, fps: 30, safeArea: { top: 72, right: 72, bottom: 84, left: 72 } },
  { id: "portrait-feed", name: "Portrait Feed", platform: "Other", width: 1080, height: 1350, fps: 30, safeArea: { top: 84, right: 76, bottom: 120, left: 76 } },
];

export const exportQualityProfiles: Record<ExportQuality, { crf: number; jpegQuality: number; x264Preset: "superfast" | "faster" | "medium" | "slow"; label: string }> = {
  draft: { crf: 28, jpegQuality: 72, x264Preset: "superfast", label: "Fast proof" },
  standard: { crf: 23, jpegQuality: 82, x264Preset: "faster", label: "Balanced" },
  high: { crf: 18, jpegQuality: 90, x264Preset: "medium", label: "Upload ready" },
  maximum: { crf: 14, jpegQuality: 96, x264Preset: "slow", label: "Largest file" },
};

export function getExportPreset(id: ExportPresetId): ExportPreset | undefined {
  return exportPresets.find((preset) => preset.id === id);
}

export function createDefaultExportConfig(filename = "datapulse-story.mp4"): ExportConfig {
  const preset = exportPresets[0];
  return {
    presetId: preset.id,
    width: preset.width,
    height: preset.height,
    fps: preset.fps,
    quality: "high",
    codec: "h264",
    filename,
  };
}
