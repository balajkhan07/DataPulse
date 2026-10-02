# DataPulse

DataPulse is a private visual-storytelling studio for turning structured datasets into deterministic, social-media-ready MP4 videos. Phase 3 adds production export around the shared Phase 1/2 engine: Remotion frames, FFmpeg encoding, audio, asset caching, render jobs, and downloadable output.

The product model is deliberately broader than one chart:

```text
Raw data → Mapping → Normalized data → Visualization state → Story → Frames → Video
```

## What works today

- CSV upload and paste, including quoted values
- JSON upload and paste, including `{ "data": [...] }` envelopes
- Column inference and automatic mapping suggestions
- Actionable row/column validation issues
- Duplicate time/entity rows combined deterministically
- Zero or carry-forward behavior for missing values
- Smooth value, position, rank, enter, and exit interpolation
- Frame-derived playback at 24, 30, or 60 fps
- Portrait, landscape, square, and 4:5 canvases with social safe areas
- Five production-quality visual themes
- Title, subtitle, source, footer, bar, format, and motion controls
- Four built-in datasets for immediate exploration
- Local create, save, load, duplicate, rename, and delete project workflows
- Versioned project JSON with validation and a Phase 1 → Phase 2 migration
- Five reusable templates that preserve the current dataset and story copy
- Circle, rounded, and square entity marks with deterministic initial fallback
- Hook, visualization, final-ranking, and outro scenes in one scene registry
- Short-form and long-form presets using the same scene and rendering system
- Lead change, rank movement, top-N entry/exit, record, milestone, and fastest-growth detection
- Importance-filtered, responsive annotations with event presentation kept separate from detection
- Deterministic cut, fade, crossfade, and slide scene transitions
- YouTube, Shorts, Reels, TikTok, Facebook, square, feed, and custom export presets
- Draft through maximum quality settings with H.264 MP4 output
- Local sequential render queue with progress, cancellation, failures, history, and collision-safe downloads
- MP3/WAV soundtrack upload with offset, trimming, volume, fades, and optional looping
- Content-addressed remote/embedded image resolution into job-local render assets

Cloud persistence, assisted storytelling, and batch/headless commands remain future work.

## Production workflow

1. Open **Projects** to create or restore a local project.
2. Import CSV/JSON or choose a bundled dataset and confirm its column mapping.
3. Open **Templates** to apply design, pacing, safe-area, and annotation defaults without replacing data or copy.
4. Use the **Story** inspector and scene timeline to select, reorder, enable, and time scenes.
5. Configure detected moments, minimum importance, frequency, and milestones.
6. Open **Export video**, select a platform preset, quality, and optional soundtrack.
7. Apply the target dimensions to preview when desired, then render, monitor, and download the MP4.
8. Save the project. The full dataset and serializable configuration reopen in the browser later.

Projects currently use browser `localStorage`. This is deliberately behind `ProjectRepository`, so a file, database, or cloud implementation can replace it without changing the editor. Browser storage quotas make it suitable for personal projects and moderate datasets, not a long-term media library.

## Setup

Requires Node.js 20.9 or newer, FFprobe on `PATH` for audio inspection, and a local Chrome/Chromium executable for Remotion. Set `REMOTION_BROWSER_EXECUTABLE` when the browser is not in a standard location.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Quality checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Dataset mapping

Imported fields never leak into rendering code. `ColumnMapping` translates arbitrary source columns into three required roles and optional metadata:

- `time`: year, date, timestamp, season, or numeric sequence
- `category`: stable entity identity such as a company, country, or team
- `value`: the numeric quantity that determines bar length and rank
- optional `displayLabel`, `group`, `color`, `image`, `secondaryMetric`, and `description`

Mapping suggestions combine column-name hints with inferred types. The normalizer converts valid rows into `NormalizedDataPoint` values, sums duplicate time/entity pairs, sorts periods, and creates serializable period/entity indexes. Invalid times, categories, and values are rejected before visualization logic runs.

## Rendering model

The browser does not animate bars with CSS or DOM transitions. The playhead is converted to a frame, and that frame is passed to the registered visualization:

```ts
const state = definition.getStateAtFrame({
  dataset,
  frame,
  fps,
  config,
});
```

`BarChartRaceRenderer` receives only serializable configuration plus derived state. Ranking, easing, interpolation, and layout remain outside the component. D3 supplies the SVG value scale; React produces the shared SVG tree. `StoryRenderer` first resolves the active scene and delegates through the scene registry; the visualization scene still invokes that same bar-chart renderer. `DataPulseComposition` passes Remotion's current frame into this exact story renderer, so every preview and export frame follows the same path.

## Projects, templates, and scenes

`ProjectConfig` schema version 3 embeds the raw scalar dataset, mapping, visualization settings, video mode, scenes/transitions, event settings, export settings, optional audio settings, and timestamps. Normalized data remains derived so persisted source fields never leak into renderers. Zod validates saved projects and render requests before they enter the store or queue.

Templates are serializable configuration objects. Applying one updates theme, visualization treatment, pacing, scene defaults, video preset, safe area, and event selection while keeping dataset, mapping, and authored copy intact.

The timeline is an ordered list of discriminated `StoryScene` values. Each enabled scene owns a frame duration and serializable config. `getActiveScene` maps an absolute story frame to a scene-local frame. The current registry provides hook, visualization, final ranking, and outro renderers. The final ranking calls the shared bar-chart state logic at its final frame instead of implementing a separate ranking path.

## Events and annotations

Detection in `src/lib/events/` is pure business logic over normalized data. It returns structured event metadata and 0–100 importance scores. A separate presentation layer creates human-readable copy; the scheduler applies enabled types, minimum importance, frequency limits, duration, and spacing before rendering an annotation. Annotation cards use each theme's serializable annotation tokens and entity highlights are passed into the shared visualization renderer.

## Entity images

The optional mapping `image` role accepts stable app paths, HTTPS URLs, and supported image data URLs. `resolveAssetReference` validates the reference and assigns a deterministic cache key. SVG marks preserve aspect ratio and render a colored initial underneath, so missing or failed images degrade gracefully. At export time, approved remote/embedded images are written to a content-addressed cache and copied into the job-local public directory before frame rendering.

## Video export architecture

The implemented export path uses Remotion with local FFmpeg encoding:

1. Validate a versioned schema-v3 project JSON document and export config.
2. Retarget dimensions/FPS while preserving scene duration in seconds.
3. Resolve local, embedded, and approved remote assets into a job-local public directory.
4. Normalize the embedded dataset and feed Remotion's current frame into `StoryRenderer`.
5. Render the same scene and visualization SVG trees used by preview.
6. Schedule the optional soundtrack from the shared offset/trim/loop/fade functions.
7. Encode H.264/AAC MP4, persist progress/history, and stream the collision-safe output.

Remotion is used instead of screen recording because it gives deterministic frames, reliable resolution/FPS control, cancellation, and a clean headless path. FFmpeg remains the final encoder and audio muxer. Runtime outputs, uploaded audio, asset cache, and job history live under the ignored `.datapulse/` directory. See [ARCHITECTURE.md](./ARCHITECTURE.md) for boundaries.

## Creating a theme

Add a serializable `VisualizationTheme` to `src/themes/index.ts`. A theme supplies background, typography colors, bar palette, track/grid colors, annotation tokens, and font family. Themes contain no React components and no functions. Existing scene and visualization renderers consume the configuration automatically.

## Adding a visualization

Create a folder in `src/visualizations/<visualization-id>/` with:

- serializable config and derived-state types
- pure validation/normalization helpers if the generic model is insufficient
- a pure `getStateAtFrame` function
- responsive layout calculation
- one renderer used by preview and export
- a `VisualizationDefinition`

Register the definition in `src/visualizations/registry.ts`. The editor should depend on the registry contract, not import visualization internals.

## Adding an event type

Event detection lives in `src/lib/events/` and runs against normalized data. Extend the `StoryEvent` union, return structured metadata from a pure detector, and test the detection boundary. Rendering annotations is a separate concern and should consume those event objects without recalculating the event.

## Roadmap

### Phase 1 — editor and deterministic preview (implemented)

- import, mapping, validation, normalization
- bar chart race visualization plugin
- responsive SVG preview and playback
- content controls and polished theme presets
- aspect-ratio presets and safe areas

### Phase 2 — reusable stories (implemented)

- local project persistence and version migrations
- configuration-only templates
- hook, visualization, final-ranking, and outro scenes
- entity image references, local sample marks, and cache-ready asset identities
- deterministic event annotations and story controls
- shared short-form and long-form scene architecture

### Phase 3 — production export (implemented)

- Remotion composition using the shared renderer
- local render queue and progress events
- FFmpeg MP4 presets
- remote asset download/cache and render-time asset manifest
- uploaded audio, trim, volume, and fades
- export history and retry

### Phase 4 — assisted production

- rule-based hooks and story suggestions
- optional provider-neutral AI adapters
- batch/headless `render-video project.json`
- additional visualization plugins

## Project documentation

The architectural decisions, dependency direction, state ownership, data models, and video pipeline are documented in [ARCHITECTURE.md](./ARCHITECTURE.md).
