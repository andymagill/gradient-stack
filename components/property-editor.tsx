"use client"

import { LinearGradientEditor } from "./linear-gradient-editor"
import { RadialGradientEditor } from "./radial-gradient-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { Layer, URLLayer, LinearGradient, RadialGradient } from "@/lib/gradient-types"

interface PropertyEditorProps {
  layer: Layer | undefined
  onChange: (layer: Layer) => void
  onClose?: () => void
}

/**
 * PropertyEditor - Layer type switching and property editing
 *
 * LAYOUT: This component has its own background (bg-card/90 backdrop-blur)
 * The parent container in the editor page has NO background.
 * This ensures the preview extends to viewport edges.
 *
 * HEIGHT BEHAVIOR:
 * - Mobile: No height constraints, sizes to content
 * - Desktop: Uses h-full to fill available space between header and timeline
 */
export function PropertyEditor({ layer, onChange, onClose }: PropertyEditorProps) {
  const handleTypeChange = (value: string) => {
    if (!layer) return

    // Switching a layer's type keeps its slot/id — only the shape changes.
    if (value === "linear") {
      const linearGradient: LinearGradient = {
        type: "linear",
        id: layer.id,
        angle: 0,
        colorStops: [
          { id: "1", color: "#000000ff", position: 0 },
          { id: "2", color: "#ffffffff", position: 100 },
        ],
        blendMode: "blendMode" in layer ? layer.blendMode : "normal",
      }
      onChange(linearGradient)
    } else if (value === "radial") {
      const radialGradient: RadialGradient = {
        type: "radial",
        id: layer.id,
        shape: "circle",
        sizeType: "farthest-corner",
        positionX: 50,
        positionY: 50,
        colorStops:
          "colorStops" in layer
            ? layer.colorStops
            : [
                { id: "1", color: "#000000ff", position: 0 },
                { id: "2", color: "#ffffffff", position: 100 },
              ],
        blendMode: "blendMode" in layer ? layer.blendMode : "normal",
      }
      onChange(radialGradient)
    } else if (value === "url") {
      const imageLayer: URLLayer = {
        type: "url",
        id: layer.id,
        url: "",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: { x: 50, y: 50 },
        blendMode: "blendMode" in layer ? layer.blendMode : "normal",
      }
      onChange(imageLayer)
    }
  }

  return (
    <div className="flex flex-col md:h-full md:max-w-xs lg:max-w-sm bg-card/90 backdrop-blur border border-border rounded-lg overflow-hidden select-none">
      {!layer ? (
        <div className="flex items-center justify-center h-full p-4">
          <p className="text-muted-foreground text-center text-sm">Select a layer to edit</p>
        </div>
      ) : (
        <>
          {/* Header with type selector and close button */}
          <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
            <Select value={layer.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="border-0 bg-transparent shadow-none font-semibold text-base p-0 h-auto focus:ring-0 w-auto gap-2">
                <SelectValue>
                  {layer.type === "linear" && "Linear Gradient"}
                  {layer.type === "radial" && "Radial Gradient"}
                  {layer.type === "url" && "Image Layer"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear Gradient</SelectItem>
                <SelectItem value="radial">Radial Gradient</SelectItem>
                <SelectItem value="url">Image Layer</SelectItem>
              </SelectContent>
            </Select>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Content area - scrollable */}
          <div className="flex-1 overflow-y-auto p-3">
            {layer.type === "linear" && <LinearGradientEditor gradient={layer} onChange={onChange} />}
            {layer.type === "radial" && <RadialGradientEditor gradient={layer} onChange={onChange} />}
            {layer.type === "url" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={(layer as URLLayer).url}
                    onChange={(e) => onChange({ ...layer, url: e.target.value } as URLLayer)}
                    className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Size Mode</label>
                    <select
                      value={(layer as URLLayer).backgroundSize}
                      onChange={(e) => onChange({ ...layer, backgroundSize: e.target.value as any } as URLLayer)}
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground"
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Repeat</label>
                    <select
                      value={(layer as URLLayer).backgroundRepeat}
                      onChange={(e) => onChange({ ...layer, backgroundRepeat: e.target.value as any } as URLLayer)}
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground"
                    >
                      <option value="no-repeat">No Repeat</option>
                      <option value="repeat">Repeat</option>
                      <option value="repeat-x">Repeat X</option>
                      <option value="repeat-y">Repeat Y</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
