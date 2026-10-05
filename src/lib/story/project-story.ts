import { analyzeProject } from "@/lib/analysis/project-analysis";
import { videoPresets } from "@/lib/project/defaults";
import { generateStoryDraft } from "@/lib/story/drafts";
import type { DatasetAnalysis } from "@/types/analysis";
import type { GeneratedStoryDraft, StoryDraftOptions } from "@/types/assistant";
import type { ProjectConfig } from "@/types/project";

export interface ProjectStoryDraftResult {
  sourceProjectId: string;
  analysis: DatasetAnalysis;
  draft: GeneratedStoryDraft;
}

export function generateProjectStoryDraft(project: ProjectConfig, options: StoryDraftOptions): ProjectStoryDraftResult {
  const analysis = analyzeProject(project);
  const draft = generateStoryDraft({ project, analysis, seed: options.seed ?? project.story.generationSeed }, options);
  return { sourceProjectId: project.id, analysis, draft };
}

export function applyGeneratedStoryDraft(project: ProjectConfig, draft: GeneratedStoryDraft): ProjectConfig {
  const aspectRatio = draft.videoMode === "long-form" ? "landscape" : "portrait";
  return {
    ...project,
    video: { ...project.video, ...videoPresets[aspectRatio], aspectRatio, mode: draft.videoMode },
    story: { ...project.story, presetId: draft.presetId },
    timeline: draft.timeline,
  };
}

export function generateBatchStoryDrafts(
  projects: ProjectConfig[],
  options: StoryDraftOptions | ((project: ProjectConfig) => StoryDraftOptions),
): ProjectStoryDraftResult[] {
  return projects.map((project) => generateProjectStoryDraft(project, typeof options === "function" ? options(project) : options));
}
