import { useCallback, useRef } from "react"
import type { EmailComponent } from "@/types/email-builder"

/**
 * Returns a debounced version of `onUpdateComponent`.
 *
 * - Rapid calls (e.g. typing in a text input) are coalesced — only the last
 *   call within `delay` ms is forwarded to the store.
 * - Non-text fields (images, booleans, selects) should call the original
 *   `onUpdateComponent` directly so they feel instant. Pass `immediate: true`
 *   as the third argument to bypass debouncing on a per-call basis.
 */
export function useDebouncedUpdate(
  onUpdateComponent: (updates: Partial<EmailComponent>) => void,
  delay = 300
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Partial<EmailComponent>>({})

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (Object.keys(pendingRef.current).length > 0) {
      onUpdateComponent(pendingRef.current)
      pendingRef.current = {}
    }
  }, [onUpdateComponent])

  const debouncedUpdate = useCallback(
    (updates: Partial<EmailComponent>, immediate = false) => {
      if (immediate) {
        // Flush any pending debounced updates first, then apply immediately
        flush()
        onUpdateComponent(updates)
        return
      }

      // Merge new updates into pending batch
      pendingRef.current = { ...pendingRef.current, ...updates }

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onUpdateComponent(pendingRef.current)
        pendingRef.current = {}
        timerRef.current = null
      }, delay)
    },
    [onUpdateComponent, delay, flush]
  )

  return { debouncedUpdate, flush }
}
