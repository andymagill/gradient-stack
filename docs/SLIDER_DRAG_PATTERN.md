# Range Slider Drag Pattern

## Problem
Using onChange on HTML range inputs causes React to re-render during user drag interactions, which resets the slider's internal state and breaks the dragging experience. The slider becomes "locked" at the initial value.

## Solution
Use local component state to track the slider value during dragging, and only sync to the parent on drag completion using onMouseUp and onTouchEnd events.

### Pattern
\`\`\`tsx
const [tempValue, setTempValue] = useState<string>(String(initialValue))

const handleDragEnd = () => {
  const finalValue = Number(tempValue)
  onChange(finalValue)  // Update parent ONLY after drag complete
}

<input
  type="range"
  value={tempValue}
  onChange={(e) => setTempValue(e.target.value)}
  onMouseUp={handleDragEnd}
  onTouchEnd={handleDragEnd}
  className="cursor-pointer"
/>
\`\`\`

### Key Points
- Keep slider value in local state during drag (no parent re-renders)
- Use onChange to update local state without calling parent callback
- Use onMouseUp/onTouchEnd to sync final value to parent
- This prevents React re-renders from interrupting the drag interaction
- Always convert to/from String for HTML input value prop

### Why This Matters
The previous pattern of calling onChange for every drag event caused React to re-render the component, which would reset the range input's internal state. This made the slider feel "stuck" or "locked" at the starting position.
