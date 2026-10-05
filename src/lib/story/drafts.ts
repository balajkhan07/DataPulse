import { generateFinalTakeaway, generateHooks, generateStoryCandidates, generateTitles } from "@/lib/story/generation";
import type { DatasetAnalysis } from "@/types/analysis";
import type { GeneratedStoryDraft, StoryDraftOptions, StoryGenerationInput, StoryPresetId } from "@/types/assistant";
import type { ProjectConfig } from "@/types/project";
import type { StoryEvent, StoryScene } from "@/types/story";

const shortPresets = new Set<StoryPresetId>(["fast-race", "story-short", "dramatic-rise-fall"]);

function frames(seconds: number, fps: number): number {
  return Math.max(1, Math.round(seconds * fps));
}

function transition(type: "cut" | "fade" | "crossfade" | "slide", fps: number, seconds = 0.4) {
  return { type, durationFrames: type === "cut" ? 0 : frames(seconds, fps) } as const;
}

function eventTitle(analysis: DatasetAnalysis, event: StoryEvent): string {
  const first = analysis.entityStats.find((item) => item.entityId === event.entityIds[0])?.label ?? event.entityIds[0];
  const second = analysis.entityStats.find((item) => item.entityId === event.entityIds[1])?.label ?? event.entityIds[1];
  switch (event.type) {
    case "lead-change": return `${first} moves ahead of ${second}`;
    case "sustained-dominance": return `${first}'s run at #1`;
    case "close-rivalry": return `${first} and ${second} close the gap`;
    case "comeback": return `${first} returns`;
    case "collapse": return `${first} falls sharply`;
    case "sudden-breakout": return `${first} breaks into the Top 3`;
    case "major-rise":
    case "rapid-rise": return `${first} climbs to #${event.metrics.toRank}`;
    case "major-fall": return `${first} falls to #${event.metrics.toRank}`;
    default: return `${first} changes the ranking`;
  }
}

function makeHookScene(project: ProjectConfig, title: string, hookText: string, id: string, longForm = false): StoryScene {
  return {
    id,
    type: "hook",
    enabled: true,
    durationFrames: frames(longForm ? 6 : 2.5, project.video.fps),
    entryTransition: transition("cut", project.video.fps),
    config: {
      title,
      subtitle: `${project.dataset.name} · ${project.content.subtitle}`,
      hookText,
      background: "spotlight",
      transition: "rise",
    },
  };
}

function makeTextScene(
  project: ProjectConfig,
  id: string,
  eyebrow: string,
  title: string,
  body: string,
  kind: "context" | "insight" | "takeaway",
  seconds: number,
): StoryScene {
  return {
    id,
    type: "text",
    enabled: true,
    durationFrames: frames(seconds, project.video.fps),
    entryTransition: transition("fade", project.video.fps, 0.45),
    config: { eyebrow, title, body, kind },
  };
}

function makeVisualizationScene(project: ProjectConfig, id: string, start: number, end: number, seconds: number): StoryScene {
  return {
    id,
    type: "visualization",
    enabled: true,
    durationFrames: frames(seconds, project.video.fps),
    entryTransition: transition("crossfade", project.video.fps, 0.45),
    config: { annotationsEnabled: true, periodStartIndex: start, periodEndIndex: end },
  };
}

function makeEnding(project: ProjectConfig, seed: number, longForm = false): StoryScene[] {
  return [
    {
      id: `generated-${seed}-final`,
      type: "final-ranking",
      enabled: true,
      durationFrames: frames(longForm ? 8 : 4, project.video.fps),
      entryTransition: transition("slide", project.video.fps),
      config: { title: "Final ranking", topN: project.visualization.topN, showValues: true, showImages: project.visualization.showImages },
    },
    {
      id: `generated-${seed}-outro`,
      type: "outro",
      enabled: true,
      durationFrames: frames(longForm ? 5 : 2, project.video.fps),
      entryTransition: transition("fade", project.video.fps),
      config: { title: "The ranking keeps moving.", cta: "Explore the source and build your own conclusion." },
    },
  ];
}

function periodSegments(periodCount: number, desiredSegments: number): Array<[number, number]> {
  const last = Math.max(1, periodCount - 1);
  const count = Math.max(1, Math.min(desiredSegments, last));
  return Array.from({ length: count }, (_, index) => {
    const start = Math.round((index * last) / count);
    const end = Math.max(start + 1, Math.round(((index + 1) * last) / count));
    return [start, Math.min(last, end)];
  });
}

function strongestEventInRange(analysis: DatasetAnalysis, start: number, end: number): StoryEvent | undefined {
  return analysis.events
    .filter((event) => event.periodIndex >= start && event.periodIndex <= end)
    .sort((a, b) => b.importance - a.importance || a.periodIndex - b.periodIndex)[0];
}

function createShortDraft(input: StoryGenerationInput, options: StoryDraftOptions): GeneratedStoryDraft {
  const { project, analysis } = input;
  const seed = options.seed ?? input.seed ?? 0;
  const title = generateTitles(input).find((item) => item.id === options.titleId) ?? generateTitles(input)[0];
  const hook = generateHooks(input).find((item) => item.id === options.hookId) ?? generateHooks(input)[0];
  const candidate = generateStoryCandidates(input).find((item) => item.id === options.candidateId) ?? generateStoryCandidates(input)[0];
  const last = Math.max(1, analysis.summary.periodCount - 1);
  const turningPoint = analysis.interestingPeriods
    .filter((period) => period.periodIndex > 0 && period.periodIndex < last)
    .sort((a, b) => b.score - a.score)[0]?.periodIndex ?? Math.max(1, Math.round(last / 2));
  const keyEvent = strongestEventInRange(analysis, Math.max(1, turningPoint - 1), Math.min(last, turningPoint + 1))
    ?? analysis.events.slice().sort((a, b) => b.importance - a.importance)[0];
  const takeaway = generateFinalTakeaway(input);
  const scenes: StoryScene[] = [makeHookScene(project, title.text, hook.text, `generated-${seed}-hook`)];

  if (options.presetId === "fast-race") {
    scenes.push(makeVisualizationScene(project, `generated-${seed}-race`, 0, last, Math.max(24, Math.min(36, last * 3.2))));
  } else {
    if (options.presetId === "dramatic-rise-fall") {
      scenes.push(makeTextScene(project, `generated-${seed}-setup`, "STORY ANGLE", candidate.angle, candidate.explanation, "context", 4));
    }
    scenes.push(makeVisualizationScene(project, `generated-${seed}-race-a`, 0, turningPoint, options.presetId === "dramatic-rise-fall" ? 16 : 14));
    if (keyEvent) {
      scenes.push(makeTextScene(
        project,
        `generated-${seed}-event`,
        keyEvent.timeLabel,
        eventTitle(analysis, keyEvent),
        keyEvent.reason,
        "insight",
        options.presetId === "dramatic-rise-fall" ? 4.5 : 3.5,
      ));
    }
    if (turningPoint < last) scenes.push(makeVisualizationScene(project, `generated-${seed}-race-b`, turningPoint, last, options.presetId === "dramatic-rise-fall" ? 17 : 15));
    scenes.push(makeTextScene(project, `generated-${seed}-takeaway`, "FINAL TAKEAWAY", "What the ranking shows", takeaway, "takeaway", 4));
  }
  scenes.push(...makeEnding(project, seed));

  return {
    id: `draft-${options.presetId}-${seed}`,
    name: options.presetId === "fast-race" ? "Fast Race" : options.presetId === "dramatic-rise-fall" ? "Dramatic Rise / Fall" : "Story Short",
    videoMode: "short-form",
    presetId: options.presetId,
    timeline: { scenes },
    selectedEventIds: keyEvent ? [keyEvent.id] : [],
    explanation: `Built around “${candidate.angle}” with ${scenes.length} editable scenes and a grounded final takeaway.`,
  };
}

function createLongDraft(input: StoryGenerationInput, options: StoryDraftOptions): GeneratedStoryDraft {
  const { project, analysis } = input;
  const seed = options.seed ?? input.seed ?? 0;
  const title = generateTitles(input).find((item) => item.id === options.titleId) ?? generateTitles(input)[0];
  const hook = generateHooks(input).find((item) => item.id === options.hookId) ?? generateHooks(input)[0];
  const candidate = generateStoryCandidates(input).find((item) => item.id === options.candidateId) ?? generateStoryCandidates(input)[0];
  const targetSegments = options.presetId === "decade-by-decade" ? 5 : options.presetId === "head-to-head" ? 3 : 4;
  const segments = periodSegments(analysis.summary.periodCount, targetSegments);
  const selectedEvents: StoryEvent[] = [];
  const scenes: StoryScene[] = [
    makeHookScene(project, title.text, hook.text, `generated-${seed}-hook`, true),
    makeTextScene(
      project,
      `generated-${seed}-intro`,
      "DATA STORY",
      candidate.angle,
      `${candidate.explanation} This draft uses only events measured in the imported dataset.`,
      "context",
      10,
    ),
  ];

  segments.forEach(([start, end], index) => {
    scenes.push(makeVisualizationScene(project, `generated-${seed}-chapter-${index + 1}`, start, end, options.presetId === "ranking-history" ? 34 : 40));
    if (index >= segments.length - 1) return;
    const event = strongestEventInRange(analysis, start + 1, end);
    if (!event) return;
    selectedEvents.push(event);
    scenes.push(makeTextScene(
      project,
      `generated-${seed}-chapter-insight-${index + 1}`,
      `CHAPTER ${index + 1} · ${event.timeLabel}`,
      eventTitle(analysis, event),
      event.reason,
      "insight",
      8,
    ));
  });

  scenes.push(makeTextScene(project, `generated-${seed}-takeaway`, "CONCLUSION", "What the full timeline shows", generateFinalTakeaway(input), "takeaway", 9));
  scenes.push(...makeEnding(project, seed, true));

  return {
    id: `draft-${options.presetId}-${seed}`,
    name: options.presetId.split("-").map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join(" "),
    videoMode: "long-form",
    presetId: options.presetId,
    timeline: { scenes },
    selectedEventIds: selectedEvents.map((event) => event.id),
    explanation: `Divides the timeline into ${segments.length} data chapters, with event-led context between chapters instead of stretching one continuous chart.`,
  };
}

export function generateStoryDraft(input: StoryGenerationInput, options: StoryDraftOptions): GeneratedStoryDraft {
  return shortPresets.has(options.presetId) ? createShortDraft(input, options) : createLongDraft(input, options);
}
