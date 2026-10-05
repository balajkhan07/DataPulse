"use client";

import { useMemo } from "react";
import { analyzeNormalizedDataset } from "@/lib/analysis/dataset-analysis";
import { sliceNormalizedDataset } from "@/lib/data/slice-normalized";
import { createAnnotationSchedule, getActiveAnnotation } from "@/lib/events/annotations";
import { eventOptionsFromSettings } from "@/lib/events/detect-events";
import { createAdaptivePacingPlan, mapFrameWithAdaptivePacing } from "@/lib/story/pacing";
import { mapSceneFrame } from "@/lib/timeline/timeline";
import { AnnotationOverlay } from "@/scenes/annotation-overlay";
import type { SceneRendererProps } from "@/scenes/types";
import { getBarChartRaceTotalFrames } from "@/visualizations/bar-chart-race/state";
import { getVisualizationDefinition } from "@/visualizations/registry";
import type { StoryScene } from "@/types/story";

export function VisualizationSceneRenderer({ project, dataset, scene, localFrame }: SceneRendererProps) {
  if (scene.type !== "visualization") return null;
  return <VisualizationSceneContent dataset={dataset} localFrame={localFrame} project={project} scene={scene} />;
}

function VisualizationSceneContent({
  project,
  dataset,
  scene,
  localFrame,
}: Omit<SceneRendererProps, "scene"> & { scene: Extract<StoryScene, { type: "visualization" }> }) {
  const definition = getVisualizationDefinition(project.visualizationType);
  const sceneDataset = useMemo(
    () => sliceNormalizedDataset(dataset, scene.config.periodStartIndex, scene.config.periodEndIndex),
    [dataset, scene.config.periodEndIndex, scene.config.periodStartIndex],
  );
  const analysis = useMemo(
    () => analyzeNormalizedDataset(sceneDataset, eventOptionsFromSettings(project.events)),
    [project.events, sceneDataset],
  );
  const chartDuration = getBarChartRaceTotalFrames(sceneDataset, project.video.fps, project.visualization.secondsPerPeriod);
  const pacingPlan = useMemo(
    () => createAdaptivePacingPlan(sceneDataset.periods.length, analysis.interestingPeriods, project.story.adaptivePacing.intensity),
    [analysis.interestingPeriods, project.story.adaptivePacing.intensity, sceneDataset.periods.length],
  );
  const chartFrame = project.story.adaptivePacing.enabled
    ? mapFrameWithAdaptivePacing(localFrame, scene.durationFrames, chartDuration, pacingPlan)
    : mapSceneFrame(localFrame, scene.durationFrames, chartDuration);
  const state = definition.getStateAtFrame({
    dataset: sceneDataset,
    frame: chartFrame,
    fps: project.video.fps,
    config: project.visualization,
  });
  const annotations = useMemo(
    () => createAnnotationSchedule(
      analysis.events.filter((event) => project.events.enabledTypes.includes(event.type)),
      sceneDataset,
      getBarChartRaceTotalFrames(sceneDataset, project.video.fps, project.visualization.secondsPerPeriod),
      project.video.fps,
      project.events,
      project.visualization,
    ),
    [analysis.events, project.events, project.video.fps, project.visualization, sceneDataset],
  );
  const annotation = scene.config.annotationsEnabled ? getActiveAnnotation(annotations, chartFrame) : null;
  const Renderer = definition.Renderer;

  return (
    <div style={{ height: "100%", position: "relative", width: "100%" }}>
      <Renderer
        config={project.visualization}
        footer={project.content.footer}
        highlightedEntityIds={annotation?.entityIds}
        source={project.content.source}
        state={state}
        subtitle={project.content.subtitle}
        themeId={project.themeId}
        title={project.content.title}
        video={project.video}
      />
      {annotation && <AnnotationOverlay annotation={annotation} frame={chartFrame} themeId={project.themeId} video={project.video} />}
    </div>
  );
}
