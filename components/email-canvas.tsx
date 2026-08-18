"use client"
import { forwardRef, useEffect, useState } from "react"
import { useDrop } from "react-dnd"
import { Layout } from "lucide-react"
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
  activeOption?: 1 | 2 | 3
  onCopyToOption?: (component: EmailComponent, targetOption: 1 | 2 | 3) => void
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
      activeOption,
      onCopyToOption,
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
          return { dropZone: "canvas", dropIndex, dropElement: (ref as React.RefObject<HTMLDivElement>).current, handled: true }
        }
        return { dropZone: "canvas", dropElement: (ref as React.RefObject<HTMLDivElement>).current }
      },
      hover: (item: any, monitor) => {
        if (!item.fromPalette || isLockedMode) return

        const clientOffset = monitor.getClientOffset()
        if (clientOffset && (ref as React.RefObject<HTMLDivElement>).current) {
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

          // IMPORTANT: scope to direct children only (":scope >") so nested
          // section children with the same data-component-id attribute don't
          // get counted and throw off the index math.
          const componentElements = (ref as React.RefObject<HTMLDivElement>).current!.querySelectorAll(
            ":scope > [data-component-id]",
          )

          if (componentElements.length > 0) {
            for (let i = 0; i < componentElements.length; i++) {
              const element = componentElements[i] as HTMLElement
              const elementRect = element.getBoundingClientRect()
              const elementMidY = elementRect.top - canvasRect.top + elementRect.height / 2
              if (dropY < elementMidY) {
                dropIndex = i
                position = "top"
                break
              } else {
                // cursor is past this element's midpoint; tentatively place
                // after it (covers the "drop into the last gap" case and
                // keeps the index correct as we keep scanning forward)
                dropIndex = i + 1
                position = "bottom"
              }
            }
          }

          dropIndex = Math.max(0, Math.min(dropIndex, components.length))
          setDropIndicator({ index: dropIndex, position })
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver() && !isLockedMode,
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
          className={`bg-white shadow-sm ring-1 ring-gray-200 max-w-2xl w-full min-h-[600px] relative isolate pb-10 rounded-md transition-shadow space-y-1 ${isOver ? "ring-2 ring-blue-500 shadow-md" : ""}`}
          style={{ width: `${canvasWidth ?? 600}px` }}
          onClick={() => !previewMode && onSelectComponent(null)}
          onDragLeave={() => setDropIndicator(null)}
        >
          {components.length === 0 && !isOver && (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center px-6 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-200">
                <Layout className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Your email is empty</p>
                <p className="text-sm text-gray-400">
                  Drag a component from the left panel to start building
                </p>
              </div>
            </div>
          )}

          {components.map((component, index) => {
            if (!component) return null
            return (
              <div key={component.id || index} className="relative" data-component-id={component.id}>
                {dropIndicator?.index === index && isOver && !previewMode && (
                  <div className="h-0.5 bg-blue-500 mx-4 rounded-full shadow-sm shadow-blue-200 animate-grow-x origin-center" />
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
                  activeOption={activeOption}
                  onCopyToOption={onCopyToOption ? (targetOption) => onCopyToOption(component, targetOption) : undefined}
                />
              </div>
            )
          })}

          {dropIndicator?.index === components.length && isOver && !previewMode && (
            <div className="mx-4 my-2 flex min-h-[5vh] items-center justify-center rounded-md border border-dashed border-blue-400 bg-blue-50/60 opacity-90">
              <p className="text-sm font-medium text-blue-500">Drop here</p>
            </div>
          )}
        </div>
      </div>
    )
  },
)

EmailCanvas.displayName = "EmailCanvas"
