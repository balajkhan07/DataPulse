"use client";

import { getStoryRenderLayers } from "@/lib/timeline/transitions";
import { sceneRegistry } from "@/scenes/registry";
import { getTheme } from "@/themes";
import type { NormalizedDataset } from "@/types/data";
import type { ProjectConfig } from "@/types/project";

export function StoryRenderer({ project, dataset, frame }: { project: ProjectConfig; dataset: NormalizedDataset; frame: number }) {
  const layers = getStoryRenderLayers(project.timeline, frame);
  const theme = getTheme(project.themeId);
  return (
    <div style={{ background: theme.background.start, height: "100%", overflow: "hidden", position: "relative", width: "100%" }}>
      {layers.map((layer) => {
        const Renderer = sceneRegistry[layer.scene.type];
        return (
          <div
            key={layer.key}
            style={{
              height: "100%",
              inset: 0,
              opacity: layer.opacity,
              position: "absolute",
              transform: `translateX(${layer.translateXPercent}%)`,
              width: "100%",
            }}
          >
            <Renderer dataset={dataset} localFrame={layer.localFrame} project={project} scene={layer.scene} />
          </div>
        );
      })}
    </div>
  );
}
