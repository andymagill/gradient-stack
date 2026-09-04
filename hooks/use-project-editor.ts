/**
 * Project editor orchestration hook
 *
 * Owns everything about a single project's edit session that ISN'T layout:
 * loading it from storage (forking templates into real projects first),
 * debounced autosave, layer CRUD, name editing, and layer/keyframe selection.
 * Composes useAnimation for playback and keyframe operations.
 *
 * Extracted from app/editor/[id]/page.tsx so that file can stay focused on
 * the (intentionally non-negotiable, see docs/LAYOUT_ARCHITECTURE.md) JSX
 * layout, without state logic interleaved through it.
 */

"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { loadProject, saveProject, createProjectFromTemplate } from "@/lib/project-storage"
import { TEMPLATES, generateRandomTemplate } from "@/lib/templates"
import type { ProjectState, Layer } from "@/lib/gradient-types"
import { generateId } from "@/lib/utils"
import { useAnimation } from "./use-animation"

/** Autosave debounce: batches rapid changes (e.g. a slider drag) into one write. */
const AUTOSAVE_DEBOUNCE_MS = 300

export function useProjectEditor(projectId: string) {
  const router = useRouter()

  const [project, setProject] = useState<ProjectState | null>(null)
  const [activeLayerIndex, setActiveLayerIndex] = useState<number | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Project name editing state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")

  // Load the project from storage on mount / when the id changes.
  //
  // Templates are forked into a real, freshly-id'd project BEFORE we ever
  // start editing: loadProject() intentionally never resolves template ids
  // (see its docstring) because autosaving edits back onto a template id
  // would be silently overwritten by the pristine template on next load.
  useEffect(() => {
    let cancelled = false

    if (projectId.startsWith("template-")) {
      const template = projectId === "template-random" ? generateRandomTemplate() : TEMPLATES.find((t) => t.id === projectId)

      if (!template) {
        router.push("/")
        return
      }

      const forked = createProjectFromTemplate(template)
      saveProject(forked)
      if (!cancelled) {
        setProject(forked)
        setEditedName(forked.name)
        router.replace(`/editor/${forked.id}`)
      }
      return () => {
        cancelled = true
      }
    }

    const loaded = loadProject(projectId)
    if (!loaded) {
      router.push("/")
      return
    }
    setProject(loaded)
    setEditedName(loaded.name)

    return () => {
      cancelled = true
    }
  }, [projectId, router])

  // Debounced autosave: a raw per-keystroke/per-slider-tick write would
  // re-serialize the whole project on every animation frame during a drag.
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!project) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveProject(project)
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [project])

  // Animation hook manages playback, interpolation, and keyframe operations.
  // project may still be null while loading; useAnimation tolerates that.
  const updateProject = useCallback((updates: Partial<ProjectState>) => {
    setProject((prev) => (prev ? { ...prev, ...updates, updatedAt: Date.now() } : null))
  }, [])

  const {
    isPlaying,
    setIsPlaying,
    playbackTime,
    setPlaybackTime,
    selectedKeyframeId,
    setSelectedKeyframeId,
    addKeyframe,
    copyKeyframe,
    removeKeyframe,
    updateKeyframe,
    updateKeyframeLayer,
    setAnimationConfig,
    getFrameAtTime,
  } = useAnimation(project, updateProject)

  const selectedKeyframe = useMemo(
    () => (project && selectedKeyframeId ? project.keyframes.find((kf) => kf.id === selectedKeyframeId) ?? null : null),
    [project, selectedKeyframeId],
  )

  // The layer stack currently shown: a selected keyframe's layers when
  // editing one directly, otherwise the interpolated frame at playbackTime.
  const displayLayers = useMemo(() => {
    if (!project) return []
    return selectedKeyframe ? selectedKeyframe.layers : getFrameAtTime(playbackTime)
  }, [project, selectedKeyframe, getFrameAtTime, playbackTime])

  const activeLayer = activeLayerIndex !== null ? displayLayers[activeLayerIndex] : undefined

  /** Add a new layer to the top of the stack (index 0) and select it. */
  const addLayer = useCallback((layer: Layer) => {
    setProject((prev) => (prev ? { ...prev, layers: [layer, ...prev.layers], updatedAt: Date.now() } : prev))
    setActiveLayerIndex(0)
  }, [])

  /** Remove a layer from the base (non-keyframe) layer stack. */
  const removeLayerFromProject = useCallback((index: number) => {
    setProject((prev) =>
      prev ? { ...prev, layers: prev.layers.filter((_, i) => i !== index), updatedAt: Date.now() } : prev,
    )
  }, [])

  /** Reorder base layers via drag-and-drop. */
  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setProject((prev) => {
      if (!prev) return prev
      const newLayers = [...prev.layers]
      const [removed] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, removed)
      return { ...prev, layers: newLayers, updatedAt: Date.now() }
    })
  }, [])

  /** Commit the project-name edit field, or discard on empty input. */
  const handleNameChange = useCallback(() => {
    setProject((prev) => {
      if (!prev) return prev
      if (!editedName.trim()) {
        setEditedName(prev.name)
        setIsEditingName(false)
        return prev
      }
      setIsEditingName(false)
      return { ...prev, name: editedName, updatedAt: Date.now() }
    })
  }, [editedName])

  /**
   * Selects a layer for editing, toggling it off if already selected.
   *
   * WHY THE AUTO-KEYFRAME LOGIC: editing a layer with no keyframe selected
   * would edit the interpolated-at-playback-time frame, which isn't stored
   * anywhere — the edit would be lost the instant playback moved on. So the
   * first time a layer is selected with nothing else selected, we snap to
   * the nearest keyframe (and pause playback) to give the edit somewhere
   * real to land.
   */
  const handleSelectLayer = useCallback(
    (index: number) => {
      if (index === activeLayerIndex) {
        setActiveLayerIndex(null)
        return
      }

      if (!selectedKeyframeId && project && project.keyframes.length > 0) {
        const duration = project.animation?.duration || 3000
        const timePercent = ((playbackTime % duration) / duration) * 100

        let closestKeyframe = project.keyframes[0]
        let minDistance = Math.abs(closestKeyframe.position - timePercent)

        for (const kf of project.keyframes) {
          const distance = Math.abs(kf.position - timePercent)
          if (distance < minDistance) {
            minDistance = distance
            closestKeyframe = kf
          }
        }

        setSelectedKeyframeId(closestKeyframe.id)
        setPlaybackTime((closestKeyframe.position / 100) * duration)
        setIsPlaying(false)
      }

      setActiveLayerIndex(index)
    },
    [activeLayerIndex, selectedKeyframeId, project, playbackTime, setSelectedKeyframeId, setPlaybackTime, setIsPlaying],
  )

  /** Duplicate a layer in-place, inserting the copy directly after the original. */
  const duplicateLayer = useCallback(
    (index: number) => {
      const layerToCopy = displayLayers[index]
      if (!layerToCopy) return
      // Fresh id: a cloned layer must not share React-key identity with its
      // source, or LayerManager's list would render two rows keyed alike.
      const duplicatedLayer: Layer = { ...JSON.parse(JSON.stringify(layerToCopy)), id: generateId() }

      if (selectedKeyframe) {
        const newLayers = [...displayLayers]
        newLayers.splice(index + 1, 0, duplicatedLayer)
        updateKeyframe(selectedKeyframe.id, { layers: newLayers })
      } else {
        setProject((prev) => {
          if (!prev) return prev
          const newLayers = [...prev.layers]
          newLayers.splice(index + 1, 0, duplicatedLayer)
          return { ...prev, layers: newLayers, updatedAt: Date.now() }
        })
      }
    },
    [displayLayers, selectedKeyframe, updateKeyframe],
  )

  /**
   * Replaces a layer at `index` with a full replacement, routing through
   * updateKeyframeLayer when a keyframe is selected or the base layer stack
   * otherwise. This is the single path for "a layer's contents changed" —
   * used by the visibility toggle, and by PropertyEditor for every field
   * edit on the active layer.
   */
  const replaceLayer = useCallback(
    (index: number, layer: Layer) => {
      if (selectedKeyframe) {
        updateKeyframeLayer(selectedKeyframe.id, index, layer)
      } else {
        setProject((prev) => {
          if (!prev) return prev
          const newLayers = prev.layers.map((l, i) => (i === index ? layer : l))
          return { ...prev, layers: newLayers, updatedAt: Date.now() }
        })
      }
    },
    [selectedKeyframe, updateKeyframeLayer],
  )

  return {
    project,
    activeLayerIndex,
    activeLayer,
    displayLayers,
    selectedKeyframe,
    exportDialogOpen,
    setExportDialogOpen,
    isEditingName,
    setIsEditingName,
    editedName,
    setEditedName,
    handleNameChange,
    // Animation / playback
    isPlaying,
    setIsPlaying,
    playbackTime,
    setPlaybackTime,
    selectedKeyframeId,
    setSelectedKeyframeId,
    addKeyframe,
    copyKeyframe,
    removeKeyframe,
    updateKeyframe,
    updateKeyframeLayer,
    setAnimationConfig,
    // Layer operations
    replaceLayer,
    addLayer,
    removeLayerFromProject,
    reorderLayers,
    duplicateLayer,
    handleSelectLayer,
    setActiveLayerIndex,
  }
}
