"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { generateFullCSS } from "@/lib/gradient-compiler"
import type { ProjectState } from "@/lib/gradient-types"
import { Copy, Download } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

interface CSSExportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  project: ProjectState
}

export function CSSExportDialog({ isOpen, onOpenChange, project }: CSSExportDialogProps) {
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Recompute only when the project actually changes, not on every render
  // (this dialog can re-render while open without the project changing).
  const cssCode = useMemo(() => generateFullCSS(project), [project])

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode)
      setCopied(true)
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleDownload = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name || "Gradient Stack Animation"}</title>
  <meta name="description" content="Animated gradient background created with Gradient Stack - Create stunning CSS gradient animations without code">
  <meta name="generator" content="Gradient Stack - https://gradient.magill.dev">
  <link rel="canonical" href="https://gradient.magill.dev">
  <style>
${cssCode}

    /* 
      ============================================
      ANIMATION USAGE:
      ============================================
      To use this gradient animation, simply add the 
      class "gradient-element" to any element. 
      The CSS above contains all the animation code.
      
      Everything below (body styles and .card) 
      is OPTIONAL styling for this demo page.
      ============================================
    */

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
    }

    /* Full-screen animated gradient container */
    .gradient-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* OPTIONAL: Card overlay styling (not required for animation) */
    .card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 3rem 2rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      text-align: center;
      max-width: 500px;
      margin: 2rem;
      position: relative;
      z-index: 10;
    }

    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    p {
      font-size: 1rem;
      color: #6b7280;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .cta {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .cta:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }

    .cta:active {
      transform: translateY(0);
    }

    @media (max-width: 640px) {
      .card {
        padding: 2rem 1.5rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      p {
        font-size: 0.875rem;
      }
    }
  </style>
</head>
<body>
  <!-- Apply the "gradient-element" class to any element for the animation -->
  <div class="gradient-container gradient-element">
    <!-- OPTIONAL: Card content (not required for animation) -->
    <div class="card">
      <h1>Beautiful Gradient Animations</h1>
      <p>Create stunning animated gradients without writing code. Build, customize, and export professional CSS animations in minutes.</p>
      <a href="https://gradient.magill.dev" class="cta">Create Your Own →</a>
    </div>
  </div>
</body>
</html>`

    const element = document.createElement("a")
    const file = new Blob([htmlContent], { type: "text/html" })
    const objectUrl = URL.createObjectURL(file)
    element.href = objectUrl
    element.download = `${project.name || "gradient-stack"}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    // Without this, each download leaks the blob for the life of the page.
    URL.revokeObjectURL(objectUrl)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl dark:bg-card dark:border-border overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Export CSS</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-transparent order-2 lg:order-1">
            <p className="font-medium text-sm mb-3">Usage Instructions:</p>
            <ol className="list-decimal list-inside space-y-2 text-xs dark:text-muted-foreground text-foreground">
              <li>Download the HTML file</li>
              <li>Open it in any browser</li>
              <li>Or copy the CSS for your own project</li>
              <li>Add an element with class "gradient-element"</li>
            </ol>
          </div>

          <div className="lg:col-span-2 overflow-hidden order-1 lg:order-2">
            <label className="text-sm font-medium block mb-2">Generated CSS</label>
            <pre className="p-4 bg-muted rounded border border-border max-h-[calc(90vh-300px)] overflow-y-auto text-sm font-mono whitespace-pre-wrap break-words">
              <code className="text-foreground">{cssCode}</code>
            </pre>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-border">
          <Button onClick={handleDownload} className="gap-2 bg-primary hover:bg-primary/90">
            <Download className="w-4 h-4" />
            Download HTML
          </Button>
          <Button onClick={handleCopy} variant="outline" className="gap-2 bg-transparent">
            <Copy className="w-4 h-4" />
            {copied ? "Copied!" : "Copy CSS"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
