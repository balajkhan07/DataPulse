# DataPulse Architecture

## 1. Decision summary

DataPulse is a single Next.js application with framework-independent data and animation modules. It uses a plugin registry for visualizations, pure functions for every frame calculation, a React/SVG presentation layer, and a serializable project model. The future export worker will load the same project model and invoke the same renderer through Remotion.

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
      Visualization registry
              ↓
 Visualization state + responsive layout
              ↓
 Data normalization / animation / formatting / events
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

## 9. State architecture

The Zustand store has three logical slices in one typed store:

- `project`: persistent, serializable content, visualization, theme, and video configuration;
- `dataset`: raw import session, inferred columns, mapping, normalized derived data, and validation issues;
- `playback`: temporary frame, playing flag, and preview speed.

Project files will persist only the versioned project document and a dataset reference or embedded dataset. Playback state and panel selection never belong in project JSON. Components subscribe to narrow selectors, so frame updates rerender the preview and timeline rather than the entire editor.

## 10. Project model and migration

`ProjectConfig` begins at `schemaVersion: 1`. External/persisted JSON is validated through Zod before it reaches the store. Future migrations should be explicit functions:

```text
unknown JSON → schema discriminator → vN migration → current schema → ProjectConfig
```

Functions, DOM nodes, React elements, `Map`, and other non-JSON values are forbidden in persistent configuration.

## 11. Event architecture

Story detection is independent of rendering. `detectStoryEvents` currently demonstrates leadership changes, top-N entry, and major rises. It returns structured, serializable event objects with time, involved entities, importance, title, and metadata.

Phase 2 will add a review/enable layer and an annotation renderer. The visualization renderer should only display scheduled annotations; it should not rediscover events each frame.

## 12. Asset handling

The normalized model accepts image URLs, but production rendering cannot rely on network availability. Phase 2 should introduce an asset resolver that downloads approved remote images into a content-addressed local cache, records dimensions and media type, and exposes stable local URLs to preview and Remotion. Uploaded filenames must never determine filesystem paths directly.

## 13. Proposed Phase 3 render boundary

```text
Editor → POST validated project render request
                  ↓
          local render queue
                  ↓
        asset resolution/cache
                  ↓
 Remotion composition → frames → FFmpeg MP4
                  ↓
       progress stream + output record
```

The first implementation can use a Next.js route to enqueue work and a local Node worker process. A distributed queue, object storage, and multi-tenant controls are unnecessary for the private-tool stage.

## 14. Folder structure

```text
src/
  app/                         Next.js route and global styling
  components/
    editor/                    shell, import, mapping, inspector
    preview/                   shared-renderer preview host
    timeline/                  frame-based playback controls
    ui/                        small reusable controls
  data/                        bundled demo datasets
  lib/
    animation/                 easing and interpolation primitives
    data/                      parsing, inspection, mapping, normalization
    events/                    pure story-event detectors
    formatting/                centralized value formatting
    project/                   defaults and Zod project schema
  store/                       persistent and transient editor slices
  themes/                      serializable theme definitions
  types/                       shared core contracts
  visualizations/
    registry.ts
    bar-chart-race/            state, layout, renderer, definition, tests
```

## 15. Major React components

- `EditorShell`: three-panel creative workspace and timeline composition.
- `DatasetPanel`: import entry point, demos, data quality, mapping, and raw preview.
- `InspectorPanel`: content, theme, animation, and video controls.
- `PreviewPlayer`: advances the frame clock and invokes the registered renderer.
- `BarChartRaceRenderer`: stateless shared SVG output.
- `TimelineControls`: play, pause, restart, speed, and deterministic seeking.
- `ImportDialog`: file/paste parsing and actionable parse errors.

## 16. Testing priorities

Business logic has focused tests for CSV/JSON parsing, normalization, duplicate handling, formatting, deterministic interpolation/ranking, event detection, and project-schema validation. Future priorities are migration fixtures, asset resolution, scene timing, and Remotion frame parity. Presentational markup should be covered with targeted interaction tests only when behavior warrants it.
