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

interface ComponentPaletteProps {
  onAddComponent: (component: EmailComponent, index?: number) => void
  customComponents: EmailComponent[]
}

function DraggableComponent({
  componentType,
  onAddComponent,
  isCustom = false,
  isTemplate = false,
}: {
  componentType: (typeof componentTypes)[0] | (typeof sectionTemplates)[0] | EmailComponent
  onAddComponent: (component: EmailComponent, index?: number) => void
  isCustom?: boolean
  isTemplate?: boolean
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "component",
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

  const {deleteCustomComponent} = useEmailBuilderStore()  

  return (
    <div
      ref={drag}
      className={`
        p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-move
        hover:border-blue-500 hover:bg-blue-50 transition-colors
        flex items-center gap-3
        ${isDragging ? "opacity-50" : ""}
        ${isCustom ? "bg-purple-50 border-purple-300" : ""}
        ${isTemplate ? "bg-green-50 border-green-300" : ""}
      `}
    >
      <Icon className="w-5 h-5 text-gray-600" />
      <span className="font-medium text-gray-700">{label}</span>
      {isCustom && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Custom</span>}
      {isCustom && <Button variant={"outline"} size={"icon"} className="p-0" onClick={()=>{
        deleteCustomComponent(componentType.id)
        toast.warning("custom component deleted")
        }}><Trash2 className="text-red-400"/></Button>}
      {isTemplate && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Template</span>}
    </div>
  )
}

export function ComponentPalette({ onAddComponent, customComponents }: ComponentPaletteProps) {
  

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      <h3 className="font-semibold text-gray-900 mb-4">Basic Components</h3>
      {componentTypes
        .filter((type) => type.type !== "section" )
        .map((componentType) => (
          <DraggableComponent key={componentType.type} componentType={componentType} onAddComponent={onAddComponent} />
        ))}

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900 mb-4">Section Templates</h3>
        {sectionTemplates.map((template, index) => (
          <DraggableComponent
            key={`${template.type}-${index}`}
            componentType={template}
            onAddComponent={onAddComponent}
            isTemplate={true}
          />
        ))}
      </div>

      <div className="pt-4">
        <CustomComponentCreator />
      </div>

      {customComponents.length > 0 && (
        <>
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-4">Custom Components</h4>
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
    </div>
  )
}
