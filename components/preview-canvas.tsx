"use client"

import type React from "react"
import {
  compileBackgroundCSSWithVariables,
  generateKeyframesCSS,
  generatePropertyDeclarations,
  generateColorVariables,
} from "@/lib/gradient-compiler"
import type { ProjectState } from "@/lib/gradient-types"
import { useMemo, useEffect, useRef } from "react"

interface PreviewCanvasProps {
  /** Current project state with keyframes */
  project: ProjectState
  /** Current playback time in milliseconds */
  playbackTime: number
  /** Whether animation is playing */
  isPlaying: boolean
}

/**
 * PreviewCanvas Component
 *
 * Displays a real-time preview using the exact CSS animation from generated code.
 * Uses animation-delay to scrub through the animation timeline.
 *
 * CRITICAL: This component MUST render identically to the exported HTML.
 * The animation is controlled by:
 * - animation-play-state: paused (always)
 * - animation-delay: -${playbackTime}ms (negative delay for scrubbing)
 */
export function PreviewCanvas({ project, playbackTime, isPlaying }: PreviewCanvasProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  // Get the base layers structure from first keyframe or base layers
  const baseLayersForStructure =
    project.keyframes && project.keyframes.length > 0 ? project.keyframes[0].layers : project.layers

  const backgroundCSS = useMemo(
    () => compileBackgroundCSSWithVariables(baseLayersForStructure),
    [baseLayersForStructure],
  )

  const propertyDeclarations = useMemo(
    () => generatePropertyDeclarations(baseLayersForStructure),
    [baseLayersForStructure],
  )

  const ANIMATION_NAME = "gradient-animation-preview"
  const keyframesCSS = useMemo(() => {
    if (!project.keyframes || project.keyframes.length === 0) return ""
    return generateKeyframesCSS(project, ANIMATION_NAME)
  }, [project])

  // Initial CSS variable values, from the first keyframe or base layers.
  // generateColorVariables already returns "--"-prefixed keys, which is
  // exactly the shape a React style object needs for custom properties.
  const cssVariables = useMemo(() => {
    const layers = project.keyframes && project.keyframes.length > 0 ? project.keyframes[0].layers : project.layers
    return generateColorVariables(layers) as React.CSSProperties
  }, [project])

  useEffect(() => {
    if (!elementRef.current) return

    const el = elementRef.current
    const duration = project.animation?.duration || 3000

    if (project.keyframes && project.keyframes.length > 0) {
      const delay = -playbackTime

      el.style.animationName = ANIMATION_NAME
      el.style.animationDuration = `${duration}ms`
      el.style.animationTimingFunction = project.animation?.easing || "ease-in-out"
      el.style.animationIterationCount = "1"
      el.style.animationPlayState = "paused" // Always paused, controlled by delay
      el.style.animationDelay = `${delay}ms`
      el.style.animationFillMode = "both"
    }
    // isPlaying isn't read here: the preview is always CSS-paused and
    // scrubbed via animation-delay regardless of play state (see class doc).
  }, [playbackTime, project, ANIMATION_NAME])

  const fullCSS = `
${propertyDeclarations}

${keyframesCSS}
  `

  const style: React.CSSProperties = {
    background: backgroundCSS,
    width: "100%",
    height: "100%",
    ...cssVariables,
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fullCSS }} />
      <div className="w-full h-full flex items-center justify-center bg-muted overflow-hidden">
        <div ref={elementRef} style={style} className="w-full h-full" />
      </div>
    </>
  )
}
