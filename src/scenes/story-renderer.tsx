"use client";

import { getActiveScene } from "@/lib/timeline/timeline";
import { sceneRegistry } from "@/scenes/registry";
import type { NormalizedDataset } from "@/types/data";
import type { ProjectConfig } from "@/types/project";

export function StoryRenderer({ project, dataset, frame }: { project: ProjectConfig; dataset: NormalizedDataset; frame: number }) {
  const active = getActiveScene(project.timeline, frame);
  if (!active) return null;
  const Renderer = sceneRegistry[active.scene.type];
  return <Renderer dataset={dataset} localFrame={active.localFrame} project={project} scene={active.scene} />;
}
