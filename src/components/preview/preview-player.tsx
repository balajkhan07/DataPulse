"use client";

import { useEffect, useMemo, useRef } from "react";
import { Maximize2, MonitorPlay, ShieldCheck } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { getBarChartRaceTotalFrames } from "@/visualizations/bar-chart-race/state";
import { getVisualizationDefinition } from "@/visualizations/registry";

export function PreviewPlayer() {
  const project = useEditorStore((state) => state.project);
  const normalized = useEditorStore((state) => state.dataset.normalized);
  const currentFrame = useEditorStore((state) => state.playback.currentFrame);
  const playing = useEditorStore((state) => state.playback.playing);
  const speed = useEditorStore((state) => state.playback.speed);
  const setFrame = useEditorStore((state) => state.setFrame);
  const setPlaying = useEditorStore((state) => state.setPlaying);
  const frameRef = useRef(currentFrame);
  const definition = getVisualizationDefinition(project.visualizationType);
  const totalFrames = normalized
    ? getBarChartRaceTotalFrames(normalized, project.video.fps, project.visualization.secondsPerPeriod)
    : 1;

  useEffect(() => {
    frameRef.current = currentFrame;
  }, [currentFrame]);

  useEffect(() => {
    if (!playing || !normalized) return;
    let animationFrame = 0;
    let previousTime: number | null = null;

    const tick = (time: number) => {
      if (previousTime === null) previousTime = time;
      const elapsedSeconds = Math.min(0.1, (time - previousTime) / 1000);
      previousTime = time;
      const nextFrame = frameRef.current + elapsedSeconds * project.video.fps * speed;
      if (nextFrame >= totalFrames) {
        frameRef.current = totalFrames;
        setFrame(totalFrames);
        setPlaying(false);
        return;
      }
      frameRef.current = nextFrame;
      setFrame(nextFrame);
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [normalized, playing, project.video.fps, setFrame, setPlaying, speed, totalFrames]);

  useEffect(() => {
    if (currentFrame > totalFrames) setFrame(totalFrames);
  }, [currentFrame, setFrame, totalFrames]);

  const state = useMemo(
    () => normalized
      ? definition.getStateAtFrame({ dataset: normalized, frame: currentFrame, fps: project.video.fps, config: project.visualization })
      : null,
    [currentFrame, definition, normalized, project.video.fps, project.visualization],
  );

  const Renderer = definition.Renderer;
  const scaleLabel = `${Math.round((currentFrame / Math.max(totalFrames, 1)) * 100)}%`;

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0a0b10]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.055] px-4">
        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
          <MonitorPlay size={13} /> Live canvas
          <span className="h-1 w-1 rounded-full bg-slate-700" />
          <span className="font-mono">{project.video.width} × {project.video.height}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-500" /> Safe area on</span>
          <span className="rounded bg-white/[0.04] px-2 py-1 font-mono text-slate-500">{scaleLabel}</span>
          <button aria-label="Fit preview" className="text-slate-600 transition hover:text-white" type="button"><Maximize2 size={13} /></button>
        </div>
      </div>

      <div className="preview-grid relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5 lg:p-7">
        <div
          className="relative max-h-full max-w-full overflow-hidden rounded-md shadow-[0_28px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
          style={{ aspectRatio: `${project.video.width} / ${project.video.height}`, height: "100%" }}
        >
          {state ? (
            <Renderer
              config={project.visualization}
              footer={project.content.footer}
              source={project.content.source}
              state={state}
              subtitle={project.content.subtitle}
              themeId={project.themeId}
              title={project.content.title}
              video={project.video}
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-slate-950 px-8 text-center text-xs text-slate-500">
              Map valid time, category, and value columns to render the preview.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
