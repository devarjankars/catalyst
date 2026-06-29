"use client"

import { useDrag } from "react-dnd"
import { Trash2, Type } from "lucide-react"
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
        }

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
      ref={drag}
      className={`
        p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-grabbing
        hover:border-blue-500 hover:bg-blue-50 transition-colors
        flex flex-col items-center gap-1
        ${isDragging ? "opacity-50" : ""}
        ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}
        ${isCustom ? "bg-purple-50 border-purple-300" : ""}
        ${isTemplate ? "bg-green-50 border-green-300" : ""}
        relative
      `}
    >
      <Icon className="w-5 h-5 text-gray-600" />
      <span className="font-medium text-gray-700 text-center">{label}</span>
      {/* {isCustom && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Custom</span>} */}
      {isCustom && <Button variant={"secondary"} size={"icon"} className=" bg-transparent  absolute top-0 right-0" onClick={() => {
        deleteCustomComponent(componentType.id)
        toast.warning("custom component deleted")
      }}><Trash2 className="text-red-400 w-4 h-4" /></Button>}
      {/* {isTemplate && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Template</span>} */}
    </div>
  )
}

export function ComponentPalette({ onAddComponent, customComponents, disabled = false, getSelectionInfo, applyUpdates }: ComponentPaletteProps) {


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
        className="w-full"
        defaultValue="item-1"
      >
        <AccordionItem value="item-gallery">
          <AccordionTrigger>Images</AccordionTrigger>
          <AccordionContent className="p-0">
            <ImageGallery getSelectionInfo={getSelectionInfo} applyUpdates={applyUpdates} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-1">
          <AccordionTrigger>Basic Components</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <div className="grid grid-cols-2 gap-2 mb-4 w-[95%]">
              {componentTypes
                .filter((type) => type.type !== "section" && type.category === "basic")
                .map((componentType) => (
                  <DraggableComponent key={componentType.type} componentType={componentType} onAddComponent={onAddComponent} disabled={disabled} />
                ))}

            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Custom components</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <div className="grid grid-cols-2 gap-2 mb-4 w-[100%] max-h-[40vh] overflow-y-auto pr-2">
              {componentTypes
                .filter((type) => type.type !== "section" && type.category === "custom")
                .map((componentType) => (
                  <DraggableComponent key={componentType.type} componentType={componentType} onAddComponent={onAddComponent} disabled={disabled} />
                ))}

            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Sections</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <div className="grid grid-cols-2 gap-2 mb-4 w-[95%]">
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
        {/* <AccordionItem value="item-4">
          <AccordionTrigger>User defined</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            {customComponents.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4 w-[95%]">

                  {customComponents.map((customComponent) => (
                    <DraggableComponent
                      key={customComponent.id}
                      componentType={customComponent}
                      onAddComponent={onAddComponent}
                      isCustom={true}
                    />
                  ))}
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem> */}
      </Accordion>

      {/* for super admin only */}
      {/* <div className="pt-4 absolute bottom-0 w-full">
        <CustomComponentCreator />
      </div> */}


    </div>
  )
}
