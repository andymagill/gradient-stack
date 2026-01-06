"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Keyframe, AnimationConfig } from "@/lib/gradient-types"
import { Plus, Play, Pause } from "lucide-react"
import { useState, useRef } from "react"

interface TimelineProps {
  keyframes: Keyframe[]
  animationConfig?: AnimationConfig
  playbackTime: number
  selectedKeyframeId: string | null
  isPlaying: boolean
  onTimeChange: (time: number) => void
  onAddKeyframe: (position: number) => void
  onCopyKeyframe: (keyframeId: string) => void
  onRemoveKeyframe: (keyframeId: string) => void
  onUpdateKeyframe: (keyframeId: string, updates: Partial<Keyframe>) => void
  onSelectKeyframe: (keyframeId: string | null) => void
  onAnimationConfigChange: (config: Partial<AnimationConfig>) => void
  onPlayToggle: () => void
  onDeselectLayer?: () => void
}

/**
 * Timeline Component
 * Manages animation playback, keyframe selection, and timeline scrubbing
 *
 * LAYOUT: This component has NO panel-level background.
 * Individual child elements (buttons, timeline bar, duration input) have their own backgrounds.
 * This ensures the preview extends to the bottom edge of the viewport.
 */
export function Timeline({
  keyframes,
  animationConfig,
  playbackTime,
  selectedKeyframeId,
  isPlaying,
  onTimeChange,
  onAddKeyframe,
  onCopyKeyframe,
  onRemoveKeyframe,
  onUpdateKeyframe,
  onSelectKeyframe,
  onAnimationConfigChange,
  onPlayToggle,
  onDeselectLayer,
}: TimelineProps) {
  const duration = animationConfig?.duration || 3000
  const timelinePosition = (playbackTime / duration) * 100
  const [draggingKeyframeId, setDraggingKeyframeId] = useState<string | null>(null)
  const [draggingPosition, setDraggingPosition] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  const calculatePosition = (clientX: number): number => {
    if (!timelineRef.current) return 0
    const rect = timelineRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    return Math.max(0, Math.min(100, (x / rect.width) * 100))
  }

  const handleKeyframeDragStart = (e: React.MouseEvent, keyframeId: string) => {
    e.preventDefault()
    setDraggingKeyframeId(keyframeId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingPosition) {
      const percent = calculatePosition(e.clientX)
      onTimeChange((percent / 100) * duration)
      return
    }

    if (!draggingKeyframeId) return
    const percent = calculatePosition(e.clientX)
    onUpdateKeyframe(draggingKeyframeId, { position: percent })
  }

  const handleMouseUp = () => {
    setDraggingKeyframeId(null)
    setDraggingPosition(false)
  }

  const handleKeyframeTouchStart = (e: React.TouchEvent, keyframeId: string) => {
    e.preventDefault() // Prevent scrolling while dragging
    e.stopPropagation()
    setDraggingKeyframeId(keyframeId)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return
    const touch = e.touches[0]
    const percent = calculatePosition(touch.clientX)

    if (draggingPosition) {
      onTimeChange((percent / 100) * duration)
      return
    }

    if (!draggingKeyframeId) return
    onUpdateKeyframe(draggingKeyframeId, { position: percent })
  }

  const handleTouchEnd = () => {
    setDraggingKeyframeId(null)
    setDraggingPosition(false)
  }

  const handlePlayToggle = () => {
    onSelectKeyframe(null)
    onDeselectLayer?.()
    onPlayToggle()
  }

  const handleKeyframeClick = (keyframeId: string) => {
    const keyframe = keyframes.find((kf) => kf.id === keyframeId)
    if (keyframe) {
      onSelectKeyframe(keyframeId)
      onTimeChange((keyframe.position / 100) * duration)
      if (isPlaying) {
        onPlayToggle()
      }
    }
  }

  const selectedKeyframe = selectedKeyframeId ? keyframes.find((kf) => kf.id === selectedKeyframeId) : null

  const handlePositionDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingPosition(true)
    onSelectKeyframe(null)
  }

  const handlePositionMouseDown = (e: React.MouseEvent) => {
    handlePositionDragStart(e)
  }

  const handlePositionTouchStart = (e: React.TouchEvent) => {
    handlePositionDragStart(e)
  }

  return (
    <div
      className="w-full flex flex-col gap-2 p-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Timeline control row: Add button, Play button, Timeline bar, Duration field */}
      <div className="flex items-end gap-3">
        <Button
          onClick={() => onAddKeyframe((playbackTime / duration) * 100)}
          size="sm"
          variant="outline"
          className="border-border hover:bg-accent p-2 h-8 w-8 flex-shrink-0 bg-card/80 backdrop-blur"
          title="Add keyframe"
        >
          <Plus className="w-4 h-4" />
        </Button>

        <Button
          onClick={handlePlayToggle}
          size="sm"
          className={`p-2 h-8 w-8 flex-shrink-0 backdrop-blur ${isPlaying ? "bg-destructive/90 hover:bg-destructive" : "bg-chart-2/90 hover:bg-chart-2"}`}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        {/* Timeline bar */}
        <div className="flex-1 flex flex-col gap-1">
          <div
            ref={timelineRef}
            className="relative h-8 bg-card/80 backdrop-blur rounded cursor-pointer group border border-border"
            onClick={(e) => {
              if (!draggingKeyframeId && !draggingPosition && timelineRef.current) {
                const percent = calculatePosition(e.clientX)
                onTimeChange((percent / 100) * duration)
                onSelectKeyframe(null) // deselect keyframe when clicking timeline
              }
            }}
          >
            <div className="absolute inset-0 flex items-center">
              {keyframes.map((keyframe) => {
                const position = keyframe.position
                const isSelected = selectedKeyframeId === keyframe.id
                const isDragging = draggingKeyframeId === keyframe.id

                return (
                  <div
                    key={keyframe.id}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing transition-all ${
                      isDragging ? "scale-150 z-20" : "scale-100"
                    } ${isSelected ? "z-10" : ""}`}
                    style={{ left: `${position}%` }}
                    onMouseDown={(e) => handleKeyframeDragStart(e, keyframe.id)}
                    onTouchStart={(e) => handleKeyframeTouchStart(e, keyframe.id)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleKeyframeClick(keyframe.id)
                    }}
                    title="Drag to move, click to select"
                  >
                    {/* Keyframe thumbnail with copy/delete buttons below */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold relative ${
                          isSelected ? "bg-accent border-foreground" : "bg-primary border-foreground/50 hover:scale-110"
                        }`}
                        style={{
                          background: `linear-gradient(to right, ${keyframe.layers.map((l) => l.colorStops?.[0]?.color || "#888").join(", ")})`,
                          borderColor: isSelected ? "hsl(var(--foreground))" : "hsla(var(--foreground) / 0.5)",
                        }}
                      />
                      {isSelected && (
                        <div className="flex gap-1 bg-popover rounded p-1 shadow-md pointer-events-auto">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              onCopyKeyframe(keyframe.id)
                            }}
                            size="sm"
                            variant="ghost"
                            className="p-1 h-5 w-5 hover:bg-accent"
                            title="Duplicate keyframe"
                          >
                            {/* Icon stays black for contrast on white background */}
                            <svg
                              className="w-3 h-3 text-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemoveKeyframe(keyframe.id)
                            }}
                            size="sm"
                            variant="ghost"
                            className="p-1 h-5 w-5 hover:bg-accent"
                            title="Delete keyframe"
                          >
                            {/* Icon stays black for contrast on white background */}
                            <svg
                              className="w-3 h-3 text-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              <div
                className={`absolute top-0 bottom-0 w-1 bg-destructive shadow-lg flex items-start -translate-x-1/2 ${
                  draggingPosition ? "cursor-grabbing scale-150" : "cursor-grab hover:scale-110"
                } transition-transform`}
                style={{
                  left: `${timelinePosition}%`,
                }}
                onMouseDown={handlePositionMouseDown}
                onTouchStart={handlePositionTouchStart}
                onClick={(e) => e.stopPropagation()} // Prevent timeline click when clicking indicator
                title="Drag to scrub timeline"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded pointer-events-none">
                  {(playbackTime / 1000).toFixed(2)}s
                </div>
              </div>
            </div>
          </div>
        </div>

        <Input
          type="number"
          value={duration}
          onChange={(e) => onAnimationConfigChange({ duration: Number(e.target.value) })}
          min="100"
          step="100"
          className="bg-card/80 backdrop-blur border-border text-foreground text-sm w-20 flex-shrink-0"
          placeholder="3000"
          title="Animation duration in milliseconds"
        />
      </div>
    </div>
  )
}
