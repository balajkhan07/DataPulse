"use client";

import { create } from "zustand";
import { demoDatasets } from "@/data/demos";
import { suggestColumnMapping } from "@/lib/data/mapping";
import { normalizeDataset } from "@/lib/data/normalization";
import { inspectColumns } from "@/lib/data/parsers";
import { createDefaultProject, videoPresets } from "@/lib/project/defaults";
import type {
  ColumnMapping,
  DatasetColumn,
  NormalizedDataset,
  RawDataRow,
  ValidationIssue,
} from "@/types/data";
import type {
  AspectRatioPreset,
  BarChartRaceConfig,
  ContentConfig,
  ProjectConfig,
  VideoConfig,
} from "@/types/project";

interface DatasetSlice {
  name: string;
  rawRows: RawDataRow[];
  columns: DatasetColumn[];
  mapping: ColumnMapping;
  normalized: NormalizedDataset | null;
  issues: ValidationIssue[];
}

interface PlaybackSlice {
  currentFrame: number;
  playing: boolean;
  speed: 0.5 | 1 | 2;
}

interface EditorStore {
  project: ProjectConfig;
  dataset: DatasetSlice;
  playback: PlaybackSlice;
  loadDemo: (id: string) => void;
  loadDataset: (name: string, rows: RawDataRow[], issues?: ValidationIssue[]) => void;
  updateMapping: (role: keyof ColumnMapping, column: string) => void;
  updateContent: (patch: Partial<ContentConfig>) => void;
  updateVisualization: (patch: Partial<BarChartRaceConfig>) => void;
  setTheme: (themeId: string) => void;
  setAspectRatio: (aspectRatio: AspectRatioPreset) => void;
  setFps: (fps: VideoConfig["fps"]) => void;
  setFrame: (frame: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: PlaybackSlice["speed"]) => void;
  restart: () => void;
}

function normalizedSlice(
  name: string,
  rawRows: RawDataRow[],
  mapping: ColumnMapping,
  parserIssues: ValidationIssue[] = [],
): DatasetSlice {
  const columns = inspectColumns(rawRows);
  const result = normalizeDataset(rawRows, mapping);
  return {
    name,
    rawRows,
    columns,
    mapping,
    normalized: result.dataset,
    issues: [...parserIssues, ...result.issues],
  };
}

const initialDemo = demoDatasets[0];
const initialProject = createDefaultProject();
initialProject.dataset = { name: initialDemo.name, mapping: initialDemo.mapping };
initialProject.content.title = initialDemo.title;
initialProject.content.subtitle = initialDemo.subtitle;
initialProject.themeId = initialDemo.themeId;
initialProject.visualization.valueFormat = initialDemo.valueFormat;

export const useEditorStore = create<EditorStore>((set, get) => ({
  project: initialProject,
  dataset: normalizedSlice(initialDemo.name, initialDemo.rows, initialDemo.mapping),
  playback: { currentFrame: 0, playing: false, speed: 1 },

  loadDemo: (id) => {
    const demo = demoDatasets.find((dataset) => dataset.id === id);
    if (!demo) return;
    const project = get().project;
    set({
      project: {
        ...project,
        name: demo.name,
        dataset: { name: demo.name, mapping: demo.mapping },
        content: { ...project.content, title: demo.title, subtitle: demo.subtitle },
        themeId: demo.themeId,
        visualization: {
          ...project.visualization,
          valueFormat: demo.valueFormat,
          valuePrefix: demo.valuePrefix ?? "",
          valueSuffix: demo.valueSuffix ?? "",
        },
        updatedAt: new Date().toISOString(),
      },
      dataset: normalizedSlice(demo.name, demo.rows, demo.mapping),
      playback: { ...get().playback, currentFrame: 0, playing: false },
    });
  },

  loadDataset: (name, rawRows, parserIssues = []) => {
    const columns = inspectColumns(rawRows);
    const mapping = suggestColumnMapping(columns);
    const project = get().project;
    set({
      project: {
        ...project,
        name,
        dataset: { name, mapping },
        updatedAt: new Date().toISOString(),
      },
      dataset: normalizedSlice(name, rawRows, mapping, parserIssues),
      playback: { ...get().playback, currentFrame: 0, playing: false },
    });
  },

  updateMapping: (role, column) => {
    const currentDataset = get().dataset;
    const mapping = { ...currentDataset.mapping, [role]: column || undefined };
    const normalized = normalizedSlice(currentDataset.name, currentDataset.rawRows, mapping);
    set({
      dataset: normalized,
      project: {
        ...get().project,
        dataset: { name: currentDataset.name, mapping },
        updatedAt: new Date().toISOString(),
      },
      playback: { ...get().playback, currentFrame: 0, playing: false },
    });
  },

  updateContent: (patch) =>
    set((state) => ({
      project: {
        ...state.project,
        content: { ...state.project.content, ...patch },
        updatedAt: new Date().toISOString(),
      },
    })),

  updateVisualization: (patch) =>
    set((state) => ({
      project: {
        ...state.project,
        visualization: { ...state.project.visualization, ...patch },
        updatedAt: new Date().toISOString(),
      },
    })),

  setTheme: (themeId) =>
    set((state) => ({
      project: { ...state.project, themeId, updatedAt: new Date().toISOString() },
    })),

  setAspectRatio: (aspectRatio) =>
    set((state) => ({
      project: {
        ...state.project,
        video: { ...state.project.video, ...videoPresets[aspectRatio], aspectRatio },
        updatedAt: new Date().toISOString(),
      },
    })),

  setFps: (fps) =>
    set((state) => ({
      project: {
        ...state.project,
        video: { ...state.project.video, fps },
        updatedAt: new Date().toISOString(),
      },
      playback: { ...state.playback, currentFrame: 0, playing: false },
    })),

  setFrame: (currentFrame) => set((state) => ({ playback: { ...state.playback, currentFrame } })),
  setPlaying: (playing) => set((state) => ({ playback: { ...state.playback, playing } })),
  setSpeed: (speed) => set((state) => ({ playback: { ...state.playback, speed } })),
  restart: () => set((state) => ({ playback: { ...state.playback, currentFrame: 0, playing: false } })),
}));
