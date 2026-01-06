import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate unique ID for projects
 */
export function generateId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
