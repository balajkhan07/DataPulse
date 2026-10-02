"use client";

import { DatasetPanel } from "@/components/editor/dataset-panel";
import { InspectorPanel } from "@/components/editor/inspector-panel";
import { TopBar } from "@/components/editor/top-bar";
import { PreviewPlayer } from "@/components/preview/preview-player";
import { TimelineControls } from "@/components/timeline/timeline-controls";

export function EditorShell() {
  return (
    <main className="flex h-screen min-h-[680px] flex-col overflow-hidden bg-[#0b0d13] text-slate-100">
      <TopBar />
      <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)_318px]">
        <DatasetPanel />
        <div className="flex min-w-0 flex-col">
          <PreviewPlayer />
          <TimelineControls />
        </div>
        <InspectorPanel />
      </div>
    </main>
  );
}
