# DataPulse Architecture

## 1. Decision summary

DataPulse is a single Next.js application with framework-independent data, timeline, event, and animation modules. It uses registries for scenes and visualizations, pure functions for every frame calculation, a React/SVG presentation layer, and a serializable project model. The future export worker will load the same project model and invoke the same story renderer through Remotion.

The initial deployment is intentionally monolithic. A local render worker can be split into a separate process when MP4 export is added, but the data model and rendering modules remain shared packages rather than duplicated services.

## 2. Rendering strategy: D3 calculations + React SVG

SVG is the correct starting point for the bar chart race:

- text placement, clipping, images, outlines, and accessibility are straightforward;
- a single React tree can run in the browser and in Remotion;
- D3 scales can be used without allowing D3 to own the DOM;
- debugging and responsive layout are substantially easier than Canvas;
- the expected top 5–15 bars are far below SVG's practical performance ceiling.

D3 is used for calculations, not imperative transitions. React renders the SVG from an explicit state object. Canvas remains an implementation option for future visualizations with thousands of simultaneous marks, but should only be selected after profiling.

## 3. MP4 strategy: Remotion + FFmpeg

Remotion should own frame orchestration and composition timing. FFmpeg should encode frames, mux audio, and write H.264 MP4. This combination supports deterministic replay, known duration/FPS/resolution, server-side progress, and exact parity with browser preview.

The export composition must import the registered visualization renderer. It must not introduce a second `VideoBarChart` implementation. A future local render worker will accept versioned project JSON, validate it, resolve assets, render frames, and emit progress events. The same path can later back a CLI.

## 4. Dependency direction

```text
Editor UI / Remotion composition
              ↓
       Story renderer + scene registry
              ↓
      Visualization registry
              ↓
 Visualization state + responsive layout
              ↓
 Timeline / events / data / animation / formatting
              ↓
       Serializable core types
```

Generic libraries do not import editor components. Visualization state does not import React. The renderer consumes already-derived state and theme/config data.

## 5. Data pipeline

```text
CSV / JSON text
      ↓ parse
RawDataRow[] + inferred DatasetColumn[]
      ↓ suggest and edit mapping
ColumnMapping
      ↓ validate and normalize
NormalizedDataset
      ↓ frame + fps + visualization config
BarChartRaceState
      ↓ responsive layout + theme
SVG frame
```

Raw rows are untrusted. Parsing allows scalar JSON values and stringifies nested values rather than executing or interpreting them. Normalization validates required roles, rejects invalid values with row/column context, combines duplicate time/entity rows, and removes source-specific field names.

`NormalizedDataset` uses plain objects and arrays so it can cross a process boundary or be cached as JSON. It contains:

- a flat point list for analysis;
- sorted period objects for frame lookup;
- a stable entity index for labels and visual metadata;
- global value bounds.

## 6. Deterministic frame pipeline

`getBarChartRaceState` converts a frame into a period index and local period progress. It then:

1. resolves values at the current and next periods;
2. applies the configured missing-value strategy;
3. calculates start and end rankings;
4. eases local progress centrally;
5. interpolates values and rank positions;
6. calculates current rank and enter/exit opacity;
7. returns a renderer-ready state object.

There are no timers, transitions, or browser APIs in this calculation. Preview uses `requestAnimationFrame` only to advance the frame counter. Seeking or exporting a frame calls exactly the same pure function.

## 7. Responsive layout

The SVG view box always matches the target video dimensions. `calculateBarChartLayout` derives:

- scaled safe areas;
- header, chart, and footer regions;
- portrait versus landscape label treatment;
- row and bar height;
- bar width and value reserve;
- typography scale.

Portrait layouts put labels above bars to preserve horizontal value range. Landscape layouts reserve a label column. Value text is clamped to the safe content edge. This is preferable to a collection of aspect-ratio-specific CSS offsets and is reusable by Remotion.

## 8. Visualization plugin API

Every registered visualization provides:

- a stable ID and display name;
- normalized-dataset validation;
- default serializable config;
- a pure `getStateAtFrame` function;
- one renderer shared by preview and export.

The bar chart race implementation is isolated in `src/visualizations/bar-chart-race/`. Adding a new visualization requires registration, not editor rewrites. As the editor gains more visualization-specific controls, a serializable control schema can be added to the definition rather than branching the editor by ID.

## 9. Scene and story-frame pipeline

`TimelineConfig` contains an ordered list of discriminated `StoryScene` objects. Hook, visualization, final-ranking, and outro scenes each carry their own serializable config and a positive `durationFrames`. Disabled scenes remain editable but consume no timeline time.

```text
absolute story frame
      ↓ getActiveScene
scene + scene-local frame
      ↓ scene registry
hook | visualization | final ranking | outro renderer
```

The visualization scene maps its local frame onto the visualization's intrinsic duration and calls the registered visualization definition. Final ranking calls the same end-frame bar-chart state function and sorts that derived state. No scene uses timers or DOM transitions. Short-form and long-form modes only change configuration, aspect ratio, pacing, and durations; they do not select different implementations.

## 10. State architecture

The Zustand store has three logical slices in one typed store:

- `project`: persistent, serializable content, embedded raw dataset, visualization, theme, video, timeline, events, and export configuration;
- `dataset`: raw import session, inferred columns, mapping, normalized derived data, and validation issues;
- `playback`: temporary frame, playing flag, preview speed, and selected scene;
- `persistence`: temporary saved-project summaries, dirty state, save time, and actionable errors.

Project files persist only the versioned project document with an embedded raw dataset. Normalized data, playback state, dialog state, and panel selection never belong in project JSON. Components subscribe to narrow selectors, so frame updates rerender the preview and timeline rather than the entire editor.

## 11. Project model, persistence, and migration

`ProjectConfig` is currently `schemaVersion: 2`. External/persisted JSON is validated through Zod before it reaches the store. The current parser migrates Phase 1 documents by adding embedded rows, image treatment, video mode, timeline, event, and export defaults. Future migrations follow the same explicit boundary:

```text
unknown JSON → schema discriminator → vN migration → current schema → ProjectConfig
```

Functions, DOM nodes, React elements, `Map`, and other non-JSON values are forbidden in persistent configuration.

`ProjectRepository` is the storage boundary. `LocalProjectRepository` stores validated project documents and the active project ID in browser `localStorage`, and exposes create/save/load/duplicate/rename/delete workflows through Zustand actions. This is appropriate for a private local tool, but storage quotas and browser-local availability are explicit limitations. A database implementation should implement the same repository contract.

## 12. Template architecture

Templates are immutable `ProjectTemplate` configuration objects and never contain datasets. Applying a template copies theme, visualization defaults, video mode/preset, safe area, scene timing/enabled state, and event defaults onto the current project while preserving dataset, mapping, content, project identity, and timestamps. Theme IDs indirectly select serializable typography, backgrounds, bars, labels, and annotation tokens; there are no template-specific renderers.

## 13. Event and annotation architecture

Story detection is independent of rendering. `detectStoryEvents` covers leadership changes, major rises/falls, top-N entry/exit, per-entity records, configured milestone crossings, and fastest absolute growth. It returns structured, serializable event objects with time, involved entities, metadata, and a bounded 0–100 importance score. It does not generate display copy.

`presentStoryEvent` owns display copy. `createAnnotationSchedule` filters enabled types and minimum importance, enforces frequency-specific spacing and caps, maps event periods to chart frames, and sets duration. The visualization scene memoizes this schedule for its stable dataset/config and only selects the active annotation per frame. The responsive overlay occupies a safe header region in portrait and an upper-right card in landscape; involved entity IDs are passed to the shared chart renderer for emphasis.

## 14. Asset handling

The normalized model accepts optional image references. `resolveAssetReference` allows app-root paths, HTTPS URLs, and supported image data URLs, rejects unstable/unsupported schemes, and creates a deterministic cache key. `EntityMark` renders in SVG at responsive layout dimensions, applies circle/rounded/square clipping, preserves aspect ratio, and leaves a colored initial fallback behind a missing image.

Production rendering cannot rely on remote availability. Phase 3 must use the existing cache key boundary to download approved remote images into a content-addressed local cache, record dimensions/media type, and expose stable local paths to preview and Remotion. Uploaded filenames must never determine filesystem paths directly.

## 15. Proposed Phase 3 render boundary

```text
Editor → POST validated project render request
                  ↓
          local render queue
                  ↓
        asset manifest + resolution/cache
                  ↓
 StoryRenderer in Remotion → frames → FFmpeg MP4
                  ↓
       progress stream + output record
```

The first implementation can use a Next.js route to enqueue work and a local Node worker process. A distributed queue, object storage, and multi-tenant controls are unnecessary for the private-tool stage.

## 16. Folder structure

```text
src/
  app/                         Next.js route and global styling
  components/
    editor/                    shell, import, mapping, inspector
    preview/                   shared-renderer preview host
    timeline/                  frame-based playback controls
    visualization/             shared entity-mark primitives
    ui/                        small reusable controls
  data/                        bundled demo datasets
  lib/
    animation/                 easing and interpolation primitives
    data/                      parsing, inspection, mapping, normalization
    assets/                    validated, cache-ready asset references
    events/                    detection, presentation, annotation schedule
    formatting/                centralized value formatting
    project/                   defaults, schema/migrations, repository
    templates/                 pure template application
    timeline/                  scene timing and reordering
  scenes/                      scene registry and shared story renderers
  store/                       persistent and transient editor slices/actions
  templates/                   built-in configuration-only templates
  themes/                      serializable theme definitions
  types/                       shared core contracts
  visualizations/
    registry.ts
    bar-chart-race/            state, layout, renderer, definition, tests
```

## 17. Major React components

- `EditorShell`: three-panel creative workspace and timeline composition.
- `DatasetPanel`: projects/templates/import entry points, demos, data quality, mapping, and raw preview.
- `InspectorPanel`: content, story, theme, animation, and video-mode controls.
- `StoryInspector`: selected-scene controls plus event type, importance, frequency, and milestone settings.
- `PreviewPlayer`: advances the story-frame clock and invokes `StoryRenderer`.
- `StoryRenderer`: maps a frame to a scene and invokes the registered scene renderer.
- `BarChartRaceRenderer`: stateless shared SVG output.
- `TimelineControls`: scene order/selection plus play, pause, restart, speed, and deterministic seeking.
- `ImportDialog`: file/paste parsing and actionable parse errors.
- `ProjectManagerDialog` and `TemplateDialog`: compact local-library and reusable-look workflows.

## 18. Testing priorities

Business logic has focused tests for CSV/JSON parsing, normalization, duplicate handling, formatting, deterministic interpolation/ranking, final ranking reuse, all event boundaries, annotation selection, scene timing/reordering, template application, repository loading/ordering, and project schema round-trip/migration. Phase 3 should add asset-manifest/cache tests, Remotion frame parity, render-job lifecycle, and output validation. Presentational markup should be covered with targeted interaction tests only when behavior warrants it.
