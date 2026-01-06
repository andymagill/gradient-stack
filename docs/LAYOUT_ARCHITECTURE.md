# Editor Layout Architecture

## Critical Requirements

This document describes the non-negotiable layout requirements for the editor. These requirements MUST be followed for any changes to the editor layout.

### Requirement 1: Preview Fills Entire Viewport

The PreviewCanvas component MUST:
- Use `fixed` positioning with `inset-0` (top/right/bottom/left all 0)
- Fill 100vw x 100vh (the entire browser viewport)
- Be positioned at `z-0` (background layer)
- This is the PRIMARY content - users must always see their gradient animation

```tsx
// CORRECT - Preview fills entire viewport
<div className="fixed inset-0 z-0">
  <PreviewCanvas ... />
</div>

// WRONG - Preview in page flow
<div className="relative w-full h-screen">
  <PreviewCanvas ... />
</div>
```

### Requirement 2: All Panels Overlay the Preview

ALL panels (header, property editor, layer manager, timeline) MUST:
- Be contained in a single overlay container at `z-10`
- Use `pointer-events-auto` so they're interactive
- Allow the preview to be visible behind/around them

The overlay container MUST:
- Use `fixed inset-0` to match viewport dimensions
- Use `pointer-events-none` with individual panels having `pointer-events-auto`
- Include a spacer element with no pointer-events to allow click-through

### Requirement 3: NO Panel-Level Backgrounds on Container Elements in Editor Page

**CRITICAL: The editor page (`app/editor/[id]/page.tsx`) container elements (header, aside, footer) MUST NOT have backgrounds.**

Backgrounds are handled INSIDE the child components themselves:
- **PropertyEditor**: Has `bg-card/90 backdrop-blur border` on its root div
- **LayerManager**: Has `bg-card/90 backdrop-blur border` on its root div
- **Header buttons/inputs**: Each has `bg-card/80 backdrop-blur`
- **Timeline elements**: Each button/bar/input has `bg-card/80 backdrop-blur`

The header and timeline containers MUST NOT have panel-level backgrounds because they need to allow the preview to show between their child elements.

```tsx
// CORRECT - Editor page containers have NO backgrounds
<header className="pointer-events-auto flex items-center gap-3 p-3 shrink-0">
  {/* NO bg-* class on header - backgrounds on child elements */}
  <Button className="bg-card/80 backdrop-blur">Back</Button>
</header>

<aside className="pointer-events-auto order-2 md:order-1 shrink-0">
  {/* NO bg-* class on aside - PropertyEditor has its own background */}
  <PropertyEditor ... />
</aside>

<footer className="pointer-events-auto mt-auto px-4 py-3 shrink-0">
  {/* NO bg-* class on footer - Timeline child elements have backgrounds */}
  <Timeline ... />
</footer>

// WRONG - Container elements with panel-level backgrounds
<header className="bg-card/95 backdrop-blur border-b">...</header>
<aside className="bg-card/95 backdrop-blur border">...</aside>
<footer className="bg-card/95 backdrop-blur border-t">...</footer>
```

### Requirement 4: Panels Use Flexbox Flow Within Overlay

Within the overlay container, panels MUST:
- Use flexbox layout so they push each other naturally
- Not use absolute positioning relative to each other
- Allow content to scroll when exceeding viewport
- Use `max-w-*` constraints to prevent overflow

```
DESKTOP LAYOUT (main is flex-row):
┌─────────────────────────────────────────────┐
│ [PropertyEditor] │ [spacer] │ [LayerManager]│
└─────────────────────────────────────────────┘
PropertyEditor (max-w-md) pushes LayerManager to the right

MOBILE LAYOUT (main is flex-col):
┌─────────────────────────────────────────────┐
│                    [LayerManager] (self-end)│
├─────────────────────────────────────────────┤
│ [PropertyEditor] (max-w-full)               │
├─────────────────────────────────────────────┤
│ [spacer - click through to preview]         │
└─────────────────────────────────────────────┘
```

## Visual Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 0 (z-0): PreviewCanvas                                │
│ - Fixed position, fills entire viewport (100vw x 100vh)    │
│ - Shows gradient animation edge-to-edge                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ LAYER 1 (z-10): Panel Overlay Container                 │ │
│ │ - Fixed position, fills viewport                        │ │
│ │ - pointer-events-none (click through to preview)        │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ HEADER (no bg) - floating buttons with bg-card/80   │ │ │
│ │ ├─────────────────────────────────────────────────────┤ │ │
│ │ │ MAIN (flex container, p-2 gap-2)                    │ │ │
│ │ │ ┌──────────────┐ ┌───────────┐ ┌──────────────────┐ │ │ │
│ │ │ │PropertyEditor│ │  spacer   │ │   LayerManager   │ │ │ │
│ │ │ │(component bg)│ │(no events)│ │  (component bg)  │ │ │ │
│ │ │ └──────────────┘ └───────────┘ └──────────────────┘ │ │ │
│ │ ├─────────────────────────────────────────────────────┤ │ │
│ │ │ FOOTER (no bg) - Timeline with element-level bgs   │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Background Responsibilities

| Component | Has Panel Background? | Where Backgrounds Live |
|-----------|----------------------|------------------------|
| Header (editor page) | NO | Child buttons/inputs: `bg-card/80` |
| PropertyEditor | YES | Root div: `bg-card/90 backdrop-blur border` |
| LayerManager | YES | Root div: `bg-card/90 backdrop-blur border` |
| Timeline | NO | Child elements: `bg-card/80` |

## Common Mistakes to Avoid

1. **Adding bg-* classes to header/aside/footer in editor page** - Backgrounds belong in components
2. **Using page flow instead of fixed overlay** - Preview would scroll off screen
3. **Adding panel backgrounds to Timeline component root** - Preview won't extend to bottom
4. **Using absolute positioning between panels** - Panels would overlap instead of push
5. **Missing max-width constraints** - Panels could overflow viewport

## Testing Checklist

When modifying the editor layout, verify:

- [ ] Preview gradient is visible edge-to-edge (no solid bars at edges)
- [ ] Header buttons float over preview (gaps show preview)
- [ ] Timeline controls float over preview (gaps show preview)
- [ ] PropertyEditor and LayerManager have contained backgrounds
- [ ] Opening property editor pushes layer manager (doesn't overlap)
- [ ] Clicking spacer area reaches the preview
- [ ] Layout works on both mobile and desktop
- [ ] Scrolling works when content exceeds viewport
- [ ] No horizontal scrollbars appear unexpectedly
