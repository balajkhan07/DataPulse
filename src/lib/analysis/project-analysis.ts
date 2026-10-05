import { analyzeNormalizedDataset } from "@/lib/analysis/dataset-analysis";
import { normalizeDataset } from "@/lib/data/normalization";
import type { DatasetAnalysis } from "@/types/analysis";
import type { ProjectConfig } from "@/types/project";

const ANALYSIS_VERSION = 1;
const analysisCache = new Map<string, DatasetAnalysis>();

function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createProjectAnalysisCacheKey(project: Pick<ProjectConfig, "dataset" | "events">): string {
  return `analysis-v${ANALYSIS_VERSION}-${hashString(JSON.stringify({
    dataset: project.dataset,
    topN: project.events.topN,
    majorRankChange: project.events.majorRankChange,
    milestones: project.events.milestones,
  }))}`;
}

export function analyzeProject(project: ProjectConfig): DatasetAnalysis {
  const cacheKey = createProjectAnalysisCacheKey(project);
  const cached = analysisCache.get(cacheKey);
  if (cached) return cached;
  const normalized = normalizeDataset(project.dataset.rows, project.dataset.mapping).dataset;
  if (!normalized) throw new Error("The project dataset could not be normalized for analysis.");
  const analysis = analyzeNormalizedDataset(normalized, {
    topN: project.events.topN,
    majorRankChange: project.events.majorRankChange,
    milestones: project.events.milestones,
  }, cacheKey);
  analysisCache.set(cacheKey, analysis);
  if (analysisCache.size > 12) analysisCache.delete(analysisCache.keys().next().value ?? "");
  return analysis;
}

export function analyzeProjects(projects: ProjectConfig[]): DatasetAnalysis[] {
  return projects.map(analyzeProject);
}

export function clearProjectAnalysisCache(): void {
  analysisCache.clear();
}
