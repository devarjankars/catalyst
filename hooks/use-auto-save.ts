import { useEffect, useRef, useCallback } from "react"
import type { EmailComponent } from "@/types/email-builder"

const AUTO_SAVE_KEY = "email_builder_autosave"
const AUTO_SAVE_INTERVAL_MS = 5000 // 5 seconds

export interface AutoSavePayload {
  components: EmailComponent[]
  option2Components: EmailComponent[]
  option3Components: EmailComponent[]
  preheaderText: string
  templateId: string | null
  templateName: string | null
  savedAt: string // ISO timestamp
}

/**
 * Periodically writes the current editor state to localStorage.
 * Call `clearAutoSave()` after a successful explicit save to avoid
 * showing a stale restore prompt on next load.
 */
export function useAutoSave(
  payload: Omit<AutoSavePayload, "savedAt">,
  enabled: boolean
) {
  const payloadRef = useRef(payload)
  payloadRef.current = payload

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      try {
        const data: AutoSavePayload = {
          ...payloadRef.current,
          savedAt: new Date().toISOString(),
        }
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data))
      } catch {
        // localStorage can throw if storage is full — silently ignore
      }
    }, AUTO_SAVE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [enabled])
}

/** Remove the auto-save entry — call after a successful explicit save */
export function clearAutoSave() {
  try {
    localStorage.removeItem(AUTO_SAVE_KEY)
  } catch {}
}

/** Read the last auto-saved payload, or null if none exists */
export function getAutoSave(): AutoSavePayload | null {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AutoSavePayload
  } catch {
    return null
  }
}
