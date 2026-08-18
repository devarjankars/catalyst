"use client"

import { useDrag } from "react-dnd"
import { Trash2, Type, Image as ImageIcon, Boxes, Pill, Building2, Sparkles, LayoutGrid, Bookmark, FlaskConical } from "lucide-react"
import type { EmailComponent } from "@/types/email-builder"
import { componentTypes } from "@/data/component-types"
import { sectionTemplates } from "@/data/section-templates"
import { CustomComponentCreator } from "./custom-component-creator"
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

interface ComponentPaletteProps {
  onAddComponent: (component: EmailComponent, index?: number) => void
  customComponents: EmailComponent[]
  disabled?: boolean
  // Optional callbacks to support external selection/update contexts (e.g., three-canvas)
  getSelectionInfo?: () => { components: any[]; selectedComponent: string | null } | undefined
  applyUpdates?: (updates: any, parentId?: string | null) => void
}

function DraggableComponent({
  componentType,
  onAddComponent,
  isCustom = false,
  isTemplate = false,
  disabled = false,
}: {
  componentType: (typeof componentTypes)[0] | (typeof sectionTemplates)[0] | EmailComponent
  onAddComponent: (component: EmailComponent, index?: number) => void
  isCustom?: boolean
  isTemplate?: boolean
  disabled?: boolean
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "component",
    canDrag: () => !disabled,
    item: {
      type: componentType.type,
      fromPalette: true,
      ...("defaultProps" in componentType ? componentType.defaultProps : componentType),
      isCustom,
      isTemplate,
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult() as { dropZone: string; dropIndex?: number; handled?: boolean } | null

      // Only handle if the canvas didn't already handle it
      if (dropResult && !dropResult.handled) {
        // Generate unique IDs for children if they exist
        const componentData = {
          id: "",
          type: componentType.type,
          ...("defaultProps" in componentType ? componentType.defaultProps : componentType),
        } as unknown as EmailComponent
        // Always regenerate the top-level id so dropped instances never collide
        componentData.id = ""

        // Generate unique IDs for nested components
        if (componentData.children) {
          componentData.children = componentData.children.map((child: any) => ({
            ...child,
            id: `${child.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }))
        }

        onAddComponent(componentData, dropResult.dropIndex)
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const Icon = "icon" in componentType ? componentType.icon : Type
  const label =
    "label" in componentType ? componentType.label : (componentType as any).name || `Custom ${componentType.type}`

  const { deleteCustomComponent } = useEmailBuilderStore()

  return (
    <div
      ref={(node) => {
        if (node) drag(node)
      }}
      className={`
        group relative flex flex-col items-center gap-2 rounded-xl border bg-white p-4
        transition-all cursor-grabbing
        hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 hover:-translate-y-0.5
        ${isDragging ? "opacity-50 scale-95" : ""}
        ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}
        ${isCustom ? "border-purple-200 bg-purple-50/50 hover:border-purple-300 hover:shadow-purple-100" : ""}
        ${isTemplate ? "border-green-200 bg-green-50/50 hover:border-green-300 hover:shadow-green-100" : ""}
        ${!isCustom && !isTemplate ? "border-gray-200" : ""}
      `}
    >
      <div className={`
        flex h-10 w-10 items-center justify-center rounded-lg transition-colors
        ring-1
        ${isCustom ? "bg-purple-100 text-purple-600 ring-purple-200 group-hover:bg-purple-200/70" : ""}
        ${isTemplate ? "bg-green-100 text-green-600 ring-green-200 group-hover:bg-green-200/70" : ""}
        ${!isCustom && !isTemplate ? "bg-gray-50 text-gray-500 ring-gray-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-blue-200" : ""}
      `}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-center text-sm font-medium leading-tight text-gray-700">{label}</span>
      {isCustom && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Delete saved block"
          className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white/80 p-0 text-red-400 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
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

export function ComponentPalette({ onAddComponent, customComponents, disabled = false, getSelectionInfo, applyUpdates }: ComponentPaletteProps) {

  const sectionItem =
    "overflow-hidden rounded-xl border border-gray-200/80 bg-white transition-all duration-200 data-[state=open]:border-gray-300 data-[state=open]:shadow-[0_2px_10px_rgba(17,24,39,0.06)]"
  const sectionTrigger =
    "px-3.5 py-3 text-[13px] font-semibold tracking-wide text-gray-700 transition-colors duration-200 hover:no-underline hover:bg-gray-50/80 data-[state=open]:text-gray-900"

  return (
    <div className="space-y-4 overflow-y-auto h-full relative overflow-x-hidden">
      {disabled && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Components are locked in header-only mode for Options 2 and 3.
        </p>
      )}

      <Accordion
        type="single"
        collapsible
        className="w-full space-y-2.5 pr-0.5"
        defaultValue="item-1"
      >
        <AccordionItem value="item-gallery" className={sectionItem}>
          <AccordionTrigger className={sectionTrigger}>
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <ImageIcon className="h-3.5 w-3.5" />
              </span>
              Images
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2.5 pb-3 pt-0.5">
            <ImageGallery getSelectionInfo={getSelectionInfo} applyUpdates={applyUpdates} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-1" className={sectionItem}>
          <AccordionTrigger className={sectionTrigger}>
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <Boxes className="h-3.5 w-3.5" />
              </span>
              Basic Components
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2.5 pb-3 pt-1">
            <div className="flex flex-col gap-3 text-balance">
              <div className="grid grid-cols-2 gap-2">
                {componentTypes
                  .filter((type) => type.type !== "section" && type.category === "basic")
                  .map((componentType) => (
                    <DraggableComponent key={componentType.type} componentType={componentType} onAddComponent={onAddComponent} disabled={disabled} />
                  ))}

              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className={sectionItem}>
          <AccordionTrigger className={sectionTrigger}>
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-50 text-green-600">
                <Pill className="h-3.5 w-3.5" />
              </span>
              Orserdu Components
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2.5 pb-3 pt-1">
            <div className="flex flex-col gap-3 text-balance">
              <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {componentTypes
                  .filter((type) => type.type !== "section" && type.category === "custom")
                  .map((componentType) => (
                    <DraggableComponent key={componentType.type} componentType={componentType} onAddComponent={onAddComponent} disabled={disabled} />
                  ))}

              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-ferring" className={sectionItem}>
          <AccordionTrigger className={sectionTrigger}>
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-50 text-sky-600">
                <Building2 className="h-3.5 w-3.5" />
              </span>
              Ferring Components
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2.5 pb-3 pt-1">
            <div className="flex flex-col gap-3 text-balance">
              <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {componentTypes
                  .filter((type) => type.category === "ferring")
                  .map((componentType) => (
                    <DraggableComponent key={componentType.type} componentType={componentType} onAddComponent={onAddComponent} disabled={disabled} />
                  ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-idorsia" className={sectionItem}>
          <AccordionTrigger className={sectionTrigger}>
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <FlaskConical className="h-3.5 w-3.5" />
              </span>
              Idorsia Components
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2.5 pb-3 pt-1">
            <div className="flex flex-col gap-3 text-balance">
              <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {componentTypes
                  .filter((type) => type.category === "idorsia")
                  .map((componentType) => (
                    <DraggableComponent key={componentType.type} componentType={componentType} onAddComponent={onAddComponent} disabled={disabled} />
                  ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-elzonris" className={sectionItem}>
          <AccordionTrigger className={sectionTrigger}>
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-50 text-orange-500">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              Elzonris Components
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2.5 pb-3 pt-1">
            <div className="flex flex-col gap-3 text-balance">
              <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {componentTypes
                  .filter((type) => type.category === "elzonris")
                  .map((componentType) => (
                    <DraggableComponent key={componentType.type} componentType={componentType} onAddComponent={onAddComponent} disabled={disabled} />
                  ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" className={sectionItem}>
          <AccordionTrigger className={sectionTrigger}>
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                <LayoutGrid className="h-3.5 w-3.5" />
              </span>
              Sections
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2.5 pb-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              {sectionTemplates.map((template, index) => (
                <DraggableComponent
                  key={`${template.type}-${index}`}
                  componentType={template}
                  onAddComponent={onAddComponent}
                  isTemplate={true}
                  disabled={disabled}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-saved-blocks" className={sectionItem}>
          <AccordionTrigger className={sectionTrigger}>
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <Bookmark className="h-3.5 w-3.5" />
              </span>
              Saved Blocks
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2.5 pb-3 pt-1">
            {customComponents.length === 0 ? (
              <p className="text-xs text-gray-400 px-1">
                No saved blocks yet. Select a component on the canvas and use "Save to Saved Blocks".
              </p>
            ) : (
              <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {customComponents.map((customComponent) => (
                  <DraggableComponent
                    key={customComponent.id}
                    componentType={customComponent}
                    onAddComponent={onAddComponent}
                    isCustom={true}
                    disabled={disabled}
                  />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* for super admin only */}
      {/* <div className="pt-4 absolute bottom-0 w-full">
        <CustomComponentCreator />
      </div> */}


    </div>
  )
}
