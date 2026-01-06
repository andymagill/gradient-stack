# Slider State Management Pattern

## Problem
Sliders were becoming "locked" at their initial values and not responding to user input. This regressed multiple times because the root cause was subtle state synchronization issues.

## Root Cause
The issue stems from the controlled component pattern and parent-child state synchronization:

1. **Stale activeLayer**: `activeLayer` is derived as `displayLayers[activeLayerId]`, which can become out of sync
2. **Delayed parent updates**: When a slider onChange fires, the parent component's state update isn't synchronous
3. **Value prop mismatch**: The controlled input's value prop receives outdated gradient data before parent re-renders
4. **Type coercion issues**: Mixing number and string types for input value prop

## Solution
The pattern requires strict adherence to controlled component best practices:

### CRITICAL: String/Number Conversion Pattern
\`\`\`tsx
// CORRECT: Always use String() for HTML input value
<input
  type="range"
  value={String(gradient.angle)}  // HTML input value must be string
  onChange={(e) => {
    const newAngle = Number(e.target.value)  // Parse back to number
    onChange({ ...gradient, angle: newAngle })
  }}
/>
\`\`\`

### Why This Matters
- HTML input elements always convert values to strings internally
- If you pass a number to `value`, React may not recognize changes properly
- The `Number()` conversion in onChange ensures the callback receives the correct type
- This pattern must be consistent across all slider inputs

### Implementation Checklist
- ✅ Use `String()` for ALL slider input value props
- ✅ Use `Number()` in ALL slider onChange handlers
- ✅ Add explicit type conversions, don't rely on implicit coercion
- ✅ Include comments marking these as CRITICAL to prevent regression
- ✅ Test sliders by dragging immediately after opening property editor
- ✅ Test sliders after switching between keyframes

### What Causes Regressions
- Removing `String()` conversion and using number value directly
- Removing `Number()` conversion in onChange handler
- Adding intermediate state processing in onChange
- Using `parseInt()` or `parseFloat()` instead of `Number()`
- Not testing slider functionality after refactoring

## Testing
- Drag any slider: should move smoothly without freezing at value
- Change value and drag again: should work immediately
- Edit keyframe layers: should maintain slider responsiveness
- Switch between keyframes: should load correct slider values and allow dragging
- Switch between different gradient types: should maintain slider responsiveness

## Related Files
- `components/linear-gradient-editor.tsx` - Position and Angle sliders
- `components/radial-gradient-editor.tsx` - Position X/Y sliders
- `app/editor/[id]/page.tsx` - Parent state management
