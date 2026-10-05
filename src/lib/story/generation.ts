import type { DatasetAnalysis, EntityStats } from "@/types/analysis";
import type {
  AnnotationSuggestion,
  GeneratedDescriptions,
  HookSuggestion,
  StoryCandidate,
  StoryGenerationInput,
  TitleSuggestion,
} from "@/types/assistant";
import type { StoryEvent } from "@/types/story";

function label(analysis: DatasetAnalysis, entityId: string): string {
  return analysis.entityStats.find((item) => item.entityId === entityId)?.label ?? entityId;
}

function entity(analysis: DatasetAnalysis, entityId: string): EntityStats {
  return analysis.entityStats.find((item) => item.entityId === entityId) ?? analysis.entityStats[0];
}

function uniqueByText<T extends { text?: string; angle?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const text = (item.text ?? item.angle ?? "").toLowerCase();
    if (!text || seen.has(text)) return false;
    seen.add(text);
    return true;
  });
}

function rotate<T>(items: T[], seed = 0): T[] {
  if (items.length === 0) return items;
  const offset = Math.abs(seed) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function relevantEvents(analysis: DatasetAnalysis, entityIds: string[]): StoryEvent[] {
  return analysis.events
    .filter((event) => event.entityIds.some((entityId) => entityIds.includes(entityId)))
    .sort((a, b) => b.importance - a.importance || a.periodIndex - b.periodIndex);
}

export function generateStoryCandidates(input: StoryGenerationInput): StoryCandidate[] {
  const { analysis, project } = input;
  const { summary } = analysis;
  const latestLeader = label(analysis, summary.latestLeaderId);
  const dominant = label(analysis, summary.longestLeaderEntityId);
  const riser = entity(analysis, summary.largestRankImprovementEntityId);
  const decliner = entity(analysis, summary.largestRankDeclineEntityId);
  const rivalry = analysis.events.find((event) => event.type === "close-rivalry");
  const leaderChanges = analysis.events.filter((event) => event.type === "lead-change");
  const candidates: StoryCandidate[] = [
    {
      id: "angle-overall-history",
      angle: `${project.dataset.name}: ${summary.firstTimeLabel}–${summary.lastTimeLabel}`,
      explanation: `Covers the complete ${summary.periodCount}-period ranking history and ends with ${latestLeader} in front.`,
      primaryEntityIds: [summary.latestLeaderId],
      relevantEventIds: analysis.events.slice().sort((a, b) => b.importance - a.importance).slice(0, 8).map((event) => event.id),
      score: Math.min(94, 70 + leaderChanges.length * 4),
      suggestedVideoMode: "either",
    },
    {
      id: "angle-dominance",
      angle: `${dominant}'s run at #1`,
      explanation: `${dominant} held the lead for ${summary.longestLeaderPeriods} consecutive periods, the longest streak in the dataset.`,
      primaryEntityIds: [summary.longestLeaderEntityId],
      relevantEventIds: relevantEvents(analysis, [summary.longestLeaderEntityId]).slice(0, 8).map((event) => event.id),
      score: Math.min(96, 66 + summary.longestLeaderPeriods * 4),
      suggestedVideoMode: summary.longestLeaderPeriods >= 4 ? "long-form" : "either",
    },
    {
      id: "angle-biggest-rise",
      angle: `The rise of ${riser.label}`,
      explanation: `${riser.label} moved from #${riser.firstRank} to #${riser.lastRank}, the largest start-to-finish rank improvement.`,
      primaryEntityIds: [riser.entityId],
      relevantEventIds: relevantEvents(analysis, [riser.entityId]).slice(0, 8).map((event) => event.id),
      score: Math.min(95, 68 + Math.max(0, riser.firstRank - riser.lastRank) * 5),
      suggestedVideoMode: "either",
    },
    {
      id: "angle-rise-fall",
      angle: `${decliner.label}: a changing position`,
      explanation: `${decliner.label} moved from #${decliner.firstRank} to #${decliner.lastRank}; its strongest rises and falls create a focused entity arc.`,
      primaryEntityIds: [decliner.entityId],
      relevantEventIds: relevantEvents(analysis, [decliner.entityId]).slice(0, 8).map((event) => event.id),
      score: Math.min(91, 62 + Math.max(0, decliner.lastRank - decliner.firstRank) * 5),
      suggestedVideoMode: "long-form",
    },
  ];

  if (rivalry) {
    const first = label(analysis, rivalry.entityIds[0]);
    const second = label(analysis, rivalry.entityIds[1]);
    candidates.push({
      id: "angle-rivalry",
      angle: `${first} vs. ${second}`,
      explanation: `The two leaders were separated by only ${(Number(rivalry.metrics.gapRatio) * 100).toFixed(1)}% in ${rivalry.timeLabel}.`,
      primaryEntityIds: rivalry.entityIds,
      relevantEventIds: analysis.events.filter((event) => event.entityIds.some((id) => rivalry.entityIds.includes(id))).slice(0, 10).map((event) => event.id),
      score: rivalry.importance + 8,
      suggestedVideoMode: "long-form",
    });
  }

  return rotate(candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)), input.seed).slice(0, 5);
}

export function generateHooks(input: StoryGenerationInput): HookSuggestion[] {
  const { analysis } = input;
  const { summary } = analysis;
  const riser = entity(analysis, summary.largestRankImprovementEntityId);
  const dominant = entity(analysis, summary.longestLeaderEntityId);
  const latestLeader = entity(analysis, summary.latestLeaderId);
  const comeback = analysis.events.find((event) => event.type === "comeback");
  const firstLeadChange = analysis.events.find((event) => event.type === "lead-change");
  const leaderChangeCount = analysis.events.filter((event) => event.type === "lead-change").length;
  const hooks: HookSuggestion[] = [
    {
      id: "hook-rank-transformation",
      text: `Watch how ${riser.label} went from #${riser.firstRank} to #${riser.lastRank}.`,
      type: "transformation",
      targetEntityIds: [riser.entityId],
      recommendedFor: "either",
      score: Math.min(98, 76 + Math.max(0, riser.firstRank - riser.lastRank) * 4),
      reason: `Suggested because ${riser.label} has the largest start-to-finish rank improvement.`,
    },
    {
      id: "hook-dominance",
      text: `${dominant.label} held #1 for ${summary.longestLeaderPeriods} straight periods — but did it finish there?`,
      type: "dominance",
      targetEntityIds: [dominant.entityId],
      recommendedFor: "either",
      score: Math.min(96, 72 + summary.longestLeaderPeriods * 4),
      reason: `Suggested because ${dominant.label} recorded the longest uninterrupted lead.`,
    },
    {
      id: "hook-finish-question",
      text: `Can you guess who finishes #1 in ${summary.lastTimeLabel}?`,
      type: "question",
      targetEntityIds: [latestLeader.entityId],
      recommendedFor: "short-form",
      score: 78,
      reason: "A prediction question creates a clear reason to watch the final ranking.",
    },
    {
      id: "hook-dataset-change",
      text: leaderChangeCount > 0
        ? `This leaderboard looked completely different in ${summary.firstTimeLabel}.`
        : `${dominant.label} never lost #1 across these ${summary.periodCount} periods.`,
      type: "surprise",
      targetEntityIds: [summary.longestLeaderEntityId],
      recommendedFor: "short-form",
      score: 74 + Math.min(12, leaderChangeCount * 3),
      reason: leaderChangeCount > 0
        ? `The dataset spans ${summary.periodCount} periods and contains ${leaderChangeCount} leadership changes.`
        : `${dominant.label} is ranked #1 in every measured period.`,
    },
    {
      id: "hook-latest-leader",
      text: `${latestLeader.label} ends on top — the path there is the real story.`,
      type: "transformation",
      targetEntityIds: [latestLeader.entityId],
      recommendedFor: "long-form",
      score: 76,
      reason: `Grounded in the final-period ranking, where ${latestLeader.label} is #1.`,
    },
  ];

  if (comeback) {
    const comebackLabel = label(analysis, comeback.entityIds[0]);
    hooks.push({
      id: "hook-comeback",
      text: `${comebackLabel} disappeared from the top group — then came back.`,
      type: "comeback",
      targetEntityIds: comeback.entityIds,
      targetEventId: comeback.id,
      recommendedFor: "either",
      score: Math.min(99, comeback.importance + 8),
      reason: `Suggested from a detected comeback in ${comeback.timeLabel}.`,
    });
  }
  if (firstLeadChange) {
    hooks.push({
      id: "hook-first-turning-point",
      text: `Everything changes in ${firstLeadChange.timeLabel}.`,
      type: "surprise",
      targetEntityIds: firstLeadChange.entityIds,
      targetEventId: firstLeadChange.id,
      recommendedFor: "short-form",
      score: firstLeadChange.importance,
      reason: `That period contains the first detected leadership change.`,
    });
  }

  return rotate(uniqueByText(hooks).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)), input.seed).slice(0, 7);
}

export function generateTitles(input: StoryGenerationInput): TitleSuggestion[] {
  const { analysis, project } = input;
  const { summary } = analysis;
  const leader = label(analysis, summary.latestLeaderId);
  const riser = label(analysis, summary.largestRankImprovementEntityId);
  const dominant = label(analysis, summary.longestLeaderEntityId);
  const span = `${summary.firstTimeLabel}–${summary.lastTimeLabel}`;
  const titles: TitleSuggestion[] = [
    { id: "title-neutral", text: `${project.dataset.name}: ${span}`, style: "neutral", score: 86, reason: "States the dataset topic and exact time range." },
    { id: "title-history", text: `How the ${project.dataset.name} Ranking Changed`, style: "neutral", score: 82, reason: `Fits a ${summary.periodCount}-period ranking history.` },
    { id: "title-leader", text: `How ${leader} Finished on Top`, style: "story", score: 88, reason: `${leader} is the latest-period leader.` },
    { id: "title-rise", text: `The Rise of ${riser}`, style: "story", score: 87, reason: `${riser} has the largest start-to-finish rank improvement.` },
    { id: "title-dominance", text: `${dominant}'s Longest Run at #1`, style: "story", score: 84, reason: `${dominant} has the longest uninterrupted lead.` },
    { id: "title-curiosity", text: `Who Really Dominated ${span}?`, style: "curiosity", score: 80, reason: "Invites comparison while remaining grounded in the measured time range." },
    { id: "title-social", text: `${summary.periodCount} Periods. One Final Leader.`, style: "social", score: 78, reason: "A concise social title grounded in the dataset length and final ranking." },
  ];
  return rotate(uniqueByText(titles).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)), input.seed).slice(0, 7);
}

export function generateFinalTakeaway(input: StoryGenerationInput): string {
  const { analysis } = input;
  const { summary } = analysis;
  const latestLeader = label(analysis, summary.latestLeaderId);
  const dominant = label(analysis, summary.longestLeaderEntityId);
  if (summary.latestLeaderId === summary.longestLeaderEntityId) {
    return `${latestLeader} finished #1 and also held the longest uninterrupted lead at ${summary.longestLeaderPeriods} periods.`;
  }
  return `${latestLeader} finished #1, while ${dominant} held the longest uninterrupted lead at ${summary.longestLeaderPeriods} periods.`;
}

function sourceAttribution(input: StoryGenerationInput): string {
  const source = input.project.sourceMetadata;
  const owner = [source.publisher, source.name].filter(Boolean).join(" · ");
  const retrieved = source.retrievedDate ? ` Retrieved ${source.retrievedDate}.` : "";
  const url = source.url ? ` ${source.url}` : "";
  return owner ? `Source: ${owner}.${retrieved}${url}`.trim() : input.project.content.source ? `Source: ${input.project.content.source}` : "";
}

export function generateDescriptions(input: StoryGenerationInput): GeneratedDescriptions {
  const { analysis, project } = input;
  const takeaway = generateFinalTakeaway(input);
  const attribution = sourceAttribution(input);
  const range = `${analysis.summary.firstTimeLabel} to ${analysis.summary.lastTimeLabel}`;
  return {
    youtubeDescription: `${project.content.title}\n\nThis data story follows ${project.dataset.name} across ${analysis.summary.periodCount} periods, from ${range}. ${takeaway}\n\n${attribution}`.trim(),
    shortCaption: `${project.content.title} — ${analysis.summary.periodCount} periods, one changing leaderboard. ${takeaway}`,
    socialCaption: `See how ${project.dataset.name} changed from ${analysis.summary.firstTimeLabel} to ${analysis.summary.lastTimeLabel}. ${takeaway}\n\n${attribution}`.trim(),
    sourceAttribution: attribution,
  };
}

function eventAnnotationText(analysis: DatasetAnalysis, event: StoryEvent): string {
  const first = label(analysis, event.entityIds[0]);
  const second = event.entityIds[1] ? label(analysis, event.entityIds[1]) : "";
  switch (event.type) {
    case "lead-change": return `${first} takes the lead${second ? ` from ${second}` : ""}`;
    case "top-entry": return `${first} enters the Top ${event.metrics.boundary ?? event.metrics.topN}`;
    case "top-exit": return `${first} falls out of the Top ${event.metrics.topN}`;
    case "major-rise":
    case "rapid-rise": return `${first} rises to #${event.metrics.toRank}`;
    case "major-fall": return `${first} falls to #${event.metrics.toRank}`;
    case "record-value": return `${first} reaches a new record`;
    case "milestone": return `${first} crosses ${event.metrics.milestone}`;
    case "fastest-growth": return `${first} posts the largest gain`;
    case "largest-decline": return `${first} records the largest decline`;
    case "comeback": return `${first} returns to the top group`;
    case "sustained-dominance": return `${first} holds #1 for ${event.metrics.periods} periods`;
    case "collapse": return `${first} drops sharply`;
    case "close-rivalry": return `${first} and ${second} are almost level`;
    case "overtaking-streak": return `${first} climbs for ${event.metrics.periods} straight periods`;
    case "sudden-breakout": return `${first} breaks into the Top 3`;
  }
}

export function generateAnnotationSuggestions(input: StoryGenerationInput, maximum = input.project.events.maximumAnnotations): AnnotationSuggestion[] {
  return input.analysis.events
    .filter((event) => event.importance >= input.project.events.minimumImportance)
    .sort((a, b) => b.importance - a.importance || a.periodIndex - b.periodIndex)
    .filter((event, index, events) => events.findIndex((candidate) => candidate.periodIndex === event.periodIndex && candidate.entityIds[0] === event.entityIds[0]) === index)
    .slice(0, maximum)
    .map((event) => ({
      eventId: event.id,
      eventType: event.type,
      text: eventAnnotationText(input.analysis, event),
      reason: event.reason,
      importance: event.importance,
    }));
}
