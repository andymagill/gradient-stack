# Slider Implementation Pattern

## Critical Pattern for Working Sliders

The gradient editor sliders use a specific pattern that MUST be maintained to work correctly:

### The Pattern

\`\`\`tsx
<input
  type="range"
  value={String(gradient.angle)}
  onInput={(e) => onChange({ ...gradient, angle: Number(e.currentTarget.value) })}
/>
\`\`\`

### Why This Works

1. **onInput vs onChange**: `onInput` fires continuously during drag without breaking the interaction
2. **String() conversion**: Range inputs require string values for proper controlled component behavior
3. **Number() conversion**: Parent state expects numeric values for calculations
4. **Immediate updates**: Parent state updates on every input event for real-time preview

### Why Other Patterns Fail

These aren't hypothetical — each one was tried and reverted. If you're about to
reach for one of these to fix a slider bug, don't; the actual fix is almost
always elsewhere (stale `activeLayer` derivation, a missing `key`, etc.).

❌ **Using onChange**: Causes re-renders that interrupt drag interaction

❌ **Using onMouseUp / local state synced on drag-end**: Looks like the
"correct" controlled-component pattern for a range input, and was tried
under the name **Slider Drag Pattern** — keep a local `tempValue` during the
drag, only calling the parent's `onChange` on `onMouseUp`/`onTouchEnd`. It
regressed the exact thing it was meant to fix: because the parent never
learns the value until the drag ends, the label (which reads from parent
state) stays frozen mid-drag, and the preview doesn't update until release.
Delayed sync trades one bug for a worse one — reject any input pattern that
withholds updates until an end-of-drag event, however that end event is
named.

❌ **Not converting to String**: Can cause React to not recognize value changes

### Required Components

1. **Value prop**: Must use `String(gradient.property)` from parent state
2. **onInput handler**: Must update parent immediately with `Number(e.currentTarget.value)`
3. **Label display**: Must read directly from parent state for real-time feedback
4. **No local state**: All state must flow through parent for synchronization

### Testing Checklist

- [ ] Slider drags smoothly without interruption
- [ ] Label updates in real-time during drag
- [ ] Preview updates immediately during drag
- [ ] Value persists after drag completes
- [ ] Multiple sliders can be dragged in sequence
- [ ] Slider works immediately after opening the property editor
- [ ] Slider still works after switching keyframes
- [ ] Slider still works after switching gradient type (linear ↔ radial)

### Common Mistakes to Avoid

1. Adding local state for temporary values during drag
2. Using onChange or other events instead of onInput
3. Not converting between string and number types
4. Reading label values from local state instead of props
5. Debouncing or throttling the input updates

## Root Cause of Past Regressions

This pattern has broken more than once, and not for the same reason each
time. Before touching slider code, understand where the value actually comes
from:

- **`activeLayer` is derived, not stored** — it's `displayLayers[activeLayerIndex]`
  (see `hooks/use-project-editor.ts`), where `displayLayers` is itself either
  a selected keyframe's layers or an interpolated frame from
  `useAnimation.getFrameAtTime`. If that derivation goes stale (e.g. an index
  computed before a re-render, or a memo with a missing dependency), the
  slider's `value` prop reflects an old layer even though `onInput` is firing
  correctly — the drag looks "locked" for a reason that has nothing to do
  with onInput vs onChange.
- **Type coercion must be explicit.** HTML range inputs stringify their value
  internally. Passing a raw number to `value` can cause React to miss a
  change if the stringified forms happen to compare equal; always go through
  `String(...)` on the way in and `Number(...)` on the way out, rather than
  relying on implicit coercion.

## Implementation

See `components/linear-gradient-editor.tsx` and `components/radial-gradient-editor.tsx` for reference implementations.
