import { detectStoryEvents, rankPeriod, type EventDetectionOptions } from "@/lib/events/detect-events";
import type { DatasetAnalysis, DatasetSummary, EntityStats, InterestingPeriod } from "@/types/analysis";
import type { NormalizedDataset } from "@/types/data";

function rankMaps(dataset: NormalizedDataset): Array<Record<string, number>> {
  return dataset.periods.map((period) => Object.fromEntries(rankPeriod(period).map((entityId, index) => [entityId, index + 1])));
}

function longestStreak(values: boolean[]): number {
  let longest = 0;
  let current = 0;
  for (const value of values) {
    current = value ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

function safePercentage(previous: number, current: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}

function entityStatistics(dataset: NormalizedDataset, ranks: Array<Record<string, number>>): EntityStats[] {
  const leaders = dataset.periods.map((period) => rankPeriod(period)[0]);
  return Object.values(dataset.entities).map((entity) => {
    const observations = dataset.periods.flatMap((period, periodIndex) => {
      const point = period.points[entity.id];
      return point ? [{ periodIndex, value: point.value, rank: ranks[periodIndex][entity.id] }] : [];
    });
    const first = observations[0];
    const last = observations.at(-1) ?? first;
    let largestIncrease = 0;
    let largestDecline = 0;
    const relativeChanges: number[] = [];
    for (let index = 1; index < observations.length; index += 1) {
      const change = observations[index].value - observations[index - 1].value;
      largestIncrease = Math.max(largestIncrease, change);
      largestDecline = Math.min(largestDecline, change);
      if (observations[index - 1].value !== 0) relativeChanges.push(Math.abs(change / observations[index - 1].value));
    }
    const peak = observations.reduce((best, item) => item.value > best.value ? item : best, first);
    const entityLeads = leaders.map((leader) => leader === entity.id);
    return {
      entityId: entity.id,
      label: entity.label,
      firstPeriodIndex: first.periodIndex,
      lastPeriodIndex: last.periodIndex,
      firstRank: first.rank,
      lastRank: last.rank,
      bestRank: Math.min(...observations.map((item) => item.rank)),
      worstRank: Math.max(...observations.map((item) => item.rank)),
      startValue: first.value,
      endValue: last.value,
      peakValue: peak.value,
      peakPeriodIndex: peak.periodIndex,
      absoluteChange: last.value - first.value,
      percentageChange: safePercentage(first.value, last.value),
      largestIncrease,
      largestDecline,
      volatility: relativeChanges.length > 0 ? relativeChanges.reduce((total, value) => total + value, 0) / relativeChanges.length : 0,
      leaderPeriods: entityLeads.filter(Boolean).length,
      longestLeaderStreak: longestStreak(entityLeads),
    };
  });
}

function bestBy<T>(items: T[], score: (item: T) => number): T {
  return items.reduce((best, item) => score(item) > score(best) ? item : best, items[0]);
}

function buildSummary(dataset: NormalizedDataset, stats: EntityStats[]): DatasetSummary {
  const firstPeriod = dataset.periods[0];
  const lastPeriod = dataset.periods.at(-1) ?? firstPeriod;
  const allTimePeak = bestBy(dataset.points, (point) => point.value);
  const latestLeaderId = rankPeriod(lastPeriod)[0] ?? allTimePeak.entityId;
  const longestLeader = bestBy(stats, (item) => item.longestLeaderStreak);
  const biggestIncrease = bestBy(stats, (item) => item.largestIncrease);
  const biggestPercentageIncrease = bestBy(stats, (item) => item.percentageChange);
  const biggestDecline = bestBy(stats, (item) => Math.abs(Math.min(0, item.largestDecline)));
  const mostVolatile = bestBy(stats, (item) => item.volatility);
  const rankImprovement = bestBy(stats, (item) => item.firstRank - item.lastRank);
  const rankDecline = bestBy(stats, (item) => item.lastRank - item.firstRank);
  return {
    firstTime: firstPeriod.time,
    firstTimeLabel: firstPeriod.label,
    lastTime: lastPeriod.time,
    lastTimeLabel: lastPeriod.label,
    entityCount: Object.keys(dataset.entities).length,
    periodCount: dataset.periods.length,
    pointCount: dataset.points.length,
    highestValueEntityId: allTimePeak.entityId,
    latestLeaderId,
    allTimePeakEntityId: allTimePeak.entityId,
    allTimePeakValue: allTimePeak.value,
    allTimePeakPeriodIndex: dataset.periods.findIndex((period) => period.time === allTimePeak.time),
    longestLeaderEntityId: longestLeader.entityId,
    longestLeaderPeriods: longestLeader.longestLeaderStreak,
    biggestIncreaseEntityId: biggestIncrease.entityId,
    biggestAbsoluteIncrease: biggestIncrease.largestIncrease,
    biggestPercentageIncreaseEntityId: biggestPercentageIncrease.entityId,
    biggestPercentageIncrease: biggestPercentageIncrease.percentageChange,
    biggestDeclineEntityId: biggestDecline.entityId,
    biggestAbsoluteDecline: Math.abs(biggestDecline.largestDecline),
    mostVolatileEntityId: mostVolatile.entityId,
    largestRankImprovementEntityId: rankImprovement.entityId,
    largestRankImprovement: Math.max(0, rankImprovement.firstRank - rankImprovement.lastRank),
    largestRankDeclineEntityId: rankDecline.entityId,
    largestRankDecline: Math.max(0, rankDecline.lastRank - rankDecline.firstRank),
  };
}

function detectInterestingPeriods(dataset: NormalizedDataset, events: DatasetAnalysis["events"], ranks: Array<Record<string, number>>): InterestingPeriod[] {
  const periods: InterestingPeriod[] = [];
  for (let index = 1; index < dataset.periods.length; index += 1) {
    const previous = dataset.periods[index - 1];
    const current = dataset.periods[index];
    const entityIds = new Set([...Object.keys(previous.points), ...Object.keys(current.points)]);
    let absoluteChange = 0;
    let rankChanges = 0;
    entityIds.forEach((entityId) => {
      absoluteChange += Math.abs((current.points[entityId]?.value ?? 0) - (previous.points[entityId]?.value ?? 0));
      const previousRank = ranks[index - 1][entityId] ?? entityIds.size + 1;
      const currentRank = ranks[index][entityId] ?? entityIds.size + 1;
      rankChanges += Math.abs(currentRank - previousRank);
    });
    const periodEvents = events.filter((event) => event.periodIndex === index);
    const strongestEvent = Math.max(0, ...periodEvents.map((event) => event.importance));
    const normalizedChange = absoluteChange / Math.max(1, dataset.maxValue * Math.max(1, entityIds.size));
    const score = Math.round(Math.min(100, strongestEvent * 0.68 + Math.min(18, rankChanges * 1.7) + Math.min(22, normalizedChange * 160)));
    const reasons: string[] = [];
    if (periodEvents.some((event) => event.type === "lead-change")) reasons.push("Leadership changed");
    if (rankChanges >= Math.max(4, entityIds.size)) reasons.push("Unusually high ranking movement");
    if (normalizedChange >= 0.12) reasons.push("Large value changes");
    if (periodEvents.some((event) => ["sudden-breakout", "comeback", "collapse"].includes(event.type))) reasons.push("A rare entity arc occurred");
    if (periodEvents.some((event) => event.importance >= 80)) reasons.push("High-importance story event");
    if (score >= 28 || periodEvents.length > 0) {
      periods.push({
        periodIndex: index,
        time: current.time,
        timeLabel: current.label,
        score,
        reasons: reasons.length > 0 ? reasons : ["Meaningful change from the previous period"],
        eventIds: periodEvents.map((event) => event.id),
        rankChanges,
        absoluteChange,
      });
    }
  }
  return periods.sort((a, b) => a.periodIndex - b.periodIndex);
}

export function analyzeNormalizedDataset(
  dataset: NormalizedDataset,
  options: Partial<EventDetectionOptions> = {},
  cacheKey = "direct-analysis-v1",
): DatasetAnalysis {
  if (dataset.periods.length === 0 || dataset.points.length === 0) throw new Error("A non-empty normalized dataset is required for analysis.");
  const ranks = rankMaps(dataset);
  const entityStats = entityStatistics(dataset, ranks);
  const events = detectStoryEvents(dataset, options);
  return {
    analysisVersion: 1,
    cacheKey,
    summary: buildSummary(dataset, entityStats),
    entityStats: entityStats.sort((a, b) => b.peakValue - a.peakValue || a.label.localeCompare(b.label)),
    events,
    milestones: events.filter((event) => event.type === "milestone"),
    interestingPeriods: detectInterestingPeriods(dataset, events, ranks),
  };
}
