import { createContext } from "react"

export const BuilderToolbarContext = createContext<{
  formatting: HTMLElement | null
  actions: HTMLElement | null
}>({ formatting: null, actions: null })
