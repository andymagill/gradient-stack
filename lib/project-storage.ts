/**
 * Project storage and management utilities
 *
 * Handles localStorage CRUD for gradient stack projects. Template data and
 * random-template generation live in lib/templates.ts — this module only
 * deals with persistence.
 */

import type { ProjectState, LinearGradient } from "./gradient-types"
import { generateId } from "./utils"

/** Storage key for list of all projects */
const PROJECTS_LIST_KEY = "gradient-stack-projects-list"
/** Storage key prefix for individual projects */
const PROJECT_PREFIX = "gradient-stack-project-"

/**
 * Deep-clones a value, preferring the native structuredClone where available.
 * Used whenever a stored/template object is handed out for mutation, so
 * callers can never accidentally share array/object references with the
 * source (see createProject and createProjectFromTemplate below — both used
 * to alias the same layer object across `layers` and `keyframes[0].layers`).
 */
const deepCloneValue = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

const cloneProjectState = (project: ProjectState): ProjectState => deepCloneValue(project)

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
 * Forks a template (or any existing project) into a brand-new saved project
 * with a fresh id and timestamps. Deep-clones so the returned project shares
 * no object references with the template it was created from.
 *
 * @param template - Project to copy
 * @param nameOverride - Name for the new project; defaults to "<template> Copy"
 */
export function createProjectFromTemplate(template: ProjectState, nameOverride?: string): ProjectState {
  const clonedTemplate = cloneProjectState(template)
  const baseName = nameOverride ?? `${template.name} Copy`

  return {
    ...clonedTemplate,
    id: generateId(),
    name: baseName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * Get list of all project metadata.
 * Returns [] outside the browser (SSR) and on any parse failure, so callers
 * never need to defend against a malformed or missing list themselves.
 */
export function getProjectsList(): ProjectMetadata[] {
  if (typeof window === "undefined") return []

  const saved = localStorage.getItem(PROJECTS_LIST_KEY)
  if (!saved) return []

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Save project metadata list.
 * @returns false if the write failed (e.g. storage quota exceeded), so
 * callers can surface the failure instead of losing data silently.
 */
function saveProjectsList(list: ProjectMetadata[]): boolean {
  if (typeof window === "undefined") return false
  try {
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(list))
    return true
  } catch (err) {
    console.error("Failed to save project list:", err)
    return false
  }
}

/**
 * Load a specific project by ID.
 *
 * IMPORTANT: templates are intentionally NOT resolved here. Loading a
 * template must go through createProjectFromTemplate first (see the editor's
 * load effect and ProjectGallery.handleOpenProject) so edits are saved under
 * a fresh project id. Resolving `template-*` ids directly here previously
 * caused a data-loss bug: the editor autosaves by id, but this function
 * would return the pristine template on every load, discarding whatever had
 * just been saved under that same id.
 *
 * @param id - Project id (never a template id)
 * @returns The saved project, or null if not found / on parse failure
 */
export function loadProject(id: string): ProjectState | null {
  if (typeof window === "undefined") return null

  const saved = localStorage.getItem(PROJECT_PREFIX + id)
  if (!saved) return null

  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

/**
 * Save a project to localStorage and update its metadata entry.
 *
 * Guarded against running outside the browser and against storage failures
 * (e.g. quota exceeded) — a failed save is reported via the return value
 * rather than thrown, since this runs from an autosave effect where an
 * uncaught exception would take down the editor.
 *
 * @returns false if the save failed
 */
export function saveProject(project: ProjectState): boolean {
  if (typeof window === "undefined") return false

  const metadata: ProjectMetadata = {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }

  try {
    localStorage.setItem(PROJECT_PREFIX + project.id, JSON.stringify(project))
  } catch (err) {
    console.error("Failed to save project:", err)
    return false
  }

  const list = getProjectsList()
  const existingIndex = list.findIndex((p) => p.id === project.id)

  if (existingIndex >= 0) {
    list[existingIndex] = metadata
  } else {
    list.push(metadata)
  }

  return saveProjectsList(list)
}

/**
 * Delete a project and its metadata entry.
 * @returns false if either localStorage write failed
 */
export function deleteProject(id: string): boolean {
  if (typeof window === "undefined") return false

  try {
    localStorage.removeItem(PROJECT_PREFIX + id)
  } catch (err) {
    console.error("Failed to delete project:", err)
    return false
  }

  const list = getProjectsList()
  const filtered = list.filter((p) => p.id !== id)
  return saveProjectsList(filtered)
}

/**
 * Create a new blank project with a single default linear gradient layer.
 */
export function createProject(name = "New Gradient Stack"): ProjectState {
  const initialLayer: LinearGradient = {
    type: "linear",
    id: generateId(),
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
        // Deep-clone so the keyframe's layer array never aliases `layers` above —
        // editing one must not silently edit the other.
        layers: deepCloneValue([initialLayer]),
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
