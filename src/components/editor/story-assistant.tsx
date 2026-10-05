"use client";

import { useMemo, useState } from "react";
import { BookOpenCheck, Check, FileText, Lightbulb, RefreshCw, Sparkles, WandSparkles } from "lucide-react";
import { analyzeProject } from "@/lib/analysis/project-analysis";
import { generateStoryDraft } from "@/lib/story/drafts";
import {
  generateAnnotationSuggestions,
  generateDescriptions,
  generateFinalTakeaway,
  generateHooks,
  generateStoryCandidates,
  generateTitles,
} from "@/lib/story/generation";
import { evaluateContentQuality } from "@/lib/story/quality";
import { useEditorStore } from "@/store/editor-store";
import type { GeneratedStoryDraft, StoryPresetId } from "@/types/assistant";
import { FieldLabel, SegmentedControl, SelectInput, TextArea, TextInput, Toggle } from "@/components/ui/controls";

function AssistantSection({ title, icon: Icon, children }: { title: string; icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/[0.065] px-4 py-5">
      <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"><Icon size={13} /> {title}</h3>
      {children}
    </section>
  );
}

function SuggestionButton({ selected, title, detail, onClick }: { selected: boolean; title: string; detail: string; onClick: () => void }) {
  return (
    <button className={`w-full rounded-xl border p-3 text-left transition ${selected ? "border-violet-400/35 bg-violet-400/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.045]"}`} onClick={onClick} type="button">
      <span className="flex items-start justify-between gap-2 text-[11px] font-semibold leading-4 text-slate-200">{title}{selected && <Check className="mt-0.5 shrink-0 text-violet-300" size={12} />}</span>
      <span className="mt-1.5 block text-[9px] leading-4 text-slate-600">{detail}</span>
    </button>
  );
}

export function StoryAssistant() {
  const project = useEditorStore((state) => state.project);
  const normalized = useEditorStore((state) => state.dataset.normalized);
  const updateContent = useEditorStore((state) => state.updateContent);
  const updateScene = useEditorStore((state) => state.updateScene);
  const updateSourceMetadata = useEditorStore((state) => state.updateSourceMetadata);
  const updatePublishing = useEditorStore((state) => state.updatePublishing);
  const updateStoryAssistant = useEditorStore((state) => state.updateStoryAssistant);
  const applyStoryDraft = useEditorStore((state) => state.applyStoryDraft);
  const [draft, setDraft] = useState<GeneratedStoryDraft | null>(null);
  const [shortPreset, setShortPreset] = useState<StoryPresetId>("story-short");
  const [longPreset, setLongPreset] = useState<StoryPresetId>("data-documentary");
  const analysis = useMemo(
    () => normalized ? analyzeProject(project) : null,
    [normalized, project],
  );
  const input = useMemo(
    () => analysis ? { project, analysis, seed: project.story.generationSeed } : null,
    [analysis, project],
  );
  const candidates = useMemo(() => input ? generateStoryCandidates(input) : [], [input]);
  const hooks = useMemo(() => input ? generateHooks(input) : [], [input]);
  const titles = useMemo(() => input ? generateTitles(input) : [], [input]);
  const annotations = useMemo(() => input ? generateAnnotationSuggestions(input) : [], [input]);
  const quality = useMemo(() => evaluateContentQuality(project), [project]);
  const draftQuality = useMemo(() => draft ? evaluateContentQuality({ ...project, timeline: draft.timeline }) : null, [draft, project]);

  if (!analysis || !input) {
    return <div className="border-b border-white/[0.065] px-4 py-5 text-[10px] leading-4 text-slate-500">Map a valid dataset to unlock analysis and story suggestions.</div>;
  }

  const selectedCandidate = candidates.find((item) => item.id === project.story.selectedCandidateId) ?? candidates[0];
  const selectedHook = hooks.find((item) => item.id === project.story.selectedHookId) ?? hooks[0];
  const selectedTitle = titles.find((item) => item.id === project.story.selectedTitleId) ?? titles[0];
  const leader = analysis.entityStats.find((item) => item.entityId === analysis.summary.latestLeaderId)?.label ?? analysis.summary.latestLeaderId;

  const applyHook = (hookId: string) => {
    const suggestion = hooks.find((item) => item.id === hookId);
    if (!suggestion) return;
    updateStoryAssistant({ selectedHookId: hookId });
    const hookScene = project.timeline.scenes.find((scene) => scene.type === "hook");
    if (hookScene) updateScene(hookScene.id, (scene) => scene.type === "hook" ? { ...scene, config: { ...scene.config, hookText: suggestion.text } } : scene);
  };

  const applyTitle = (titleId: string) => {
    const suggestion = titles.find((item) => item.id === titleId);
    if (!suggestion) return;
    updateStoryAssistant({ selectedTitleId: titleId });
    updateContent({ title: suggestion.text });
    const hookScene = project.timeline.scenes.find((scene) => scene.type === "hook");
    if (hookScene) updateScene(hookScene.id, (scene) => scene.type === "hook" ? { ...scene, config: { ...scene.config, title: suggestion.text } } : scene);
  };

  const createDraft = (presetId: StoryPresetId) => {
    setDraft(generateStoryDraft(input, {
      presetId,
      candidateId: selectedCandidate?.id,
      hookId: selectedHook?.id,
      titleId: selectedTitle?.id,
      seed: project.story.generationSeed,
    }));
  };

  const applyGeneratedDescriptions = () => {
    const descriptions = generateDescriptions(input);
    updatePublishing({ ...descriptions, finalTakeaway: generateFinalTakeaway(input) });
  };

  return (
    <>
      <AssistantSection icon={Sparkles} title="Dataset analysis">
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Time range", `${analysis.summary.firstTimeLabel}–${analysis.summary.lastTimeLabel}`],
            ["Entities", analysis.summary.entityCount],
            ["Periods", analysis.summary.periodCount],
            ["Latest leader", leader],
          ].map(([label, value]) => <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5" key={label}><p className="text-[8px] font-bold uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 truncate text-[11px] font-semibold text-slate-200">{value}</p></div>)}
        </div>
        <div className="mt-3 space-y-1.5">
          {analysis.events.slice().sort((a, b) => b.importance - a.importance).slice(0, 3).map((event) => (
            <div className="rounded-lg bg-black/15 px-3 py-2" key={event.id}><p className="text-[10px] font-semibold text-slate-300">{event.type.replaceAll("-", " ")} · {event.timeLabel}</p><p className="mt-1 text-[9px] leading-4 text-slate-600">{event.reason}</p></div>
          ))}
        </div>
      </AssistantSection>

      <AssistantSection icon={Lightbulb} title="Story angles">
        <div className="space-y-2">
          {candidates.slice(0, 4).map((candidate) => <SuggestionButton detail={`${candidate.explanation} · Score ${candidate.score}`} key={candidate.id} onClick={() => updateStoryAssistant({ selectedCandidateId: candidate.id })} selected={candidate.id === selectedCandidate?.id} title={candidate.angle} />)}
        </div>
      </AssistantSection>

      <AssistantSection icon={WandSparkles} title="Hooks and titles">
        <div className="mb-4 flex items-center justify-between"><p className="text-[10px] text-slate-600">Grounded rule-based variations</p><button className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-violet-300" onClick={() => updateStoryAssistant({ generationSeed: project.story.generationSeed + 1, selectedHookId: null, selectedTitleId: null })} type="button"><RefreshCw size={11} /> Regenerate</button></div>
        <FieldLabel>Hook suggestions</FieldLabel>
        <div className="space-y-2">{hooks.slice(0, 5).map((hook) => <SuggestionButton detail={`${hook.reason} · Score ${hook.score}`} key={hook.id} onClick={() => applyHook(hook.id)} selected={hook.id === project.story.selectedHookId} title={hook.text} />)}</div>
        <div className="mt-5"><FieldLabel>Title suggestions</FieldLabel><div className="space-y-2">{titles.slice(0, 5).map((title) => <SuggestionButton detail={`${title.reason} · ${title.style}`} key={title.id} onClick={() => applyTitle(title.id)} selected={title.id === project.story.selectedTitleId} title={title.text} />)}</div></div>
      </AssistantSection>

      <AssistantSection icon={BookOpenCheck} title="Draft generator">
        <div className="space-y-4">
          <div><FieldLabel>Short-form preset</FieldLabel><SelectInput onChange={(event) => setShortPreset(event.target.value as StoryPresetId)} value={shortPreset}><option value="fast-race">Fast Race · 30–45 sec</option><option value="story-short">Story Short · 45–60 sec</option><option value="dramatic-rise-fall">Dramatic Rise / Fall</option></SelectInput><button className="mt-2 w-full rounded-lg bg-violet-500 px-3 py-2.5 text-[10px] font-bold text-white hover:bg-violet-400" onClick={() => createDraft(shortPreset)} type="button">Generate Short Draft</button></div>
          <div><FieldLabel>Long-form preset</FieldLabel><SelectInput onChange={(event) => setLongPreset(event.target.value as StoryPresetId)} value={longPreset}><option value="data-documentary">Data Documentary</option><option value="ranking-history">Ranking History</option><option value="rise-and-fall">Rise and Fall</option><option value="head-to-head">Head to Head</option><option value="decade-by-decade">Decade by Decade</option></SelectInput><button className="mt-2 w-full rounded-lg border border-violet-300/20 bg-violet-500/10 px-3 py-2.5 text-[10px] font-bold text-violet-200 hover:bg-violet-500/20" onClick={() => createDraft(longPreset)} type="button">Generate Long-Form Draft</button></div>
          <Toggle checked={project.story.adaptivePacing.enabled} label="Adaptive pacing" onChange={(enabled) => updateStoryAssistant({ adaptivePacing: { ...project.story.adaptivePacing, enabled } })} />
          <div><FieldLabel>Adaptive pacing intensity</FieldLabel><SegmentedControl onChange={(intensity) => updateStoryAssistant({ adaptivePacing: { ...project.story.adaptivePacing, intensity } })} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} value={project.story.adaptivePacing.intensity} /></div>
        </div>
        {draft && (
          <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-3">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-emerald-200">{draft.name}</p><p className="mt-1 text-[9px] leading-4 text-slate-500">{draft.explanation}</p></div><span className="rounded bg-emerald-400/10 px-2 py-1 text-[9px] font-bold text-emerald-300">{draft.timeline.scenes.length} scenes</span></div>
            <div className="mt-3 space-y-1">{draft.timeline.scenes.map((scene, index) => <p className="truncate text-[9px] text-slate-500" key={scene.id}>{index + 1}. {scene.type.replace("-", " ")} · {(scene.durationFrames / project.video.fps).toFixed(1)}s</p>)}</div>
            <p className="mt-3 text-[9px] text-slate-500">Quality score: <span className="font-bold text-emerald-300">{draftQuality?.score ?? 0}/100</span></p>
            <button className="mt-3 w-full rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-400" onClick={() => { applyStoryDraft(draft); updatePublishing({ finalTakeaway: generateFinalTakeaway(input) }); setDraft(null); }} type="button">Apply editable draft</button>
          </div>
        )}
      </AssistantSection>

      <AssistantSection icon={FileText} title="Publishing copy">
        <div className="space-y-3">
          <div><FieldLabel>Source name</FieldLabel><TextInput onChange={(event) => updateSourceMetadata({ name: event.target.value })} value={project.sourceMetadata.name} /></div>
          <div><FieldLabel>Publisher</FieldLabel><TextInput onChange={(event) => updateSourceMetadata({ publisher: event.target.value })} value={project.sourceMetadata.publisher} /></div>
          <div><FieldLabel>Source URL</FieldLabel><TextInput onChange={(event) => updateSourceMetadata({ url: event.target.value })} placeholder="https://…" type="url" value={project.sourceMetadata.url} /></div>
          <div><FieldLabel>Retrieved date</FieldLabel><TextInput onChange={(event) => updateSourceMetadata({ retrievedDate: event.target.value })} type="date" value={project.sourceMetadata.retrievedDate} /></div>
          <div><FieldLabel>Source notes</FieldLabel><TextArea onChange={(event) => updateSourceMetadata({ notes: event.target.value })} placeholder="Methodology or caveats" value={project.sourceMetadata.notes} /></div>
          <div><FieldLabel>License / usage notes</FieldLabel><TextArea onChange={(event) => updateSourceMetadata({ licenseNotes: event.target.value })} placeholder="License or reuse terms" value={project.sourceMetadata.licenseNotes} /></div>
          <button className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-white/[0.07]" onClick={applyGeneratedDescriptions} type="button">Generate grounded captions</button>
          <div><FieldLabel>YouTube description</FieldLabel><TextArea onChange={(event) => updatePublishing({ youtubeDescription: event.target.value })} value={project.publishing.youtubeDescription} /></div>
          <div><FieldLabel>Shorts caption</FieldLabel><TextArea onChange={(event) => updatePublishing({ shortCaption: event.target.value })} value={project.publishing.shortCaption} /></div>
          <div><FieldLabel>Social caption</FieldLabel><TextArea onChange={(event) => updatePublishing({ socialCaption: event.target.value })} value={project.publishing.socialCaption} /></div>
          <div><FieldLabel>Source attribution</FieldLabel><TextArea onChange={(event) => updatePublishing({ sourceAttribution: event.target.value })} value={project.publishing.sourceAttribution} /></div>
          <div><FieldLabel>Final takeaway</FieldLabel><TextArea onChange={(event) => updatePublishing({ finalTakeaway: event.target.value })} value={project.publishing.finalTakeaway} /></div>
        </div>
      </AssistantSection>

      <AssistantSection icon={BookOpenCheck} title="Quality and annotations">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-200">Content quality</p><span className={`font-mono text-sm font-bold ${quality.score >= 75 ? "text-emerald-300" : "text-amber-300"}`}>{quality.score}/100</span></div>{quality.warnings.slice(0, 3).map((warning) => <p className="mt-2 text-[9px] leading-4 text-slate-600" key={warning}>• {warning}</p>)}</div>
        <div className="mt-4"><FieldLabel detail={`${annotations.length} selected`}>Suggested annotations</FieldLabel><div className="space-y-1.5">{annotations.slice(0, 5).map((annotation) => <div className="rounded-lg bg-black/15 px-3 py-2" key={annotation.eventId}><p className="text-[10px] font-semibold text-slate-300">{annotation.text}</p><p className="mt-1 text-[9px] text-slate-600">{annotation.reason}</p></div>)}</div></div>
      </AssistantSection>
    </>
  );
}
