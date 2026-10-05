import type { StoryEvent, StoryEventType } from "@/types/story";

const baseScores: Record<StoryEventType, number> = {
  "lead-change": 78,
  "major-rise": 54,
  "major-fall": 52,
  "top-entry": 58,
  "top-exit": 48,
  "record-value": 44,
  milestone: 66,
  "fastest-growth": 50,
  "largest-decline": 52,
  comeback: 68,
  "sustained-dominance": 70,
  "rapid-rise": 62,
  collapse: 66,
  "close-rivalry": 58,
  "overtaking-streak": 60,
  "sudden-breakout": 72,
};

export interface EventScoreFactors {
  rankMagnitude?: number;
  relativeValueMagnitude?: number;
  affectsLeader?: boolean;
  affectsTopThree?: boolean;
  entityCount?: number;
  rarity?: number;
  confidence?: number;
}

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

export function scoreStoryEvent(type: StoryEventType, factors: EventScoreFactors = {}): number {
  const rankContribution = Math.min(16, Math.max(0, factors.rankMagnitude ?? 0) * 3.2);
  const valueContribution = Math.min(18, Math.max(0, factors.relativeValueMagnitude ?? 0) * 20);
  const leaderContribution = factors.affectsLeader ? 13 : 0;
  const topThreeContribution = factors.affectsTopThree ? 7 : 0;
  const multiEntityContribution = Math.max(0, Math.min(5, (factors.entityCount ?? 1) - 1) * 2.5);
  const rarityContribution = Math.max(0, Math.min(8, factors.rarity ?? 0));
  const confidenceMultiplier = 0.85 + Math.max(0, Math.min(1, factors.confidence ?? 1)) * 0.15;
  return clampScore((baseScores[type] + rankContribution + valueContribution + leaderContribution + topThreeContribution + multiEntityContribution + rarityContribution) * confidenceMultiplier);
}

function clusterKey(event: StoryEvent): string {
  return `${event.type}:${[...event.entityIds].sort().join("|")}`;
}

export function deduplicateStoryEvents(events: StoryEvent[], periodWindow = 1): StoryEvent[] {
  const selected: StoryEvent[] = [];
  const ordered = [...events].sort((a, b) => a.periodIndex - b.periodIndex || b.importance - a.importance || a.id.localeCompare(b.id));

  for (const event of ordered) {
    const key = clusterKey(event);
    const previousIndex = selected.findLastIndex((candidate) => clusterKey(candidate) === key && event.periodIndex - candidate.periodIndex <= periodWindow);
    if (previousIndex < 0) {
      selected.push(event);
      continue;
    }
    const previous = selected[previousIndex];
    if (event.importance > previous.importance || (event.importance === previous.importance && event.confidence > previous.confidence)) {
      selected[previousIndex] = event;
    }
  }

  return selected.sort((a, b) => a.periodIndex - b.periodIndex || b.importance - a.importance || a.id.localeCompare(b.id));
}
