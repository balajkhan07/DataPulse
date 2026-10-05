import type { StoryEvent } from "@/types/story";

export interface DatasetSummary {
  firstTime: number;
  firstTimeLabel: string;
  lastTime: number;
  lastTimeLabel: string;
  entityCount: number;
  periodCount: number;
  pointCount: number;
  highestValueEntityId: string;
  latestLeaderId: string;
  allTimePeakEntityId: string;
  allTimePeakValue: number;
  allTimePeakPeriodIndex: number;
  longestLeaderEntityId: string;
  longestLeaderPeriods: number;
  biggestIncreaseEntityId: string;
  biggestAbsoluteIncrease: number;
  biggestPercentageIncreaseEntityId: string;
  biggestPercentageIncrease: number;
  biggestDeclineEntityId: string;
  biggestAbsoluteDecline: number;
  mostVolatileEntityId: string;
  largestRankImprovementEntityId: string;
  largestRankImprovement: number;
  largestRankDeclineEntityId: string;
  largestRankDecline: number;
}

export interface EntityStats {
  entityId: string;
  label: string;
  firstPeriodIndex: number;
  lastPeriodIndex: number;
  firstRank: number;
  lastRank: number;
  bestRank: number;
  worstRank: number;
  startValue: number;
  endValue: number;
  peakValue: number;
  peakPeriodIndex: number;
  absoluteChange: number;
  percentageChange: number;
  largestIncrease: number;
  largestDecline: number;
  volatility: number;
  leaderPeriods: number;
  longestLeaderStreak: number;
}

export interface InterestingPeriod {
  periodIndex: number;
  time: number;
  timeLabel: string;
  score: number;
  reasons: string[];
  eventIds: string[];
  rankChanges: number;
  absoluteChange: number;
}

export interface DatasetAnalysis {
  analysisVersion: 1;
  cacheKey: string;
  summary: DatasetSummary;
  entityStats: EntityStats[];
  events: StoryEvent[];
  milestones: StoryEvent[];
  interestingPeriods: InterestingPeriod[];
}
