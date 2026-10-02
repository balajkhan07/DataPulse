import type { NormalizedDataset } from "@/types/data";
import type { ProjectConfig } from "@/types/project";
import type { StoryScene } from "@/types/story";

export interface SceneRendererProps {
  project: ProjectConfig;
  dataset: NormalizedDataset;
  scene: StoryScene;
  localFrame: number;
}
