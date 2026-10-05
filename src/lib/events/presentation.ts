import { formatValue } from "@/lib/formatting/number";
import type { NormalizedDataset } from "@/types/data";
import type { BarChartRaceConfig } from "@/types/project";
import type { EventPresentation, StoryEvent } from "@/types/story";

export function presentStoryEvent(
  event: StoryEvent,
  dataset: NormalizedDataset,
  valueConfig: BarChartRaceConfig,
): EventPresentation {
  const label = dataset.entities[event.entityIds[0]]?.label ?? "An entity";
  const secondLabel = dataset.entities[event.entityIds[1]]?.label;
  switch (event.type) {
    case "lead-change":
      return { title: `${label} takes the lead`, description: secondLabel ? `Moves ahead of ${secondLabel}` : undefined };
    case "major-rise":
      return { title: `${label} surges to #${event.metrics.toRank}`, description: `Up ${event.metrics.change} positions` };
    case "major-fall":
      return { title: `${label} falls to #${event.metrics.toRank}`, description: `Down ${Math.abs(Number(event.metrics.change))} positions` };
    case "top-entry":
      return { title: `${label} enters the top ${event.metrics.boundary ?? event.metrics.topN}`, description: `Arrives at #${event.metrics.rank}` };
    case "top-exit":
      return { title: `${label} leaves the top ${event.metrics.topN}`, description: `Previously ranked #${event.metrics.previousRank}` };
    case "milestone":
      return { title: `${label} crosses a milestone`, description: formatValue(Number(event.metrics.milestone), valueConfig) };
    case "record-value":
      return { title: `${label} sets a new record`, description: formatValue(Number(event.metrics.value), valueConfig) };
    case "fastest-growth":
      return { title: `${label} grows fastest`, description: `+${formatValue(Number(event.metrics.absoluteGrowth), valueConfig)}` };
    case "largest-decline":
      return { title: `${label} records the largest decline`, description: `-${formatValue(Number(event.metrics.absoluteDecline), valueConfig)}` };
    case "comeback":
      return { title: `${label} makes a comeback`, description: `Returns at #${event.metrics.rank}` };
    case "sustained-dominance":
      return { title: `${label} sustains the lead`, description: `#1 for ${event.metrics.periods} periods` };
    case "rapid-rise":
      return { title: `${label} rises rapidly`, description: `From #${event.metrics.fromRank} to #${event.metrics.toRank}` };
    case "collapse":
      return { title: `${label} drops sharply`, description: `Down ${Math.round(Number(event.metrics.relativeDecline) * 100)}%` };
    case "close-rivalry":
      return { title: `${label} and ${secondLabel ?? "the runner-up"} are almost level`, description: `${(Number(event.metrics.gapRatio) * 100).toFixed(1)}% apart` };
    case "overtaking-streak":
      return { title: `${label} keeps climbing`, description: `${event.metrics.periods} consecutive periods` };
    case "sudden-breakout":
      return { title: `${label} breaks into the top 3`, description: `Arrives at #${event.metrics.rank}` };
  }
}
