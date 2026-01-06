# Gradient Stack Architecture

## Overview

Gradient Stack is a CSS gradient animation tool built with Next.js App Router. It enables users to create, edit, and export animated CSS gradients using @keyframes and CSS custom properties for smooth interpolation.

## Core Principles

1. **CSS-First Animation**: All animations use CSS @keyframes with CSS custom properties (@property). No JavaScript animation loops in the exported output.
2. **Preview = Export**: The preview canvas uses identical CSS as the exported HTML, ensuring WYSIWYG behavior.
3. **Keyframe-Based Editing**: Users define keyframes at timeline positions; the system interpolates between them.

## Directory Structure

\`\`\`
├── app/
│   ├── page.tsx              # Gallery homepage
│   ├── editor/[id]/page.tsx  # Project editor
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Design tokens and global styles
├── components/
│   ├── preview-canvas.tsx    # Renders CSS animation preview
│   ├── timeline.tsx          # Keyframe timeline with scrubbing
│   ├── layer-manager.tsx     # Layer stack management
│   ├── property-editor.tsx   # Layer type switcher and editing
│   ├── linear-gradient-editor.tsx
│   ├── radial-gradient-editor.tsx
│   ├── color-stop-slider.tsx
│   ├── css-export-dialog.tsx
│   └── project-gallery.tsx   # Gallery grid display
├── hooks/
│   └── use-animation.ts      # Animation playback and interpolation
├── lib/
│   ├── gradient-types.ts     # TypeScript interfaces
│   ├── gradient-compiler.ts  # CSS generation
│   ├── project-storage.ts    # localStorage management
│   └── color-utils.ts        # Color conversion utilities
└── docs/
    ├── SPECIFICATION.md      # Original spec
    └── ARCHITECTURE.md       # This file
\`\`\`

## Data Flow

\`\`\`
ProjectState
     │
     ├─► PreviewCanvas (renders CSS animation)
     │
     ├─► LayerManager (displays layer stack)
     │
     ├─► PropertyEditor (edits selected layer)
     │
     └─► Timeline (manages keyframes)
           │
           └─► useAnimation hook (playback, interpolation)
\`\`\`

## Key Components

### PreviewCanvas
Renders the gradient animation using the exact same CSS that will be exported:
- Injects @property declarations for CSS variable interpolation
- Uses animation-delay for timeline scrubbing (always paused)
- Negative delay values position the animation at the correct frame

### Timeline
Controls animation playback and keyframe management:
- Scrubbing via click/drag updates playbackTime
- Keyframe thumbnails show gradient preview
- Selected keyframe editing updates that keyframe's layers

### GradientCompiler
Generates all CSS output:
- `compileBackgroundCSSWithVariables()`: Creates background with CSS variables
- `generateKeyframesCSS()`: Creates @keyframes rule
- `generatePropertyDeclarations()`: Creates @property rules for interpolation
- `generateFullCSS()`: Combines all for export

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

## Storage

Projects are stored in localStorage with two keys:
- `gradient-stack-projects-list`: Array of project metadata
- `gradient-stack-project-{id}`: Individual project data

Templates are predefined in `project-storage.ts` and identified by `template-` prefix.

## Design Tokens

All UI colors use semantic design tokens from `globals.css`:
- `--background`, `--foreground`: Main surfaces
- `--card`, `--card-foreground`: Elevated surfaces
- `--muted`, `--muted-foreground`: Subdued elements
- `--primary`, `--accent`: Interactive elements
- `--border`, `--input`: Form elements

## Future Enhancements

1. **Database Storage**: Replace localStorage with Supabase/Neon
2. **User Accounts**: Save projects across devices
3. **Sharing**: Public URLs for gradient stacks
4. **More Layer Types**: Conic gradients, SVG patterns
5. **Easing Curves**: Per-property easing functions
