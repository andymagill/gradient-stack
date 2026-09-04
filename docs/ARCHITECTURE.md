# Gradient Stack Architecture

## Overview

Gradient Stack is a CSS gradient animation tool built with Next.js App Router. It enables users to create, edit, and export animated CSS gradients using @keyframes and CSS custom properties for smooth interpolation.

## Core Principles

1. **CSS-First Animation**: All animations use CSS @keyframes with CSS custom properties (@property). No JavaScript animation loops in the exported output.
2. **Preview = Export**: The preview canvas uses identical CSS as the exported HTML, ensuring WYSIWYG behavior.
3. **Keyframe-Based Editing**: Users define keyframes at timeline positions; the system interpolates between them.

## Entry Points

- **`app/page.tsx`** — the gallery homepage (`/`). Server component that
  renders `ProjectGallery`, which lists saved projects and templates.
- **`app/editor/[id]/page.tsx`** — the editor (`/editor/[id]`). Client
  component; `[id]` is either a saved project id or a `template-*` id (see
  Templates below). This file is layout only — all state lives in
  `useProjectEditor`.

## Directory Structure

\`\`\`
├── app/
│   ├── page.tsx              # Gallery homepage (entry point)
│   ├── editor/[id]/page.tsx  # Project editor (entry point) — layout only
│   ├── layout.tsx            # Root layout: fonts, theme provider, metadata
│   └── globals.css           # Design tokens (Tailwind v4 @theme) and global styles
├── components/
│   ├── preview-canvas.tsx    # Renders CSS animation preview
│   ├── timeline.tsx          # Keyframe timeline with scrubbing
│   ├── layer-manager.tsx     # Layer stack management (add/remove/reorder/duplicate)
│   ├── property-editor.tsx   # Layer type switcher and property editing
│   ├── linear-gradient-editor.tsx
│   ├── radial-gradient-editor.tsx
│   ├── color-stop-slider.tsx # Color-only editor for a single stop
│   ├── css-export-dialog.tsx # CSS/HTML export UI
│   ├── project-gallery.tsx   # Gallery grid display
│   ├── layout-wrapper.tsx    # Wraps the app in next-themes' ThemeProvider
│   └── ui/                   # shadcn/ui primitives (button, card, dialog, input, select)
├── hooks/
│   ├── use-project-editor.ts # Owns a single project's edit session: load
│   │                         # (forking templates first), debounced autosave,
│   │                         # layer CRUD, name editing, selection state.
│   │                         # Composes useAnimation. Everything the editor
│   │                         # page needs that ISN'T layout lives here.
│   └── use-animation.ts      # Playback (rAF loop), keyframe CRUD, and
│                             # JS-side interpolation for scrubbing
├── lib/
│   ├── gradient-types.ts     # TypeScript interfaces for the whole domain model
│   ├── gradient-compiler.ts  # ProjectState/Layer → CSS string generation
│   ├── project-storage.ts    # localStorage CRUD (pure persistence, no template data)
│   ├── templates.ts          # Template presets + random-template generation
│   └── color-utils.ts        # Hex/RGBA conversion, interpolation, validation
└── docs/
    ├── SPECIFICATION.md         # Original spec
    ├── ARCHITECTURE.md          # This file
    ├── LAYOUT_ARCHITECTURE.md   # Non-negotiable editor overlay layout rules
    ├── UI_BEHAVIOR.md           # Interaction behavior reference
    ├── SLIDER_IMPLEMENTATION.md # The onInput slider pattern, and why alternatives failed
    └── CSS_BEST_PRACTICES.md    # Mobile viewport height (dvh) conventions
\`\`\`

## Data Flow

\`\`\`
ProjectState (in useProjectEditor)
     │
     ├─► useAnimation (playback, keyframe CRUD, JS interpolation for scrubbing)
     │
     ├─► displayLayers = selected keyframe's layers, or the interpolated
     │   frame at the current playback time
     │
     ├─► PreviewCanvas (renders CSS animation from the full ProjectState)
     ├─► LayerManager (displays displayLayers as the layer stack)
     ├─► PropertyEditor (edits displayLayers[activeLayerIndex])
     └─► Timeline (manages keyframes, playback, scrubbing)
\`\`\`

`useProjectEditor` is the single owner of `ProjectState`. Every mutation —
from a slider drag to a keyframe drag to a layer reorder — flows through one
of its exposed functions, which update `ProjectState` and let the debounced
autosave effect persist it. No component holds its own copy of project data;
`displayLayers` and `activeLayer` are derived on every render, never stored.

## Key Components

### useProjectEditor (hooks/use-project-editor.ts)
Owns the edit session for one project:
- **Load**: resolves `projectId` from storage. A `template-*` id is forked
  into a brand-new saved project first (see Templates below) — the hook
  never edits a template id directly.
- **Autosave**: debounced ~300ms so a slider drag produces one write, not
  one per animation frame.
- **Layer operations**: add/remove/reorder/duplicate/replace, each aware of
  whether a keyframe is currently selected (edits go to the keyframe's
  layers) or not (edits go to the project's base layers).
- **Selection**: `handleSelectLayer` auto-selects the nearest keyframe when
  none is selected, so an edit always has somewhere durable to land (editing
  the interpolated-at-playback-time frame would otherwise be lost the
  instant playback moved on).

### useAnimation (hooks/use-animation.ts)
Manages playback and keyframes, independent of layout:
- `requestAnimationFrame` loop drives `playbackTime` while playing.
- `getFrameAtTime` interpolates between the two keyframes surrounding a given
  time, for JS-side scrubbing/editing feedback.
- Accepts `project: ProjectState | null` so it can be called unconditionally
  before the project has loaded (React hooks can't be called conditionally).

### PreviewCanvas
Renders the gradient animation using the exact same CSS that will be exported:
- Injects @property declarations for CSS variable interpolation
- Uses animation-delay for timeline scrubbing (always paused)
- Negative delay values position the animation at the correct frame

### Timeline
Controls animation playback and keyframe management:
- Scrubbing via click/drag updates playbackTime
- Keyframe thumbnails show a gradient preview built from each layer's first color stop
- Selected keyframe editing updates that keyframe's layers

### GradientCompiler (lib/gradient-compiler.ts)
Generates all CSS output:
- `getVisibleLayers()`: the single source of truth for "which layers render"
  — every function below routes through it so CSS variable indices can never
  desync between what's declared (`@property`) and what's used (`background`).
- `compileBackgroundCSSWithVariables()`: Creates background with CSS variables
- `generateKeyframesCSS()`: Creates @keyframes rule
- `generatePropertyDeclarations()`: Creates @property rules for interpolation
- `generateFullCSS()`: Combines all of the above for export

## Animation System

### How Interpolation Works

1. **CSS Variables**: Each animatable property (colors, angles, positions) is a CSS variable
2. **@property Registration**: Browser knows the type for interpolation:
   \`\`\`css
   @property --gradient-l0-c0 {
     syntax: "<color>";
     initial-value: #ff0000;
     inherits: false;
   }
   \`\`\`
3. **@keyframes**: Define variable values at each timeline position
4. **Animation Scrubbing**: `animation-delay: -${time}ms` with `animation-play-state: paused`

### Supported Properties
- Linear gradient: angle, color stops
- Radial gradient: positionX, positionY, color stops
- URL/image layers are not animated between keyframes (no interpolatable numeric properties)

## Storage

Projects are stored in localStorage (`lib/project-storage.ts`) with two keys:
- `gradient-stack-projects-list`: Array of project metadata
- `gradient-stack-project-{id}`: Individual project data

All writes are guarded (`typeof window`) and wrapped in try/catch, returning
`false` on failure (e.g. quota exceeded) rather than throwing — the editor
must stay usable even if a save fails.

### Templates

Template presets live in `lib/templates.ts`, identified by a `template-`
prefix on their id, and are never written to storage as-is. Opening one
forks it into a real project with a fresh id
(`createProjectFromTemplate`) before the editor starts autosaving —
`loadProject()` intentionally refuses to resolve a `template-*` id, so an
edited template can never be silently overwritten by the pristine version on
next load.

## Design Tokens

All UI colors use semantic design tokens from `app/globals.css`:
- `--background`, `--foreground`: Main surfaces
- `--card`, `--card-foreground`: Elevated surfaces
- `--muted`, `--muted-foreground`: Subdued elements
- `--primary`, `--accent`: Interactive elements
- `--border`, `--input`: Form elements

**Known issue**: `layout-wrapper.tsx` sets `defaultTheme="dark"`, so the
`.dark` block always wins over `:root`'s tuned "Gradient Stack" palette —
`:root`'s values are effectively dead. This wasn't addressed as part of the
Fix/Clean/Document pass since it's a visual design decision, not a defect;
flagging it here for whoever picks up the design system next.

## Future Enhancements

1. **Database Storage**: Replace localStorage with Supabase/Neon
2. **User Accounts**: Save projects across devices
3. **Sharing**: Public URLs for gradient stacks
4. **More Layer Types**: Conic gradients, SVG patterns
5. **Easing Curves**: Per-property easing functions
