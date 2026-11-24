import { createContext } from "react"

export const BuilderToolbarContext = createContext<{
  inlineFormatting: boolean
  actions: HTMLElement | null
}>({ inlineFormatting: false, actions: null })
