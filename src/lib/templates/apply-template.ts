import { videoPresets } from "@/lib/project/defaults";
import type { ProjectConfig } from "@/types/project";
import type { ProjectTemplate } from "@/types/template";

export function applyProjectTemplate(project: ProjectConfig, template: ProjectTemplate): ProjectConfig {
  const fps = template.video.fps;
  const annotationDurationFrames = Math.max(1, Math.round((project.events.durationFrames / project.video.fps) * fps));
  const scenes = project.timeline.scenes.map((scene) => {
    const defaults = template.scenes.find((candidate) => candidate.type === scene.type);
    if (!defaults) return scene;
    return {
      ...scene,
      enabled: defaults.enabled,
      durationFrames: Math.max(1, Math.round(defaults.durationSeconds * fps)),
      config: { ...scene.config },
    } as typeof scene;
  });
  const preset = videoPresets[template.video.aspectRatio];

  return {
    ...project,
    themeId: template.themeId,
    visualization: { ...project.visualization, ...template.visualization },
    video: {
      ...project.video,
      ...preset,
      ...template.video,
      mode: template.videoMode,
    },
    timeline: { scenes },
    events: { ...project.events, durationFrames: annotationDurationFrames, ...template.events },
  };
}
