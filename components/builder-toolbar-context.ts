import { createContext, type Dispatch, type MutableRefObject, type SetStateAction } from "react"

export type SelectionColor = { editorId: string; componentId: string; color: string }

export const BuilderToolbarContext = createContext<{
  sidebarFormatting?: boolean
  selectionColor?: SelectionColor | null
  setSelectionColor?: Dispatch<SetStateAction<SelectionColor | null>>
  formatting: HTMLElement | null
  actions: HTMLElement | null
  applySelectionColor: MutableRefObject<((color: string) => boolean) | null> | null
}>({ formatting: null, actions: null, applySelectionColor: null })
