/**
 * CSS generation utilities
 *
 * This module handles conversion of gradient and layer configurations into valid CSS.
 * It supports generating both static backgrounds and animated keyframes.
 */

import type { Layer, LinearGradient, RadialGradient, URLLayer, ProjectState } from "./gradient-types"

/**
 * Compiles a linear gradient configuration to CSS
 * @param gradient - Linear gradient configuration
 * @returns CSS linear-gradient() string
 */
export function compileGradientCSS(gradient: LinearGradient): string {
  const sortedStops = [...gradient.colorStops].sort((a, b) => a.position - b.position)
  const colorStopsStr = sortedStops.map((stop) => `${stop.color} ${stop.position}%`).join(", ")

  return `linear-gradient(${gradient.angle}deg, ${colorStopsStr})`
}

/**
 * Compiles a linear gradient with CSS variables for smooth animation
 * @param gradient - Linear gradient configuration
 * @param layerIndex - Index of layer for unique variable names
 * @returns CSS linear-gradient() string using CSS variables
 */
export function compileGradientCSSWithVariables(gradient: LinearGradient, layerIndex: number): string {
  const angleVar = `var(--linear-${layerIndex}-angle, ${gradient.angle}deg)`

  const sortedStops = [...gradient.colorStops].sort((a, b) => a.position - b.position)
  const colorStopsStr = sortedStops
    .map((stop, stopIndex) => {
      const colorVar = `--gradient-l${layerIndex}-c${stopIndex}`
      const positionVar = `--gradient-l${layerIndex}-p${stopIndex}`
      return `var(${colorVar}, ${stop.color}) var(${positionVar}, ${stop.position}%)`
    })
    .join(", ")

  return `linear-gradient(${angleVar}, ${colorStopsStr})`
}

/**
 * Compiles a radial gradient configuration to CSS
 * @param gradient - Radial gradient configuration
 * @returns CSS radial-gradient() string
 */
export function compileRadialGradientCSS(gradient: RadialGradient): string {
  const shapeStr = gradient.shape === "circle" ? "circle" : "ellipse"
  const positionStr = `${gradient.positionX}% ${gradient.positionY}%`
  const sortedStops = [...gradient.colorStops].sort((a, b) => a.position - b.position)
  const colorStopsStr = sortedStops.map((stop) => `${stop.color} ${stop.position}%`).join(", ")

  return `radial-gradient(${shapeStr} at ${positionStr}, ${colorStopsStr})`
}

/**
 * Compiles a radial gradient with CSS variables for smooth animation
 * @param gradient - Radial gradient configuration
 * @param layerIndex - Index of layer for unique variable names
 * @returns CSS radial-gradient() string using CSS variables
 */
export function compileRadialGradientCSSWithVariables(gradient: RadialGradient, layerIndex: number): string {
  const positionXVar = `var(--radial-${layerIndex}-posX, ${gradient.positionX}%)`
  const positionYVar = `var(--radial-${layerIndex}-posY, ${gradient.positionY}%)`
  const positionStr = `${positionXVar} ${positionYVar}`

  const shapeStr = gradient.shape === "circle" ? "circle" : "ellipse"
  const sortedStops = [...gradient.colorStops].sort((a, b) => a.position - b.position)
  const colorStopsStr = sortedStops
    .map((stop, stopIndex) => {
      const colorVar = `--gradient-r${layerIndex}-c${stopIndex}`
      const positionVar = `--gradient-r${layerIndex}-p${stopIndex}`
      return `var(${colorVar}, ${stop.color}) var(${positionVar}, ${stop.position}%)`
    })
    .join(", ")

  return `radial-gradient(${shapeStr} at ${positionStr}, ${colorStopsStr})`
}

/**
 * Escapes a URL for safe interpolation inside a CSS `url(" ... ")` token.
 *
 * WHY THIS EXISTS: the compiled CSS is injected into the page via
 * `dangerouslySetInnerHTML` (see PreviewCanvas) and written verbatim into the
 * exported HTML file. An unescaped user-supplied URL containing `"` or `)`
 * can close the `url()` token early and inject arbitrary CSS (or, in the
 * exported file, arbitrary HTML via a `</style>` sequence). Only http(s) and
 * data: URLs are allowed through; anything else (e.g. `javascript:`) is
 * rejected rather than silently stripped, since a background-image cannot
 * execute a javascript: URL but we don't want to rely on that.
 *
 * @param url - Raw URL as entered by the user
 * @returns A safely quoted `url("...")` token, or `none` if the URL is empty/unsupported
 */
function toSafeCSSUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return "none"
  if (!/^(https?:|data:)/i.test(trimmed)) return "none"

  const escaped = trimmed
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[\r\n]/g, "")

  return `url("${escaped}")`
}

/**
 * Compiles a URL/image layer to CSS
 *
 * Honors backgroundSize (including custom width/height), backgroundRepeat,
 * and backgroundPosition, so the corresponding property-editor controls
 * actually affect the rendered layer.
 *
 * @param layer - URL layer configuration
 * @returns CSS background image string (position / size and repeat included)
 */
export function compileURLCSS(layer: URLLayer): string {
  const urlToken = toSafeCSSUrl(layer.url)

  const sizeStr =
    layer.backgroundSize === "custom"
      ? `${layer.backgroundSizeCustom?.width || "auto"} ${layer.backgroundSizeCustom?.height || "auto"}`
      : layer.backgroundSize

  const positionStr = `${layer.backgroundPosition?.x ?? 50}% ${layer.backgroundPosition?.y ?? 50}%`

  return `${urlToken} ${positionStr} / ${sizeStr} ${layer.backgroundRepeat}`
}

/**
 * Compiles any layer type to its CSS representation
 * @param layer - Layer configuration
 * @returns CSS string for the layer
 */
export function compileLayerCSS(layer: Layer): string {
  if (layer.type === "linear") {
    return compileGradientCSS(layer)
  }
  if (layer.type === "radial") {
    return compileRadialGradientCSS(layer)
  }
  return compileURLCSS(layer)
}

/**
 * Compiles any layer type to CSS with variable support
 * @param layer - Layer configuration
 * @param layerIndex - Index of layer for unique variable names
 * @returns CSS string for the layer
 */
export function compileLayerCSSWithVariables(layer: Layer, layerIndex: number): string {
  if (layer.type === "linear") {
    return compileGradientCSSWithVariables(layer, layerIndex)
  }
  if (layer.type === "radial") {
    return compileRadialGradientCSSWithVariables(layer, layerIndex)
  }
  return compileURLCSS(layer)
}

/**
 * Filters a layer stack down to visible layers only.
 *
 * WHY THIS EXISTS: every function below that assigns a layer a numeric index
 * (for CSS variable names like `--gradient-l{index}-c{stop}`) MUST use the
 * exact same visible-layer list, in the exact same order, or the indices
 * assigned here will not match the indices `generatePropertyDeclarations`
 * registers via `@property`. A mismatch means the browser has no type
 * information for the variable actually used in `background`, so it can't be
 * animated — the gradient jumps between keyframes instead of transitioning
 * smoothly. Route every "visible layers" filter through this one function so
 * that invariant can't drift again (it did previously: see git history).
 *
 * @param layers - Full layer stack, in stack order
 * @returns Layers with `visible !== false` (undefined is treated as visible)
 */
export function getVisibleLayers(layers: Layer[]): Layer[] {
  return layers.filter((layer) => layer.visible !== false)
}

/**
 * Compiles multiple layers into a composite background CSS
 *
 * Only visible layers are included in the output (see getVisibleLayers).
 * This affects both preview and exported CSS.
 *
 * @param layers - Array of layer configurations
 * @returns CSS background string with all visible layers composited
 */
export function compileBackgroundCSS(layers: Layer[]): string {
  return getVisibleLayers(layers).map(compileLayerCSS).join(",\n")
}

/**
 * Compiles multiple layers with variable support for animation
 *
 * Only visible layers are included in the output (see getVisibleLayers).
 * This must match the behavior of compileBackgroundCSS and
 * generatePropertyDeclarations, or CSS variable indices will desync.
 *
 * @param layers - Array of layer configurations
 * @returns CSS background string with CSS variables for visible layers only
 */
export function compileBackgroundCSSWithVariables(layers: Layer[]): string {
  return getVisibleLayers(layers)
    .map((layer, idx) => compileLayerCSSWithVariables(layer, idx))
    .join(",\n")
}

/**
 * Generates CSS variable definitions from layer colors and positions
 *
 * Only visible layers generate variables (see getVisibleLayers), so invisible
 * layers can't affect the animation.
 *
 * @param layers - Array of layers
 * @returns CSS variable declarations for visible layers only
 */
export function generateColorVariables(layers: Layer[]): Record<string, string> {
  const variables: Record<string, string> = {}

  const visibleLayers = getVisibleLayers(layers)

  visibleLayers.forEach((layer, layerIndex) => {
    if (layer.type === "linear") {
      variables[`--linear-${layerIndex}-angle`] = `${layer.angle}deg`

      layer.colorStops.forEach((stop, stopIndex) => {
        variables[`--gradient-l${layerIndex}-c${stopIndex}`] = stop.color
        variables[`--gradient-l${layerIndex}-p${stopIndex}`] = `${stop.position}%`
      })
    }
    if (layer.type === "radial") {
      variables[`--radial-${layerIndex}-posX`] = `${layer.positionX}%`
      variables[`--radial-${layerIndex}-posY`] = `${layer.positionY}%`

      layer.colorStops.forEach((stop, stopIndex) => {
        variables[`--gradient-r${layerIndex}-c${stopIndex}`] = stop.color
        variables[`--gradient-r${layerIndex}-p${stopIndex}`] = `${stop.position}%`
      })
    }
  })

  return variables
}

/**
 * Generates @keyframes CSS for animation with variable transitions
 * @param state - Project state with keyframes
 * @param animationName - Name of the animation
 * @returns CSS @keyframes rule
 */
export function generateKeyframesCSS(state: ProjectState, animationName: string): string {
  if (!state.keyframes || state.keyframes.length === 0) {
    return ""
  }

  const sortedKeyframes = [...state.keyframes].sort((a, b) => a.position - b.position)

  const frames = sortedKeyframes
    .map((kf) => {
      const variables = generateColorVariables(kf.layers)
      const varDeclarations = Object.entries(variables)
        .map(([name, value]) => `${name}: ${value}`)
        .join("; ")

      return `${kf.position}% { ${varDeclarations}; }`
    })
    .join("\n")

  return `@keyframes ${animationName} {\n${frames}\n}`
}

/**
 * Generates @property declarations for CSS custom properties
 * Enables browser interpolation of color and position values during animation
 *
 * Only visible layers are declared (see getVisibleLayers) so the indices here
 * line up with the indices compileBackgroundCSSWithVariables assigns.
 *
 * @param layers - Array of layers
 * @returns CSS @property rules
 */
export function generatePropertyDeclarations(layers: Layer[]): string {
  const declarations: string[] = []

  getVisibleLayers(layers).forEach((layer, layerIndex) => {
    if (layer.type === "linear") {
      declarations.push(`@property --linear-${layerIndex}-angle {
  syntax: "<angle>";
  initial-value: ${layer.angle}deg;
  inherits: false;
}`)

      layer.colorStops.forEach((stop, stopIndex) => {
        const colorVar = `--gradient-l${layerIndex}-c${stopIndex}`
        const positionVar = `--gradient-l${layerIndex}-p${stopIndex}`

        declarations.push(`@property ${colorVar} {
  syntax: "<color>";
  initial-value: ${stop.color};
  inherits: false;
}`)

        declarations.push(`@property ${positionVar} {
  syntax: "<percentage>";
  initial-value: ${stop.position}%;
  inherits: false;
}`)
      })
    }
    if (layer.type === "radial") {
      declarations.push(`@property --radial-${layerIndex}-posX {
  syntax: "<percentage>";
  initial-value: ${layer.positionX}%;
  inherits: false;
}`)
      declarations.push(`@property --radial-${layerIndex}-posY {
  syntax: "<percentage>";
  initial-value: ${layer.positionY}%;
  inherits: false;
}`)

      layer.colorStops.forEach((stop, stopIndex) => {
        const colorVar = `--gradient-r${layerIndex}-c${stopIndex}`
        const positionVar = `--gradient-r${layerIndex}-p${stopIndex}`

        declarations.push(`@property ${colorVar} {
  syntax: "<color>";
  initial-value: ${stop.color};
  inherits: false;
}`)

        declarations.push(`@property ${positionVar} {
  syntax: "<percentage>";
  initial-value: ${stop.position}%;
  inherits: false;
}`)
      })
    }
  })

  return declarations.join("\n")
}

/**
 * Generates complete CSS for the project including keyframes and element styling
 *
 * CRITICAL REQUIREMENT: This function generates CSS that uses CSS animations with @keyframes
 * and CSS variables for interpolation. This is the ONLY supported animation method.
 *
 * - CSS transitions are NOT sufficient and must NOT be used
 * - Both the preview and exported HTML must use identical animation techniques
 * - The animation is controlled via @keyframes with CSS custom properties (@property)
 * - No JavaScript is required in the exported HTML
 *
 * @param state - Complete project state
 * @returns Full CSS code ready to use
 */
export function generateFullCSS(state: ProjectState): string {
  const cssArray: string[] = []

  const layersForBackground = state.keyframes && state.keyframes.length > 0 ? state.keyframes[0].layers : state.layers

  const propertyDeclarations = generatePropertyDeclarations(layersForBackground)
  if (propertyDeclarations) {
    cssArray.push(propertyDeclarations)
  }

  const ANIMATION_NAME = "gradient-animation"

  // Without keyframes, the gradient will not animate in the exported HTML
  if (state.keyframes && state.keyframes.length > 0) {
    cssArray.push(generateKeyframesCSS(state, ANIMATION_NAME))
  }

  const backgroundCSS = compileBackgroundCSSWithVariables(layersForBackground)

  const backgroundValue =
    backgroundCSS && backgroundCSS.trim()
      ? backgroundCSS
      : layersForBackground.length > 0
        ? compileBackgroundCSS(layersForBackground)
        : "transparent"

  const variables = generateColorVariables(layersForBackground)
  const varDeclarations = Object.entries(variables)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n")

  // The animation is always defined but may be paused/controlled via animation-delay
  const duration = state.animation?.duration || 3000
  const easing = state.animation?.easing || "ease-in-out"
  const iterationCount =
    state.animation?.iterationCount === "infinite" ? "infinite" : state.animation?.iterationCount || 1

  const animationCSS =
    state.keyframes && state.keyframes.length > 0
      ? `  animation: ${ANIMATION_NAME} ${duration}ms ${easing} ${iterationCount};`
      : ""

  const elementCSS = `.gradient-element {
  background: ${backgroundValue};
${varDeclarations}
${animationCSS}
}`

  cssArray.push(elementCSS)

  return cssArray.join("\n\n")
}
