# Slider Implementation Pattern

## Critical Pattern for Working Sliders

The gradient editor sliders use a specific pattern that MUST be maintained to work correctly:

### The Pattern

```tsx
<input
  type="range"
  value={String(gradient.angle)}
  onInput={(e) => onChange({ ...gradient, angle: Number(e.currentTarget.value) })}
/>
```

### Why This Works

1. **onInput vs onChange**: `onInput` fires continuously during drag without breaking the interaction
2. **String() conversion**: Range inputs require string values for proper controlled component behavior
3. **Number() conversion**: Parent state expects numeric values for calculations
4. **Immediate updates**: Parent state updates on every input event for real-time preview

### Why Other Patterns Fail

❌ **Using onChange**: Causes re-renders that interrupt drag interaction
❌ **Using onMouseUp**: Delays updates until drag ends, breaking real-time preview
❌ **Local state with delayed sync**: Creates stale values and broken label displays
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

### Common Mistakes to Avoid

1. Adding local state for temporary values during drag
2. Using onChange or other events instead of onInput
3. Not converting between string and number types
4. Reading label values from local state instead of props
5. Debouncing or throttling the input updates

## Implementation

See `components/linear-gradient-editor.tsx` and `components/radial-gradient-editor.tsx` for reference implementations.
