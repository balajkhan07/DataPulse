import type { ContentQualityReport, QualityCheck } from "@/types/assistant";
import type { ProjectConfig } from "@/types/project";

function hash(value: string): string {
  let result = 5381;
  for (let index = 0; index < value.length; index += 1) result = ((result << 5) + result) ^ value.charCodeAt(index);
  return (result >>> 0).toString(36);
}

export function createDraftSignature(project: Pick<ProjectConfig, "timeline">): string {
  return hash(JSON.stringify(project.timeline.scenes.map((scene) => ({ type: scene.type, enabled: scene.enabled, durationFrames: scene.durationFrames }))));
}

export function evaluateContentQuality(project: ProjectConfig, previousSignatures: string[] = []): ContentQualityReport {
  const enabledScenes = project.timeline.scenes.filter((scene) => scene.enabled);
  const hook = enabledScenes.find((scene) => scene.type === "hook");
  const signature = createDraftSignature(project);
  const checks: QualityCheck[] = [
    { id: "hook", label: "Specific hook", passed: Boolean(hook?.type === "hook" && hook.config.hookText.trim().length >= 18), weight: 15, suggestion: "Add a specific, data-grounded hook." },
    { id: "events", label: "Meaningful event beats", passed: enabledScenes.some((scene) => scene.type === "text" && scene.config.kind === "insight"), weight: 16, suggestion: "Add at least one detected event as a story beat." },
    { id: "annotations", label: "Annotations enabled", passed: project.events.enabled && project.events.maximumAnnotations > 0 && enabledScenes.some((scene) => scene.type === "visualization" && scene.config.annotationsEnabled), weight: 12, suggestion: "Enable a small number of high-importance annotations." },
    { id: "beats", label: "Multiple story beats", passed: enabledScenes.length >= 4, weight: 15, suggestion: "Use at least four editable scenes to create a beginning, turn, and ending." },
    { id: "title", label: "Specific title", passed: project.content.title.trim().length >= 12 && !/^untitled/i.test(project.content.title), weight: 12, suggestion: "Use a title that names the subject or time range." },
    { id: "source", label: "Source metadata", passed: Boolean(project.sourceMetadata.name.trim() || project.sourceMetadata.publisher.trim()), weight: 10, suggestion: "Add a source name or publisher." },
    { id: "takeaway", label: "Grounded takeaway", passed: Boolean(project.publishing.finalTakeaway.trim() || enabledScenes.some((scene) => scene.type === "text" && scene.config.kind === "takeaway")), weight: 12, suggestion: "Add a final takeaway derived from the analysis." },
    { id: "variety", label: "Scene variety", passed: new Set(enabledScenes.map((scene) => scene.type)).size >= 3, weight: 8, suggestion: "Mix visualization, hook, context, or final-ranking scenes." },
  ];
  const score = checks.reduce((total, check) => total + (check.passed ? check.weight : 0), 0);
  const warnings = checks.filter((check) => !check.passed && check.suggestion).map((check) => check.suggestion as string);
  if (enabledScenes.length === 1 && enabledScenes[0]?.type === "visualization") warnings.unshift("This draft contains only one continuous visualization scene.");
  if (previousSignatures.includes(signature)) warnings.push("This draft has the same scene structure as a previous draft. Consider a different story angle or preset.");
  return { score, checks, warnings, draftSignature: signature };
}
