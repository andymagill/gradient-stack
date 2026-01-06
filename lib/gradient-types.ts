/**
 * Type definitions for Gradient Stack
 *
 * This module contains all TypeScript interfaces and types used throughout the application.
 * Types are organized by domain: gradients, layers, animations, and project state.
 */

/** Supported gradient types */
export type GradientType = "linear" | "radial" | "url"

/**
 * A color stop represents a single color at a specific position within a gradient
 */
export interface ColorStop {
  /** Unique identifier */
  id: string
  /** Hex color with alpha channel (e.g., "#ff0000ff") */
  color: string
  /** Position in gradient from 0-100% */
  position: number
  /** Optional color hint position for smoother transitions */
  hint?: number
}

/**
 * Linear gradient configuration
 * Defines gradients that change color along a linear axis
 */
export interface LinearGradient {
  type: "linear"
  /** Gradient direction in degrees (0-360) */
  angle: number
  /** Array of color stops defining the gradient */
  colorStops: ColorStop[]
  /** CSS blend mode for compositing with layers below */
  blendMode?: string
  /** Controls whether the layer is visible in the preview */
  visible?: boolean
}

/**
 * Radial gradient configuration
 * Defines gradients that radiate outward from a center point
 */
export interface RadialGradient {
  type: "radial"
  /** Circle or ellipse shape */
  shape: "circle" | "ellipse"
  /** Size type or custom dimensions */
  sizeType: "closest-side" | "farthest-side" | "closest-corner" | "farthest-corner" | "custom"
  /** Custom size when sizeType is 'custom' */
  size?: { width: number; height: number }
  /** Center X position as percentage */
  positionX: number
  /** Center Y position as percentage */
  positionY: number
  /** Array of color stops */
  colorStops: ColorStop[]
  /** CSS blend mode */
  blendMode?: string
  /** Controls whether the layer is visible in the preview */
  visible?: boolean
}

/**
 * Image/URL layer configuration
 * Supports background images with various sizing and positioning options
 */
export interface URLLayer {
  type: "url"
  /** Image URL */
  url: string
  /** Background size mode */
  backgroundSize: "cover" | "contain" | "auto" | "custom"
  /** Custom size dimensions */
  backgroundSizeCustom?: { width: string; height: string }
  /** Background repeat mode */
  backgroundRepeat: "repeat" | "repeat-x" | "repeat-y" | "no-repeat"
  /** Background position as percentages */
  backgroundPosition: { x: number; y: number }
  /** CSS blend mode */
  blendMode?: string
  /** Controls whether the layer is visible in the preview */
  visible?: boolean
}

/** Union type of all possible layer types */
export type Layer = LinearGradient | RadialGradient | URLLayer

/**
 * Represents a snapshot of layers at a specific point in an animation
 */
export interface Keyframe {
  /** Unique identifier */
  id: string
  /** Position in animation timeline (0-100%) */
  position: number
  /** Layers configuration at this keyframe */
  layers: Layer[]
  /** Optional descriptive label */
  label?: string
}

/**
 * Animation configuration
 * Defines how layers transition between keyframes
 */
export interface AnimationConfig {
  /** Animation name for CSS generation */
  name: string
  /** Duration in milliseconds */
  duration: number
  /** Easing function name */
  easing: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "custom"
  /** Number of iterations or "infinite" */
  iterationCount: number | "infinite"
  /** Playback speed multiplier (0.1 to 2) */
  playbackRate: number
}

/**
 * Complete project state
 * Contains all data needed to represent a gradient animation project
 */
export interface ProjectState {
  /** Unique project identifier */
  id: string
  /** Project name */
  name: string
  /** Base layers without animation */
  layers: Layer[]
  /** Animation keyframes */
  keyframes: Keyframe[]
  /** Currently selected layer ID */
  activeLayerId?: string
  /** Currently selected keyframe ID */
  activeKeyframeId?: string
  /** Animation configuration */
  animation?: AnimationConfig
  /** Creation timestamp */
  createdAt: number
  /** Last update timestamp */
  updatedAt: number
}
