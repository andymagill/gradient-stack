"use client"

import { useParams, useRouter } from "next/navigation"
import { PreviewCanvas } from "@/components/preview-canvas"
import { LayerManager } from "@/components/layer-manager"
import { PropertyEditor } from "@/components/property-editor"
import { Timeline } from "@/components/timeline"
import { CSSExportDialog } from "@/components/css-export-dialog"
import { useProjectEditor } from "@/hooks/use-project-editor"
import { ArrowLeft, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Editor Page - Main gradient animation editor interface
 *
 * =============================================================================
 * CRITICAL LAYOUT ARCHITECTURE - DO NOT CHANGE WITHOUT READING THIS
 * =============================================================================
 *
 * REQUIREMENT 1: PREVIEW FILLS ENTIRE VIEWPORT
 * - The PreviewCanvas MUST be fixed position with inset-0
 * - It fills 100vw x 100vh as the background layer (z-0)
 * - This is NON-NEGOTIABLE - the preview is the primary content
 *
 * REQUIREMENT 2: ALL PANELS OVERLAY THE PREVIEW
 * - Header, property editor, layer manager, and timeline ALL overlay the preview
 * - Panels use pointer-events-auto so they're interactive
 * - The spacer element allows click-through to the preview
 *
 * REQUIREMENT 3: NO PANEL-LEVEL BACKGROUNDS IN EDITOR PAGE
 * - The aside/header/footer containers have NO backgrounds
 * - Backgrounds are handled INSIDE the child components (PropertyEditor, LayerManager, Timeline)
 * - This ensures the preview extends to all edges of the viewport
 *
 * REQUIREMENT 4: PANELS USE FLEXBOX FLOW LAYOUT
 * - Panels are in a single fixed overlay container (z-10)
 * - The container uses flexbox so panels push each other naturally
 * - Property editor pushes layer manager right, timeline stays at bottom
 *
 * REQUIREMENT 5: NO STICKY ELEMENTS - ALL PANELS SCROLL TOGETHER
 * - Header, panels, and timeline are all part of the same scroll container
 * - On mobile and desktop, all UI elements scroll together as one group
 * - There are no fixed or sticky elements within the overlay container
 *
 * STRUCTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Fixed z-0: PreviewCanvas fills entire viewport]           │
 * │ ┌─────────────────────────────────────────────────────────┐ │
 * │ │ [Fixed z-10: Scrollable panel overlay]                 │ │
 * │ │ ┌─────────────────────────────────────────────────────┐ │ │
 * │ │ │ HEADER (floating buttons with their own bg)         │ │ │
 * │ │ ├─────────────────────────────────────────────────────┤ │ │
 * │ │ │ MAIN (flex-row on desktop, flex-col on mobile)      │ │ │
 * │ │ │ [PropertyEditor*] | [spacer] | [LayerManager*]      │ │ │
 * │ │ ├─────────────────────────────────────────────────────┤ │ │
 * │ │ │ TIMELINE (footer - has internal bg)                 │ │ │
 * │ │ └─────────────────────────────────────────────────────┘ │ │
 * │ └─────────────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────┘
 *
 * All state orchestration (loading, autosave, layer/keyframe editing) lives
 * in useProjectEditor — this file is layout plus wiring only.
 */
export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
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
    setAnimationConfig,
    replaceLayer,
    addLayer,
    removeLayerFromProject,
    reorderLayers,
    duplicateLayer,
    handleSelectLayer,
    setActiveLayerIndex,
  } = useProjectEditor(projectId)

  if (!project) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading project...</p>
      </div>
    )
  }

  return (
    <>
      {/*
        LAYER 1: PREVIEW CANVAS (Background)
        CRITICAL: Fixed, fills entire viewport, sits behind everything (z-0)
      */}
      <div className="fixed inset-0 z-0">
        <PreviewCanvas project={project} playbackTime={playbackTime} isPlaying={isPlaying} />
      </div>

      {/*
        LAYER 2: PANEL OVERLAY CONTAINER
        CRITICAL: Fixed overlay, flexbox layout, scrollable, NO backgrounds on containers
        Backgrounds are handled by child components internally

        ALL ELEMENTS SCROLL TOGETHER: Header, panels, and timeline are all part of the same scroll group

        MOBILE VIEWPORT HEIGHT: Uses min-h-dvh (dynamic viewport height) which accounts for
        mobile browser address bar. Falls back to min-h-screen for browsers without dvh support.
        DO NOT use 100vh or min-h-screen alone - they don't work correctly on mobile browsers.
      */}
      <div className="fixed inset-0 z-10 flex flex-col min-h-[100dvh] overflow-auto pointer-events-auto supports-[height:100dvh]:min-h-[100dvh]">
        <header className="flex items-center gap-3 p-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-accent bg-card/80 backdrop-blur"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Gallery</span>
          </Button>

          <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-3 py-1.5 rounded-lg border border-border">
            {isEditingName ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameChange()
                  if (e.key === "Escape") {
                    setEditedName(project.name)
                    setIsEditingName(false)
                  }
                }}
                className="h-6 bg-input border-border text-foreground text-sm"
                autoFocus
              />
            ) : (
              <>
                <span className="font-semibold text-foreground text-sm">{project.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => setIsEditingName(true)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </header>

        <main className="flex flex-col md:flex-row p-2 gap-2 flex-1">
          <aside
            className={`
              order-2 md:order-1 shrink-0 overflow-hidden
              transition-all duration-300 ease-in-out
              ${activeLayer ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"}
            `}
            style={{
              display: "grid",
              gridTemplateRows: activeLayer ? "1fr" : "0fr",
            }}
          >
            <div className="overflow-hidden">
              {activeLayer && (
                <PropertyEditor
                  layer={activeLayer}
                  onChange={(updatedLayer) => {
                    if (activeLayerIndex !== null) {
                      replaceLayer(activeLayerIndex, updatedLayer)
                    }
                  }}
                  onClose={() => setActiveLayerIndex(null)}
                />
              )}
            </div>
          </aside>

          {/* SPACER - Click-through to preview */}
          <div className="flex-1 order-3 md:order-2 pointer-events-none" />

          {/* LAYER MANAGER - Content-width, internal background */}
          <aside className="order-1 md:order-3 self-end md:self-start shrink-0">
            <LayerManager
              layers={displayLayers}
              activeLayerIndex={activeLayerIndex}
              onSelectLayer={handleSelectLayer}
              onRemoveLayer={(index) => {
                if (selectedKeyframe) {
                  const newLayers = displayLayers.filter((_, i) => i !== index)
                  updateKeyframe(selectedKeyframe.id, { layers: newLayers })
                } else {
                  removeLayerFromProject(index)
                }
              }}
              onReorderLayers={(fromIndex, toIndex) => {
                if (selectedKeyframe) {
                  const newLayers = [...displayLayers]
                  const [removed] = newLayers.splice(fromIndex, 1)
                  newLayers.splice(toIndex, 0, removed)
                  updateKeyframe(selectedKeyframe.id, { layers: newLayers })
                } else {
                  reorderLayers(fromIndex, toIndex)
                }
              }}
              onAddLayer={(layer) => {
                if (selectedKeyframe) {
                  updateKeyframe(selectedKeyframe.id, { layers: [layer, ...displayLayers] })
                  setActiveLayerIndex(0)
                } else {
                  addLayer(layer)
                }
              }}
              onExport={() => setExportDialogOpen(true)}
              onUpdateLayer={replaceLayer}
              onDuplicateLayer={duplicateLayer}
            />
          </aside>
        </main>

        <footer className="px-4 py-3 shrink-0">
          <Timeline
            keyframes={project.keyframes}
            animationConfig={project.animation}
            playbackTime={playbackTime}
            selectedKeyframeId={selectedKeyframeId}
            isPlaying={isPlaying}
            onTimeChange={setPlaybackTime}
            onAddKeyframe={(position) => addKeyframe(position)}
            onCopyKeyframe={copyKeyframe}
            onRemoveKeyframe={removeKeyframe}
            onUpdateKeyframe={updateKeyframe}
            onSelectKeyframe={setSelectedKeyframeId}
            onAnimationConfigChange={setAnimationConfig}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            onDeselectLayer={() => setActiveLayerIndex(null)}
          />
        </footer>
      </div>

      {/* Export Dialog */}
      <CSSExportDialog isOpen={exportDialogOpen} onOpenChange={setExportDialogOpen} project={project} />
    </>
  )
}
