"use client";

import { Layers3, X } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { projectTemplates } from "@/templates";
import { getTheme } from "@/themes";

export function TemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const applyTemplate = useEditorStore((state) => state.applyTemplate);
  const themeId = useEditorStore((state) => state.project.themeId);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#05060a]/80 p-5 backdrop-blur-md" onMouseDown={onClose}>
      <section aria-modal="true" className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#12141d] shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <header className="flex items-start justify-between border-b border-white/8 px-6 py-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400">Reusable looks</p><h2 className="mt-1 text-lg font-semibold text-white">Story templates</h2><p className="mt-1 text-xs text-slate-500">Apply design, pacing, scenes, safe areas, and annotation defaults without replacing your dataset or copy.</p></div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" onClick={onClose} type="button"><X size={17} /></button>
        </header>
        <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {projectTemplates.map((template) => {
            const theme = getTheme(template.themeId);
            return (
              <button
                className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.04] ${themeId === template.themeId ? "border-violet-400/30 bg-violet-400/[0.055]" : "border-white/[0.07] bg-white/[0.02]"}`}
                key={template.id}
                onClick={() => { applyTemplate(template.id); onClose(); }}
                type="button"
              >
                <div className="mb-4 h-20 overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.background.start}, ${theme.background.end})` }}>
                  <div className="flex h-full items-end gap-1.5 p-3">{theme.bars.palette.slice(0, 5).map((color, index) => <span className="w-full rounded-sm" key={color} style={{ background: color, height: `${35 + index * 10}%` }} />)}</div>
                </div>
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-100">{template.name}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{template.description}</p></div><Layers3 className="shrink-0 text-slate-700 transition group-hover:text-violet-400" size={16} /></div>
                <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-slate-600">{template.videoMode.replace("-", " ")} · {template.video.fps} fps · {template.video.aspectRatio}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
