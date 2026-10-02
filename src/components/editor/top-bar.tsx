"use client";

import { useState } from "react";
import { Cloud, Download, HelpCircle, Redo2, Save, Undo2 } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { IconButton } from "@/components/ui/controls";
import { ExportDialog } from "@/components/export/export-dialog";

export function TopBar() {
  const [exportOpen, setExportOpen] = useState(false);
  const project = useEditorStore((state) => state.project);
  const persistence = useEditorStore((state) => state.persistence);
  const saveProject = useEditorStore((state) => state.saveProject);

  return (
    <>
    <header className="flex h-14 shrink-0 items-center border-b border-white/[0.07] bg-[#0e1017] px-4">
      <div className="flex w-[234px] items-center gap-2.5">
        <div className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 shadow-lg shadow-violet-950/40">
          <span className="h-3.5 w-3.5 rotate-45 rounded-[3px] border-2 border-white/90" />
        </div>
        <div>
          <p className="text-sm font-black tracking-[-0.03em] text-white">DataPulse</p>
          <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-600">Story Studio</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between border-l border-white/[0.06] pl-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-200">{project.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-600"><Cloud size={10} /> {persistence.dirty ? "Unsaved local changes" : persistence.lastSavedAt ? "Saved locally" : "Local draft"}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton aria-label="Undo" disabled><Undo2 size={14} /></IconButton>
          <IconButton aria-label="Redo" disabled><Redo2 size={14} /></IconButton>
          <span className="mx-1 h-5 w-px bg-white/[0.07]" />
          <IconButton aria-label="Help"><HelpCircle size={14} /></IconButton>
          <button className="ml-1 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white" onClick={saveProject} type="button"><Save size={13} /> Save</button>
          <button
            className="ml-1 flex items-center gap-2 rounded-lg border border-violet-300/20 bg-violet-500 px-3.5 py-2 text-[11px] font-bold text-white shadow-lg shadow-violet-950/25 transition hover:bg-violet-400"
            onClick={() => setExportOpen(true)}
            type="button"
          >
            <Download size={13} /> Export video
          </button>
        </div>
      </div>
    </header>
    <ExportDialog onClose={() => setExportOpen(false)} open={exportOpen} />
    </>
  );
}
