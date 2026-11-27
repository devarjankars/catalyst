"use client"

import { useState } from "react"
import { useDrag } from "react-dnd"
import { Trash2, Type, Image as ImageIcon, Boxes, LayoutGrid, Bookmark, Search, X } from "lucide-react"
import type { EmailComponent } from "@/types/email-builder"
import { componentTypes } from "@/data/component-types"
import { sectionTemplates } from "@/data/section-templates"
import { Button } from "./ui/button"
import { useEmailBuilderStore } from "@/store/email-builder-store"
import { toast } from "sonner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ImageGallery } from "./image-gallery"
import { BRANDS, type Brand } from "./brand-selection-modal"

/** Categories shown for each brand — can include multiple categories */
const BRAND_CATEGORY_MAP: Record<Brand, string[]> = {
  orserdu:  ["custom"],
  geron:    ["geron"],
  idorsia:  ["idorsia"],
  elzonris: ["elzonris"],
}

interface ComponentPaletteProps {
  onAddComponent: (component: EmailComponent, index?: number) => void
  customComponents: EmailComponent[]
  disabled?: boolean
  /** The brand selected by the user on the landing page */
  selectedBrand?: Brand
  // Optional callbacks to support external selection/update contexts (e.g., three-canvas)
  getSelectionInfo?: () => { components: any[]; selectedComponent: string | null } | undefined
  applyUpdates?: (updates: any, parentId?: string | null) => void
}

type PaletteComponent = (typeof componentTypes)[number] | (typeof sectionTemplates)[number] | EmailComponent

function getComponentLabel(component: PaletteComponent) {
  return "label" in component ? component.label : component.name || `Custom ${component.type}`
}

function DraggableComponent({
  componentType,
  defaults,
  onAddComponent,
  isCustom = false,
  isTemplate = false,
  disabled = false,
}: {
  componentType: PaletteComponent
  onAddComponent: (component: EmailComponent, index?: number) => void
  defaults?: Partial<EmailComponent>
  isCustom?: boolean
  isTemplate?: boolean
  disabled?: boolean
}) {
  const addComponent = (index?: number) => {
    const component = {
      type: componentType.type,
      ...("defaultProps" in componentType ? componentType.defaultProps : componentType),
      ...defaults,
      id: "",
    } as EmailComponent
    const assignChildIds = (children: EmailComponent[]): EmailComponent[] => children.map(child => ({
      ...child,
      id: `${child.type}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      ...(child.children ? { children: assignChildIds(child.children) } : {}),
    }))
    if (component.children) component.children = assignChildIds(component.children)
    onAddComponent(component, index)
  }

  const [{ isDragging }, drag] = useDrag({
    type: "component",
    canDrag: () => !disabled,
    item: {
      type: componentType.type,
      fromPalette: true,
      ...("defaultProps" in componentType ? componentType.defaultProps : componentType),
      ...defaults,
      isCustom,
      isTemplate,
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult() as { dropZone: string; dropIndex?: number; handled?: boolean } | null

      // The canvas drop() handler inserts the component and returns handled:true.
      // If handled is true, or there is no result at all, do nothing — the canvas
      // already took care of it (or the drag was cancelled).
      // Only proceed when there IS a result but it wasn't handled (e.g. a custom
      // drop target that doesn't know about our component system).
      if (!dropResult || dropResult.handled) return

      // If we reach here we have a result without handled:true but also without
      // a dropIndex — that means the section-drop-zone fired without a computed
      // index. Don't append to the bottom; bail out.
      if (dropResult.dropIndex === undefined) return

      addComponent(dropResult.dropIndex)
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const Icon = "icon" in componentType ? componentType.icon : Type
  const label = getComponentLabel(componentType)
  const { deleteCustomComponent } = useEmailBuilderStore()

  return (
    <div
      ref={(node) => { if (node) drag(node) }}
      className={`group relative rounded-lg border border-slate-200 bg-white transition-colors
        motion-reduce:transition-none ${isDragging ? "opacity-40" : ""}
        ${disabled ? "opacity-50" : "hover:border-blue-200 hover:bg-blue-50/40"}`}
    >
      <button type="button" disabled={disabled} aria-label={`Add ${label}`} title={label}
        className="flex min-h-[64px] w-full cursor-grab flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-center active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed"
        onClick={() => addComponent()}>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md
          ${isCustom ? "bg-violet-50 text-violet-600" : isTemplate ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700"}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-700">{label}</span>
      </button>
      {isCustom && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Delete saved block"
          aria-label={`Delete ${label}`}
          disabled={disabled}
          className="absolute right-0.5 top-0.5 h-6 w-6 rounded bg-white text-slate-500 hover:bg-red-50 hover:text-red-600"
          onClick={async () => {
            const ok = await deleteCustomComponent((componentType as EmailComponent).id)
            if (ok) {
              toast.success("Saved block deleted")
            } else {
              toast.error("Could not delete saved block")
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

export function ComponentPalette({ onAddComponent, customComponents, disabled = false, selectedBrand, getSelectionInfo, applyUpdates }: ComponentPaletteProps) {
  const [search, setSearch] = useState("")
  const [openSections, setOpenSections] = useState(["basic"])
  const query = search.trim().toLowerCase()
  const brand = BRANDS.find(entry => entry.id === (selectedBrand ?? "orserdu")) ?? BRANDS[0]
  const standard = componentTypes.filter(component => component.type !== "section")
  const groups = [
    { id: "basic", label: "Basic", icon: Boxes, items: standard.filter(component => component.category === "basic") },
    { id: "brand", label: brand.label, icon: null, items: standard.filter(component =>
      component.type !== "orserdu-isi-animated" && BRAND_CATEGORY_MAP[brand.id].includes(component.category ?? "")) },
    { id: "sections", label: "Sections", icon: LayoutGrid, items: sectionTemplates },
    { id: "saved", label: "Saved Blocks", icon: Bookmark, items: customComponents },
  ].map(group => ({
    ...group,
    items: group.items.filter(component => `${getComponentLabel(component)} ${component.type}`.toLowerCase().includes(query)),
  }))
  const visibleGroups = query ? groups.filter(group => group.items.length) : groups
  const triggerClass = "rounded-md px-2 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-slate-100 px-3 py-3">
        <div className="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 focus-within:border-blue-500 focus-within:bg-white">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
          <input type="text" value={search} onChange={event => setSearch(event.currentTarget.value)}
            placeholder="Find a component" aria-label="Find a component"
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-500"
            onKeyDown={event => { if (event.key === "Escape") setSearch("") }} />
          {search && <button type="button" aria-label="Clear component search" onClick={() => setSearch("")}
            className="grid h-5 w-5 place-items-center rounded text-slate-500 hover:bg-slate-200 focus-visible:outline focus-visible:outline-blue-500">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1">
        {disabled && (
          <p className="mx-1 my-2 rounded-md bg-amber-50 px-2 py-2 text-xs text-amber-800">
            Components are locked in header-only mode for Options 2 and 3.
          </p>
        )}
        {visibleGroups.length === 0 && <p role="status" className="px-2 py-3 text-xs text-slate-600">No components found.</p>}
        <Accordion type="multiple" value={query ? visibleGroups.map(group => group.id) : openSections}
          onValueChange={value => { if (!query) setOpenSections(value) }}>
          {!query && (
            <AccordionItem value="images" className="border-slate-100 py-1">
              <AccordionTrigger className={triggerClass}>
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />Images
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-2">
                <ImageGallery getSelectionInfo={getSelectionInfo} applyUpdates={applyUpdates} />
              </AccordionContent>
            </AccordionItem>
          )}
          {visibleGroups.map(({ id, label, icon: Icon, items }) => (
            <AccordionItem key={id} value={id} className="border-slate-100 py-1">
              <AccordionTrigger className={triggerClass}>
                <span className="flex items-center gap-2">
                  {Icon ? <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    : <span className="grid h-4 w-4 place-items-center rounded text-[9px]" aria-hidden="true"
                        style={{ backgroundColor: brand.iconBg, color: brand.iconText }}>{brand.symbol}</span>}
                  {label}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0">
                {items.length ? <div className="grid grid-cols-2 gap-1.5 px-1 pb-1">{items.map((component, index) => (
                  <DraggableComponent key={`${component.type}-${"id" in component ? component.id : index}`}
                    componentType={component} onAddComponent={onAddComponent}
                    defaults={selectedBrand === "orserdu" && component.type === "text" && id === "basic" ? { fontSize: "14px", lineHeight: "20px" } : undefined}
                    isCustom={id === "saved"} isTemplate={id === "sections"} disabled={disabled} />
                ))}</div> : <p className="px-2 py-2 text-xs text-slate-500">{id === "saved" ? "No saved blocks yet." : "No components available."}</p>}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
