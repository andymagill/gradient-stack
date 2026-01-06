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
import type { Keyframe, AnimationConfig, ProjectState, Layer } from "@/lib/gradient-types"
import { hexToRgba, rgbaToHex } from "@/lib/color-utils"

/**
 * useAnimation hook
 * Manages animation playback, keyframe operations, and interpolation between frames
 * @param project - Current project state
 * @param updateProject - Function to update project state
 * @returns Animation state and control functions
 */
export function useAnimation(project: ProjectState, updateProject: (updates: Partial<ProjectState>) => void) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

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
    const duration = project.animation?.duration || 3000

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
  }, [isPlaying, project.animation?.duration])

  /**
   * Adds a new keyframe at the current playback position
   * @param position - Timeline position (0-100%)
   * @returns The newly created keyframe
   */
  const addKeyframe = useCallback(
    (position: number) => {
      const newKeyframe: Keyframe = {
        id: `keyframe-${Date.now()}`,
        position,
        layers: JSON.parse(JSON.stringify(project.layers)),
        label: `${position.toFixed(0)}%`,
      }

      updateProject({
        keyframes: [...project.keyframes, newKeyframe].sort((a, b) => a.position - b.position),
        activeKeyframeId: newKeyframe.id,
      })

      setSelectedKeyframeId(newKeyframe.id)
      return newKeyframe
    },
    [project.layers, project.keyframes, updateProject],
  )

  /**
   * Creates a duplicate of an existing keyframe with a slight position offset
   * @param keyframeId - ID of keyframe to copy
   */
  const copyKeyframe = useCallback(
    (keyframeId: string) => {
      const keyframeToCopy = project.keyframes.find((kf) => kf.id === keyframeId)
      if (!keyframeToCopy) return

      const newKeyframe: Keyframe = {
        ...keyframeToCopy,
        id: `keyframe-${Date.now()}`,
        position: Math.min(100, keyframeToCopy.position + 5),
      }

      updateProject({
        keyframes: [...project.keyframes, newKeyframe].sort((a, b) => a.position - b.position),
        activeKeyframeId: newKeyframe.id,
      })

      setSelectedKeyframeId(newKeyframe.id)
    },
    [project.keyframes, updateProject],
  )

  /**
   * Updates a keyframe with new values
   * @param keyframeId - ID of keyframe to update
   * @param updates - Partial keyframe updates
   */
  const updateKeyframe = useCallback(
    (keyframeId: string, updates: Partial<Keyframe>) => {
      updateProject({
        keyframes: project.keyframes
          .map((kf) => (kf.id === keyframeId ? { ...kf, ...updates } : kf))
          .sort((a, b) => a.position - b.position),
      })
    },
    [project.keyframes, updateProject],
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
        keyframes: project.keyframes.map((kf) => {
          if (kf.id === keyframeId) {
            const newLayers = [...kf.layers]
            newLayers[layerIndex] = updatedLayer
            return { ...kf, layers: newLayers }
          }
          return kf
        }),
      })
    },
    [project.keyframes, updateProject],
  )

  /**
   * Removes a keyframe from the animation
   * @param keyframeId - ID of keyframe to remove
   */
  const removeKeyframe = useCallback(
    (keyframeId: string) => {
      updateProject({
        keyframes: project.keyframes.filter((kf) => kf.id !== keyframeId),
        activeKeyframeId: undefined,
      })
      setSelectedKeyframeId(null)
    },
    [project.keyframes, updateProject],
  )

  /**
   * Updates animation configuration
   * @param config - Partial animation config updates
   */
  const setAnimationConfig = useCallback(
    (config: Partial<AnimationConfig>) => {
      updateProject({
        animation: {
          ...project.animation,
          name: config.name || project.animation?.name || "gradient-animation",
          duration: config.duration || project.animation?.duration || 3000,
          easing: config.easing || project.animation?.easing || "ease-in-out",
          iterationCount: config.iterationCount || project.animation?.iterationCount || "infinite",
          playbackRate: config.playbackRate || project.animation?.playbackRate || 1,
        },
      })
    },
    [project.animation, updateProject],
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
          colorStops: fromLayer.colorStops.map((stop, i) => {
            const toStop = toLayer.colorStops[i]
            if (!toStop) return stop

            const fromRGB = hexToRgba(stop.color)
            const toRGB = hexToRgba(toStop.color)

            return {
              ...stop,
              color: rgbaToHex(
                Math.round(fromRGB.r + (toRGB.r - fromRGB.r) * progress),
                Math.round(fromRGB.g + (toRGB.g - fromRGB.g) * progress),
                Math.round(fromRGB.b + (toRGB.b - fromRGB.b) * progress),
                Math.round(fromRGB.a + (toRGB.a - fromRGB.a) * progress),
              ),
              position: stop.position + (toStop.position - stop.position) * progress,
            }
          }),
        }
      }

      if (fromLayer.type === "radial" && toLayer.type === "radial") {
        return {
          ...fromLayer,
          positionX: fromLayer.positionX + (toLayer.positionX - fromLayer.positionX) * progress,
          positionY: fromLayer.positionY + (toLayer.positionY - fromLayer.positionY) * progress,
          colorStops: fromLayer.colorStops.map((stop, i) => {
            const toStop = toLayer.colorStops[i]
            if (!toStop) return stop

            const fromRGB = hexToRgba(stop.color)
            const toRGB = hexToRgba(toStop.color)

            return {
              ...stop,
              color: rgbaToHex(
                Math.round(fromRGB.r + (toRGB.r - fromRGB.r) * progress),
                Math.round(fromRGB.g + (toRGB.g - fromRGB.g) * progress),
                Math.round(fromRGB.b + (toRGB.b - fromRGB.b) * progress),
                Math.round(fromRGB.a + (toRGB.a - fromRGB.a) * progress),
              ),
              position: stop.position + (toStop.position - stop.position) * progress,
            }
          }),
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
      if (project.keyframes.length === 0) return project.layers

      const duration = project.animation?.duration || 3000
      const timePercent = ((time % duration) / duration) * 100

      const sortedKeyframes = [...project.keyframes].sort((a, b) => a.position - b.position)

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
    [project.keyframes, project.animation, project.layers, interpolateLayers],
  )

  return {
    isPlaying,
    setIsPlaying,
    playbackTime,
    setPlaybackTime,
    playbackRate,
    setPlaybackRate,
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
