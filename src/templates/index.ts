import { videoPresets } from "@/lib/project/defaults";
import type { ProjectTemplate } from "@/types/template";

export const projectTemplates: ProjectTemplate[] = [
  {
    id: "modern-dark",
    name: "Modern Dark",
    description: "Cinematic contrast for business and technology",
    themeId: "modern-dark",
    videoMode: "short-form",
    video: { aspectRatio: "portrait", fps: 30, safeArea: videoPresets.portrait.safeArea },
    visualization: { topN: 8, barRadius: 14, barOpacity: 1, easing: "easeInOut", secondsPerPeriod: 1.35, imageStyle: "circle" },
    events: { frequency: "medium", minimumImportance: 68 },
    scenes: [
      { type: "hook", enabled: true, durationSeconds: 2 },
      { type: "visualization", enabled: true, durationSeconds: 12 },
      { type: "final-ranking", enabled: true, durationSeconds: 3 },
      { type: "outro", enabled: true, durationSeconds: 2 },
    ],
  },
  {
    id: "clean-light",
    name: "Clean Light",
    description: "Minimal editorial styling for clear comparisons",
    themeId: "clean-light",
    videoMode: "custom",
    video: { aspectRatio: "feed", fps: 30, safeArea: videoPresets.feed.safeArea },
    visualization: { topN: 7, barRadius: 8, barOpacity: 0.95, easing: "easeInOut", secondsPerPeriod: 1.5, imageStyle: "rounded" },
    events: { frequency: "low", minimumImportance: 76 },
    scenes: [
      { type: "hook", enabled: true, durationSeconds: 2.5 },
      { type: "visualization", enabled: true, durationSeconds: 14 },
      { type: "final-ranking", enabled: true, durationSeconds: 3.5 },
      { type: "outro", enabled: false, durationSeconds: 2 },
    ],
  },
  {
    id: "tech-signal",
    name: "Tech Signal",
    description: "Neon energy and faster pacing for product stories",
    themeId: "neon-signal",
    videoMode: "short-form",
    video: { aspectRatio: "portrait", fps: 60, safeArea: videoPresets.portrait.safeArea },
    visualization: { topN: 8, barRadius: 18, barOpacity: 1, easing: "easeOut", secondsPerPeriod: 1, imageStyle: "rounded" },
    events: { frequency: "high", minimumImportance: 62 },
    scenes: [
      { type: "hook", enabled: true, durationSeconds: 1.5 },
      { type: "visualization", enabled: true, durationSeconds: 10 },
      { type: "final-ranking", enabled: true, durationSeconds: 2.5 },
      { type: "outro", enabled: true, durationSeconds: 1.5 },
    ],
  },
  {
    id: "documentary",
    name: "Documentary",
    description: "Measured pacing and archival warmth for history",
    themeId: "documentary",
    videoMode: "long-form",
    video: { aspectRatio: "landscape", fps: 30, safeArea: videoPresets.landscape.safeArea },
    visualization: { topN: 10, barRadius: 5, barOpacity: 0.94, easing: "easeInOut", secondsPerPeriod: 2.2, imageStyle: "circle" },
    events: { frequency: "medium", minimumImportance: 64 },
    scenes: [
      { type: "hook", enabled: true, durationSeconds: 5 },
      { type: "visualization", enabled: true, durationSeconds: 30 },
      { type: "final-ranking", enabled: true, durationSeconds: 6 },
      { type: "outro", enabled: true, durationSeconds: 4 },
    ],
  },
  {
    id: "sports-broadcast",
    name: "Sports Broadcast",
    description: "Bold rankings and brisk broadcast-style movement",
    themeId: "sports-broadcast",
    videoMode: "short-form",
    video: { aspectRatio: "portrait", fps: 60, safeArea: videoPresets.portrait.safeArea },
    visualization: { topN: 10, barRadius: 3, barOpacity: 1, easing: "easeOut", secondsPerPeriod: 1.1, imageStyle: "circle" },
    events: { frequency: "high", minimumImportance: 65 },
    scenes: [
      { type: "hook", enabled: true, durationSeconds: 2 },
      { type: "visualization", enabled: true, durationSeconds: 12 },
      { type: "final-ranking", enabled: true, durationSeconds: 4 },
      { type: "outro", enabled: true, durationSeconds: 2 },
    ],
  },
];

export function getProjectTemplate(templateId: string): ProjectTemplate | undefined {
  return projectTemplates.find((template) => template.id === templateId);
}
