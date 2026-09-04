"use client"
import { ColorStopSlider } from "./color-stop-slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { LinearGradient, ColorStop } from "@/lib/gradient-types"
import { useState } from "react"

interface LinearGradientEditorProps {
  gradient: LinearGradient
  onChange: (gradient: LinearGradient) => void
}

/**
 * LinearGradientEditor - Editor for linear gradient properties
 *
 * CRITICAL SLIDER PATTERN:
 * - Uses onInput (NOT onChange) to update parent state during drag
 * - onInput fires continuously during slider drag without breaking the interaction
 * - value prop must use String() conversion for proper controlled input behavior
 * - Labels display values directly from gradient props for real-time feedback
 *
 * DO NOT replace onInput with onChange or onMouseUp - this will break real-time updates
 */
export function LinearGradientEditor({ gradient, onChange }: LinearGradientEditorProps) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    gradient.colorStops.length > 0 ? gradient.colorStops[0].id : null,
  )

  const selectedStop = gradient.colorStops.find((stop) => stop.id === selectedStopId)

  const formatValue = (value: number): number => {
    return Math.round(value * 10000) / 10000
  }

  const updateStop = (id: string, updates: Partial<ColorStop>) => {
    onChange({
      ...gradient,
      colorStops: gradient.colorStops.map((stop) => (stop.id === id ? { ...stop, ...updates } : stop)),
    })
  }

  const addColorStop = () => {
    const newStop: ColorStop = {
      id: `stop-${Date.now()}`,
      color: "#666666ff",
      position: 50,
    }
    onChange({ ...gradient, colorStops: [...gradient.colorStops, newStop] })
    setSelectedStopId(newStop.id)
  }

  const removeColorStop = (id: string) => {
    if (gradient.colorStops.length <= 1) return
    const newStops = gradient.colorStops.filter((stop) => stop.id !== id)
    onChange({ ...gradient, colorStops: newStops })
    if (selectedStopId === id) {
      setSelectedStopId(newStops[0]?.id || null)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Left Column: Gradient Options + Stop Controls */}
      <div className="space-y-4 p-4 bg-muted rounded border border-border sm:flex-1 sm:min-w-0">
        <div className="space-y-2">
          <label className="text-sm font-medium">Color Stops</label>
          <div className="relative h-12 rounded border border-border bg-muted overflow-hidden">
            {/* Gradient preview */}
            <div
              className="absolute inset-0"
              style={{
                // Sort a copy — Array.prototype.sort mutates in place, and
                // gradient.colorStops is live project state; sorting it
                // during render would reorder it out from under the stop
                // markers rendered just below, which read the unsorted array.
                background: `linear-gradient(90deg, ${[...gradient.colorStops]
                  .sort((a, b) => a.position - b.position)
                  .map((stop) => `${stop.color} ${stop.position}%`)
                  .join(", ")})`,
              }}
            />

            {/* Stop markers */}
            {gradient.colorStops.map((stop) => (
              <button
                key={stop.id}
                onClick={() => setSelectedStopId(stop.id)}
                className={`absolute w-6 h-6 rounded-full border-2 -translate-x-1/2 top-1/2 -translate-y-1/2 transition-all ${
                  selectedStopId === stop.id ? "border-foreground scale-125" : "border-muted-foreground hover:scale-110"
                }`}
                style={{
                  left: `${stop.position}%`,
                  backgroundColor: stop.color,
                }}
              />
            ))}
          </div>
        </div>

        {selectedStop && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Position: {formatValue(selectedStop.position)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={String(selectedStop.position)}
                onInput={(e) => updateStop(selectedStop.id, { position: Number(e.currentTarget.value) })}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={addColorStop}>
                Add Stop
              </Button>
              {gradient.colorStops.length > 1 && (
                <Button size="sm" variant="destructive" onClick={() => removeColorStop(selectedStop.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Blend Mode</label>
          <Select
            value={gradient.blendMode || "normal"}
            onValueChange={(value) => onChange({ ...gradient, blendMode: value })}
          >
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="multiply">Multiply</SelectItem>
              <SelectItem value="screen">Screen</SelectItem>
              <SelectItem value="overlay">Overlay</SelectItem>
              <SelectItem value="darken">Darken</SelectItem>
              <SelectItem value="lighten">Lighten</SelectItem>
              <SelectItem value="color-dodge">Color Dodge</SelectItem>
              <SelectItem value="color-burn">Color Burn</SelectItem>
              <SelectItem value="hard-light">Hard Light</SelectItem>
              <SelectItem value="soft-light">Soft Light</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right Column: Color Options + Angle */}
      {selectedStop && (
        <div className="space-y-4 p-4 bg-muted rounded border border-border sm:flex-1 sm:min-w-0">
          <div className="space-y-2">
            <label className="text-sm font-medium">Angle: {formatValue(gradient.angle)}°</label>
            <input
              type="range"
              min="0"
              max="360"
              step="0.1"
              value={String(gradient.angle)}
              onInput={(e) => onChange({ ...gradient, angle: Number(e.currentTarget.value) })}
              className="w-full cursor-pointer"
            />
          </div>

          <ColorStopSlider colorStop={selectedStop} onChange={(updates) => updateStop(selectedStop.id, updates)} />
        </div>
      )}
    </div>
  )
}
