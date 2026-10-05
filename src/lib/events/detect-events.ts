import { deduplicateStoryEvents, scoreStoryEvent, type EventScoreFactors } from "@/lib/events/scoring";
import type { NormalizedDataset, NormalizedPeriod } from "@/types/data";
import type { EventSettings, StoryEvent, StoryEventType } from "@/types/story";

export interface EventDetectionOptions {
  topN: number;
  majorRankChange: number;
  milestones: number[];
  enabledTypes?: StoryEventType[];
}

const defaultOptions: EventDetectionOptions = { topN: 10, majorRankChange: 3, milestones: [] };

export function rankPeriod(period: NormalizedPeriod): string[] {
  return Object.values(period.points)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .map((point) => point.entityId);
}

function rankMap(ranking: string[]): Record<string, number> {
  return Object.fromEntries(ranking.map((entityId, index) => [entityId, index + 1]));
}

function relativeChange(previous: number, current: number): number {
  if (previous === 0) return current === 0 ? 0 : 1;
  return (current - previous) / Math.abs(previous);
}

function createEvent(
  type: StoryEventType,
  dataset: NormalizedDataset,
  periodIndex: number,
  entityIds: string[],
  metrics: StoryEvent["metrics"],
  reason: string,
  factors: EventScoreFactors = {},
): StoryEvent {
  const period = dataset.periods[periodIndex];
  const confidence = Math.max(0, Math.min(1, factors.confidence ?? 0.9));
  return {
    id: `${type}-${period.time}-${entityIds.join("-")}-${Object.values(metrics).join("-")}`,
    type,
    time: period.time,
    timeLabel: period.label,
    periodIndex,
    entityIds,
    importance: scoreStoryEvent(type, { ...factors, entityCount: entityIds.length, confidence }),
    confidence,
    metrics,
    reason,
  };
}

function leaderStreakEvents(dataset: NormalizedDataset): StoryEvent[] {
  if (dataset.periods.length < 3) return [];
  const events: StoryEvent[] = [];
  let leader = rankPeriod(dataset.periods[0])[0] ?? "";
  let streakStart = 0;

  for (let index = 1; index <= dataset.periods.length; index += 1) {
    const nextLeader = index < dataset.periods.length ? rankPeriod(dataset.periods[index])[0] ?? "" : "";
    if (nextLeader === leader) continue;
    const periods = index - streakStart;
    if (leader && periods >= 3) {
      const eventIndex = index - 1;
      events.push(createEvent(
        "sustained-dominance",
        dataset,
        eventIndex,
        [leader],
        { periods, startPeriodIndex: streakStart, endPeriodIndex: eventIndex },
        `Held the #1 rank for ${periods} consecutive periods.`,
        { affectsLeader: true, rarity: Math.min(8, periods), confidence: 1 },
      ));
    }
    leader = nextLeader;
    streakStart = index;
  }
  return events;
}

export function detectStoryEvents(dataset: NormalizedDataset, providedOptions: Partial<EventDetectionOptions> = {}): StoryEvent[] {
  const options = { ...defaultOptions, ...providedOptions };
  if (dataset.periods.length < 2) return [];
  const events: StoryEvent[] = [...leaderStreakEvents(dataset)];
  const records: Record<string, number> = {};
  const everTopThree = new Set<string>();
  const droppedAfterTopThree = new Set<string>();
  const riseStreaks: Record<string, number> = {};

  Object.values(dataset.periods[0].points).forEach((point) => { records[point.entityId] = point.value; });
  rankPeriod(dataset.periods[0]).slice(0, 3).forEach((entityId) => everTopThree.add(entityId));

  for (let index = 1; index < dataset.periods.length; index += 1) {
    const previousPeriod = dataset.periods[index - 1];
    const currentPeriod = dataset.periods[index];
    const previous = rankPeriod(previousPeriod);
    const current = rankPeriod(currentPeriod);
    const previousRanks = rankMap(previous);
    const currentRanks = rankMap(current);

    if (previous[0] && current[0] && previous[0] !== current[0]) {
      const newValue = currentPeriod.points[current[0]]?.value ?? 0;
      const oldValue = currentPeriod.points[previous[0]]?.value ?? 0;
      events.push(createEvent(
        "lead-change", dataset, index, [current[0], previous[0]],
        { previousLeaderId: previous[0], newLeaderId: current[0], margin: newValue - oldValue },
        `The #1 position changed from ${previous[0]} to ${current[0]}.`,
        { affectsLeader: true, affectsTopThree: true, rarity: 6, confidence: 1 },
      ));
    }

    const topTwo = current.slice(0, 2);
    if (topTwo.length === 2) {
      const firstValue = currentPeriod.points[topTwo[0]]?.value ?? 0;
      const secondValue = currentPeriod.points[topTwo[1]]?.value ?? 0;
      const gapRatio = firstValue > 0 ? Math.abs(firstValue - secondValue) / firstValue : 1;
      if (gapRatio <= 0.06) {
        events.push(createEvent(
          "close-rivalry", dataset, index, topTwo, { gap: Math.abs(firstValue - secondValue), gapRatio },
          `The top two values were within ${(gapRatio * 100).toFixed(1)}%.`,
          { affectsLeader: true, affectsTopThree: true, relativeValueMagnitude: 0.06 - gapRatio, confidence: 0.92 },
        ));
      }
    }

    const previousTop = new Set(previous.slice(0, options.topN));
    const currentTop = new Set(current.slice(0, options.topN));
    current.slice(0, options.topN).forEach((entityId, rankIndex) => {
      const rank = rankIndex + 1;
      if (!previousTop.has(entityId)) {
        events.push(createEvent(
          "top-entry", dataset, index, [entityId], { rank, topN: options.topN, boundary: rank <= 3 ? 3 : options.topN },
          `Entered the top ${rank <= 3 ? 3 : options.topN} at rank #${rank}.`,
          { affectsTopThree: rank <= 3, rankMagnitude: Math.max(1, options.topN - rank), confidence: 0.95 },
        ));
      }
      if (rank <= 3 && !previousTop.has(entityId)) {
        events.push(createEvent(
          "sudden-breakout", dataset, index, [entityId], { rank, previousRank: previousRanks[entityId] ?? options.topN + 1 },
          `Jumped into the top three from outside the previous top ${options.topN}.`,
          { affectsTopThree: true, rankMagnitude: options.topN - rank + 1, rarity: 5, confidence: 0.9 },
        ));
      }
      if (rank <= 3) {
        if (droppedAfterTopThree.has(entityId)) {
          events.push(createEvent(
            "comeback", dataset, index, [entityId], { rank, previousBestGroup: "top-3" },
            `Returned to the top three after previously falling outside the top ${options.topN}.`,
            { affectsTopThree: true, rankMagnitude: options.topN - rank, rarity: 7, confidence: 0.9 },
          ));
          droppedAfterTopThree.delete(entityId);
        }
        everTopThree.add(entityId);
      }
    });
    previous.slice(0, options.topN).forEach((entityId, rankIndex) => {
      if (!currentTop.has(entityId)) {
        const previousRank = rankIndex + 1;
        events.push(createEvent(
          "top-exit", dataset, index, [entityId], { previousRank, topN: options.topN },
          `Fell out of the top ${options.topN} from rank #${previousRank}.`,
          { affectsTopThree: previousRank <= 3, rankMagnitude: options.topN - previousRank, confidence: 0.95 },
        ));
        if (everTopThree.has(entityId)) droppedAfterTopThree.add(entityId);
      }
    });

    current.forEach((entityId) => {
      const previousRank = previousRanks[entityId];
      const currentRank = currentRanks[entityId];
      if (!previousRank || !currentRank) {
        riseStreaks[entityId] = 0;
        return;
      }
      const rankChange = previousRank - currentRank;
      riseStreaks[entityId] = rankChange > 0 ? (riseStreaks[entityId] ?? 0) + 1 : 0;
      if (rankChange >= options.majorRankChange) {
        events.push(createEvent(
          "major-rise", dataset, index, [entityId], { fromRank: previousRank, toRank: currentRank, change: rankChange },
          `Rose ${rankChange} ranks, from #${previousRank} to #${currentRank}.`,
          { rankMagnitude: rankChange, affectsTopThree: currentRank <= 3, confidence: 1 },
        ));
      }
      if (rankChange <= -options.majorRankChange) {
        events.push(createEvent(
          "major-fall", dataset, index, [entityId], { fromRank: previousRank, toRank: currentRank, change: rankChange },
          `Fell ${Math.abs(rankChange)} ranks, from #${previousRank} to #${currentRank}.`,
          { rankMagnitude: Math.abs(rankChange), affectsTopThree: previousRank <= 3, confidence: 1 },
        ));
      }
      if (rankChange >= options.majorRankChange + 1) {
        events.push(createEvent(
          "rapid-rise", dataset, index, [entityId], { fromRank: previousRank, toRank: currentRank, change: rankChange },
          `Made an unusually fast ${rankChange}-place climb in one period.`,
          { rankMagnitude: rankChange, affectsTopThree: currentRank <= 3, rarity: 4, confidence: 0.92 },
        ));
      }
      if (riseStreaks[entityId] >= 2) {
        events.push(createEvent(
          "overtaking-streak", dataset, index, [entityId], { periods: riseStreaks[entityId], toRank: currentRank },
          `Improved its rank in ${riseStreaks[entityId]} consecutive periods.`,
          { rankMagnitude: riseStreaks[entityId], affectsTopThree: currentRank <= 3, rarity: 3, confidence: 0.88 },
        ));
      }
    });

    let fastest: { entityId: string; change: number; relative: number } | null = null;
    let largestDecline: { entityId: string; change: number; relative: number } | null = null;
    for (const point of Object.values(currentPeriod.points)) {
      const previousValue = previousPeriod.points[point.entityId]?.value ?? 0;
      const change = point.value - previousValue;
      const relative = relativeChange(previousValue, point.value);
      if (!fastest || change > fastest.change) fastest = { entityId: point.entityId, change, relative };
      if (!largestDecline || change < largestDecline.change) largestDecline = { entityId: point.entityId, change, relative };

      const previousRecord = records[point.entityId] ?? Number.NEGATIVE_INFINITY;
      if (point.value > previousRecord) {
        const relativeGain = Number.isFinite(previousRecord) ? Math.max(0, relativeChange(previousRecord, point.value)) : 0;
        events.push(createEvent(
          "record-value", dataset, index, [point.entityId], { value: point.value, previousRecord: Number.isFinite(previousRecord) ? previousRecord : 0, relativeGain },
          `Set a new entity record with a value of ${point.value}.`,
          { relativeValueMagnitude: relativeGain, affectsLeader: current[0] === point.entityId, confidence: 1 },
        ));
        records[point.entityId] = point.value;
      }

      for (const milestone of options.milestones) {
        if (previousValue < milestone && point.value >= milestone) {
          events.push(createEvent(
            "milestone", dataset, index, [point.entityId], { milestone, value: point.value },
            `Crossed the configured ${milestone} milestone.`,
            { affectsLeader: current[0] === point.entityId, rarity: 5, confidence: 1 },
          ));
        }
      }

      const rankDrop = (currentRanks[point.entityId] ?? previousRanks[point.entityId] ?? 0) - (previousRanks[point.entityId] ?? 0);
      if (relative <= -0.35 && rankDrop >= 2) {
        events.push(createEvent(
          "collapse", dataset, index, [point.entityId], { relativeDecline: Math.abs(relative), rankDrop, fromValue: previousValue, toValue: point.value },
          `Lost ${(Math.abs(relative) * 100).toFixed(1)}% and fell ${rankDrop} ranks in one period.`,
          { relativeValueMagnitude: Math.abs(relative), rankMagnitude: rankDrop, affectsTopThree: (previousRanks[point.entityId] ?? 99) <= 3, rarity: 5, confidence: 0.94 },
        ));
      }
    }

    if (fastest && fastest.change > 0) {
      events.push(createEvent(
        "fastest-growth", dataset, index, [fastest.entityId], { absoluteGrowth: fastest.change, relativeGrowth: fastest.relative },
        `Recorded the largest absolute increase in this period.`,
        { relativeValueMagnitude: Math.max(0, fastest.relative), affectsLeader: current[0] === fastest.entityId, confidence: 1 },
      ));
    }
    if (largestDecline && largestDecline.change < 0) {
      events.push(createEvent(
        "largest-decline", dataset, index, [largestDecline.entityId], { absoluteDecline: Math.abs(largestDecline.change), relativeDecline: Math.abs(largestDecline.relative) },
        `Recorded the largest absolute decline in this period.`,
        { relativeValueMagnitude: Math.abs(largestDecline.relative), affectsLeader: previous[0] === largestDecline.entityId, confidence: 1 },
      ));
    }
  }

  const enabled = options.enabledTypes ? new Set(options.enabledTypes) : null;
  return deduplicateStoryEvents(events)
    .filter((event) => !enabled || enabled.has(event.type))
    .sort((a, b) => a.time - b.time || b.importance - a.importance || a.id.localeCompare(b.id));
}

export function eventOptionsFromSettings(settings: EventSettings): EventDetectionOptions {
  return { topN: settings.topN, majorRankChange: settings.majorRankChange, milestones: settings.milestones, enabledTypes: settings.enabledTypes };
}
