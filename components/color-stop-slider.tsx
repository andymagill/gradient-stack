"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ColorStop } from "@/lib/gradient-types"
import { isValidHexColor, randomColor } from "@/lib/color-utils"
import { useEffect, useState } from "react"

interface ColorStopSliderProps {
  colorStop: ColorStop
  onChange: (updates: Partial<ColorStop>) => void
}

/**
 * ColorStopSlider - Simplified color-only editor for a single color stop
 * Used in the right column of gradient editors
 * Only shows color picker and hex input - position controls are in the left column
 */
export function ColorStopSlider({ colorStop, onChange }: ColorStopSliderProps) {
  const [editingColor, setEditingColor] = useState<string | null>(null)

  // Discard any in-progress hex edit when a different stop is selected, so a
  // half-typed value from the previous stop can't linger and appear "stuck"
  // on the newly selected one.
  useEffect(() => {
    setEditingColor(null)
  }, [colorStop.id])

  const handleColorInputChange = (newValue: string) => {
    setEditingColor(newValue)
  }

  const handleColorInputBlur = () => {
    if (editingColor === null) return

    const trimmed = editingColor.trim()
    if (isValidHexColor(trimmed)) {
      // 6-digit hex has no alpha channel — normalize to 8-digit, full opacity.
      const normalized = trimmed.length === 7 ? `${trimmed}FF` : trimmed
      onChange({ color: normalized.toUpperCase() })
    }
    // Invalid input is discarded. Clearing editingColor (rather than leaving
    // it as the invalid string) reverts the field to colorStop.color, which
    // still reflects the last-committed value.
    setEditingColor(null)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Color (RGBA)</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={colorStop.color.substring(0, 7)}
            onChange={(e) => {
              const currentAlpha = colorStop.color.length === 9 ? colorStop.color.substring(7) : "ff"
              onChange({ color: e.target.value + currentAlpha })
            }}
            className="w-12 h-10 rounded cursor-pointer flex-shrink-0"
          />
          <Input
            value={editingColor !== null ? editingColor : colorStop.color}
            onChange={(e) => handleColorInputChange(e.target.value)}
            onBlur={handleColorInputBlur}
            placeholder="#000000FF"
            className="flex-1 bg-input text-foreground border-border text-sm font-mono"
          />
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full bg-transparent"
        onClick={() => onChange({ color: randomColor() })}
        title="Randomize color"
      >
        Random Color
      </Button>
    </div>
  )
}
