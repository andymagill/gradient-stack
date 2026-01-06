"use client"

import { ProjectGallery } from "@/components/project-gallery"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  return (
    <div>
      <ProjectGallery />
    </div>
  )
}
