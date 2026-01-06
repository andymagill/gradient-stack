"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import type { Layer } from "@/lib/gradient-types"
import { Plus, Trash2, Download, GripVertical, Eye, EyeOff, Copy } from "lucide-react"
import { useState } from "react"

interface LayerManagerProps {
  layers: Layer[]
  activeLayerId?: string | number
  onSelectLayer: (index: number) => void
  onRemoveLayer: (index: number) => void
  onReorderLayers: (fromIndex: number, toIndex: number) => void
  onAddLayer: (layer: Layer) => void
  onExport: () => void
  onUpdateLayer?: (index: number, layer: Layer) => void
  onDuplicateLayer?: (index: number) => void
}

/**
 * LayerManager Component
 *
 * Manages the layer stack with visual feedback and drag-and-drop reordering.
 *
 * LAYOUT: This component has its own background (bg-card/90 backdrop-blur)
 * The parent container in the editor page has NO background.
 * This ensures the preview extends to viewport edges.
 *
 * BUTTON EVENT HANDLING:
 * - Visibility and duplicate buttons MUST use e.stopPropagation() to prevent triggering layer selection
 * - DO NOT use e.preventDefault() as it blocks the button click events
 * - The layer selection button should toggle selection when clicked
 *
 * VISIBILITY TOGGLE LOGIC:
 * - layer.visible can be true, false, or undefined
 * - undefined is treated as true (visible by default)
 * - Toggle logic: layer.visible !== false means "currently visible"
 * - When toggling: set to !currentVisibility where currentVisibility = layer.visible !== false
 * - This ensures consistent behavior: undefined -> false (hide), false -> true (show), true -> false (hide)
 */
export function LayerManager({
  layers,
  activeLayerId,
  onSelectLayer,
  onRemoveLayer,
  onReorderLayers,
  onAddLayer,
  onExport,
  onUpdateLayer,
  onDuplicateLayer,
}: LayerManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorderLayers(draggedIndex, targetIndex)
      setDraggedIndex(targetIndex)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const toggleVisibility = (index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent layer selection, but allow button click
    if (onUpdateLayer) {
      const layer = layers[index]
      const currentVisibility = layer.visible !== false // treat undefined as true
      onUpdateLayer(index, { ...layer, visible: !currentVisibility })
    }
  }

  const duplicateLayer = (index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent layer selection, but allow button click
    if (onDuplicateLayer) {
      onDuplicateLayer(index)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2 bg-card/90 backdrop-blur border border-border rounded-lg">
      <Button
        size="sm"
        variant="outline"
        className="border-border hover:bg-accent bg-transparent gap-2"
        onClick={() => {
          onAddLayer({
            type: "linear",
            angle: 45,
            colorStops: [
              { id: "1", color: "#ef4444ff", position: 0 },
              { id: "2", color: "#fbbf24ff", position: 100 },
            ],
            visible: true,
          })
        }}
        title="Add new layer"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add Layer</span>
      </Button>

      {/* Layer list with drag-and-drop reordering */}
      {layers.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-2 max-h-64 overflow-y-auto">
          {layers.map((layer, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative flex items-center gap-1 p-1 rounded cursor-move transition-colors ${
                draggedIndex === index ? "bg-muted opacity-50" : "hover:bg-accent"
              }`}
            >
              <div className="cursor-grab active:cursor-grabbing shrink-0">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>

              <Button
                size="sm"
                variant={index === activeLayerId ? "default" : "outline"}
                className={`p-2 h-auto shrink-0 flex-1 ${index === activeLayerId ? "bg-primary hover:bg-primary/90" : "border-border hover:bg-accent"}`}
                onClick={() => {
                  if (index === activeLayerId) {
                    onSelectLayer(-1)
                  } else {
                    onSelectLayer(index)
                  }
                }}
                title={`Layer ${index + 1}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {layer.type === "linear" ? "Linear" : layer.type === "radial" ? "Radial" : "Image"}
                </span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="p-1 h-auto shrink-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => toggleVisibility(index, e)}
                title={layer.visible !== false ? "Hide layer" : "Show layer"}
              >
                {layer.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="p-1 h-auto shrink-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => duplicateLayer(index, e)}
                title="Duplicate layer"
              >
                <Copy className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className={`p-1 h-auto shrink-0 ${
                  index === activeLayerId ? "text-muted-foreground hover:text-destructive" : "invisible"
                }`}
                onClick={() => onRemoveLayer(index)}
                title="Delete layer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Export button */}
      <Button
        size="sm"
        variant="outline"
        className="border-t border-border rounded-t-none border-border hover:bg-accent gap-2 bg-transparent mt-auto"
        onClick={onExport}
      >
        <Download className="w-4 h-4" />
        Export
      </Button>
    </div>
  )
}
