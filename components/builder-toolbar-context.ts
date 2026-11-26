import { createContext, type MutableRefObject } from "react"

export const BuilderToolbarContext = createContext<{
  sidebarFormatting?: boolean
  formatting: HTMLElement | null
  actions: HTMLElement | null
  applySelectionColor: MutableRefObject<((color: string) => boolean) | null> | null
}>({ formatting: null, actions: null, applySelectionColor: null })
