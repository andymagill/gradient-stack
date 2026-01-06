"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ColorStop } from "@/lib/gradient-types"
import { useState } from "react"

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

  const handleColorInputChange = (newValue: string) => {
    setEditingColor(newValue)
  }

  const handleColorInputBlur = () => {
    if (!editingColor) return

    const val = editingColor.toUpperCase()
    if (val.match(/^#[0-9A-F]{6}([0-9A-F]{2})?$/)) {
      // Already valid format
      onChange({ color: val })
    } else if (val.match(/^#[0-9A-F]{6}$/)) {
      // 6-digit hex - auto-append full opacity
      onChange({ color: val + "FF" })
    }
    // If invalid, just discard the edit and reset
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
        onClick={() => {
          const randomColor =
            "#" +
            Math.floor(Math.random() * 16777215)
              .toString(16)
              .padStart(6, "0") +
            "ff"
          onChange({ color: randomColor.toUpperCase() })
        }}
        title="Randomize color"
      >
        Random Color
      </Button>
    </div>
  )
}
