/**
 * Project Gallery Component
 *
 * Displays a grid of project thumbnails including templates and user projects.
 * Supports creation, deletion, and navigation to editor.
 */

"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  getProjectsList,
  loadProject,
  deleteProject,
  createProject,
  saveProject,
  createProjectFromTemplate,
} from "@/lib/project-storage"
import type { ProjectMetadata } from "@/lib/project-storage"
import { TEMPLATES, generateRandomTemplate } from "@/lib/templates"
import { compileBackgroundCSS } from "@/lib/gradient-compiler"
import { randomColor } from "@/lib/color-utils"
import { Input } from "@/components/ui/input"

/** A quick, throwaway two-stop gradient for the "Random Mix" template card's live preview. */
function generateSimpleRandomGradient(): string {
  const angle = Math.floor(Math.random() * 360)
  return `linear-gradient(${angle}deg, ${randomColor()}, ${randomColor()})`
}

export function ProjectGallery() {
  const router = useRouter()
  const [userProjects, setUserProjects] = useState<ProjectMetadata[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [projectBackgrounds, setProjectBackgrounds] = useState<Record<string, string>>({})

  const refreshProjects = useCallback(() => {
    const projects = getProjectsList()
    setUserProjects(projects)
    const backgrounds: Record<string, string> = {}
    projects.forEach(({ id }) => {
      const project = loadProject(id)
      if (!project) {
        backgrounds[id] = "transparent"
        return
      }

      const layers = project.keyframes.length > 0 ? project.keyframes[0].layers : project.layers
      backgrounds[id] = compileBackgroundCSS(layers)
    })
    setProjectBackgrounds(backgrounds)
  }, [])

  // Load user projects on mount
  useEffect(() => {
    refreshProjects()
  }, [refreshProjects])

  // Create new project
  const handleCreateNew = () => {
    const newProject = createProject()
    saveProject(newProject)
    refreshProjects()
    router.push(`/editor/${newProject.id}`)
  }

  // Open project or create from template
  const handleOpenProject = (id: string, isTemplate?: boolean) => {
    if (isTemplate) {
      let template
      if (id === "template-random") {
        template = generateRandomTemplate()
      } else {
        template = TEMPLATES.find((t) => t.id === id)
      }

      if (!template) return

      const newProject = createProjectFromTemplate(template)

      // Save and refresh
      saveProject(newProject)
      refreshProjects()

      // Navigate to the new project
      router.push(`/editor/${newProject.id}`)
      return
    } else {
      // Open existing saved project
      router.push(`/editor/${id}`)
    }
  }

  // Delete project
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Delete this gradient stack?")) {
      deleteProject(id)
      refreshProjects()
    }
  }

  // Generate thumbnail background CSS
  const getThumbnailCSS = (id: string, isTemplate?: boolean) => {
    if (isTemplate && id === "template-random") {
      return ""
    }

    if (isTemplate) {
      // For templates, directly access template data to avoid SSR issues with loadProject
      const template = TEMPLATES.find((t) => t.id === id)
      if (!template || !template.layers || template.layers.length === 0) {
        return "transparent"
      }
      const layers =
        template.keyframes && template.keyframes.length > 0 ? template.keyframes[0].layers : template.layers
      return compileBackgroundCSS(layers)
    }

    return projectBackgrounds[id] ?? "transparent"
  }

  const filteredProjects = userProjects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main content */}
      <div className="flex-1 p-8">
        <header className="mb-12">
          <div className="mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">
              Gradient Stack
            </h1>
          </div>
          <p className="text-muted-foreground">Create and manage animated gradient backgrounds</p>
        </header>

        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button
            onClick={handleCreateNew}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Stack
          </Button>
          <Input
            type="search"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* User Projects Section */}
        {userProjects.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">
              Your Animations {filteredProjects.length > 0 && `(${filteredProjects.length})`}
            </h2>
            {filteredProjects.length === 0 && searchTerm ? (
              <p className="text-muted-foreground italic">No projects found matching your search.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    backgroundCSS={getThumbnailCSS(project.id)}
                    onClick={() => handleOpenProject(project.id, false)}
                    onDelete={(e) => handleDeleteProject(project.id, e)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {userProjects.length === 0 && !searchTerm && (
          <p className="text-muted-foreground italic mb-12">No projects yet. Create your first gradient stack!</p>
        )}

        {/* Templates Section */}
        {TEMPLATES.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">Templates</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {TEMPLATES.map((template) => (
                <ProjectCard
                  key={template.id}
                  id={template.id}
                  name={template.name}
                  backgroundCSS={getThumbnailCSS(template.id, true)}
                  onClick={() => handleOpenProject(template.id, true)}
                  isTemplate
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="bg-muted/50 border-t border-border mt-12 py-6 text-center text-sm text-muted-foreground">
        Built with ♥ by{" "}
        <a href="https://magill.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Andrew Magill
        </a>
      </footer>
    </div>
  )
}

interface ProjectCardProps {
  id: string
  name: string
  backgroundCSS: string
  onClick: () => void
  onDelete?: (e: React.MouseEvent) => void
  isTemplate?: boolean
}

function ProjectCard({ id, name, backgroundCSS, onClick, onDelete, isTemplate }: ProjectCardProps) {
  const isRandomTemplate = isTemplate && id === "template-random"
  const [currentBackground, setCurrentBackground] = useState(backgroundCSS)

  useEffect(() => {
    if (isRandomTemplate) {
      setCurrentBackground(generateSimpleRandomGradient())
    } else {
      setCurrentBackground(backgroundCSS)
    }
  }, [backgroundCSS, isRandomTemplate])

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-2 border-border hover:border-primary transition-all bg-card py-0"
      onClick={onClick}
    >
      {/* Thumbnail Preview */}
      <div
        className="h-48 w-full flex items-center justify-center"
        style={{ background: currentBackground }}
      >
        {isRandomTemplate && <span className="text-6xl font-bold text-background opacity-80">?</span>}
      </div>

      {/* Project Info */}
      <div className="bg-card/95 backdrop-blur px-3 py-2">
        <h3 className="font-semibold truncate text-foreground">{name}</h3>
        {isTemplate && <span className="text-xs text-chart-1 inline-block">Template</span>}
      </div>

      {/* Delete Button (not shown for templates) */}
      {!isTemplate && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </Card>
  )
}
