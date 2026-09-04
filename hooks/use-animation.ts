/**
 * Custom React hook for managing gradient animation playback and keyframes
 *
 * Handles animation timeline, keyframe management, and frame interpolation.
 *
 * CRITICAL: This hook provides JavaScript interpolation for scrubbing/editing.
 * The actual exported CSS uses @keyframes with CSS variable interpolation.
 * Both methods produce visually identical results.
 */

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { Keyframe, AnimationConfig, ProjectState, Layer, ColorStop } from "@/lib/gradient-types"
import { interpolateColor } from "@/lib/color-utils"

/**
 * Interpolates a single array of color stops toward a target array,
 * lerping both color (via interpolateColor) and position. Shared by the
 * linear and radial branches of interpolateLayers below, since stops behave
 * identically regardless of which gradient type they belong to.
 *
 * @param fromStops - Starting color stops
 * @param toStops - Ending color stops (matched to fromStops by index)
 * @param progress - Interpolation progress (0-1)
 */
function interpolateColorStops(fromStops: ColorStop[], toStops: ColorStop[], progress: number): ColorStop[] {
  return fromStops.map((stop, i) => {
    const toStop = toStops[i]
    if (!toStop) return stop

    return {
      ...stop,
      color: interpolateColor(stop.color, toStop.color, progress),
      position: stop.position + (toStop.position - stop.position) * progress,
    }
  })
}

/**
 * useAnimation hook
 * Manages animation playback, keyframe operations, and interpolation between frames
 *
 * Accepts `project: null` so it can be called unconditionally before the
 * project has finished loading (React hooks can't be called conditionally).
 * All keyframe/layer operations become no-ops while project is null; the
 * caller's UI shouldn't be able to invoke them before a project exists, but
 * this keeps the hook itself safe regardless.
 *
 * @param project - Current project state, or null while still loading
 * @param updateProject - Function to update project state
 * @returns Animation state and control functions
 */
export function useAnimation(
  project: ProjectState | null,
  updateProject: (updates: Partial<ProjectState>) => void,
) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const layers = project?.layers ?? []
  const keyframes = project?.keyframes ?? []
  const animation = project?.animation

  // Animation loop using requestAnimationFrame for smooth playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    startTimeRef.current = Date.now() - playbackTime
    const duration = animation?.duration || 3000

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current
      const newTime = elapsed % duration
      setPlaybackTime(newTime)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, animation?.duration])

  /**
   * Adds a new keyframe at the current playback position
   * @param position - Timeline position (0-100%)
   * @returns The newly created keyframe
   */
  const addKeyframe = useCallback(
    (position: number) => {
      if (!project) return undefined

      const newKeyframe: Keyframe = {
        id: `keyframe-${Date.now()}`,
        position,
        layers: JSON.parse(JSON.stringify(layers)),
        label: `${position.toFixed(0)}%`,
      }

      updateProject({
        keyframes: [...keyframes, newKeyframe].sort((a, b) => a.position - b.position),
      })

      setSelectedKeyframeId(newKeyframe.id)
      return newKeyframe
    },
    [project, layers, keyframes, updateProject],
  )

  /**
   * Creates a duplicate of an existing keyframe with a slight position offset
   * @param keyframeId - ID of keyframe to copy
   */
  const copyKeyframe = useCallback(
    (keyframeId: string) => {
      const keyframeToCopy = keyframes.find((kf) => kf.id === keyframeId)
      if (!keyframeToCopy) return

      const newKeyframe: Keyframe = {
        ...keyframeToCopy,
        id: `keyframe-${Date.now()}`,
        position: Math.min(100, keyframeToCopy.position + 5),
        // Deep-clone the layers array so editing the copy can never mutate
        // the original keyframe's layers through a shared reference.
        layers: JSON.parse(JSON.stringify(keyframeToCopy.layers)),
      }

      updateProject({
        keyframes: [...keyframes, newKeyframe].sort((a, b) => a.position - b.position),
      })

      setSelectedKeyframeId(newKeyframe.id)
    },
    [keyframes, updateProject],
  )

  /**
   * Updates a keyframe with new values
   * @param keyframeId - ID of keyframe to update
   * @param updates - Partial keyframe updates
   */
  const updateKeyframe = useCallback(
    (keyframeId: string, updates: Partial<Keyframe>) => {
      updateProject({
        keyframes: keyframes
          .map((kf) => (kf.id === keyframeId ? { ...kf, ...updates } : kf))
          .sort((a, b) => a.position - b.position),
      })
    },
    [keyframes, updateProject],
  )

  /**
   * Updates a layer within a keyframe
   * @param keyframeId - ID of keyframe containing the layer
   * @param layerIndex - Index of layer to update
   * @param updatedLayer - Updated layer configuration
   */
  const updateKeyframeLayer = useCallback(
    (keyframeId: string, layerIndex: number, updatedLayer: Layer) => {
      updateProject({
        keyframes: keyframes.map((kf) => {
          if (kf.id === keyframeId) {
            const newLayers = [...kf.layers]
            newLayers[layerIndex] = updatedLayer
            return { ...kf, layers: newLayers }
          }
          return kf
        }),
      })
    },
    [keyframes, updateProject],
  )

  /**
   * Removes a keyframe from the animation
   * @param keyframeId - ID of keyframe to remove
   */
  const removeKeyframe = useCallback(
    (keyframeId: string) => {
      updateProject({
        keyframes: keyframes.filter((kf) => kf.id !== keyframeId),
      })
      setSelectedKeyframeId(null)
    },
    [keyframes, updateProject],
  )

  /**
   * Updates animation configuration
   * @param config - Partial animation config updates
   */
  const setAnimationConfig = useCallback(
    (config: Partial<AnimationConfig>) => {
      updateProject({
        animation: {
          ...animation,
          name: config.name || animation?.name || "gradient-animation",
          duration: config.duration || animation?.duration || 3000,
          easing: config.easing || animation?.easing || "ease-in-out",
          iterationCount: config.iterationCount || animation?.iterationCount || "infinite",
          playbackRate: config.playbackRate || animation?.playbackRate || 1,
        },
      })
    },
    [animation, updateProject],
  )

  /**
   * Interpolates layer properties between two layer states
   * Used for JavaScript-based scrubbing during editing
   * @param fromLayers - Starting layers
   * @param toLayers - Ending layers
   * @param progress - Interpolation progress (0-1)
   * @returns Interpolated layers
   */
  const interpolateLayers = useCallback((fromLayers: Layer[], toLayers: Layer[], progress: number): Layer[] => {
    return fromLayers.map((fromLayer, index) => {
      const toLayer = toLayers[index]
      if (!toLayer || fromLayer.type !== toLayer.type) return fromLayer

      if (fromLayer.type === "linear" && toLayer.type === "linear") {
        return {
          ...fromLayer,
          angle: fromLayer.angle + (toLayer.angle - fromLayer.angle) * progress,
          colorStops: interpolateColorStops(fromLayer.colorStops, toLayer.colorStops, progress),
        }
      }

      if (fromLayer.type === "radial" && toLayer.type === "radial") {
        return {
          ...fromLayer,
          positionX: fromLayer.positionX + (toLayer.positionX - fromLayer.positionX) * progress,
          positionY: fromLayer.positionY + (toLayer.positionY - fromLayer.positionY) * progress,
          colorStops: interpolateColorStops(fromLayer.colorStops, toLayer.colorStops, progress),
        }
      }

      return fromLayer
    })
  }, [])

  /**
   * Calculates the rendered layer frame at a specific playback time
   * Interpolates between keyframes for smooth animation
   * @param time - Playback time in milliseconds
   * @returns Interpolated layers at the given time
   */
  const getFrameAtTime = useCallback(
    (time: number): Layer[] => {
      if (keyframes.length === 0) return layers

      const duration = animation?.duration || 3000
      const timePercent = ((time % duration) / duration) * 100

      const sortedKeyframes = [...keyframes].sort((a, b) => a.position - b.position)

      let fromKeyframe = sortedKeyframes[0]
      let toKeyframe = sortedKeyframes[sortedKeyframes.length - 1]

      // Find the two keyframes surrounding the current time
      for (let i = 0; i < sortedKeyframes.length - 1; i++) {
        if (timePercent >= sortedKeyframes[i].position && timePercent < sortedKeyframes[i + 1].position) {
          fromKeyframe = sortedKeyframes[i]
          toKeyframe = sortedKeyframes[i + 1]
          break
        }
      }

      // Calculate progress between keyframes
      const range = toKeyframe.position - fromKeyframe.position
      const progress = range === 0 ? 0 : (timePercent - fromKeyframe.position) / range

      return interpolateLayers(fromKeyframe.layers, toKeyframe.layers, progress)
    },
    [keyframes, animation, layers, interpolateLayers],
  )

  return {
    isPlaying,
    setIsPlaying,
    playbackTime,
    setPlaybackTime,
    selectedKeyframeId,
    setSelectedKeyframeId,
    addKeyframe,
    copyKeyframe,
    updateKeyframe,
    updateKeyframeLayer,
    removeKeyframe,
    setAnimationConfig,
    getFrameAtTime,
  }
}
