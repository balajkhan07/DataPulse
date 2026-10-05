import type { InterestingPeriod } from "@/types/analysis";
import type { AdaptivePacingIntensity } from "@/types/assistant";

const intensityMultiplier: Record<AdaptivePacingIntensity, number> = { low: 0.55, medium: 1.05, high: 1.75 };

export interface AdaptivePacingPlan {
  weights: number[];
  totalWeight: number;
}

export function createAdaptivePacingPlan(
  periodCount: number,
  interestingPeriods: InterestingPeriod[],
  intensity: AdaptivePacingIntensity,
): AdaptivePacingPlan {
  const intervalCount = Math.max(1, periodCount - 1);
  const scoreByArrivalPeriod = new Map(interestingPeriods.map((period) => [period.periodIndex, period.score]));
  const weights = Array.from({ length: intervalCount }, (_, intervalIndex) => {
    const score = scoreByArrivalPeriod.get(intervalIndex + 1) ?? 0;
    return 1 + (score / 100) * intensityMultiplier[intensity];
  });
  return { weights, totalWeight: weights.reduce((total, weight) => total + weight, 0) };
}

export function mapFrameWithAdaptivePacing(
  localFrame: number,
  sceneDurationFrames: number,
  targetDurationFrames: number,
  plan: AdaptivePacingPlan,
): number {
  if (sceneDurationFrames <= 1 || targetDurationFrames <= 1 || plan.weights.length === 0) return 0;
  const progress = Math.max(0, Math.min(1, localFrame / (sceneDurationFrames - 1)));
  const weightedPosition = progress * plan.totalWeight;
  let accumulated = 0;
  let intervalIndex = plan.weights.length - 1;
  let intervalProgress = 1;
  for (let index = 0; index < plan.weights.length; index += 1) {
    const intervalEnd = accumulated + plan.weights[index];
    if (weightedPosition <= intervalEnd || index === plan.weights.length - 1) {
      intervalIndex = index;
      intervalProgress = Math.max(0, Math.min(1, (weightedPosition - accumulated) / plan.weights[index]));
      break;
    }
    accumulated = intervalEnd;
  }
  const intrinsicProgress = (intervalIndex + intervalProgress) / plan.weights.length;
  return intrinsicProgress * (targetDurationFrames - 1);
}
