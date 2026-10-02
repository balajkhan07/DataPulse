# DataPulse

DataPulse is a private visual-storytelling studio for turning structured datasets into deterministic, social-media-ready animations. Phase 1 ships a working bar chart race editor with import, mapping, validation, responsive preview, five themes, and frame-based playback.

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
- Pure story-event detection primitives for the next editor phase

Project saving, reusable user templates, intro/outro scenes, audio, and MP4 export belong to the next planned phases and are not presented as completed functionality.

## Setup

Requires Node.js 20.9 or newer.

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

`BarChartRaceRenderer` receives only serializable configuration plus derived state. Ranking, easing, interpolation, and layout remain outside the component. D3 supplies the SVG value scale; React produces the shared SVG tree. This makes any frame reproducible and keeps the renderer suitable for both live preview and future Remotion composition.

## Video export architecture

The recommended Phase 3 path is Remotion with server-side FFmpeg encoding:

1. Validate a versioned project JSON document.
2. Load/cache any remote assets.
3. Feed the normalized dataset and project configuration into the same visualization definition used by preview.
4. Pass Remotion's current frame into `getStateAtFrame`.
5. Render the same `BarChartRaceRenderer` SVG tree.
6. Encode H.264/AAC MP4 with platform presets and stream progress back to the editor.

Remotion is preferred over screen recording because it gives deterministic frames, reliable resolution/FPS control, and a clean headless path. FFmpeg remains the final encoder and audio muxer. See [ARCHITECTURE.md](./ARCHITECTURE.md) for boundaries and the render-worker plan.

## Creating a theme

Add a serializable `VisualizationTheme` to `src/themes/index.ts`. A theme supplies background, typography colors, bar palette, track/grid colors, and font family. Themes contain no React components and no functions. The existing renderer consumes the configuration automatically.

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

### Phase 2 — reusable stories

- local project persistence and version migrations
- saved templates
- intro, visualization, final-ranking, and outro scenes
- entity asset cache and logos
- event annotations and event-review UI

### Phase 3 — production export

- Remotion composition using the shared renderer
- local render queue and progress events
- FFmpeg MP4 presets
- uploaded audio, trim, volume, and fades
- export history and retry

### Phase 4 — assisted production

- rule-based hooks and story suggestions
- optional provider-neutral AI adapters
- batch/headless `render-video project.json`
- additional visualization plugins

## Project documentation

The architectural decisions, dependency direction, state ownership, data models, and video pipeline are documented in [ARCHITECTURE.md](./ARCHITECTURE.md).
