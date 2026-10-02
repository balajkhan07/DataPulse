"use client";

import { useState } from "react";
import { Clapperboard, Gauge, LayoutTemplate, Palette, SlidersHorizontal, Type } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { themes } from "@/themes";
import type { AspectRatioPreset, BarChartRaceConfig, VideoConfig } from "@/types/project";
import { FieldLabel, SegmentedControl, SelectInput, TextInput, Toggle } from "@/components/ui/controls";

type InspectorTab = "content" | "style" | "motion" | "video";

const tabs: Array<{ id: InspectorTab; label: string; icon: typeof Type }> = [
  { id: "content", label: "Content", icon: Type },
  { id: "style", label: "Style", icon: Palette },
  { id: "motion", label: "Motion", icon: Gauge },
  { id: "video", label: "Video", icon: Clapperboard },
];

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Type; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/[0.065] px-4 py-5 last:border-b-0">
      <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"><Icon size={13} /> {title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  detail,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  detail: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <FieldLabel detail={detail}>{label}</FieldLabel>
      <input className="editor-range w-full" max={max} min={min} onChange={(event) => onChange(Number(event.target.value))} step={step} type="range" value={value} />
    </div>
  );
}

export function InspectorPanel() {
  const [tab, setTab] = useState<InspectorTab>("content");
  const project = useEditorStore((state) => state.project);
  const updateContent = useEditorStore((state) => state.updateContent);
  const updateVisualization = useEditorStore((state) => state.updateVisualization);
  const setTheme = useEditorStore((state) => state.setTheme);
  const setAspectRatio = useEditorStore((state) => state.setAspectRatio);
  const setFps = useEditorStore((state) => state.setFps);
  const chart = project.visualization;

  return (
    <aside className="flex min-h-0 flex-col border-l border-white/[0.07] bg-[#10121a]">
      <div className="grid grid-cols-4 border-b border-white/[0.07] px-2 pt-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={`relative flex flex-col items-center gap-1.5 px-1 pb-2.5 pt-2 text-[9px] font-semibold transition ${tab === item.id ? "text-violet-300" : "text-slate-600 hover:text-slate-300"}`}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button"
            >
              <Icon size={14} /> {item.label}
              {tab === item.id && <span className="absolute bottom-0 h-0.5 w-7 rounded-full bg-violet-400" />}
            </button>
          );
        })}
      </div>

      <div className="editor-scrollbar min-h-0 flex-1 overflow-y-auto">
        {tab === "content" && (
          <>
            <Section icon={Type} title="Story copy">
              <div><FieldLabel>Title</FieldLabel><TextInput onChange={(event) => updateContent({ title: event.target.value })} value={project.content.title} /></div>
              <div><FieldLabel>Subtitle</FieldLabel><TextInput onChange={(event) => updateContent({ subtitle: event.target.value })} value={project.content.subtitle} /></div>
              <div><FieldLabel>Source</FieldLabel><TextInput onChange={(event) => updateContent({ source: event.target.value })} value={project.content.source} /></div>
              <div><FieldLabel>Footer</FieldLabel><TextInput onChange={(event) => updateContent({ footer: event.target.value })} value={project.content.footer} /></div>
            </Section>
            <Section icon={LayoutTemplate} title="Chart content">
              <RangeField detail={String(chart.topN)} label="Visible bars" max={15} min={3} onChange={(topN) => updateVisualization({ topN })} value={chart.topN} />
              <Toggle checked={chart.showRank} label="Show rank numbers" onChange={(showRank) => updateVisualization({ showRank })} />
              <Toggle checked={chart.showValues} label="Show values" onChange={(showValues) => updateVisualization({ showValues })} />
              <Toggle checked={chart.showImages} label="Show entity marks" onChange={(showImages) => updateVisualization({ showImages })} />
              <div>
                <FieldLabel>Value format</FieldLabel>
                <SelectInput onChange={(event) => updateVisualization({ valueFormat: event.target.value as BarChartRaceConfig["valueFormat"] })} value={chart.valueFormat}>
                  <option value="raw">Raw</option><option value="integer">1,234</option><option value="compact">1.2M</option><option value="currency">$1.2B</option><option value="percentage">15%</option>
                </SelectInput>
              </div>
            </Section>
          </>
        )}

        {tab === "style" && (
          <>
            <Section icon={Palette} title="Theme presets">
              <div className="space-y-2">
                {themes.map((theme) => (
                  <button
                    className={`w-full rounded-xl border p-3 text-left transition ${project.themeId === theme.id ? "border-violet-400/35 bg-violet-400/[0.07]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"}`}
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-xs font-semibold text-slate-200">{theme.name}</p><p className="mt-1 text-[9px] text-slate-600">{theme.description}</p></div>
                      <div className="flex -space-x-1.5">{theme.bars.palette.slice(0, 4).map((color) => <span className="h-5 w-5 rounded-full border-2 border-[#151720]" key={color} style={{ background: color }} />)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Section>
            <Section icon={SlidersHorizontal} title="Bar treatment">
              <RangeField detail={`${chart.barRadius}px`} label="Corner radius" max={40} min={0} onChange={(barRadius) => updateVisualization({ barRadius })} value={chart.barRadius} />
              <RangeField detail={`${Math.round(chart.barOpacity * 100)}%`} label="Opacity" max={1} min={0.3} onChange={(barOpacity) => updateVisualization({ barOpacity })} step={0.05} value={chart.barOpacity} />
            </Section>
          </>
        )}

        {tab === "motion" && (
          <Section icon={Gauge} title="Animation">
            <RangeField detail={`${chart.secondsPerPeriod.toFixed(1)}s`} label="Time per period" max={4} min={0.4} onChange={(secondsPerPeriod) => updateVisualization({ secondsPerPeriod })} step={0.1} value={chart.secondsPerPeriod} />
            <div>
              <FieldLabel>Easing</FieldLabel>
              <SelectInput onChange={(event) => updateVisualization({ easing: event.target.value as BarChartRaceConfig["easing"] })} value={chart.easing}>
                <option value="easeInOut">Smooth in/out</option><option value="easeOut">Ease out</option><option value="easeIn">Ease in</option><option value="linear">Linear</option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel>Missing entities</FieldLabel>
              <SegmentedControl
                onChange={(missingValueStrategy) => updateVisualization({ missingValueStrategy })}
                options={[{ value: "zero", label: "Fade to zero" }, { value: "carry", label: "Carry value" }]}
                value={chart.missingValueStrategy}
              />
            </div>
            <div className="rounded-xl border border-sky-400/10 bg-sky-400/[0.045] p-3 text-[10px] leading-4 text-sky-200/65">
              Every preview frame is calculated from the playhead. The same frame will render identically during MP4 export.
            </div>
          </Section>
        )}

        {tab === "video" && (
          <>
            <Section icon={Clapperboard} title="Canvas">
              <FieldLabel>Aspect ratio</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["portrait", "9:16", "Shorts · Reels"],
                  ["landscape", "16:9", "YouTube"],
                  ["square", "1:1", "Square"],
                  ["feed", "4:5", "Instagram feed"],
                ] as Array<[AspectRatioPreset, string, string]>).map(([id, ratio, label]) => (
                  <button
                    className={`rounded-xl border p-3 text-left transition ${project.video.aspectRatio === id ? "border-violet-400/35 bg-violet-400/[0.07]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"}`}
                    key={id}
                    onClick={() => setAspectRatio(id)}
                    type="button"
                  >
                    <span className="font-mono text-xs font-bold text-slate-200">{ratio}</span><span className="mt-1 block text-[9px] text-slate-600">{label}</span>
                  </button>
                ))}
              </div>
              <div>
                <FieldLabel detail={`${project.video.width} × ${project.video.height}`}>Resolution</FieldLabel>
                <div className="rounded-lg border border-white/[0.06] bg-black/15 px-3 py-2 text-xs text-slate-400">1080p · Social master</div>
              </div>
              <div>
                <FieldLabel>Frame rate</FieldLabel>
                <SegmentedControl<`${VideoConfig["fps"]}`>
                  onChange={(fps) => setFps(Number(fps) as VideoConfig["fps"])}
                  options={[{ value: "24", label: "24 fps" }, { value: "30", label: "30 fps" }, { value: "60", label: "60 fps" }]}
                  value={String(project.video.fps) as `${VideoConfig["fps"]}`}
                />
              </div>
            </Section>
            <Section icon={LayoutTemplate} title="Safe area">
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-500">
                {Object.entries(project.video.safeArea).map(([edge, value]) => <div className="rounded-lg bg-white/[0.03] px-3 py-2" key={edge}><span className="capitalize">{edge}</span><span className="float-right text-slate-300">{value}</span></div>)}
              </div>
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}
