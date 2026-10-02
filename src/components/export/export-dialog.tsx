"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileAudio, LoaderCircle, Music2, Play, RotateCcw, X, XCircle } from "lucide-react";
import { getExportMetrics } from "@/lib/export/config";
import { exportPresets, exportQualityProfiles, getExportPreset } from "@/lib/export/presets";
import { useEditorStore } from "@/store/editor-store";
import type { ExportPresetId, ExportQuality, RenderJob } from "@/types/export";
import type { VideoConfig } from "@/types/project";
import { FieldLabel, SelectInput, TextInput, Toggle } from "@/components/ui/controls";

const activeStatuses = new Set<RenderJob["status"]>(["queued", "preparing", "rendering", "encoding", "finalizing"]);

function formatDuration(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed with HTTP ${response.status}.`);
  return body;
}

export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const project = useEditorStore((state) => state.project);
  const updateExport = useEditorStore((state) => state.updateExport);
  const applyExportToProject = useEditorStore((state) => state.applyExportToProject);
  const updateAudio = useEditorStore((state) => state.updateAudio);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [currentJob, setCurrentJob] = useState<RenderJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null);
  const metrics = useMemo(() => getExportMetrics(project, project.export), [project]);

  const loadJobs = useCallback(async () => {
    try {
      const body = await responseJson<{ jobs: RenderJob[] }>(await fetch("/api/render-jobs", { cache: "no-store" }));
      setJobs(body.jobs);
      const active = body.jobs.find((job) => activeStatuses.has(job.status) && job.projectId === project.id);
      if (active) setCurrentJob(active);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Render history could not be loaded.");
    }
  }, [project.id]);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => { void loadJobs(); }, 0);
    const interval = window.setInterval(() => { void loadJobs(); }, 5000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [loadJobs, open]);

  useEffect(() => {
    if (!open || !currentJob || !activeStatuses.has(currentJob.status)) return;
    const interval = window.setInterval(async () => {
      try {
        const body = await responseJson<{ job: RenderJob }>(await fetch(`/api/render-jobs/${currentJob.id}`, { cache: "no-store" }));
        setCurrentJob(body.job);
        if (!activeStatuses.has(body.job.status)) void loadJobs();
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "The render status could not be refreshed.");
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [currentJob, loadJobs, open]);

  if (!open) return null;

  const selectPreset = (presetId: ExportPresetId) => {
    const preset = getExportPreset(presetId);
    if (!preset) { updateExport({ presetId }); return; }
    updateExport({ presetId, width: preset.width, height: preset.height, fps: preset.fps });
  };

  const uploadAudio = async (file: File | undefined) => {
    if (!file) return;
    setUploadingAudio(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const body = await responseJson<{ asset: { assetId: string; fileName: string; mimeType: "audio/mpeg" | "audio/wav"; durationSeconds: number } }>(
        await fetch("/api/audio-assets", { method: "POST", body: formData }),
      );
      updateAudio({
        enabled: true,
        ...body.asset,
        trimStartSeconds: 0,
        trimEndSeconds: body.asset.durationSeconds,
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Audio upload failed.");
    } finally {
      setUploadingAudio(false);
      if (uploadInput.current) uploadInput.current.value = "";
    }
  };

  const startRender = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body = await responseJson<{ job: RenderJob }>(await fetch("/api/render-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, config: project.export }),
      }));
      setCurrentJob(body.job);
      setJobs((current) => [body.job, ...current.filter((job) => job.id !== body.job.id)]);
    } catch (renderError) {
      setError(renderError instanceof Error ? renderError.message : "The render could not be started.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRender = async () => {
    if (!currentJob) return;
    try {
      const body = await responseJson<{ job: RenderJob }>(await fetch(`/api/render-jobs/${currentJob.id}/cancel`, { method: "POST" }));
      setCurrentJob(body.job);
      void loadJobs();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "The render could not be cancelled.");
    }
  };

  const audio = project.audio;
  const hasActiveJob = currentJob ? activeStatuses.has(currentJob.status) : false;

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm" role="dialog">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11141d] shadow-2xl shadow-black/60">
        <header className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div><h2 className="text-base font-bold text-white">Export video</h2><p className="mt-1 text-[11px] text-slate-500">Deterministic local H.264 MP4 rendering</p></div>
          <button aria-label="Close export dialog" className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-white" onClick={onClose} type="button"><X size={17} /></button>
        </header>

        <div className="editor-scrollbar grid min-h-0 flex-1 grid-cols-[1.12fr_0.88fr] overflow-y-auto">
          <div className="space-y-6 border-r border-white/[0.07] p-6">
            <section>
              <FieldLabel>Platform preset</FieldLabel>
              <SelectInput onChange={(event) => selectPreset(event.target.value as ExportPresetId)} value={project.export.presetId}>
                {exportPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name} · {preset.width}×{preset.height}</option>)}
                <option value="custom">Custom resolution</option>
              </SelectInput>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div><FieldLabel>Width</FieldLabel><TextInput min={320} onChange={(event) => updateExport({ presetId: "custom", width: Number(event.target.value) })} type="number" value={project.export.width} /></div>
                <div><FieldLabel>Height</FieldLabel><TextInput min={320} onChange={(event) => updateExport({ presetId: "custom", height: Number(event.target.value) })} type="number" value={project.export.height} /></div>
                <div><FieldLabel>Frame rate</FieldLabel><SelectInput onChange={(event) => updateExport({ fps: Number(event.target.value) as VideoConfig["fps"] })} value={project.export.fps}><option value={24}>24 fps</option><option value={30}>30 fps</option><option value={60}>60 fps</option></SelectInput></div>
              </div>
              <button className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/[0.07]" onClick={applyExportToProject} type="button">Apply dimensions and FPS to preview</button>
            </section>

            <section>
              <FieldLabel>Quality</FieldLabel>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(exportQualityProfiles) as Array<[ExportQuality, (typeof exportQualityProfiles)[ExportQuality]]>).map(([id, profile]) => (
                  <button className={`rounded-xl border p-2.5 text-left ${project.export.quality === id ? "border-violet-400/40 bg-violet-400/[0.09]" : "border-white/[0.06] bg-white/[0.025]"}`} key={id} onClick={() => updateExport({ quality: id })} type="button"><span className="block text-[11px] font-bold capitalize text-slate-200">{id}</span><span className="mt-1 block text-[9px] text-slate-600">{profile.label}</span></button>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between"><div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400"><Music2 size={13} /> Soundtrack</p><p className="mt-1 text-[9px] text-slate-600">Optional MP3 or WAV · AAC in the final MP4</p></div><Toggle checked={audio.enabled} label="Enabled" onChange={(enabled) => updateAudio({ enabled })} /></div>
              <input accept=".mp3,.wav,audio/mpeg,audio/wav" className="hidden" onChange={(event) => void uploadAudio(event.target.files?.[0])} ref={uploadInput} type="file" />
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-3 text-[11px] font-semibold text-slate-400 hover:border-violet-400/30 hover:text-violet-200" disabled={uploadingAudio} onClick={() => uploadInput.current?.click()} type="button">{uploadingAudio ? <LoaderCircle className="animate-spin" size={14} /> : <FileAudio size={14} />}{audio.fileName ?? "Upload soundtrack"}</button>
              {audio.assetId && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div><FieldLabel>Starts at</FieldLabel><TextInput min={0} onChange={(event) => updateAudio({ startOffsetSeconds: Number(event.target.value) })} step={0.1} type="number" value={audio.startOffsetSeconds} /></div>
                    <div><FieldLabel>Trim start</FieldLabel><TextInput min={0} onChange={(event) => updateAudio({ trimStartSeconds: Number(event.target.value) })} step={0.1} type="number" value={audio.trimStartSeconds} /></div>
                    <div><FieldLabel>Trim end</FieldLabel><TextInput min={0.1} onChange={(event) => updateAudio({ trimEndSeconds: Number(event.target.value) })} step={0.1} type="number" value={audio.trimEndSeconds ?? audio.durationSeconds ?? 0} /></div>
                  </div>
                  <div><FieldLabel detail={`${Math.round(audio.volume * 100)}%`}>Volume</FieldLabel><input className="editor-range w-full" max={1} min={0} onChange={(event) => updateAudio({ volume: Number(event.target.value) })} step={0.01} type="range" value={audio.volume} /></div>
                  <div className="grid grid-cols-2 gap-3"><div><FieldLabel>Fade in</FieldLabel><TextInput min={0} onChange={(event) => updateAudio({ fadeInSeconds: Number(event.target.value) })} step={0.1} type="number" value={audio.fadeInSeconds} /></div><div><FieldLabel>Fade out</FieldLabel><TextInput min={0} onChange={(event) => updateAudio({ fadeOutSeconds: Number(event.target.value) })} step={0.1} type="number" value={audio.fadeOutSeconds} /></div></div>
                  <Toggle checked={audio.loop} label="Loop to fill the story" onChange={(loop) => updateAudio({ loop })} />
                </div>
              )}
            </section>

            <section><FieldLabel>Filename</FieldLabel><TextInput onChange={(event) => updateExport({ filename: event.target.value })} value={project.export.filename} /></section>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
              <div className="grid grid-cols-3 gap-3 text-center"><div><p className="text-sm font-bold text-white">{project.export.width}×{project.export.height}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">Canvas</p></div><div><p className="text-sm font-bold text-white">{formatDuration(metrics.durationSeconds)}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">Duration</p></div><div><p className="text-sm font-bold text-white">{metrics.frameCount.toLocaleString()}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">Frames</p></div></div>
            </div>

            {currentJob && (
              <div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.045] p-5">
                <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold capitalize text-violet-100">{activeStatuses.has(currentJob.status) && <LoaderCircle className="animate-spin" size={14} />}{currentJob.status === "completed" && <CheckCircle2 className="text-emerald-400" size={14} />}{currentJob.status === "failed" && <XCircle className="text-rose-400" size={14} />}{currentJob.status}</p><p className="mt-1 text-[10px] text-slate-500">{currentJob.stage}</p></div><span className="font-mono text-xs text-violet-200">{Math.round(currentJob.progress * 100)}%</span></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-violet-400 transition-all duration-500" style={{ width: `${Math.max(1, currentJob.progress * 100)}%` }} /></div>
                {currentJob.error && <p className="mt-3 rounded-lg bg-rose-500/10 p-3 text-[10px] leading-4 text-rose-200">{currentJob.error}</p>}
                {currentJob.warnings.length > 0 && <p className="mt-3 text-[9px] leading-4 text-amber-200/75">{currentJob.warnings.join(" ")}</p>}
                <div className="mt-4 flex gap-2">{hasActiveJob && <button className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-white/[0.05]" onClick={() => void cancelRender()} type="button">Cancel</button>}{currentJob.status === "completed" && <a className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-bold text-white" href={`/api/render-jobs/${currentJob.id}/download`}><Download size={12} /> Download {formatBytes(currentJob.outputBytes)}</a>}{["failed", "cancelled"].includes(currentJob.status) && <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300" onClick={() => { setCurrentJob(null); setError(null); }} type="button"><RotateCcw size={12} /> Try again</button>}</div>
              </div>
            )}

            {error && <div className="rounded-xl border border-rose-400/15 bg-rose-400/[0.06] p-3 text-[10px] leading-4 text-rose-200">{error}</div>}

            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-violet-950/30 hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40" disabled={hasActiveJob || submitting} onClick={() => void startRender()} type="button">{submitting ? <LoaderCircle className="animate-spin" size={14} /> : <Play size={14} />} Render MP4</button>
            <p className="text-center text-[9px] leading-4 text-slate-600">Rendering runs locally and sequentially. Closing this dialog does not cancel the job.</p>

            <section><FieldLabel>Recent exports</FieldLabel><div className="space-y-2">{jobs.slice(0, 5).map((job) => <button className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left hover:bg-white/[0.04]" key={job.id} onClick={() => setCurrentJob(job)} type="button"><span><span className="block max-w-48 truncate text-[10px] font-semibold text-slate-300">{job.config.filename}</span><span className="mt-0.5 block text-[9px] capitalize text-slate-600">{job.status} · {job.config.width}×{job.config.height}</span></span><span className="text-[9px] text-slate-500">{job.status === "completed" ? formatBytes(job.outputBytes) : `${Math.round(job.progress * 100)}%`}</span></button>)}</div></section>
          </div>
        </div>
      </div>
    </div>
  );
}
