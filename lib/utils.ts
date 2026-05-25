import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse dates from API responses (MySQL can return various formats)
 * Handles: "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.sssZ", Date objects, null/undefined
 */
export function parseApiDate(dateValue: string | Date | null | undefined): Date {
  if (!dateValue) return new Date()
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? new Date() : dateValue
  }
  
  // If it's a string
  const dateStr = String(dateValue)
  
  // Handle ISO format with time (e.g., "2026-05-25T00:00:00.000Z")
  if (dateStr.includes('T')) {
    const parsed = new Date(dateStr)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }
  
  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parsed = new Date(dateStr + 'T00:00:00')
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }
  
  // Try parsing as-is
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}
