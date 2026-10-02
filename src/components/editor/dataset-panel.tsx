"use client";

import { useState } from "react";
import { Braces, CheckCircle2, ChevronRight, Database, FileUp, FolderOpen, Layers3, Sparkles, Table2, TriangleAlert } from "lucide-react";
import { demoDatasets } from "@/data/demos";
import { useEditorStore } from "@/store/editor-store";
import type { ColumnMapping } from "@/types/data";
import { FieldLabel, SelectInput } from "@/components/ui/controls";
import { ImportDialog } from "@/components/editor/import-dialog";
import { ProjectManagerDialog } from "@/components/editor/project-manager-dialog";
import { TemplateDialog } from "@/components/editor/template-dialog";

const mappingFields: Array<{ key: keyof ColumnMapping; label: string; required?: boolean }> = [
  { key: "time", label: "Time", required: true },
  { key: "category", label: "Category", required: true },
  { key: "value", label: "Value", required: true },
  { key: "group", label: "Group" },
  { key: "image", label: "Image / logo" },
  { key: "color", label: "Color" },
];

export function DatasetPanel() {
  const [importOpen, setImportOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(true);
  const dataset = useEditorStore((state) => state.dataset);
  const loadDemo = useEditorStore((state) => state.loadDemo);
  const updateMapping = useEditorStore((state) => state.updateMapping);
  const errorCount = dataset.issues.filter((issue) => issue.severity === "error").length;
  const warningCount = dataset.issues.filter((issue) => issue.severity === "warning").length;

  return (
    <>
      <aside className="flex min-h-0 flex-col border-r border-white/[0.07] bg-[#10121a]">
        <div className="border-b border-white/[0.07] px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Workspace</p>
              <h2 className="mt-1 text-sm font-semibold text-slate-200">Dataset</h2>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-400"><Database size={15} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.035] py-2 text-[10px] font-bold text-slate-300 hover:bg-white/[0.07]" onClick={() => setProjectsOpen(true)} type="button"><FolderOpen size={13} /> Projects</button>
            <button className="flex items-center justify-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.035] py-2 text-[10px] font-bold text-slate-300 hover:bg-white/[0.07]" onClick={() => setTemplatesOpen(true)} type="button"><Layers3 size={13} /> Templates</button>
          </div>
          <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/20 transition hover:bg-violet-400" onClick={() => setImportOpen(true)} type="button"><FileUp size={14} /> Import dataset</button>
        </div>

        <div className="editor-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-600">
              <Sparkles size={11} /> Quick start
            </div>
            <div className="space-y-1.5">
              {demoDatasets.map((demo) => {
                const active = dataset.name === demo.name;
                return (
                  <button
                    className={`group w-full rounded-xl border p-3 text-left transition ${active ? "border-violet-400/25 bg-violet-400/[0.08]" : "border-transparent hover:border-white/5 hover:bg-white/[0.035]"}`}
                    key={demo.id}
                    onClick={() => loadDemo(demo.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold ${active ? "text-violet-200" : "text-slate-300"}`}>{demo.name}</span>
                      <ChevronRight className={`transition ${active ? "text-violet-400" : "text-slate-700 group-hover:text-slate-400"}`} size={13} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-600">{demo.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="mb-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-200">{dataset.name}</p>
                <p className="mt-1 text-[10px] text-slate-600">{dataset.rawRows.length.toLocaleString()} rows · {dataset.columns.length} columns</p>
              </div>
              {errorCount === 0 ? <CheckCircle2 className="text-emerald-400" size={16} /> : <TriangleAlert className="text-rose-400" size={16} />}
            </div>
            <div className="mt-3 flex gap-2">
              <span className="rounded-md bg-emerald-400/8 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">{errorCount === 0 ? "Ready" : `${errorCount} errors`}</span>
              {warningCount > 0 && <span className="rounded-md bg-amber-400/8 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-300">{warningCount} notices</span>}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
            <button className="flex w-full items-center justify-between px-3 py-3" onClick={() => setMappingOpen(!mappingOpen)} type="button">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-300"><Braces size={13} className="text-slate-500" /> Column mapping</span>
              <ChevronRight className={`text-slate-600 transition ${mappingOpen ? "rotate-90" : ""}`} size={13} />
            </button>
            {mappingOpen && (
              <div className="space-y-3 border-t border-white/[0.06] p-3">
                {mappingFields.map((field) => (
                  <div key={field.key}>
                    <FieldLabel detail={field.required ? "Required" : "Optional"}>{field.label}</FieldLabel>
                    <SelectInput
                      onChange={(event) => updateMapping(field.key, event.target.value)}
                      value={dataset.mapping[field.key] ?? ""}
                    >
                      {!field.required && <option value="">Not mapped</option>}
                      {dataset.columns.map((column) => (
                        <option key={column.name} value={column.name}>{column.name} · {column.type}</option>
                      ))}
                    </SelectInput>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-300"><Table2 size={13} className="text-slate-500" /> Data preview</span>
              <span className="text-[9px] text-slate-600">First 4 rows</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/[0.06]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left font-mono text-[9px]">
                  <thead className="bg-black/20 text-slate-600">
                    <tr>{dataset.columns.slice(0, 3).map((column) => <th className="px-2 py-1.5 font-medium" key={column.name}>{column.name}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-slate-400">
                    {dataset.rawRows.slice(0, 4).map((row, rowIndex) => (
                      <tr key={rowIndex}>{dataset.columns.slice(0, 3).map((column) => <td className="max-w-24 truncate px-2 py-1.5" key={column.name}>{String(row[column.name] ?? "")}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </aside>
      <ImportDialog onClose={() => setImportOpen(false)} open={importOpen} />
      <ProjectManagerDialog onClose={() => setProjectsOpen(false)} open={projectsOpen} />
      <TemplateDialog onClose={() => setTemplatesOpen(false)} open={templatesOpen} />
    </>
  );
}
