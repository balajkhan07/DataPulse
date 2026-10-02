"use client";

import { useState } from "react";
import { Copy, FolderOpen, Plus, Save, Trash2, X } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { TextInput } from "@/components/ui/controls";

export function ProjectManagerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const project = useEditorStore((state) => state.project);
  const persistence = useEditorStore((state) => state.persistence);
  const createProject = useEditorStore((state) => state.createProject);
  const saveProject = useEditorStore((state) => state.saveProject);
  const loadSavedProject = useEditorStore((state) => state.loadSavedProject);
  const duplicateProject = useEditorStore((state) => state.duplicateProject);
  const renameProject = useEditorStore((state) => state.renameProject);
  const deleteProject = useEditorStore((state) => state.deleteProject);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#05060a]/80 p-5 backdrop-blur-md" onMouseDown={onClose}>
      <section aria-modal="true" className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12141d] shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <header className="flex items-start justify-between border-b border-white/8 px-6 py-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400">Local library</p><h2 className="mt-1 text-lg font-semibold text-white">Projects</h2><p className="mt-1 text-xs text-slate-500">Projects include their dataset, timeline, events, and visual configuration.</p></div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" onClick={onClose} type="button"><X size={17} /></button>
        </header>

        <div className="grid min-h-0 grid-cols-[230px_1fr]">
          <div className="border-r border-white/[0.07] p-4">
            <button className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 py-2.5 text-xs font-bold text-white hover:bg-violet-400" onClick={createProject} type="button"><Plus size={14} /> New project</button>
            <div className="space-y-2">
              {persistence.projects.map((item) => (
                <button
                  className={`w-full rounded-xl border p-3 text-left transition ${item.id === project.id ? "border-violet-400/30 bg-violet-400/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"}`}
                  key={item.id}
                  onClick={() => loadSavedProject(item.id)}
                  type="button"
                >
                  <span className="block truncate text-xs font-semibold text-slate-200">{item.name}</span>
                  <span className="mt-1 block text-[9px] capitalize text-slate-600">{item.videoMode.replace("-", " ")} · {item.updatedAt.slice(0, 10)}</span>
                </button>
              ))}
              {persistence.projects.length === 0 && <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-[10px] leading-4 text-slate-600">Save the current story to add it to your local library.</p>}
            </div>
          </div>

          <div className="editor-scrollbar min-h-0 overflow-y-auto p-5">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-300"><FolderOpen size={14} className="text-violet-400" /> Current project</p>
            <div className="space-y-4">
              <ProjectNameEditor key={project.id} initialName={project.name} onRename={renameProject} />
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-3 py-2.5 text-xs font-bold text-white hover:bg-violet-400" onClick={saveProject} type="button"><Save size={13} /> Save project</button>
                <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/[0.06]" onClick={duplicateProject} type="button"><Copy size={13} /> Duplicate</button>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4 text-[10px] leading-5 text-slate-500">
                <p><span className="text-slate-300">Schema</span> · version {project.schemaVersion}</p>
                <p><span className="text-slate-300">Dataset</span> · {project.dataset.rows.length.toLocaleString()} embedded rows</p>
                <p><span className="text-slate-300">Scenes</span> · {project.timeline.scenes.filter((scene) => scene.enabled).length} enabled</p>
              </div>
              {persistence.projects.some((item) => item.id === project.id) && (
                <button
                  className="flex items-center gap-2 text-xs font-semibold text-rose-400/75 hover:text-rose-300"
                  onClick={() => {
                    if (window.confirm(`Delete “${project.name}” from local storage?`)) deleteProject(project.id);
                  }}
                  type="button"
                >
                  <Trash2 size={13} /> Delete project
                </button>
              )}
              {persistence.error && <p className="rounded-lg border border-rose-400/15 bg-rose-400/[0.06] p-3 text-xs text-rose-300">{persistence.error}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProjectNameEditor({ initialName, onRename }: { initialName: string; onRename: (name: string) => void }) {
  const [name, setName] = useState(initialName);
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-600">Project name</label>
      <div className="flex gap-2">
        <TextInput onChange={(event) => setName(event.target.value)} value={name} />
        <button className="rounded-lg border border-white/10 px-3 text-[10px] font-bold text-slate-300 hover:bg-white/5" onClick={() => onRename(name)} type="button">Rename</button>
      </div>
    </div>
  );
}
