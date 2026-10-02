"use client";

import { useEffect, useRef } from "react";
import { Maximize2, MonitorPlay, ShieldCheck } from "lucide-react";
import { getAudioTiming, getAudioVolume } from "@/lib/export/audio";
import { getActiveScene, getTimelineDuration } from "@/lib/timeline/timeline";
import { StoryRenderer } from "@/scenes/story-renderer";
import { useEditorStore } from "@/store/editor-store";

export function PreviewPlayer() {
  const project = useEditorStore((state) => state.project);
  const normalized = useEditorStore((state) => state.dataset.normalized);
  const currentFrame = useEditorStore((state) => state.playback.currentFrame);
  const playing = useEditorStore((state) => state.playback.playing);
  const speed = useEditorStore((state) => state.playback.speed);
  const setFrame = useEditorStore((state) => state.setFrame);
  const setPlaying = useEditorStore((state) => state.setPlaying);
  const frameRef = useRef(currentFrame);
  const audioRef = useRef<HTMLAudioElement>(null);
  const totalFrames = getTimelineDuration(project.timeline);
  const audioTiming = getAudioTiming(project.audio, totalFrames, project.video.fps);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioTiming) return;
    const localFrame = currentFrame - audioTiming.startFrame;
    if (!playing || localFrame < 0 || localFrame >= audioTiming.outputDurationFrames) {
      audio.pause();
      return;
    }
    const sourceFrame = audioTiming.loop
      ? localFrame % audioTiming.sourceDurationFrames
      : localFrame;
    const expectedTime = (audioTiming.trimBeforeFrames + sourceFrame) / project.video.fps;
    if (Math.abs(audio.currentTime - expectedTime) > 0.15) audio.currentTime = expectedTime;
    audio.playbackRate = speed;
    audio.volume = getAudioVolume(project.audio, localFrame, audioTiming.outputDurationFrames, project.video.fps);
    if (audio.paused) void audio.play().catch(() => undefined);
  }, [audioTiming, currentFrame, playing, project.audio, project.video.fps, speed]);

  const scaleLabel = `${Math.round((currentFrame / Math.max(totalFrames, 1)) * 100)}%`;
  const activeScene = getActiveScene(project.timeline, currentFrame)?.scene;

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
          <span className="capitalize text-slate-500">{activeScene?.type.replace("-", " ") ?? "No scene"}</span>
          <span className="rounded bg-white/[0.04] px-2 py-1 font-mono text-slate-500">{scaleLabel}</span>
          <button aria-label="Fit preview" className="text-slate-600 transition hover:text-white" type="button"><Maximize2 size={13} /></button>
        </div>
      </div>

      <div className="preview-grid relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5 lg:p-7">
        {project.audio.assetId && <audio preload="auto" ref={audioRef} src={`/api/audio-assets/${project.audio.assetId}`} />}
        <div
          className="relative max-h-full max-w-full overflow-hidden rounded-md shadow-[0_28px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
          style={{ aspectRatio: `${project.video.width} / ${project.video.height}`, height: "100%" }}
        >
          {normalized ? (
            <StoryRenderer dataset={normalized} frame={currentFrame} project={project} />
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
