import type { BarChartRaceConfig } from "@/types/project";

export function applyEasing(progress: number, easing: BarChartRaceConfig["easing"]): number {
  const value = Math.min(1, Math.max(0, progress));
  switch (easing) {
    case "easeIn":
      return value * value * value;
    case "easeOut":
      return 1 - (1 - value) ** 3;
    case "easeInOut":
      return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
    default:
      return value;
  }
}

export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
