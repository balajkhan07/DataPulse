import type { ComponentType } from "react";
import { FinalRankingSceneRenderer } from "@/scenes/final-ranking-renderer";
import { HookSceneRenderer } from "@/scenes/hook-renderer";
import { OutroSceneRenderer } from "@/scenes/outro-renderer";
import { TextSceneRenderer } from "@/scenes/text-scene-renderer";
import type { SceneRendererProps } from "@/scenes/types";
import { VisualizationSceneRenderer } from "@/scenes/visualization-scene-renderer";
import type { SceneType } from "@/types/story";

export const sceneRegistry = {
  hook: HookSceneRenderer,
  text: TextSceneRenderer,
  visualization: VisualizationSceneRenderer,
  "final-ranking": FinalRankingSceneRenderer,
  outro: OutroSceneRenderer,
} satisfies Record<SceneType, ComponentType<SceneRendererProps>>;
