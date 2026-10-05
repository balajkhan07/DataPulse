"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Captions, Film, Plus, Trash2 } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import type { SceneTransitionType, StoryEventType } from "@/types/story";
import { FieldLabel, IconButton, SegmentedControl, SelectInput, TextInput, Toggle } from "@/components/ui/controls";
import { StoryAssistant } from "@/components/editor/story-assistant";

const eventTypeLabels: Array<[StoryEventType, string]> = [
  ["lead-change", "Leader changes"],
  ["major-rise", "Major rank rises"],
  ["major-fall", "Major rank falls"],
  ["top-entry", "Top-N entries"],
  ["top-exit", "Top-N exits"],
  ["record-value", "Record values"],
  ["milestone", "Milestones"],
  ["fastest-growth", "Fastest growth"],
  ["largest-decline", "Largest decline"],
  ["comeback", "Comebacks"],
  ["sustained-dominance", "Sustained dominance"],
  ["rapid-rise", "Rapid rises"],
  ["collapse", "Collapses"],
  ["close-rivalry", "Close rivalries"],
  ["overtaking-streak", "Overtaking streaks"],
  ["sudden-breakout", "Sudden breakouts"],
];

export function StoryInspector() {
  const [workspace, setWorkspace] = useState<"assist" | "edit">("assist");
  const project = useEditorStore((state) => state.project);
  const selectedSceneId = useEditorStore((state) => state.playback.selectedSceneId);
  const updateScene = useEditorStore((state) => state.updateScene);
  const moveScene = useEditorStore((state) => state.moveScene);
  const updateEvents = useEditorStore((state) => state.updateEvents);
  const addTextScene = useEditorStore((state) => state.addTextScene);
  const deleteScene = useEditorStore((state) => state.deleteScene);
  const scene = project.timeline.scenes.find((candidate) => candidate.id === selectedSceneId) ?? project.timeline.scenes[0];
  if (!scene) return null;
  const sceneIndex = project.timeline.scenes.findIndex((candidate) => candidate.id === scene.id);
  const durationSeconds = scene.durationFrames / project.video.fps;

  const setDurationSeconds = (seconds: number) => {
    updateScene(scene.id, (current) => ({ ...current, durationFrames: Math.max(1, Math.round(seconds * project.video.fps)) }));
  };

  return (
    <div>
      <section className="border-b border-white/[0.065] px-4 py-3">
        <SegmentedControl onChange={setWorkspace} options={[{ value: "assist", label: "Assist" }, { value: "edit", label: "Edit scenes" }]} value={workspace} />
      </section>
      {workspace === "assist" ? <StoryAssistant /> : <>
      <section className="border-b border-white/[0.065] px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"><Film size={13} /> Selected scene</h3>
          <div className="flex gap-0.5">
            <IconButton aria-label="Add story beat after this scene" onClick={addTextScene}><Plus size={13} /></IconButton>
            <IconButton aria-label="Delete scene" disabled={project.timeline.scenes.length <= 1} onClick={() => deleteScene(scene.id)}><Trash2 size={13} /></IconButton>
            <IconButton aria-label="Move scene earlier" disabled={sceneIndex <= 0} onClick={() => moveScene(scene.id, -1)}><ArrowLeft size={13} /></IconButton>
            <IconButton aria-label="Move scene later" disabled={sceneIndex >= project.timeline.scenes.length - 1} onClick={() => moveScene(scene.id, 1)}><ArrowRight size={13} /></IconButton>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.055] px-3 py-2.5">
            <p className="text-xs font-semibold capitalize text-violet-200">{scene.type.replace("-", " ")}</p>
            <p className="mt-0.5 font-mono text-[9px] text-violet-300/45">{scene.id}</p>
          </div>
          <Toggle checked={scene.enabled} label="Include scene" onChange={(enabled) => updateScene(scene.id, (current) => ({ ...current, enabled }))} />
          <div>
            <FieldLabel detail={`${durationSeconds.toFixed(1)}s`}>Duration</FieldLabel>
            <input className="editor-range w-full" max={scene.type === "visualization" ? 120 : 15} min={0.5} onChange={(event) => setDurationSeconds(Number(event.target.value))} step={0.5} type="range" value={durationSeconds} />
          </div>
          <div>
            <FieldLabel>Entry transition</FieldLabel>
            <SelectInput
              onChange={(event) => updateScene(scene.id, (current) => ({
                ...current,
                entryTransition: {
                  ...current.entryTransition,
                  type: event.target.value as SceneTransitionType,
                  durationFrames: event.target.value === "cut" ? 0 : Math.max(1, current.entryTransition.durationFrames),
                },
              }))}
              value={scene.entryTransition.type}
            >
              <option value="cut">Cut</option>
              <option value="fade">Fade from background</option>
              <option value="crossfade">Crossfade</option>
              <option value="slide">Slide</option>
            </SelectInput>
          </div>
          {scene.entryTransition.type !== "cut" && (
            <div>
              <FieldLabel detail={`${(scene.entryTransition.durationFrames / project.video.fps).toFixed(2)}s`}>Transition duration</FieldLabel>
              <input
                className="editor-range w-full"
                max={2}
                min={0.1}
                onChange={(event) => updateScene(scene.id, (current) => ({
                  ...current,
                  entryTransition: { ...current.entryTransition, durationFrames: Math.round(Number(event.target.value) * project.video.fps) },
                }))}
                step={0.05}
                type="range"
                value={scene.entryTransition.durationFrames / project.video.fps}
              />
            </div>
          )}

          {scene.type === "hook" && (
            <>
              <div><FieldLabel>Title</FieldLabel><TextInput onChange={(event) => updateScene(scene.id, (current) => current.type === "hook" ? { ...current, config: { ...current.config, title: event.target.value } } : current)} value={scene.config.title} /></div>
              <div><FieldLabel>Subtitle</FieldLabel><TextInput onChange={(event) => updateScene(scene.id, (current) => current.type === "hook" ? { ...current, config: { ...current.config, subtitle: event.target.value } } : current)} value={scene.config.subtitle} /></div>
              <div><FieldLabel>Hook text</FieldLabel><TextInput onChange={(event) => updateScene(scene.id, (current) => current.type === "hook" ? { ...current, config: { ...current.config, hookText: event.target.value } } : current)} value={scene.config.hookText} /></div>
              <div><FieldLabel>Background</FieldLabel><SelectInput onChange={(event) => updateScene(scene.id, (current) => current.type === "hook" ? { ...current, config: { ...current.config, background: event.target.value as "spotlight" | "gradient" | "solid" } } : current)} value={scene.config.background}><option value="spotlight">Accent spotlight</option><option value="gradient">Theme gradient</option><option value="solid">Solid</option></SelectInput></div>
              <div><FieldLabel>Title motion</FieldLabel><SelectInput onChange={(event) => updateScene(scene.id, (current) => current.type === "hook" ? { ...current, config: { ...current.config, transition: event.target.value as "fade" | "rise" } } : current)} value={scene.config.transition}><option value="rise">Gentle rise</option><option value="fade">Fade</option></SelectInput></div>
            </>
          )}

          {scene.type === "visualization" && (
            <Toggle checked={scene.config.annotationsEnabled} label="Show annotations" onChange={(annotationsEnabled) => updateScene(scene.id, (current) => current.type === "visualization" ? { ...current, config: { ...current.config, annotationsEnabled } } : current)} />
          )}

          {scene.type === "text" && (
            <>
              <div><FieldLabel>Eyebrow</FieldLabel><TextInput onChange={(event) => updateScene(scene.id, (current) => current.type === "text" ? { ...current, config: { ...current.config, eyebrow: event.target.value } } : current)} value={scene.config.eyebrow} /></div>
              <div><FieldLabel>Headline</FieldLabel><TextInput onChange={(event) => updateScene(scene.id, (current) => current.type === "text" ? { ...current, config: { ...current.config, title: event.target.value } } : current)} value={scene.config.title} /></div>
              <div><FieldLabel>Body</FieldLabel><TextInput onChange={(event) => updateScene(scene.id, (current) => current.type === "text" ? { ...current, config: { ...current.config, body: event.target.value } } : current)} value={scene.config.body} /></div>
              <div><FieldLabel>Beat type</FieldLabel><SelectInput onChange={(event) => updateScene(scene.id, (current) => current.type === "text" ? { ...current, config: { ...current.config, kind: event.target.value as "context" | "insight" | "takeaway" } } : current)} value={scene.config.kind}><option value="context">Context</option><option value="insight">Insight</option><option value="takeaway">Takeaway</option></SelectInput></div>
            </>
          )}

          {scene.type === "final-ranking" && (
            <>
              <div><FieldLabel>Title</FieldLabel><TextInput onChange={(event) => updateScene(scene.id, (current) => current.type === "final-ranking" ? { ...current, config: { ...current.config, title: event.target.value } } : current)} value={scene.config.title} /></div>
              <div><FieldLabel detail={scene.config.topN}>Visible results</FieldLabel><input className="editor-range w-full" max={15} min={3} onChange={(event) => updateScene(scene.id, (current) => current.type === "final-ranking" ? { ...current, config: { ...current.config, topN: Number(event.target.value) } } : current)} type="range" value={scene.config.topN} /></div>
              <Toggle checked={scene.config.showValues} label="Show final values" onChange={(showValues) => updateScene(scene.id, (current) => current.type === "final-ranking" ? { ...current, config: { ...current.config, showValues } } : current)} />
              <Toggle checked={scene.config.showImages} label="Show entity marks" onChange={(showImages) => updateScene(scene.id, (current) => current.type === "final-ranking" ? { ...current, config: { ...current.config, showImages } } : current)} />
            </>
          )}

          {scene.type === "outro" && (
            <>
              <div><FieldLabel>Closing line</FieldLabel><TextInput onChange={(event) => updateScene(scene.id, (current) => current.type === "outro" ? { ...current, config: { ...current.config, title: event.target.value } } : current)} value={scene.config.title} /></div>
              <div><FieldLabel>Call to action</FieldLabel><TextInput onChange={(event) => updateScene(scene.id, (current) => current.type === "outro" ? { ...current, config: { ...current.config, cta: event.target.value } } : current)} value={scene.config.cta} /></div>
            </>
          )}
        </div>
      </section>

      <section className="px-4 py-5">
        <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"><Captions size={13} /> Auto annotations</h3>
        <div className="space-y-4">
          <Toggle checked={project.events.enabled} label="Detect story moments" onChange={(enabled) => updateEvents({ enabled })} />
          <div><FieldLabel>Frequency</FieldLabel><SegmentedControl onChange={(frequency) => updateEvents({ frequency })} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} value={project.events.frequency} /></div>
          <div><FieldLabel detail={project.events.minimumImportance}>Minimum importance</FieldLabel><input className="editor-range w-full" max={100} min={40} onChange={(event) => updateEvents({ minimumImportance: Number(event.target.value) })} step={2} type="range" value={project.events.minimumImportance} /></div>
          <div><FieldLabel detail={project.events.maximumAnnotations}>Maximum annotations</FieldLabel><input className="editor-range w-full" max={20} min={0} onChange={(event) => updateEvents({ maximumAnnotations: Number(event.target.value) })} type="range" value={project.events.maximumAnnotations} /></div>
          <div><FieldLabel detail={`${(project.events.durationFrames / project.video.fps).toFixed(1)}s`}>Annotation duration</FieldLabel><input className="editor-range w-full" max={5} min={1} onChange={(event) => updateEvents({ durationFrames: Math.round(Number(event.target.value) * project.video.fps) })} step={0.25} type="range" value={project.events.durationFrames / project.video.fps} /></div>
          <div className="space-y-1.5">
            <FieldLabel>Enabled moments</FieldLabel>
            {eventTypeLabels.map(([type, label]) => (
              <Toggle
                checked={project.events.enabledTypes.includes(type)}
                key={type}
                label={label}
                onChange={(enabled) => updateEvents({ enabledTypes: enabled ? [...project.events.enabledTypes, type] : project.events.enabledTypes.filter((candidate) => candidate !== type) })}
              />
            ))}
          </div>
          <div>
            <FieldLabel>Milestones</FieldLabel>
            <TextInput
              onChange={(event) => updateEvents({ milestones: event.target.value.split(",").map((value) => Number(value.trim())).filter(Number.isFinite) })}
              placeholder="1000000, 10000000"
              value={project.events.milestones.join(", ")}
            />
          </div>
        </div>
      </section>
      </>}
    </div>
  );
}
