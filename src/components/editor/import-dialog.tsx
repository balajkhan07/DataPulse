"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { parseDataset } from "@/lib/data/parsers";
import { useEditorStore } from "@/store/editor-store";
import type { ValidationIssue } from "@/types/data";
import { SegmentedControl } from "@/components/ui/controls";

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const loadDataset = useEditorStore((state) => state.loadDataset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [fileName, setFileName] = useState("Pasted dataset");
  const [content, setContent] = useState("");
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  if (!open) return null;

  const importContent = () => {
    const result = parseDataset(content, format);
    setIssues(result.issues);
    if (result.rows.length === 0 || result.issues.some((issue) => issue.severity === "error")) return;
    loadDataset(fileName.replace(/\.(csv|json)$/i, "") || "Imported dataset", result.rows, result.issues);
    onClose();
  };

  const readFile = async (file: File) => {
    const nextFormat = file.name.toLowerCase().endsWith(".json") ? "json" : "csv";
    setFormat(nextFormat);
    setFileName(file.name);
    setContent(await file.text());
    setIssues([]);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#05060a]/80 p-5 backdrop-blur-md" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#12141d] shadow-2xl shadow-black/50"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="flex items-start justify-between border-b border-white/8 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400">New dataset</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">Import CSV or JSON</h2>
            <p className="mt-1 text-xs text-slate-500">Upload a file or paste structured data. Mapping suggestions run automatically.</p>
          </div>
          <button className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white" onClick={onClose} type="button">
            <X size={17} />
          </button>
        </header>

        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <SegmentedControl
              onChange={setFormat}
              options={[{ value: "csv", label: "CSV" }, { value: "json", label: "JSON" }]}
              value={format}
            />
            <button
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload size={14} /> Choose file
            </button>
            <input
              ref={fileInputRef}
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void readFile(file);
              }}
              type="file"
            />
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              <FileText size={13} /> {fileName}
            </div>
            <textarea
              autoFocus
              className="min-h-64 w-full resize-y rounded-xl border border-white/8 bg-black/20 px-3 pb-3 pt-10 font-mono text-[11px] leading-5 text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-violet-400/50"
              onChange={(event) => {
                setContent(event.target.value);
                setIssues([]);
              }}
              placeholder={format === "csv" ? "year,company,value\n2020,Apple,200" : '[{"year": 2020, "company": "Apple", "value": 200}]'}
              value={content}
            />
          </div>

          {issues.length > 0 && (
            <div className="rounded-xl border border-rose-400/15 bg-rose-400/[0.06] px-4 py-3 text-xs text-rose-200">
              {issues.slice(0, 3).map((issue) => <p key={`${issue.code}-${issue.row ?? 0}`}>{issue.message}</p>)}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-white/8 bg-black/10 px-6 py-4">
          <p className="text-[11px] text-slate-600">Files stay in your browser during Phase 1.</p>
          <button
            className="rounded-lg bg-violet-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!content.trim()}
            onClick={importContent}
            type="button"
          >
            Analyze dataset
          </button>
        </footer>
      </section>
    </div>
  );
}
