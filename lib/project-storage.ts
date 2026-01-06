/**
 * Project storage and management utilities
 *
 * Handles localStorage operations for multiple gradient stack projects,
 * provides template presets, and manages project CRUD operations.
 */

import type { ProjectState, LinearGradient, RadialGradient, Layer } from "./gradient-types"
import { generateId } from "./utils"

/** Storage key for list of all projects */
const PROJECTS_LIST_KEY = "gradient-stack-projects-list"
/** Storage key prefix for individual projects */
const PROJECT_PREFIX = "gradient-stack-project-"

/**
 * Project metadata for gallery display
 */
export interface ProjectMetadata {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  thumbnail?: string
}

/**
 * Generate a random color in hex format with full opacity
 */
function getRandomColor(): string {
  const letters = "0123456789ABCDEF"
  let color = "#"
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color + "ff"
}

/**
 * Generate a color with random opacity
 */
function getRandomColorWithOpacity(): string {
  const letters = "0123456789ABCDEF"
  let color = "#"
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  const opacity = Math.floor(Math.random() * 100)
  return color + opacity.toString(16).padStart(2, "0")
}

/**
 * Generate a random linear gradient layer
 */
function generateRandomLinearGradient(includeTransparency = false): LinearGradient {
  const colorStops = [
    { id: "1", color: getRandomColor(), position: 0 },
    { id: "2", color: getRandomColor(), position: Math.floor(Math.random() * 50) + 25 },
  ]

  if (includeTransparency) {
    colorStops.push({ id: "3", color: "#00000000", position: 100 })
  } else {
    colorStops.push({ id: "3", color: getRandomColor(), position: 100 })
  }

  return {
    type: "linear",
    angle: Math.floor(Math.random() * 360),
    colorStops,
    blendMode: Math.random() > 0.7 ? "multiply" : "normal",
  }
}

/**
 * Generate a random radial gradient layer
 */
function generateRandomRadialGradient(includeTransparency = false): RadialGradient {
  const colorStops = [{ id: "1", color: getRandomColor(), position: 0 }]

  if (includeTransparency) {
    colorStops.push({ id: "2", color: "#00000000", position: 100 })
  } else {
    colorStops.push({ id: "2", color: getRandomColor(), position: 100 })
  }

  return {
    type: "radial",
    shape: Math.random() > 0.5 ? "circle" : "ellipse",
    sizeType: ["closest-side", "farthest-side", "closest-corner", "farthest-corner"][Math.floor(Math.random() * 4)] as
      | "closest-side"
      | "farthest-side"
      | "closest-corner"
      | "farthest-corner",
    positionX: Math.floor(Math.random() * 100),
    positionY: Math.floor(Math.random() * 100),
    colorStops,
    blendMode: "normal",
  }
}

/**
 * Generate a random layer of any type
 */
function generateRandomLayer(includeTransparency = false): Layer {
  const rand = Math.random()
  if (rand < 0.5) {
    return generateRandomLinearGradient(includeTransparency)
  } else {
    return generateRandomRadialGradient(includeTransparency)
  }
}

/**
 * Generate consistent random layer types for use across all keyframes
 * Returns array of layer types that will be consistent across all keyframes
 * LIMITED TO 2 LAYERS for the random template
 */
function generateRandomLayerTypes(): ("linear" | "radial")[] {
  const types: ("linear" | "radial")[] = [
    Math.random() > 0.5 ? "linear" : "radial",
    Math.random() > 0.5 ? "linear" : "radial",
  ]
  return types
}

/**
 * Generate a layer of specific type
 */
function generateLayerOfType(type: "linear" | "radial", includeTransparency = false): Layer {
  if (type === "linear") {
    return generateRandomLinearGradient(includeTransparency)
  } else {
    return generateRandomRadialGradient(includeTransparency)
  }
}

/**
 * Generate a fresh random template project
 * This function should be called each time the random template is used
 * to ensure unique random values every time
 */
export function generateRandomTemplate(): ProjectState {
  const types = generateRandomLayerTypes()

  return {
    id: "template-random",
    name: "Random Mix",
    layers: types.map((type) => generateLayerOfType(type, false)),
    keyframes: [
      {
        id: "random-0",
        position: 0,
        layers: types.map((type) => generateLayerOfType(type, false)),
      },
      {
        id: "random-50",
        position: 50,
        layers: types.map((type) => generateLayerOfType(type, false)),
      },
      {
        id: "random-100",
        position: 100,
        layers: types.map((type) => generateLayerOfType(type, false)),
      },
    ],
    animation: {
      name: "gradient-animation",
      duration: 5000,
      easing: "ease-in-out",
      iterationCount: "infinite",
      playbackRate: 1,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * Template gradient stack presets
 * Each template includes at least two keyframes demonstrating real-world animation usage
 */
export const TEMPLATES: ProjectState[] = [
  {
    id: "template-sunset",
    name: "Sunset Waves",
    layers: [
      {
        type: "linear",
        angle: 135,
        colorStops: [
          { id: "1", color: "#ff6b6bff", position: 0 },
          { id: "2", color: "#feca57ff", position: 50 },
          { id: "3", color: "#ee5a6fff", position: 100 },
        ],
        blendMode: "normal",
      } as LinearGradient,
    ],
    keyframes: [
      {
        id: "sunset-0",
        position: 0,
        layers: [
          {
            type: "linear",
            angle: 135,
            colorStops: [
              { id: "1", color: "#ff6b6bff", position: 0 },
              { id: "2", color: "#feca57ff", position: 50 },
              { id: "3", color: "#ee5a6fff", position: 100 },
            ],
            blendMode: "normal",
          } as LinearGradient,
        ],
      },
      {
        id: "sunset-100",
        position: 100,
        layers: [
          {
            type: "linear",
            angle: 315,
            colorStops: [
              { id: "1", color: "#ee5a6fff", position: 0 },
              { id: "2", color: "#ff6b6bff", position: 50 },
              { id: "3", color: "#feca57ff", position: 100 },
            ],
            blendMode: "normal",
          } as LinearGradient,
        ],
      },
    ],
    animation: {
      name: "gradient-animation",
      duration: 4000,
      easing: "ease-in-out",
      iterationCount: "infinite",
      playbackRate: 1,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "template-ocean",
    name: "Ocean Depth",
    layers: [
      {
        type: "radial",
        shape: "circle",
        sizeType: "farthest-corner",
        positionX: 50,
        positionY: 50,
        colorStops: [
          { id: "1", color: "#0abde3ff", position: 0 },
          { id: "2", color: "#341f97ff", position: 100 },
        ],
        blendMode: "normal",
      } as RadialGradient,
    ],
    keyframes: [
      {
        id: "ocean-0",
        position: 0,
        layers: [
          {
            type: "radial",
            shape: "circle",
            sizeType: "farthest-corner",
            positionX: 40,
            positionY: 50,
            colorStops: [
              { id: "1", color: "#0abde3ff", position: 0 },
              { id: "2", color: "#341f97ff", position: 100 },
            ],
            blendMode: "normal",
          } as RadialGradient,
        ],
      },
      {
        id: "ocean-100",
        position: 100,
        layers: [
          {
            type: "radial",
            shape: "circle",
            sizeType: "farthest-corner",
            positionX: 60,
            positionY: 50,
            colorStops: [
              { id: "1", color: "#0546b9ff", position: 0 },
              { id: "2", color: "#001b3aff", position: 100 },
            ],
            blendMode: "normal",
          } as RadialGradient,
        ],
      },
    ],
    animation: {
      name: "gradient-animation",
      duration: 5000,
      easing: "ease-in-out",
      iterationCount: "infinite",
      playbackRate: 1,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "template-aurora",
    name: "Aurora Borealis",
    layers: [
      {
        type: "linear",
        angle: 180,
        colorStops: [
          { id: "1", color: "#667eea80", position: 0 },
          { id: "2", color: "#764ba280", position: 50 },
          { id: "3", color: "#f093fb80", position: 100 },
        ],
        blendMode: "screen",
      } as LinearGradient,
      {
        type: "linear",
        angle: 90,
        colorStops: [
          { id: "4", color: "#4facfe80", position: 0 },
          { id: "5", color: "#00f2fe80", position: 100 },
        ],
        blendMode: "overlay",
      } as LinearGradient,
    ],
    keyframes: [
      {
        id: "aurora-0",
        position: 0,
        layers: [
          {
            type: "linear",
            angle: 180,
            colorStops: [
              { id: "1", color: "#667eea80", position: 0 },
              { id: "2", color: "#764ba280", position: 50 },
              { id: "3", color: "#f093fb80", position: 100 },
            ],
            blendMode: "screen",
          } as LinearGradient,
          {
            type: "linear",
            angle: 90,
            colorStops: [
              { id: "4", color: "#4facfe80", position: 0 },
              { id: "5", color: "#00f2fe80", position: 100 },
            ],
            blendMode: "overlay",
          } as LinearGradient,
        ],
      },
      {
        id: "aurora-100",
        position: 100,
        layers: [
          {
            type: "linear",
            angle: 0,
            colorStops: [
              { id: "1", color: "#f093fbff", position: 0 },
              { id: "2", color: "#667eeaff", position: 50 },
              { id: "3", color: "#764ba2ff", position: 100 },
            ],
            blendMode: "screen",
          } as LinearGradient,
          {
            type: "linear",
            angle: 180,
            colorStops: [
              { id: "4", color: "#00f2fe80", position: 0 },
              { id: "5", color: "#4facfe80", position: 100 },
            ],
            blendMode: "overlay",
          } as LinearGradient,
        ],
      },
    ],
    animation: {
      name: "gradient-animation",
      duration: 6000,
      easing: "ease-in-out",
      iterationCount: "infinite",
      playbackRate: 1,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "template-rise-shine",
    name: "Rise & Shine",
    layers: [
      {
        type: "linear",
        angle: 0,
        colorStops: [
          { id: "1", color: "#56423eff", position: 18.3 },
          { id: "2", color: "#FFFFFF00", position: 21.3 },
        ],
        blendMode: "normal",
      } as LinearGradient,
      {
        type: "radial",
        shape: "circle",
        sizeType: "farthest-corner",
        positionX: 0,
        positionY: 100,
        colorStops: [
          { id: "3", color: "#fffa5cff", position: 9.4 },
          { id: "4", color: "#00000000", position: 11.6 },
        ],
        blendMode: "normal",
      } as RadialGradient,
      {
        type: "linear",
        angle: 45,
        colorStops: [
          { id: "5", color: "#2f042bff", position: 0 },
          { id: "6", color: "#293834ff", position: 100 },
        ],
        blendMode: "normal",
      } as LinearGradient,
    ],
    keyframes: [
      {
        id: "rise-0",
        position: 0.336,
        layers: [
          {
            type: "linear",
            angle: 0,
            colorStops: [
              { id: "1", color: "#56423eff", position: 18.3 },
              { id: "2", color: "#FFFFFF00", position: 21.3 },
            ],
            blendMode: "normal",
          } as LinearGradient,
          {
            type: "radial",
            shape: "circle",
            sizeType: "farthest-corner",
            positionX: 0,
            positionY: 100,
            colorStops: [
              { id: "3", color: "#fffa5cff", position: 9.4 },
              { id: "4", color: "#00000000", position: 11.6 },
            ],
            blendMode: "normal",
          } as RadialGradient,
          {
            type: "linear",
            angle: 45,
            colorStops: [
              { id: "5", color: "#2f042bff", position: 0 },
              { id: "6", color: "#293834ff", position: 100 },
            ],
            blendMode: "normal",
          } as LinearGradient,
        ],
      },
      {
        id: "rise-50",
        position: 50.157,
        layers: [
          {
            type: "linear",
            angle: 0,
            colorStops: [
              { id: "1", color: "#56423eff", position: 18.3 },
              { id: "2", color: "#FFFFFF00", position: 21.3 },
            ],
            blendMode: "normal",
          } as LinearGradient,
          {
            type: "radial",
            shape: "circle",
            sizeType: "farthest-corner",
            positionX: 50.9,
            positionY: 6.2,
            colorStops: [
              { id: "3", color: "#ffd780ff", position: 9.4 },
              { id: "4", color: "#00000000", position: 11.6 },
            ],
            blendMode: "normal",
          } as RadialGradient,
          {
            type: "linear",
            angle: 0,
            colorStops: [
              { id: "5", color: "#edc8c5ff", position: 0 },
              { id: "6", color: "#c1ece0ff", position: 100 },
            ],
            blendMode: "normal",
          } as LinearGradient,
        ],
      },
      {
        id: "rise-100",
        position: 100,
        layers: [
          {
            type: "linear",
            angle: 0,
            colorStops: [
              { id: "1", color: "#56423eff", position: 18.3 },
              { id: "2", color: "#FFFFFF00", position: 21.3 },
            ],
            blendMode: "normal",
          } as LinearGradient,
          {
            type: "radial",
            shape: "circle",
            sizeType: "farthest-corner",
            positionX: 100,
            positionY: 100,
            colorStops: [
              { id: "3", color: "#ffbf66ff", position: 9.4 },
              { id: "4", color: "#00000000", position: 11.6 },
            ],
            blendMode: "normal",
          } as RadialGradient,
          {
            type: "linear",
            angle: 261,
            colorStops: [
              { id: "5", color: "#640750ff", position: 0 },
              { id: "6", color: "#293834ff", position: 100 },
            ],
            blendMode: "normal",
          } as LinearGradient,
        ],
      },
    ],
    animation: {
      name: "gradient-animation",
      duration: 5000,
      easing: "ease-in-out",
      iterationCount: "infinite",
      playbackRate: 1,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  // Placeholder for random template that will be generated on-demand
  {
    id: "template-random",
    name: "Random Mix",
    layers: [],
    keyframes: [],
    animation: {
      name: "gradient-animation",
      duration: 5000,
      easing: "ease-in-out",
      iterationCount: "infinite",
      playbackRate: 1,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

/**
 * Get list of all project metadata
 */
export function getProjectsList(): ProjectMetadata[] {
  if (typeof window === "undefined") return []

  const saved = localStorage.getItem(PROJECTS_LIST_KEY)
  if (!saved) return []

  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

/**
 * Save project metadata list
 */
function saveProjectsList(list: ProjectMetadata[]) {
  localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(list))
}

/**
 * Load a specific project by ID
 */
export function loadProject(id: string): ProjectState | null {
  if (typeof window === "undefined") return null

  // Check if it's a template
  const template = TEMPLATES.find((t) => t.id === id)
  if (template) {
    // Return a copy with the same ID and new timestamps
    return {
      ...template,
      id: id, // Keep template ID as-is for URL consistency
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  const saved = localStorage.getItem(PROJECT_PREFIX + id)
  if (!saved) return null

  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

/**
 * Save a project to localStorage
 */
export function saveProject(project: ProjectState) {
  const metadata: ProjectMetadata = {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }

  // Save project data
  localStorage.setItem(PROJECT_PREFIX + project.id, JSON.stringify(project))

  // Update metadata list
  const list = getProjectsList()
  const existingIndex = list.findIndex((p) => p.id === project.id)

  if (existingIndex >= 0) {
    list[existingIndex] = metadata
  } else {
    list.push(metadata)
  }

  saveProjectsList(list)
}

/**
 * Delete a project
 */
export function deleteProject(id: string) {
  localStorage.removeItem(PROJECT_PREFIX + id)

  const list = getProjectsList()
  const filtered = list.filter((p) => p.id !== id)
  saveProjectsList(filtered)
}

/**
 * Create a new blank project
 */
export function createProject(name = "New Gradient Stack"): ProjectState {
  const initialLayer: LinearGradient = {
    type: "linear",
    angle: 45,
    colorStops: [
      { id: "1", color: "#3b82f6ff", position: 0 },
      { id: "2", color: "#8b5cf6ff", position: 100 },
    ],
    blendMode: "normal",
  }

  return {
    id: generateId(),
    name,
    layers: [initialLayer],
    keyframes: [
      {
        id: generateId(),
        position: 0,
        layers: [initialLayer],
      },
    ],
    animation: {
      name: "gradient-animation",
      duration: 4000,
      easing: "ease-in-out",
      iterationCount: "infinite",
      playbackRate: 1,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
