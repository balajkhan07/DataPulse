# AGENTS.md

## Project Overview

This project is a data-driven visual content generation platform.

Its purpose is to transform structured datasets into animated visual stories that can be exported as social-media-ready videos.

The first visualization type is a Bar Chart Race, but the architecture MUST NOT be limited to bar chart races.

Future visualization types may include:

- Bar chart races
- Line chart races
- Animated rankings
- Timeline comparisons
- Geographic/map visualizations
- Bubble visualizations
- Counter-based visualizations
- Head-to-head comparisons
- Historical timelines
- Animated leaderboards
- Statistical cards
- Data-story scenes

The system should be designed around a generic visualization engine.

Think of the product as:

DATA
→ VISUALIZATION
→ STORY
→ VIDEO

The primary goal is to make content creation fast, repeatable, visually polished, and easy to automate.

---

# 1. PRIMARY PRODUCT PRINCIPLES

Always optimize for these priorities, in this order:

1. High-quality visual output
2. Smooth deterministic animation
3. Fast content creation workflow
4. Maintainable architecture
5. Reusable rendering logic
6. Reliable video export
7. Good developer experience
8. Performance
9. Extensibility

Do NOT prioritize:

- unnecessary abstractions
- premature microservices
- enterprise features
- billing
- authentication complexity
- SaaS multi-tenancy
- over-engineering

This is initially an internal/personal content-generation tool.

---

# 2. CORE PRODUCT WORKFLOW

The expected workflow is:

Dataset
→ Import
→ Column Mapping
→ Normalization
→ Visualization Configuration
→ Live Preview
→ Story/Event Detection
→ Video Export
→ Final MP4

The target user workflow should eventually take approximately:

5–10 minutes per video

Once a template exists, the ideal workflow is:

Upload dataset
→ Select template
→ Edit title
→ Preview
→ Export

Whenever making a UX or architecture decision, optimize toward this workflow.

---

# 3. TECHNOLOGY STACK

Preferred stack:

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand

## Visualization

Prefer:

- D3 for data calculations/scales/layout logic
- SVG for visualization output where practical
- Canvas only where performance requires it

Do not tightly couple visualization logic to React component state.

## Video Rendering

Preferred:

- Remotion
- FFmpeg where necessary

The browser preview and video renderer MUST share the same rendering/data logic as much as possible.

DO NOT create two separate visualization implementations for:

- browser preview
- exported video

This rule is extremely important.

---

# 4. CRITICAL ARCHITECTURAL RULE

## Never duplicate visualization logic

The preview renderer and final video renderer should consume the same:

- normalized dataset
- timeline state
- animation state
- layout calculations
- theme configuration
- scene configuration
- value formatting
- interpolation logic

Example:

BAD:

PreviewBarChart.tsx
VideoBarChart.tsx

where both independently implement ranking, layout, colors, animation, etc.

GOOD:

BarChartRaceRenderer.tsx

used by:

PreviewPlayer
RemotionComposition

with time/frame passed into the renderer.

Prefer deterministic rendering based on:

render(frame, config, dataset)

rather than hidden internal animation state.

---

# 5. DETERMINISTIC ANIMATION

Animation should preferably be derived from time/frame.

Example:

```ts
const state = getVisualizationState({
  dataset,
  frame,
  fps,
  config
});
```

The renderer should then render that state.

Avoid relying on:

- setTimeout
- setInterval
- non-deterministic CSS transitions
- uncontrolled browser-only animations

for core exported animation behavior.

Why:

The same frame should always render the same visual result.

This is required for reliable video export.

---

# 6. VISUALIZATION PLUGIN ARCHITECTURE

Do NOT hardcode the application around Bar Chart Race.

Create a visualization system such as:

VisualizationDefinition

Example conceptual interface:

```ts
interface VisualizationDefinition {
  id: string;
  name: string;

  validateDataset(...): ValidationResult;

  normalizeDataset(...): NormalizedDataset;

  getStateAtTime(...): VisualizationState;

  render(...): ReactNode;

  getDefaultConfig(...): VisualizationConfig;
}
```

Possible visualization IDs:

- bar-chart-race
- line-race
- leaderboard
- timeline
- bubble-race
- comparison
- map-race

Each visualization should be independently registered.

Example:

```text
visualizations/
  registry.ts

  bar-chart-race/
    index.ts
    schema.ts
    normalization.ts
    interpolation.ts
    layout.ts
    renderer.tsx
    defaults.ts
    events.ts
    types.ts
```

Adding a new visualization should NOT require major changes to the editor.

---

# 7. DATA PIPELINE

Maintain a clear separation between:

RAW DATA

and

NORMALIZED DATA

Pipeline:

Raw Dataset
→ Column Mapping
→ Validation
→ Normalization
→ Interpolation
→ Ranking
→ Visualization State

Never perform large amounts of raw-data processing directly inside React components.

Create dedicated pure functions.

Example:

```text
lib/data/
  parsers/
  validation/
  normalization/
  interpolation/
  formatting/
```

---

# 8. NORMALIZED DATA MODEL

All visualization types should consume normalized data where practical.

Example:

```ts
interface DataPoint {
  time: number | string;
  entityId: string;
  label: string;
  value: number;

  group?: string;
  color?: string;
  image?: string;

  metadata?: Record<string, unknown>;
}
```

Avoid leaking source-specific field names deep into the renderer.

For example:

BAD:

row.market_cap
row.company_name

GOOD:

point.value
point.label

Column mapping should handle the conversion.

---

# 9. CONFIGURATION MUST BE SERIALIZABLE

All major project state must be serializable.

This includes:

- dataset mapping
- visualization type
- visualization configuration
- theme
- video configuration
- timeline configuration
- event settings
- intro/outro configuration
- export settings

Do not place:

- DOM references
- functions
- React elements
- non-serializable objects

inside persistent project configuration.

This is important because later the system may generate projects programmatically.

---

# 10. PROJECT CONFIGURATION

Prefer a model similar to:

```ts
interface Project {
  id: string;
  name: string;

  visualizationType: string;

  dataset: DatasetConfig;

  visualization: VisualizationConfig;

  theme: ThemeConfig;

  video: VideoConfig;

  timeline: TimelineConfig;

  events: EventConfig;

  createdAt: string;
  updatedAt: string;
}
```

Keep versioning in mind.

Example:

```json
{
  "schemaVersion": 1
}
```

This will help migrate old projects later.

---

# 11. VIDEO DIMENSIONS

The visualization renderer must NOT assume a fixed resolution.

Support different aspect ratios.

Examples:

1080x1920
1920x1080
1080x1080
1080x1350

Layout should depend on:

width
height
safeArea
aspectRatio

Never scatter hardcoded pixel values throughout components.

Create layout utilities.

Example:

```ts
const layout = calculateLayout({
  width,
  height,
  itemCount,
  titleEnabled,
  footerEnabled
});
```

---

# 12. RESPONSIVE VIDEO LAYOUT

The video itself must be responsive.

The renderer should prevent:

- label clipping
- values going off screen
- logos overlapping labels
- bars exceeding the viewport
- title overflow
- annotations covering important elements

Prefer measured or calculated layout rules.

Do not fix visual problems with random CSS offsets.

---

# 13. SOCIAL MEDIA SAFE AREAS

Remember that social platforms overlay UI.

For portrait videos, avoid putting critical content too close to:

- bottom edge
- right edge
- top edge

Create safe-area configuration.

Example:

```ts
safeArea: {
  top: 120,
  right: 120,
  bottom: 220,
  left: 80
}
```

Use this during layout calculation.

---

# 14. STATE MANAGEMENT

Use Zustand or another lightweight predictable state store.

Prefer separate logical slices.

Example:

```text
store/
  projectSlice.ts
  datasetSlice.ts
  editorSlice.ts
  playbackSlice.ts
  exportSlice.ts
```

Avoid one giant global store.

Persist project configuration separately from temporary editor state.

For example:

PERSISTENT:

- title
- theme
- dataset mapping

TEMPORARY:

- selected sidebar tab
- current playhead
- hover states
- open dropdowns

Do not save temporary editor state into project files.

---

# 15. REACT COMPONENT RULES

Avoid extremely large components.

If a React component becomes difficult to understand, split it.

As a guideline:

- 50–200 lines is generally reasonable
- 300+ lines should trigger review
- 500+ lines is usually a design smell

Exceptions are acceptable when justified.

Do not create meaningless one-line wrapper components purely to reduce line count.

Split by responsibility.

---

# 16. BUSINESS LOGIC DOES NOT BELONG IN UI COMPONENTS

React components should mostly:

- receive data
- render UI
- dispatch actions

They should NOT implement major business logic such as:

- ranking calculations
- interpolation
- event detection
- dataset normalization
- value scaling

Put those in pure modules.

---

# 17. PURE FUNCTIONS

Prefer pure functions for:

- ranking
- interpolation
- layout
- formatting
- event detection
- timeline calculations

Example:

```ts
getRankingAtTime(data, time)

interpolateDataset(data, progress)

formatValue(value, config)

detectLeadChanges(data)

calculateBarLayout(config)
```

Pure functions are easier to:

- test
- reuse
- render in Remotion
- debug

---

# 18. BAR CHART RACE IMPLEMENTATION

For bar chart races:

At a given frame:

1. Determine timeline time.
2. Find previous and next dataset periods.
3. Interpolate entity values.
4. Rank entities.
5. Select top N.
6. Compute positions.
7. Compute bar widths.
8. Compute labels.
9. Compute enter/exit state.
10. Render.

Do not base rankings on DOM transitions.

Rankings should be calculated from numerical state.

---

# 19. INTERPOLATION

Interpolation should be isolated.

Example:

```ts
interpolateValue(start, end, progress)
```

Entities missing from one side should support configurable behavior.

Examples:

- treat as zero
- carry previous value
- fade out
- fade in

Do not hide this behavior in rendering code.

---

# 20. ANIMATION EASING

Centralize easing.

Example:

```text
lib/animation/easing.ts
```

Support:

- linear
- easeIn
- easeOut
- easeInOut

Default transitions should feel smooth and modern.

Avoid overly exaggerated animation.

---

# 21. TIMELINE MODEL

The visualization should operate on a timeline.

Possible scenes:

Intro
Visualization
Final Leaderboard
Outro

Example:

```ts
interface TimelineScene {
  id: string;
  type: "intro" | "visualization" | "final" | "outro";
  startFrame: number;
  durationFrames: number;
}
```

Do not embed timing constants inside components.

---

# 22. EVENT DETECTION

Story/event detection must be separate from visualization rendering.

Examples:

- leadership change
- rank increase
- rank decrease
- top-N entry
- top-N exit
- milestone crossing
- fastest growth
- biggest decline

Create:

```text
lib/events/
```

Events should return structured objects.

Example:

```ts
interface StoryEvent {
  id: string;
  type: string;

  time: number | string;

  entityIds: string[];

  importance: number;

  title: string;

  metadata?: Record<string, unknown>;
}
```

The renderer decides how to display the event.

---

# 23. THEMES

Themes should contain visual design configuration.

Example:

```ts
interface ThemeConfig {
  id: string;

  background: BackgroundConfig;

  typography: TypographyConfig;

  bars: BarStyleConfig;

  labels: LabelStyleConfig;

  annotations: AnnotationStyleConfig;
}
```

Do not make themes components.

Themes should be configuration objects.

---

# 24. DEFAULT VISUAL QUALITY

Default themes must look polished immediately.

Avoid:

- spreadsheet aesthetics
- overly bright random colors
- heavy gradients everywhere
- excessive shadows
- clutter
- tiny text

Prefer:

- strong typography
- visual hierarchy
- clean spacing
- subtle depth
- smooth animation
- high contrast

The user should be able to export a respectable video without changing settings.

---

# 25. PERFORMANCE

Animation performance matters.

Avoid:

- updating global React state every frame
- unnecessary component re-renders
- recalculating static data every frame
- rebuilding scales repeatedly when unnecessary

Use:

- memoization
- derived data
- pure calculations
- requestAnimationFrame for preview playback
- frame-based rendering for Remotion

Profile before introducing complex optimization.

Do not prematurely convert everything to Canvas.

---

# 26. SVG VS CANVAS

Default to SVG for initial visualization types because:

- text rendering is easier
- positioning is easier
- debugging is easier
- D3 integration is excellent
- export via React/Remotion is straightforward

Move a visualization to Canvas only if profiling proves SVG is a significant bottleneck.

Do not optimize based on assumptions.

---

# 27. VIDEO RENDERING

Video export should be deterministic.

Preferred architecture:

Project
→ Normalized Data
→ Timeline
→ Remotion Composition
→ Frames
→ MP4

The video renderer should not depend on browser interaction state.

Do not attempt to "record the browser screen" as the primary export mechanism.

Actual rendering is preferred.

---

# 28. PREVIEW PLAYER

The editor preview should simulate the exported video as closely as possible.

Preview should provide:

- play
- pause
- restart
- scrub
- playback speed

The preview's playhead should translate to frame/time.

Example:

```ts
currentFrame
```

Do not create an independent animation timeline for preview.

---

# 29. FORMATTING

Centralize number formatting.

Support:

- raw
- integer
- compact
- currency
- percentage
- custom prefix
- custom suffix

Examples:

1200
1,200
1.2K
1.2M
$1.2B
15%

Do not scatter `Intl.NumberFormat` logic throughout the codebase.

---

# 30. DATASET VALIDATION

Validate data before rendering.

Detect:

- missing required columns
- invalid numbers
- duplicate rows
- invalid dates
- empty entities
- unsupported values

Show useful errors.

Do not allow malformed data to fail deep inside rendering logic.

---

# 31. ERROR HANDLING

Errors should be actionable.

BAD:

"Something went wrong."

GOOD:

"14 rows contain invalid values in the `revenue` column."

When possible include:

- column
- row number
- expected type
- actual value

---

# 32. TESTING

Write tests for business logic.

High-priority tests:

- CSV parsing
- JSON parsing
- normalization
- ranking
- interpolation
- timeline
- event detection
- number formatting
- project serialization
- config migration

Do not waste excessive time testing simple presentational markup.

---

# 33. TYPESCRIPT

Use strict TypeScript.

Avoid `any`.

If `any` is required, leave a comment explaining why.

Prefer:

unknown

over:

any

for untrusted external data.

Validate external inputs.

---

# 34. SCHEMA VALIDATION

Use a schema validation library such as Zod.

Validate:

- uploaded data mappings
- project files
- visualization configs
- themes
- export settings

Do not assume persisted JSON is valid.

---

# 35. FILE STRUCTURE

Prefer something like:

```text
src/
  app/

  components/
    editor/
    preview/
    controls/
    timeline/
    layout/

  visualizations/
    registry.ts

    bar-chart-race/
      index.ts
      types.ts
      schema.ts
      defaults.ts
      normalization.ts
      interpolation.ts
      layout.ts
      renderer.tsx
      events.ts

  lib/
    animation/
    data/
    events/
    formatting/
    project/
    timeline/
    export/

  store/

  themes/

  types/

  hooks/

  tests/
```

Do not treat this as mandatory if a better organization becomes obvious.

Maintain separation of responsibility.

---

# 36. IMPORT BOUNDARIES

Avoid circular dependencies.

Recommended dependency direction:

UI
↓
Visualization API
↓
Core visualization logic
↓
Generic libraries

Generic libraries should never import from UI components.

Example:

`lib/data/`

must not import:

`components/editor/`

---

# 37. NAMING

Use descriptive names.

BAD:

data2
tmp
thing
handleStuff

GOOD:

normalizedDataset
rankingAtFrame
calculateEntityPosition
currentTimelineScene

Avoid unnecessary abbreviations.

---

# 38. COMMENTS

Do not comment obvious code.

BAD:

```ts
// Increment i
i++;
```

Use comments to explain:

- architectural decisions
- unusual mathematics
- workarounds
- performance tradeoffs
- browser limitations

---

# 39. DOCUMENTATION

Maintain:

README.md

and:

ARCHITECTURE.md

When making a significant architectural change, update ARCHITECTURE.md.

Document:

- rendering pipeline
- data model
- visualization plugin system
- video rendering
- project persistence
- major tradeoffs

---

# 40. DEVELOPMENT PROCESS

When starting work:

1. Inspect existing repository.
2. Read:
   - AGENTS.md
   - README.md
   - ARCHITECTURE.md
3. Inspect relevant code before modifying it.
4. Form a short implementation plan.
5. Implement.
6. Run checks.
7. Fix failures.
8. Summarize what changed.

Do not blindly create files before inspecting existing architecture.

---

# 41. BEFORE IMPLEMENTING A FEATURE

Before implementing a non-trivial feature, determine:

- where the logic belongs
- whether an abstraction already exists
- whether similar functionality already exists
- whether this affects video rendering
- whether this affects serialization
- whether tests are needed

Avoid parallel duplicate systems.

---

# 42. AFTER IMPLEMENTATION

Run the relevant commands.

Prefer:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Use whatever scripts exist in the repository.

Do not claim a feature works unless checks have been run where practical.

If a check cannot be run, explicitly state why.

---

# 43. DO NOT SILENCE ERRORS

Never fix TypeScript/lint/build errors by blindly:

- disabling lint rules
- adding `@ts-ignore`
- converting everything to `any`
- removing strict typing

Fix the underlying issue.

Exceptions require a clear reason.

---

# 44. DEPENDENCIES

Before installing a dependency:

Ask whether:

- native APIs can solve it cleanly
- an existing dependency already solves it
- the package is maintained
- the package adds substantial bundle weight
- it is compatible with server/client environments

Do not add libraries for trivial functionality.

---

# 45. SERVER VS CLIENT

Be conscious of Next.js server/client boundaries.

Do not mark large portions of the application:

`"use client"`

unless required.

Keep data processing utilities framework-independent.

Video rendering logic should not unnecessarily depend on browser APIs.

---

# 46. SECURITY

Treat uploaded datasets as untrusted input.

Never execute dataset content.

Sanitize where necessary.

Do not allow uploaded filenames or content to control filesystem paths directly.

Validate all imported configuration files.

---

# 47. ASSET HANDLING

Images/logos may originate from remote URLs.

Design asset handling so that later the app can:

- download/cache assets
- store them locally/S3
- reuse them during video rendering

Do not assume remote images will always be available during rendering.

---

# 48. EXPORT RELIABILITY

An exported video is more important than an editor animation.

When choosing between:

A beautiful preview that cannot reliably export

and

A deterministic renderer that exports reliably

choose deterministic export.

Preview should be built around the export model.

---

# 49. USER EXPERIENCE

The editor should feel closer to:

Canva
CapCut
Figma

than:

an admin dashboard.

Avoid excessive:

- forms
- tables
- modal dialogs
- configuration pages

Prefer:

- live preview
- side panels
- sliders
- toggles
- tabs
- direct manipulation where reasonable

---

# 50. DO NOT OVERBUILD

For every feature ask:

Does this help produce better videos faster?

If not, deprioritize it.

Do not build:

- billing
- teams
- permissions
- complex cloud architecture
- analytics dashboards
- marketing pages

unless explicitly requested.

---

# 51. MVP PRIORITY

Until explicitly instructed otherwise, prioritize Phase 1.

Phase 1 includes:

- editor shell
- dataset import
- CSV/JSON parsing
- column mapping
- data normalization
- bar chart race
- timeline playback
- title/subtitle
- value formatting
- themes
- portrait/landscape preview

The Bar Chart Race must be polished before adding many visualization types.

---

# 52. QUALITY OVER FEATURE COUNT

Do not implement five mediocre visualizations.

Implement one excellent visualization first.

The Bar Chart Race should have:

- smooth interpolation
- fluid reordering
- readable typography
- attractive defaults
- responsive layout
- stable ranking
- good handling of entry/exit
- deterministic rendering

Only then expand.

---

# 53. FUTURE AI FEATURES

The architecture may later include AI for:

- title generation
- hook generation
- event summarization
- caption writing
- dataset discovery
- story generation

AI must remain optional.

Core visualization generation should work without an AI provider.

Do not tightly couple the system to a specific LLM.

---

# 54. FUTURE AUTOMATION

Future workflows may include:

Dataset
→ Automatically generate configuration
→ Render video
→ Generate title/caption
→ Upload/schedule

Keep the project model serializable so headless generation is possible.

Do not implement this until requested.

---

# 55. FUTURE BATCH RENDERING

It should eventually be possible to execute something like:

```bash
render-video project.json
```

without opening the editor.

Keep this possibility in mind when designing rendering logic.

---

# 56. CODING AGENT BEHAVIOR

When asked to implement a feature:

Do NOT immediately produce a massive rewrite.

First inspect.

Then make the smallest coherent architectural change.

Do not overwrite good existing code simply because another implementation is possible.

Preserve existing working behavior unless the requested feature requires changing it.

---

# 57. REFACTORING

Refactor when:

- logic is duplicated
- responsibilities are mixed
- testing is difficult
- video and preview rendering diverge
- components become unmaintainable

Do not refactor unrelated code during a focused task unless necessary.

---

# 58. GIT SAFETY

Never:

- delete large parts of the project without clear need
- reset repository history
- force push
- remove user changes
- overwrite environment files

Do not modify secrets.

Avoid touching unrelated files.

---

# 59. ENVIRONMENT VARIABLES

Never commit secrets.

Use `.env.example`.

Document required variables.

Example:

```env
DATABASE_URL=
RENDER_OUTPUT_DIR=
```

Future APIs may include AI providers, S3, etc.

---

# 60. WHEN UNCERTAIN

If a minor technical choice can reasonably be made, choose a sensible option and continue.

Do not block implementation with unnecessary clarification.

Ask the user only when the decision:

- changes the product direction
- creates major cost
- changes core architecture
- requires credentials
- risks data loss

---

# 61. DEFINITION OF DONE

A feature is not done merely because code exists.

It is done when:

- functionality works
- types pass
- lint passes
- relevant tests pass
- build passes where practical
- architecture remains coherent
- preview remains functional
- export compatibility is preserved

---

# 62. FINAL RULE

Always remember:

This is not a chart editor.

It is a visual storytelling engine powered by data.

The architecture should make it possible to turn:

structured data

into:

compelling animated stories

and eventually:

publishable videos

with minimal manual work.


---

# 63. SHORT-FORM AND LONG-FORM ARE BOTH FIRST-CLASS OUTPUTS

The product must NOT be designed as a short-form-only video generator.

It must support both:

## Short-form content

Examples:

- YouTube Shorts
- Instagram Reels
- Facebook Reels
- TikTok

Typical characteristics:

- 9:16 portrait
- approximately 15–90 seconds
- immediate hook
- faster pacing
- fewer scenes
- large text
- strong visual movement
- simple story arc
- optimized for attention and replayability

## Long-form content

Examples:

- YouTube videos
- Facebook long-form videos
- documentary-style data stories
- educational visualizations

Typical characteristics:

- primarily 16:9 landscape
- several minutes or longer
- multiple scenes
- slower pacing where appropriate
- deeper context
- richer storytelling
- annotations
- comparisons
- chapter-like structure
- optional narration / voiceover support
- more deliberate transitions

Short-form and long-form must use the SAME underlying:

- normalized dataset
- visualization system
- theme system
- rendering engine
- event detection
- project model
- timeline model

Do not build separate products or separate rendering systems for each format.

---

# 64. VIDEO MODE

Projects should support a top-level video mode such as:

```ts
type VideoMode =
  | "short-form"
  | "long-form"
  | "custom";
```

Video mode should influence defaults, not artificially limit the user.

For example:

Short-form defaults may use:

- 1080x1920
- faster pacing
- larger typography
- fewer scenes
- shorter intro
- stronger hook

Long-form defaults may use:

- 1920x1080
- longer timeline
- more scenes
- richer annotations
- deeper contextual sections
- optional narration

Custom mode should allow unrestricted configuration.

---

# 65. SCENE-BASED STORY SYSTEM

A project must eventually support multiple scenes rather than treating one visualization as the entire video.

Conceptual example:

```ts
interface StoryScene {
  id: string;
  type: string;
  startFrame: number;
  durationFrames: number;
  config: Record<string, unknown>;
}
```

Possible scene types:

- title
- hook
- visualization
- final-ranking
- comparison
- statistic
- annotation
- image
- text
- historical-context
- transition
- outro

Example long-form project:

```text
Scene 1 — Hook
Scene 2 — Introduction
Scene 3 — Bar chart race: 1995–2005
Scene 4 — Nokia highlight
Scene 5 — Comparison / historical context
Scene 6 — Bar chart race: 2006–2015
Scene 7 — Apple enters / major event
Scene 8 — Modern era
Scene 9 — Final ranking
Scene 10 — Key takeaway / outro
```

The architecture should allow new scene types to be added without rewriting the timeline editor.

---

# 66. ONE PROJECT, MULTIPLE EXPORTS

A single project should be capable of producing different exports.

For example:

```text
Smartphone Brands 1995–2026
```

could generate:

```text
Short:
45-second 9:16 bar chart race

Long:
7-minute 16:9 visual data story

Square:
1:1 social post animation
```

Do not duplicate datasets or core project logic just to create alternate formats.

Where practical, support format-specific scene/timeline variants.

---

# 67. LONG-FORM STORYTELLING REQUIREMENTS

Long-form videos should be capable of including:

- hooks
- title sequence
- introduction
- multiple visualization segments
- important-event pauses
- historical context
- image/logo inserts
- statistic cards
- head-to-head comparisons
- annotations
- final leaderboard
- summary / conclusion
- outro

The goal is NOT to create a 10-minute chart that moves continuously.

The goal is to create structured visual stories using data.

---

# 68. STORY PACING

Pacing must be configurable.

Short-form should generally favor:

- fast transitions
- rapid progression
- minimal downtime
- immediate movement

Long-form should allow:

- pauses
- slower explanation sections
- emphasis on important events
- scene transitions
- narrative breathing room

Do not hardcode one animation speed for all output types.

---

# 69. NARRATION-READY ARCHITECTURE

Long-form support should be compatible with future:

- recorded voiceover
- text-to-speech
- AI narration
- subtitles
- captions

Do not require narration for the MVP.

However, timeline and scene architecture should make it possible to associate narration/caption data with scenes later.

Example:

```ts
interface NarrationTrack {
  sceneId: string;
  text?: string;
  audioAssetId?: string;
  startFrame: number;
  durationFrames: number;
}
```

---

# 70. CONTENT REUSE PRINCIPLE

The system should maximize reuse.

One researched dataset should be capable of producing:

- a short-form video
- a long-form video
- alternate aspect ratios
- multiple visualization styles
- multiple hooks/titles

The product should reduce duplicated creative work.

Think:

ONE DATASET
→ MULTIPLE STORIES
→ MULTIPLE FORMATS
→ MULTIPLE EXPORTS

---

# 71. EXPORT PRESETS

Video export presets should eventually include:

## Short-form

- YouTube Shorts
- Instagram Reels
- Facebook Reels
- TikTok

## Long-form

- YouTube 1080p
- YouTube 1440p
- YouTube 4K where practical
- Facebook landscape

## Other

- Square
- Portrait feed
- Custom dimensions

Presets are defaults only.

The underlying renderer must remain resolution-independent.

---

# 72. PRODUCT IDENTITY

Do not describe or architect this product as:

- a bar chart race generator
- a Shorts generator
- a Reels generator

The product is a:

DATA-DRIVEN VISUAL STORYTELLING AND VIDEO GENERATION PLATFORM.

Bar chart races are the first visualization type.

Short-form videos are one output format.

Long-form visual stories are equally important.

All future architectural decisions should preserve this broader product direction.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
