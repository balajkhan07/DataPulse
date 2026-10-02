import type { ComponentType } from "react";
import type { NormalizedDataset, ValidationIssue } from "@/types/data";
import type { VideoConfig } from "@/types/project";

export interface VisualizationStateArgs<TConfig> {
  dataset: NormalizedDataset;
  frame: number;
  fps: number;
  config: TConfig;
}

export interface VisualizationRendererProps<TConfig, TState> {
  config: TConfig;
  state: TState;
  video: VideoConfig;
  themeId: string;
  title: string;
  subtitle: string;
  source: string;
  footer: string;
  highlightedEntityIds?: string[];
}

export interface VisualizationDefinition<TConfig, TState> {
  id: string;
  name: string;
  validateDataset: (dataset: NormalizedDataset) => ValidationIssue[];
  getDefaultConfig: () => TConfig;
  getStateAtFrame: (args: VisualizationStateArgs<TConfig>) => TState;
  Renderer: ComponentType<VisualizationRendererProps<TConfig, TState>>;
}
