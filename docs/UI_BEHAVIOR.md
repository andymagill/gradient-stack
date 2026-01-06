# Gradient Stack UI Behavior Guide

This document describes the intended behavior and interaction patterns of the Gradient Stack editor UI.

## Editor Layout Architecture

### CRITICAL: Overlay Layout Pattern
The editor uses a two-layer architecture that MUST NOT be changed:

1. **Preview Canvas Layer (Background)** - z-index: 0
   - Fixed position, fills entire viewport
   - Shows the gradient animation
   - Must always be visible behind panels

2. **Panel Overlay Layer** - z-index: 10
   - Fixed position, fills viewport
   - Contains all UI panels (header, property editor, layer manager, timeline)
   - Uses FLEXBOX for panel layout (panels push each other)
   - Panels have semi-transparent backgrounds (`bg-card/95`) so preview shows through
   - `pointer-events-none` on container, `pointer-events-auto` on individual panels

**Desktop Layout (flex-row):**
```
[Property Editor (left)] | [spacer grows] | [Layer Manager (right)]
```
- Property editor pushes layer manager to the right when open

**Mobile Layout (flex-col):**
```
[Layer Manager (top-right aligned)]
[Property Editor (if open)]
[spacer grows]
```

**Timeline:** Always at bottom, full viewport width, inside the overlay container.

**WHY THIS PATTERN:**
- Preview must always be visible as the background
- Panels overlay but use flexbox to push each other naturally
- Spacer element allows click-through to preview
- DO NOT change this to absolute positioning on individual panels
- DO NOT change this to a flow-based layout where preview is in the document flow

## Layer Selection & Editing

### Selecting a Layer
**When:** User clicks a layer in the Layer Manager panel

**Behavior:**
1. If the same layer is already selected → Deselect it (close PropertyEditor)
2. If a different layer is clicked → Select it and open PropertyEditor
3. **Auto-keyframe selection:** If no keyframe is currently selected:
   - Find the keyframe closest to the current playback time
   - Select that keyframe
   - Move playhead to that keyframe's position
   - **Pause playback** (ensures consistent editing state)

**Why:** This ensures users always have a keyframe context when editing layers, preventing confusion about which keyframe they're modifying.

### Adding a New Layer
**When:** User clicks the "+" button in Layer Manager

**Behavior:**
1. New layer is added to **top of the layer stack** (index 0)
2. New layer is **automatically selected**
3. PropertyEditor opens immediately for editing
4. If a keyframe is selected, the layer is added to that keyframe; otherwise to base layers

**Why:** New layers at the top make sense visually (top layer = highest z-index), and auto-selection provides immediate feedback.

### Deleting a Layer
**When:** User clicks the trash icon on a selected layer

**Behavior:**
1. Layer is removed from current context (keyframe or base layers)
2. If only one layer remains, deletion is prevented (minimum 1 layer required)
3. Selected layer state is cleared

**Context Awareness:** Deletion affects either:
- Selected keyframe's layers (if keyframe is selected)
- Base project layers (if no keyframe selected)

## Keyframe Interaction

### Selecting a Keyframe
**When:** User clicks a keyframe marker on the timeline

**Behavior:**
1. Keyframe is selected (highlighted)
2. **Playback pauses** (clicking a keyframe is an editing action)
3. Playhead moves to that keyframe's exact position
4. Layer Manager shows that keyframe's layers
5. Copy/Delete buttons appear below the keyframe marker

**Why:** Pausing on keyframe selection creates a stable editing state. Users expect "clicking to edit" to stop motion.

### Clicking Timeline (not on keyframe)
**When:** User clicks the timeline bar background

**Behavior:**
1. Playhead moves to clicked position
2. Any selected keyframe is **deselected**
3. Layer Manager shows interpolated layers at that time
4. Playback state (playing/paused) is unchanged

**Why:** Clicking empty timeline is for scrubbing/previewing, not editing, so playback shouldn't change.

### Dragging a Keyframe
**When:** User drags a keyframe marker left/right

**Behavior:**
1. Keyframe position updates in real-time
2. Playback continues if already playing (smooth preview)
3. Keyframe remains selected during drag
4. Position snaps to percentage intervals (0-100%)

**Why:** Real-time feedback helps users position keyframes precisely while seeing animation changes.

### Dragging Position Indicator
**When:** User drags the red position indicator (playhead) left/right on the timeline

**Behavior:**
1. Playhead position updates in real-time as user drags
2. Preview canvas shows interpolated frame at current position
3. Any selected keyframe is **deselected** (scrubbing shows interpolation, not discrete keyframe)
4. Playback is **not affected** (paused stays paused, playing stays playing)
5. Works on both desktop (mouse) and mobile (touch) devices

**Visual Feedback:**
- Hover: Indicator scales up slightly (110%)
- Dragging: Indicator scales up significantly (150%)
- Cursor: Shows grab/grabbing cursor states

**Why:** Dragging provides intuitive timeline scrubbing for previewing animation at any point. Deselecting keyframes keeps UI state clean during free-form scrubbing.

## Animation Playback

### Play/Pause Button
**When:** User clicks the play/pause button in Timeline

**Behavior:**
1. Toggles playback state (playing ↔ paused)
2. **Deselects any selected keyframe** (play mode shows interpolation, not discrete keyframe)
3. **Deselects any selected layer** (closes PropertyEditor)
4. Playhead continues from current position

**Why:** Play mode is for previewing the full animation; editing (keyframes/layers) requires pause mode.

### Automatic Pause Triggers
Playback automatically pauses when:
1. User clicks a keyframe marker
2. User selects a layer (via auto-keyframe selection)

**Why:** Editing actions require a stable, non-moving state.

### Timeline Scrubbing While Playing
**When:** User clicks timeline bar while animation is playing

**Behavior:**
1. Playhead jumps to clicked position
2. Animation **continues playing** from new position
3. No keyframe is selected

**Why:** Allows quick preview of different sections without interrupting playback flow.

## Property Editing

### Slider Inputs (CRITICAL)
**Pattern:** All slider inputs use `onInput` event, NOT `onChange`

**Why:**
- `onChange` fires after each value change during drag, causing React re-renders
- Re-renders during drag interrupt the native drag gesture, making sliders appear "locked"
- `onInput` fires during drag but doesn't interrupt the gesture
- Values are always controlled (from props), never use local state during drag

**Implementation:**
```tsx
<input
  type="range"
  value={String(propValue)}  // Always convert to string
  onInput={(e) => onChange(Number(e.target.value))}  // Convert back to number
  // Never use onChange for sliders!
/>
```

**Documentation:** See `docs/SLIDER_IMPLEMENTATION.md` for complete details.

### Color Stop Position
**Both linear and radial gradients** have position sliders for color stops.

**Behavior:**
- Position range: 0-100%
- Uses `onInput` pattern (see above)
- Updates in real-time without interrupting drag
- Label shows current value formatted to 4 decimal places

## Responsive Behavior

### Property Editor Layout
**Desktop (≥640px):**
- Two-column layout: Gradient options | Color options
- Gradient options (left): Type, angle/radius, blend mode, color stop controls
- Color options (right): Color picker, position slider

**Mobile (<640px):**
- Single-column layout: Gradient options → Color options (stacked)
- Full-width controls
- Scrollable if content exceeds viewport

### Delete Button Visibility
**Gallery cards:**
- Mobile/Tablet: Always visible
- Desktop: Visible on hover only

**Layer Manager:**
- Delete button always reserves space (uses `invisible` class)
- Visible only for selected layers
- Prevents layout shift when selection changes

## State Management Flow

```
User Action
    ↓
Component Handler
    ↓
State Update (useState/useAnimation)
    ↓
Auto-save to localStorage
    ↓
Re-render with new state
    ↓
Preview Canvas updates (CSS animation)
```

**Key Points:**
- All state changes flow through React state
- localStorage is write-only (except initial load)
- Preview always reflects current state
- No manual DOM manipulation (except ResizeObserver suppression)

## Error States & Edge Cases

### No Keyframes
- Timeline shows only playhead and play button
- Adding first keyframe creates it at current playback position
- Layer edits affect base layers only

### Single Layer
- Deletion is disabled (minimum 1 layer required)
- Layer Manager shows message if user attempts deletion

### Invalid Project ID
- Redirect to gallery homepage
- Show loading message during check

### Empty Template
- Random template has empty layers array
- Clicking generates fresh random gradient
- Thumbnail uses separate random gradient function

## Design Tokens

All colors use semantic design tokens from `globals.css`:
- Prevents hardcoded color values
- Supports theming
- Ensures consistency across components

**Examples:**
- `bg-background`, `text-foreground`: Main UI
- `bg-card`, `text-card-foreground`: Elevated surfaces
- `bg-muted`, `text-muted-foreground`: Subdued elements
- `bg-primary`, `text-primary-foreground`: Interactive elements
- `border-border`: All borders
- `bg-input`: Form inputs

## Testing Checklist

When making UI changes, verify:
- [ ] Slider inputs use `onInput` (not `onChange`)
- [ ] Selecting layer while playing → pauses playback
- [ ] Clicking keyframe → pauses playback
- [ ] Play button → deselects keyframe and layer
- [ ] Adding layer → adds to top, auto-selects
- [ ] Layer selection without keyframe → selects closest keyframe
- [ ] Delete button space always reserved (layer manager)
- [ ] All colors use design tokens (no hardcoded bg-blue-500, etc.)
- [ ] PropertyEditor layout responsive (2 col → 1 col)
- [ ] Timeline scrubbing → deselects keyframe
- [ ] Position indicator draggable on desktop and mobile
- [ ] Dragging position indicator → deselects keyframe
