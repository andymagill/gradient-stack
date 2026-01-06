/**
 * Color Conversion Utilities
 *
 * Shared utilities for color manipulation used throughout the application.
 * Supports 6-digit (#RRGGBB) and 8-digit (#RRGGBBAA) hex formats.
 */

/**
 * RGBA color components
 */
export interface RGBAColor {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Converts a hex color string to RGBA components
 * @param hex - Hex color string (#RRGGBB or #RRGGBBAA)
 * @returns RGBA color object with values 0-255
 */
export function hexToRgba(hex: string): RGBAColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
        a: result[4] ? Number.parseInt(result[4], 16) : 255,
      }
    : { r: 0, g: 0, b: 0, a: 255 }
}

/**
 * Converts RGBA components to an 8-digit hex string
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @param a - Alpha component (0-255)
 * @returns Hex color string with alpha (#RRGGBBAA)
 */
export function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const toHex = (x: number) => {
    const hex = Math.max(0, Math.min(255, x)).toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`
}

/**
 * Interpolates between two hex colors
 * @param fromHex - Starting hex color
 * @param toHex - Ending hex color
 * @param progress - Interpolation progress (0-1)
 * @returns Interpolated hex color
 */
export function interpolateColor(fromHex: string, toHex: string, progress: number): string {
  const from = hexToRgba(fromHex)
  const to = hexToRgba(toHex)

  return rgbaToHex(
    Math.round(from.r + (to.r - from.r) * progress),
    Math.round(from.g + (to.g - from.g) * progress),
    Math.round(from.b + (to.b - from.b) * progress),
    Math.round(from.a + (to.a - from.a) * progress),
  )
}

/**
 * Generates a random hex color with full opacity
 * @returns Random hex color (#RRGGBBFF)
 */
export function randomColor(): string {
  const letters = "0123456789ABCDEF"
  let color = "#"
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color + "FF"
}

/**
 * Validates a hex color string
 * @param hex - String to validate
 * @returns True if valid 6 or 8 digit hex color
 */
export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)
}
