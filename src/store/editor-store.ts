"use client";

import { create } from "zustand";
import { demoDatasets, type DemoDataset } from "@/data/demos";
import { suggestColumnMapping } from "@/lib/data/mapping";
import { normalizeDataset } from "@/lib/data/normalization";
import { inspectColumns } from "@/lib/data/parsers";
import { prepareProjectForExport } from "@/lib/export/config";
import { createDefaultProject, createDefaultTimeline, videoPresets } from "@/lib/project/defaults";
import { createBrowserProjectRepository, type ProjectRepository, type ProjectSummary } from "@/lib/project/repository";
import { parseProjectConfig } from "@/lib/project/schema";
import { applyProjectTemplate } from "@/lib/templates/apply-template";
import { applyGeneratedStoryDraft } from "@/lib/story/project-story";
import { moveScene as moveTimelineScene } from "@/lib/timeline/timeline";
import { getProjectTemplate } from "@/templates";
import type { ColumnMapping, DatasetColumn, NormalizedDataset, RawDataRow, ValidationIssue } from "@/types/data";
import type { AspectRatioPreset, BarChartRaceConfig, ContentConfig, ProjectConfig, VideoConfig, VideoMode } from "@/types/project";
import type { EventSettings, StoryScene } from "@/types/story";
import type { GeneratedStoryDraft, StoryAssistantConfig } from "@/types/assistant";
import type { PublishingContent, SourceMetadata } from "@/types/project";
import type { AudioConfig, ExportConfig } from "@/types/export";
import { getBarChartRaceTotalFrames } from "@/visualizations/bar-chart-race/state";

export interface DatasetSlice {
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
  selectedSceneId: string;
}

interface PersistenceSlice {
  ready: boolean;
  dirty: boolean;
  projects: ProjectSummary[];
  lastSavedAt: string | null;
  error: string | null;
}

interface EditorStore {
  project: ProjectConfig;
  dataset: DatasetSlice;
  playback: PlaybackSlice;
  persistence: PersistenceSlice;
  initializePersistence: () => void;
  createProject: () => void;
  saveProject: () => void;
  loadSavedProject: (id: string) => void;
  duplicateProject: () => void;
  renameProject: (name: string) => void;
  deleteProject: (id: string) => void;
  loadDemo: (id: string) => void;
  loadDataset: (name: string, rows: RawDataRow[], issues?: ValidationIssue[]) => void;
  updateMapping: (role: keyof ColumnMapping, column: string) => void;
  applyTemplate: (templateId: string) => void;
  updateContent: (patch: Partial<ContentConfig>) => void;
  updateSourceMetadata: (patch: Partial<SourceMetadata>) => void;
  updatePublishing: (patch: Partial<PublishingContent>) => void;
  updateStoryAssistant: (patch: Partial<StoryAssistantConfig>) => void;
  applyStoryDraft: (draft: GeneratedStoryDraft) => void;
  updateVisualization: (patch: Partial<BarChartRaceConfig>) => void;
  updateEvents: (patch: Partial<EventSettings>) => void;
  updateExport: (patch: Partial<ExportConfig>) => void;
  applyExportToProject: () => void;
  updateAudio: (patch: Partial<AudioConfig>) => void;
  updateScene: (sceneId: string, update: (scene: StoryScene) => StoryScene) => void;
  addTextScene: () => void;
  deleteScene: (sceneId: string) => void;
  selectScene: (sceneId: string) => void;
  moveScene: (sceneId: string, direction: -1 | 1) => void;
  setTheme: (themeId: string) => void;
  setVideoMode: (mode: VideoMode) => void;
  setAspectRatio: (aspectRatio: AspectRatioPreset) => void;
  setFps: (fps: VideoConfig["fps"]) => void;
  setFrame: (frame: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: PlaybackSlice["speed"]) => void;
  restart: () => void;
}

let projectRepository: ProjectRepository | null = null;

function repository(): ProjectRepository {
  projectRepository ??= createBrowserProjectRepository();
  return projectRepository;
}

function normalizedSlice(
  name: string,
  rawRows: RawDataRow[],
  mapping: ColumnMapping,
  parserIssues: ValidationIssue[] = [],
): DatasetSlice {
  const columns = inspectColumns(rawRows);
  const result = normalizeDataset(rawRows, mapping);
  return { name, rawRows, columns, mapping, normalized: result.dataset, issues: [...parserIssues, ...result.issues] };
}

function projectId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `project-${Date.now().toString(36)}`;
}

function slug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "datapulse-story";
}

function syncVisualizationScene(project: ProjectConfig, dataset: NormalizedDataset | null): ProjectConfig {
  if (!dataset) return project;
  const durationFrames = getBarChartRaceTotalFrames(dataset, project.video.fps, project.visualization.secondsPerPeriod);
  return {
    ...project,
    timeline: {
      scenes: project.timeline.scenes.map((scene) => scene.id === "scene-visualization" ? { ...scene, durationFrames } : scene),
    },
  };
}

function projectForDemo(demo: DemoDataset, id = "demo-project", now = new Date(0).toISOString()): ProjectConfig {
  const base = createDefaultProject();
  const dataset = normalizedSlice(demo.name, demo.rows, demo.mapping);
  const project: ProjectConfig = {
    ...base,
    id,
    name: demo.name,
    dataset: { name: demo.name, mapping: demo.mapping, rows: demo.rows },
    content: { ...base.content, title: demo.title, subtitle: demo.subtitle },
    visualization: {
      ...base.visualization,
      valueFormat: demo.valueFormat,
      valuePrefix: demo.valuePrefix ?? "",
      valueSuffix: demo.valueSuffix ?? "",
      showImages: Boolean(demo.mapping.image),
    },
    themeId: demo.themeId,
    timeline: {
      scenes: base.timeline.scenes.map((scene) => scene.type === "hook"
        ? { ...scene, config: { ...scene.config, title: demo.title, subtitle: demo.subtitle } }
        : scene),
    },
    export: { ...base.export, filename: `${slug(demo.name)}.mp4` },
    createdAt: now,
    updatedAt: now,
  };
  return syncVisualizationScene(project, dataset.normalized);
}

function datasetFromProject(project: ProjectConfig): DatasetSlice {
  return normalizedSlice(project.dataset.name, project.dataset.rows, project.dataset.mapping);
}

function markUpdated(project: ProjectConfig): ProjectConfig {
  return { ...project, updatedAt: new Date().toISOString() };
}

const initialDemo = demoDatasets[0];
const initialDataset = normalizedSlice(initialDemo.name, initialDemo.rows, initialDemo.mapping);
const initialProject = projectForDemo(initialDemo);

export const useEditorStore = create<EditorStore>((set, get) => ({
  project: initialProject,
  dataset: initialDataset,
  playback: { currentFrame: 0, playing: false, speed: 1, selectedSceneId: "scene-visualization" },
  persistence: { ready: false, dirty: false, projects: [], lastSavedAt: null, error: null },

  initializePersistence: () => {
    if (get().persistence.ready) return;
    const savedProjects = repository().list();
    const activeId = repository().getActiveId();
    const activeProject = activeId ? repository().get(activeId) : null;
    if (activeProject) {
      set({
        project: activeProject,
        dataset: datasetFromProject(activeProject),
        playback: { ...get().playback, currentFrame: 0, playing: false, selectedSceneId: activeProject.timeline.scenes[0]?.id ?? "" },
        persistence: { ready: true, dirty: false, projects: savedProjects, lastSavedAt: activeProject.updatedAt, error: null },
      });
      return;
    }
    set((state) => ({ persistence: { ...state.persistence, ready: true, projects: savedProjects } }));
  },

  createProject: () => {
    const now = new Date().toISOString();
    const nextProject = projectForDemo(initialDemo, projectId(), now);
    nextProject.name = "Untitled data story";
    nextProject.export.filename = "untitled-data-story.mp4";
    repository().save(nextProject);
    set({
      project: nextProject,
      dataset: datasetFromProject(nextProject),
      playback: { ...get().playback, currentFrame: 0, playing: false, selectedSceneId: "scene-hook" },
      persistence: { ready: true, dirty: false, projects: repository().list(), lastSavedAt: now, error: null },
    });
  },

  saveProject: () => {
    try {
      const project = markUpdated(parseProjectConfig(get().project));
      repository().save(project);
      set((state) => ({
        project,
        persistence: { ...state.persistence, dirty: false, projects: repository().list(), lastSavedAt: project.updatedAt, error: null },
      }));
    } catch (error) {
      set((state) => ({
        persistence: { ...state.persistence, error: error instanceof Error ? error.message : "The project could not be saved." },
      }));
    }
  },

  loadSavedProject: (id) => {
    const project = repository().get(id);
    if (!project) return;
    repository().setActiveId(id);
    set({
      project,
      dataset: datasetFromProject(project),
      playback: { ...get().playback, currentFrame: 0, playing: false, selectedSceneId: project.timeline.scenes[0]?.id ?? "" },
      persistence: { ...get().persistence, dirty: false, projects: repository().list(), lastSavedAt: project.updatedAt, error: null },
    });
  },

  duplicateProject: () => {
    const now = new Date().toISOString();
    const copy = parseProjectConfig(JSON.parse(JSON.stringify(get().project)));
    copy.id = projectId();
    copy.name = `${copy.name} copy`;
    copy.createdAt = now;
    copy.updatedAt = now;
    copy.export.filename = `${slug(copy.name)}.mp4`;
    repository().save(copy);
    set({
      project: copy,
      dataset: datasetFromProject(copy),
      playback: { ...get().playback, currentFrame: 0, playing: false },
      persistence: { ...get().persistence, dirty: false, projects: repository().list(), lastSavedAt: now, error: null },
    });
  },

  renameProject: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const project = markUpdated({ ...get().project, name: trimmed });
    repository().save(project);
    set({
      project,
      persistence: { ...get().persistence, dirty: false, projects: repository().list(), lastSavedAt: project.updatedAt, error: null },
    });
  },

  deleteProject: (id) => {
    repository().delete(id);
    const projects = repository().list();
    if (get().project.id !== id) {
      set((state) => ({ persistence: { ...state.persistence, projects } }));
      return;
    }
    const fallback = projects[0] ? repository().get(projects[0].id) : null;
    if (fallback) repository().setActiveId(fallback.id);
    const project = fallback ?? projectForDemo(initialDemo, projectId(), new Date().toISOString());
    set({
      project,
      dataset: datasetFromProject(project),
      playback: { ...get().playback, currentFrame: 0, playing: false, selectedSceneId: project.timeline.scenes[0]?.id ?? "" },
      persistence: { ...get().persistence, dirty: !fallback, projects, lastSavedAt: fallback?.updatedAt ?? null, error: null },
    });
  },

  loadDemo: (id) => {
    const demo = demoDatasets.find((candidate) => candidate.id === id);
    if (!demo) return;
    const dataset = normalizedSlice(demo.name, demo.rows, demo.mapping);
    const current = get().project;
    const project = syncVisualizationScene(markUpdated({
      ...current,
      name: demo.name,
      dataset: { name: demo.name, mapping: demo.mapping, rows: demo.rows },
      content: { ...current.content, title: demo.title, subtitle: demo.subtitle },
      visualization: {
        ...current.visualization,
        valueFormat: demo.valueFormat,
        valuePrefix: demo.valuePrefix ?? "",
        valueSuffix: demo.valueSuffix ?? "",
        showImages: Boolean(demo.mapping.image),
      },
      themeId: demo.themeId,
      timeline: {
        scenes: current.timeline.scenes.map((scene) => scene.type === "hook"
          ? { ...scene, config: { ...scene.config, title: demo.title, subtitle: demo.subtitle } }
          : scene),
      },
    }), dataset.normalized);
    set({ project, dataset, playback: { ...get().playback, currentFrame: 0, playing: false }, persistence: { ...get().persistence, dirty: true } });
  },

  loadDataset: (name, rawRows, parserIssues = []) => {
    const mapping = suggestColumnMapping(inspectColumns(rawRows));
    const dataset = normalizedSlice(name, rawRows, mapping, parserIssues);
    const project = syncVisualizationScene(markUpdated({
      ...get().project,
      name,
      dataset: { name, mapping, rows: rawRows },
      export: { ...get().project.export, filename: `${slug(name)}.mp4` },
    }), dataset.normalized);
    set({ project, dataset, playback: { ...get().playback, currentFrame: 0, playing: false }, persistence: { ...get().persistence, dirty: true } });
  },

  updateMapping: (role, column) => {
    const currentDataset = get().dataset;
    const mapping = { ...currentDataset.mapping, [role]: column || undefined };
    const dataset = normalizedSlice(currentDataset.name, currentDataset.rawRows, mapping);
    const project = syncVisualizationScene(markUpdated({
      ...get().project,
      dataset: { name: currentDataset.name, mapping, rows: currentDataset.rawRows },
    }), dataset.normalized);
    set({ project, dataset, playback: { ...get().playback, currentFrame: 0, playing: false }, persistence: { ...get().persistence, dirty: true } });
  },

  applyTemplate: (templateId) => {
    const template = getProjectTemplate(templateId);
    if (!template) return;
    set((state) => ({
      project: markUpdated(applyProjectTemplate(state.project, template)),
      playback: { ...state.playback, currentFrame: 0, playing: false },
      persistence: { ...state.persistence, dirty: true },
    }));
  },

  updateContent: (patch) => set((state) => ({
    project: markUpdated({ ...state.project, content: { ...state.project.content, ...patch } }),
    persistence: { ...state.persistence, dirty: true },
  })),

  updateSourceMetadata: (patch) => set((state) => ({
    project: markUpdated({ ...state.project, sourceMetadata: { ...state.project.sourceMetadata, ...patch } }),
    persistence: { ...state.persistence, dirty: true },
  })),

  updatePublishing: (patch) => set((state) => ({
    project: markUpdated({ ...state.project, publishing: { ...state.project.publishing, ...patch } }),
    persistence: { ...state.persistence, dirty: true },
  })),

  updateStoryAssistant: (patch) => set((state) => ({
    project: markUpdated({
      ...state.project,
      story: {
        ...state.project.story,
        ...patch,
        adaptivePacing: patch.adaptivePacing
          ? { ...state.project.story.adaptivePacing, ...patch.adaptivePacing }
          : state.project.story.adaptivePacing,
      },
    }),
    persistence: { ...state.persistence, dirty: true },
  })),

  applyStoryDraft: (draft) => set((state) => {
    return {
      project: markUpdated(applyGeneratedStoryDraft(state.project, draft)),
      playback: { ...state.playback, currentFrame: 0, playing: false, selectedSceneId: draft.timeline.scenes[0]?.id ?? "" },
      persistence: { ...state.persistence, dirty: true },
    };
  }),

  updateVisualization: (patch) => {
    const project = markUpdated({ ...get().project, visualization: { ...get().project.visualization, ...patch } });
    const synced = patch.secondsPerPeriod ? syncVisualizationScene(project, get().dataset.normalized) : project;
    set({ project: synced, persistence: { ...get().persistence, dirty: true } });
  },

  updateEvents: (patch) => set((state) => ({
    project: markUpdated({ ...state.project, events: { ...state.project.events, ...patch } }),
    persistence: { ...state.persistence, dirty: true },
  })),

  updateExport: (patch) => set((state) => ({
    project: markUpdated({ ...state.project, export: { ...state.project.export, ...patch } }),
    persistence: { ...state.persistence, dirty: true },
  })),

  applyExportToProject: () => set((state) => ({
    project: markUpdated(prepareProjectForExport(state.project, state.project.export)),
    playback: { ...state.playback, currentFrame: 0, playing: false },
    persistence: { ...state.persistence, dirty: true },
  })),

  updateAudio: (patch) => set((state) => ({
    project: markUpdated({ ...state.project, audio: { ...state.project.audio, ...patch } }),
    persistence: { ...state.persistence, dirty: true },
  })),

  updateScene: (sceneId, update) => set((state) => ({
    project: markUpdated({
      ...state.project,
      timeline: { scenes: state.project.timeline.scenes.map((scene) => scene.id === sceneId ? update(scene) : scene) },
    }),
    persistence: { ...state.persistence, dirty: true },
  })),

  addTextScene: () => set((state) => {
    const scene: StoryScene = {
      id: `scene-text-${projectId()}`,
      type: "text",
      enabled: true,
      durationFrames: state.project.video.fps * 5,
      entryTransition: { type: "fade", durationFrames: Math.round(state.project.video.fps * 0.4) },
      config: { eyebrow: "STORY BEAT", title: "Add a grounded insight", body: "Edit this scene with context drawn from your dataset.", kind: "context" },
    };
    const selectedIndex = state.project.timeline.scenes.findIndex((item) => item.id === state.playback.selectedSceneId);
    const insertionIndex = selectedIndex < 0 ? state.project.timeline.scenes.length : selectedIndex + 1;
    const scenes = [...state.project.timeline.scenes];
    scenes.splice(insertionIndex, 0, scene);
    return {
      project: markUpdated({ ...state.project, timeline: { scenes } }),
      playback: { ...state.playback, selectedSceneId: scene.id, playing: false },
      persistence: { ...state.persistence, dirty: true },
    };
  }),

  deleteScene: (sceneId) => set((state) => {
    if (state.project.timeline.scenes.length <= 1) return state;
    const index = state.project.timeline.scenes.findIndex((scene) => scene.id === sceneId);
    const scenes = state.project.timeline.scenes.filter((scene) => scene.id !== sceneId);
    return {
      project: markUpdated({ ...state.project, timeline: { scenes } }),
      playback: {
        ...state.playback,
        selectedSceneId: state.playback.selectedSceneId === sceneId ? (scenes[Math.max(0, index - 1)]?.id ?? scenes[0]?.id ?? "") : state.playback.selectedSceneId,
        currentFrame: 0,
        playing: false,
      },
      persistence: { ...state.persistence, dirty: true },
    };
  }),

  selectScene: (selectedSceneId) => set((state) => ({ playback: { ...state.playback, selectedSceneId } })),
  moveScene: (sceneId, direction) => set((state) => ({
    project: markUpdated({ ...state.project, timeline: moveTimelineScene(state.project.timeline, sceneId, direction) }),
    persistence: { ...state.persistence, dirty: true },
  })),

  setTheme: (themeId) => set((state) => ({
    project: markUpdated({ ...state.project, themeId }),
    persistence: { ...state.persistence, dirty: true },
  })),

  setVideoMode: (mode) => {
    const state = get();
    const aspectRatio = mode === "long-form" ? "landscape" : mode === "short-form" ? "portrait" : state.project.video.aspectRatio;
    const intrinsicFrames = state.dataset.normalized
      ? getBarChartRaceTotalFrames(state.dataset.normalized, state.project.video.fps, state.project.visualization.secondsPerPeriod)
      : state.project.video.fps * 12;
    const defaults = createDefaultTimeline(state.project.video.fps, intrinsicFrames, mode);
    const timeline = {
      scenes: state.project.timeline.scenes.map((scene) => {
        const defaultScene = defaults.scenes.find((candidate) => candidate.type === scene.type);
        return defaultScene ? { ...scene, enabled: defaultScene.enabled, durationFrames: defaultScene.durationFrames } : scene;
      }),
    };
    set({
      project: markUpdated({
        ...state.project,
        video: { ...state.project.video, ...videoPresets[aspectRatio], aspectRatio, mode },
        timeline,
      }),
      playback: { ...state.playback, currentFrame: 0, playing: false },
      persistence: { ...state.persistence, dirty: true },
    });
  },

  setAspectRatio: (aspectRatio) => set((state) => ({
    project: markUpdated({
      ...state.project,
      video: { ...state.project.video, ...videoPresets[aspectRatio], aspectRatio, mode: "custom" },
    }),
    persistence: { ...state.persistence, dirty: true },
  })),

  setFps: (fps) => set((state) => {
    const ratio = fps / state.project.video.fps;
    return {
      project: markUpdated({
        ...state.project,
        video: { ...state.project.video, fps },
        timeline: { scenes: state.project.timeline.scenes.map((scene) => ({ ...scene, durationFrames: Math.max(1, Math.round(scene.durationFrames * ratio)) })) },
        events: { ...state.project.events, durationFrames: Math.max(1, Math.round(state.project.events.durationFrames * ratio)) },
      }),
      playback: { ...state.playback, currentFrame: 0, playing: false },
      persistence: { ...state.persistence, dirty: true },
    };
  }),

  setFrame: (currentFrame) => set((state) => ({ playback: { ...state.playback, currentFrame } })),
  setPlaying: (playing) => set((state) => ({ playback: { ...state.playback, playing } })),
  setSpeed: (speed) => set((state) => ({ playback: { ...state.playback, speed } })),
  restart: () => set((state) => ({ playback: { ...state.playback, currentFrame: 0, playing: false } })),
}));
