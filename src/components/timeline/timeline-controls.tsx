"use client";

import { Pause, Play, RotateCcw, SkipBack } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { getBarChartRaceTotalFrames } from "@/visualizations/bar-chart-race/state";
import { IconButton, SegmentedControl } from "@/components/ui/controls";

function formatTime(frame: number, fps: number): string {
  const seconds = Math.max(0, frame / fps);
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  const hundredths = Math.floor((seconds - wholeSeconds) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

export function TimelineControls() {
  const project = useEditorStore((state) => state.project);
  const normalized = useEditorStore((state) => state.dataset.normalized);
  const playback = useEditorStore((state) => state.playback);
  const setFrame = useEditorStore((state) => state.setFrame);
  const setPlaying = useEditorStore((state) => state.setPlaying);
  const setSpeed = useEditorStore((state) => state.setSpeed);
  const restart = useEditorStore((state) => state.restart);
  const totalFrames = normalized ? getBarChartRaceTotalFrames(normalized, project.video.fps, project.visualization.secondsPerPeriod) : 1;
  const progress = Math.min(1, playback.currentFrame / Math.max(1, totalFrames));
  const periods = normalized?.periods.length ?? 0;

  const togglePlayback = () => {
    if (playback.currentFrame >= totalFrames) setFrame(0);
    setPlaying(!playback.playing);
  };

  return (
    <section className="h-[126px] shrink-0 border-t border-white/[0.07] bg-[#0f1118]">
      <div className="flex h-12 items-center gap-3 border-b border-white/[0.055] px-4">
        <div className="flex items-center gap-0.5">
          <IconButton aria-label="Restart" onClick={restart}><RotateCcw size={14} /></IconButton>
          <IconButton aria-label="Go to start" onClick={() => setFrame(0)}><SkipBack size={14} /></IconButton>
          <button
            aria-label={playback.playing ? "Pause" : "Play"}
            className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-950 transition hover:scale-105 hover:bg-white"
            onClick={togglePlayback}
            type="button"
          >
            {playback.playing ? <Pause fill="currentColor" size={13} /> : <Play fill="currentColor" size={13} className="ml-0.5" />}
          </button>
        </div>
        <div className="w-32 font-mono text-[10px] text-slate-500">
          <span className="text-slate-300">{formatTime(playback.currentFrame, project.video.fps)}</span>
          <span className="mx-1.5 text-slate-700">/</span>
          {formatTime(totalFrames, project.video.fps)}
        </div>
        <div className="ml-auto w-44">
          <SegmentedControl
            onChange={setSpeed}
            options={[{ value: 0.5, label: "0.5×" }, { value: 1, label: "1×" }, { value: 2, label: "2×" }]}
            value={playback.speed}
          />
        </div>
      </div>

      <div className="relative h-[78px] px-5 pb-3 pt-4">
        <div className="absolute left-5 right-5 top-2 flex justify-between font-mono text-[8px] text-slate-700">
          <span>00:00</span><span>{Math.round(totalFrames / project.video.fps / 2)}s</span><span>{Math.round(totalFrames / project.video.fps)}s</span>
        </div>
        <div className="relative mt-2 h-11 rounded-lg border border-violet-400/15 bg-violet-400/[0.055]">
          <div className="absolute inset-y-0 left-0 rounded-l-lg bg-violet-400/10" style={{ width: `${progress * 100}%` }} />
          <div className="absolute inset-y-0 left-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-violet-300/80">
            <span className="h-2 w-2 rounded-sm bg-violet-400" /> Chart race · {periods} periods
          </div>
          <div className="pointer-events-none absolute -top-2 bottom-[-6px] z-10 w-px bg-white shadow-[0_0_8px_white]" style={{ left: `${progress * 100}%` }}>
            <span className="absolute -left-[3px] -top-0.5 h-2 w-2 rotate-45 bg-white" />
          </div>
          <input
            aria-label="Timeline playhead"
            className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
            max={totalFrames}
            min={0}
            onChange={(event) => {
              setPlaying(false);
              setFrame(Number(event.target.value));
            }}
            step={0.1}
            type="range"
            value={Math.min(playback.currentFrame, totalFrames)}
          />
        </div>
      </div>
    </section>
  );
}
