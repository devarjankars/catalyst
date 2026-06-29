"use client"
import { forwardRef, useEffect, useState } from "react"
import { useDrop } from "react-dnd"
import { EmailComponentRenderer } from "./email-component-renderer"
import type { EmailComponent } from "@/types/email-builder"

interface EmailCanvasProps {
  components: EmailComponent[]
  selectedComponent: string | null
  onSelectComponent: (id: string | null) => void
  onUpdateComponent: (id: string, updates: Partial<EmailComponent>) => void
  onDeleteComponent: (id: string) => void
  onMoveComponent: (dragIndex: number, hoverIndex: number) => void
  previewMode: boolean
  duplicateComponent: (id: string) => void
  addComponent: (component: EmailComponent, index?: number) => void
  canvasWidth?: number
  isLockedMode?: boolean
}

export const EmailCanvas = forwardRef<HTMLDivElement, EmailCanvasProps>(
  (
    {
      components,
      selectedComponent,
      onSelectComponent,
      onUpdateComponent,
      onDeleteComponent,
      onMoveComponent,
      previewMode,
      duplicateComponent,
      addComponent,
      canvasWidth,
      isLockedMode = false,
    },
    ref,
  ) => {
    const [dropIndicator, setDropIndicator] = useState<{ index: number; position: "top" | "bottom" } | null>(null)

    const [{ isOver }, drop] = useDrop({
      accept: "component",
      drop: (item: any, monitor) => {
        if (monitor.didDrop() || isLockedMode) return

        if (item.fromPalette) {
          const dropIndex = dropIndicator?.index ?? components.length
          const newComponent = {
            ...item,
            id: Date.now().toString(),
            children: item.children?.map((child: any) => ({
              ...child,
              id: `${child.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            })),
          }
          addComponent(newComponent, dropIndex)
          setDropIndicator(null)
          onSelectComponent(newComponent.id)
          return { dropZone: "canvas", dropIndex, dropElement: ref?.current, handled: true }
        }
        return { dropZone: "canvas", dropElement: ref?.current }
      },
      hover: (item: any, monitor) => {
        if (!item.fromPalette || isLockedMode) return

        const clientOffset = monitor.getClientOffset()
        if (clientOffset && ref?.current) {
          const canvasRect = (ref as React.RefObject<HTMLDivElement>).current!.getBoundingClientRect()
          const buffer = 50
          if (
            clientOffset.y < canvasRect.top - buffer ||
            clientOffset.y > canvasRect.bottom + buffer
          ) {
            setDropIndicator(null)
            return
          }

          const dropY = clientOffset.y - canvasRect.top
          let dropIndex = components.length
          let position: "top" | "bottom" = "top"

          const componentElements = (ref as React.RefObject<HTMLDivElement>).current!.querySelectorAll("[data-component-id]")
          if (componentElements.length > 0) {
            for (let i = 0; i < componentElements.length; i++) {
              const element = componentElements[i] as HTMLElement
              const elementRect = element.getBoundingClientRect()
              const elementMidY = elementRect.top - canvasRect.top + elementRect.height / 2
              if (dropY < elementMidY) {
                dropIndex = i
                position = "top"
                break
              }
            }
          }

          dropIndex = Math.max(0, Math.min(dropIndex, components.length))
          setDropIndicator({ index: dropIndex, position })
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }) && !isLockedMode,
      }),
    })

    useEffect(() => {
      if (!isOver) setDropIndicator(null)
    }, [isOver])

    const handleAddToSection = (sectionId: string, component: EmailComponent, index?: number) => {
      const newComponent = { ...component, id: Date.now().toString() }
      onUpdateComponent(sectionId, {
        children: components.find((c) => c.id === sectionId)?.children
          ? index !== undefined
            ? [
                ...components.find((c) => c.id === sectionId)!.children!.slice(0, index),
                newComponent,
                ...components.find((c) => c.id === sectionId)!.children!.slice(index),
              ]
            : [...components.find((c) => c.id === sectionId)!.children!, newComponent]
          : [newComponent],
      })
    }

    const handleMoveWithinSection = (sectionId: string, dragIndex: number, hoverIndex: number) => {
      const section = components.find((c) => c.id === sectionId)
      if (!section?.children) return
      const newChildren = [...section.children]
      const draggedComponent = newChildren[dragIndex]
      newChildren.splice(dragIndex, 1)
      newChildren.splice(hoverIndex, 0, draggedComponent)
      onUpdateComponent(sectionId, { children: newChildren })
    }

    const getSectionREcursively = (id: string, comps: EmailComponent[]): EmailComponent | null => {
      for (const comp of comps) {
        if (comp.id === id) return comp
        if (comp.children) {
          const found = getSectionREcursively(id, comp.children)
          if (found) return found
        }
      }
      return null
    }

    const handleUpdateChild = (sectionId: string, childId: string, updates: Partial<EmailComponent>) => {
      const section = getSectionREcursively(sectionId, components)
      if (!section?.children) return
      const newChildren = section.children.map((child) => (child.id === childId ? { ...child, ...updates } : child))
      onUpdateComponent(sectionId, { children: newChildren })
    }

    const handleDeleteChild = (sectionId: string, childId: string) => {
      onDeleteComponent(childId)
    }

    return (
      <div className="flex justify-center">
        <div
          ref={(node) => {
            drop(node)
            if (ref && typeof ref === "function") {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          className={`bg-white shadow-lg max-w-2xl w-full min-h-[600px] relative pb-10 ${isOver ? "ring-2 ring-blue-500" : ""}`}
          style={{ width: `${canvasWidth ?? 600}px` }}
          onClick={() => !previewMode && onSelectComponent(null)}
          onDragLeave={() => setDropIndicator(null)}
        >
          {components.length === 0 && !isOver && (
            <div className="h-full flex flex-col justify-center items-center text-gray-400">
              <p>Drag a component from component palette to start building</p>
            </div>
          )}

          {components.map((component, index) => {
            if (!component) return null
            return (
              <div key={component.id || index} className="relative">
                {dropIndicator?.index === index && isOver && !previewMode && (
                  <div className="h-1 bg-blue-600 mx-2 rounded-sm opacity-75 my-2 shadow-lg animate-grow-x origin-center" />
                )}
                <EmailComponentRenderer
                  component={component}
                  index={index}
                  isSelected={selectedComponent === component.id}
                  onSelect={() => !previewMode && onSelectComponent(component.id)}
                  onUpdate={(updates) => onUpdateComponent(component.id, updates)}
                  onDelete={() => onDeleteComponent(component.id)}
                  onMove={onMoveComponent}
                  onAddToSection={handleAddToSection}
                  onMoveWithinSection={handleMoveWithinSection}
                  onUpdateChild={handleUpdateChild}
                  onDeleteChild={handleDeleteChild}
                  onSelectChild={onSelectComponent}
                  selectedComponent={selectedComponent}
                  previewMode={previewMode}
                  totalComponents={components.length}
                  onDuplicate={() => duplicateComponent(component.id)}
                  isLockedMode={isLockedMode && component.type !== "header-image"}
                />
              </div>
            )
          })}

          {dropIndicator?.index === components.length && isOver && !previewMode && (
            <div className="h-2 border border-dashed border-blue-500 mx-4 min-h-[5vh] rounded-sm opacity-75 my-2 shadow-lg relative flex items-center justify-center">
              <p className="text-center text-sm text-blue-500 absolute top-2 left-1/2 transform -translate-x-1/2 font-medium">drop here</p>
            </div>
          )}
        </div>
      </div>
    )
  },
)

EmailCanvas.displayName = "EmailCanvas"


