"use client";

import { Pause, Play, RotateCcw, SkipBack } from "lucide-react";
import { getActiveScene, getSceneStartFrame, getTimelineDuration } from "@/lib/timeline/timeline";
import { useEditorStore } from "@/store/editor-store";
import { IconButton, SegmentedControl } from "@/components/ui/controls";
import type { SceneType } from "@/types/story";

const sceneLabels: Record<SceneType, string> = {
  hook: "Hook",
  visualization: "Chart race",
  "final-ranking": "Final ranking",
  outro: "Outro",
};

const sceneColors: Record<SceneType, string> = {
  hook: "border-fuchsia-400/25 bg-fuchsia-400/[0.08] text-fuchsia-300",
  visualization: "border-violet-400/25 bg-violet-400/[0.08] text-violet-300",
  "final-ranking": "border-sky-400/25 bg-sky-400/[0.08] text-sky-300",
  outro: "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300",
};

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
  const playback = useEditorStore((state) => state.playback);
  const setFrame = useEditorStore((state) => state.setFrame);
  const setPlaying = useEditorStore((state) => state.setPlaying);
  const setSpeed = useEditorStore((state) => state.setSpeed);
  const selectScene = useEditorStore((state) => state.selectScene);
  const restart = useEditorStore((state) => state.restart);
  const totalFrames = getTimelineDuration(project.timeline);
  const progress = Math.min(1, playback.currentFrame / Math.max(1, totalFrames));
  const activeSceneId = getActiveScene(project.timeline, playback.currentFrame)?.scene.id;

  const togglePlayback = () => {
    if (playback.currentFrame >= totalFrames - 1) setFrame(0);
    setPlaying(!playback.playing);
  };

  return (
    <section className="h-[142px] shrink-0 border-t border-white/[0.07] bg-[#0f1118]">
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
        <div className="w-36 font-mono text-[10px] text-slate-500">
          <span className="text-slate-300">{formatTime(playback.currentFrame, project.video.fps)}</span>
          <span className="mx-1.5 text-slate-700">/</span>
          {formatTime(totalFrames, project.video.fps)}
        </div>
        <div className="ml-auto w-44">
          <SegmentedControl onChange={setSpeed} options={[{ value: 0.5, label: "0.5×" }, { value: 1, label: "1×" }, { value: 2, label: "2×" }]} value={playback.speed} />
        </div>
      </div>

      <div className="relative h-[94px] px-5 pb-3 pt-5">
        <div className="absolute left-5 right-5 top-2 flex justify-between font-mono text-[8px] text-slate-700">
          <span>00:00</span><span>{Math.round(totalFrames / project.video.fps / 2)}s</span><span>{Math.round(totalFrames / project.video.fps)}s</span>
        </div>
        <div className="relative mt-1 flex h-14 gap-1.5">
          {project.timeline.scenes.map((scene) => {
            const selected = playback.selectedSceneId === scene.id;
            const active = activeSceneId === scene.id;
            return (
              <button
                className={`relative min-w-[70px] overflow-hidden rounded-lg border px-3 text-left transition ${scene.enabled ? sceneColors[scene.type] : "border-white/[0.05] bg-white/[0.02] text-slate-700"} ${selected ? "ring-1 ring-white/45" : ""}`}
                key={scene.id}
                onClick={() => {
                  selectScene(scene.id);
                  const start = getSceneStartFrame(project.timeline, scene.id);
                  if (start !== null) {
                    setPlaying(false);
                    setFrame(start);
                  }
                }}
                style={{ flexGrow: scene.enabled ? scene.durationFrames : 0, flexBasis: scene.enabled ? 0 : 70 }}
                type="button"
              >
                {active && <span className="absolute inset-x-0 top-0 h-0.5 bg-current" />}
                <span className="block truncate text-[9px] font-bold uppercase tracking-[0.13em]">{sceneLabels[scene.type]}</span>
                <span className="mt-1 block font-mono text-[8px] opacity-55">{scene.enabled ? `${(scene.durationFrames / project.video.fps).toFixed(1)}s` : "Disabled"}</span>
              </button>
            );
          })}
          <div className="pointer-events-none absolute -top-2 bottom-[-5px] z-10 w-px bg-white shadow-[0_0_8px_white]" style={{ left: `${progress * 100}%` }}>
            <span className="absolute -left-[3px] -top-0.5 h-2 w-2 rotate-45 bg-white" />
          </div>
          <input
            aria-label="Timeline playhead"
            className="absolute -top-4 left-0 right-0 z-20 h-4 w-full cursor-ew-resize opacity-0"
            max={Math.max(0, totalFrames - 1)}
            min={0}
            onChange={(event) => {
              setPlaying(false);
              setFrame(Number(event.target.value));
            }}
            step={0.1}
            type="range"
            value={Math.min(playback.currentFrame, Math.max(0, totalFrames - 1))}
          />
        </div>
      </div>
    </section>
  );
}
