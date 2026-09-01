"use client"
import { forwardRef, useEffect, useRef, useState } from "react"
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
  showCopyToOption?: boolean
  onCopyToOptions?: () => void
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
      showCopyToOption,
      onCopyToOptions,
    },
    ref,
  ) => {
    const [dropIndex, setDropIndex] = useState<number | null>(null)
    // Always-current ref — drop handler reads this directly, no stale closure
    const dropIndexRef = useRef<number | null>(null)
    // Track if we're over a section drop zone to avoid conflicting with canvas drop indicator
    const overSectionRef = useRef(false)

    const setDropIndexBoth = (idx: number | null) => {
      dropIndexRef.current = idx
      setDropIndex(idx)
    }

    const computeDropIndex = (clientY: number, canvasEl: HTMLElement): number => {
      const componentElements = canvasEl.querySelectorAll(":scope > [data-component-id], :scope > [data-section-id]")
      let idx = components.length

      for (let i = 0; i < componentElements.length; i++) {
        const el = componentElements[i] as HTMLElement
        const rect = el.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        if (clientY < midY) {
          idx = i
          break
        } else {
          idx = i + 1
        }
      }

      return Math.max(0, Math.min(idx, components.length))
    }

    const [{ isOver }, drop] = useDrop({
      accept: "component",
      drop: (item: any, monitor) => {
        // For palette items: never bail on didDrop() — child drop targets
        // (EmailComponentRenderer) absorb the hover but don't handle palette drops,
        // so we must always process palette drops here regardless of didDrop().
        if (!item.fromPalette && monitor.didDrop()) return
        if (isLockedMode) return

        if (item.fromPalette) {
          // Check if the drop is over a section drop zone
          const clientOffset = monitor.getClientOffset()
          const canvasEl = (ref as React.RefObject<HTMLDivElement>).current
          if (clientOffset && canvasEl) {
            const sectionElements = canvasEl.querySelectorAll("[data-section-id]")
            for (const el of sectionElements) {
              const rect = el.getBoundingClientRect()
              if (
                clientOffset.x >= rect.left &&
                clientOffset.x <= rect.right &&
                clientOffset.y >= rect.top &&
                clientOffset.y <= rect.bottom
              ) {
                // Drop is over a section - let the section-drop-zone handle it
                return { dropZone: "canvas" }
              }
            }
          }

          // Re-compute the exact drop index from the final cursor position
          let finalIndex = components.length

          if (clientOffset && canvasEl) {
            finalIndex = computeDropIndex(clientOffset.y, canvasEl)
          }

          const newComponent = {
            ...item,
            id: `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            children: item.children?.map((child: any) => ({
              ...child,
              id: `${child.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            })),
          }
          addComponent(newComponent, finalIndex)
          setDropIndexBoth(null)
          onSelectComponent(newComponent.id)
          return { dropZone: "canvas", dropIndex: finalIndex, handled: true }
        }
        return { dropZone: "canvas" }
      },
      hover: (item: any, monitor) => {
        if (!item.fromPalette || isLockedMode) return

        const clientOffset = monitor.getClientOffset()
        const canvasEl = (ref as React.RefObject<HTMLDivElement>).current
        if (!clientOffset || !canvasEl) return

        const canvasRect = canvasEl.getBoundingClientRect()

        // Ignore if cursor is well outside the canvas
        if (
          clientOffset.y < canvasRect.top - 50 ||
          clientOffset.y > canvasRect.bottom + 50
        ) {
          setDropIndexBoth(null)
          overSectionRef.current = false
          return
        }

        // Check if cursor is over a section drop zone
        const sectionElements = canvasEl.querySelectorAll("[data-section-id]")
        let overSection = false
        for (const el of sectionElements) {
          const rect = el.getBoundingClientRect()
          if (
            clientOffset.x >= rect.left &&
            clientOffset.x <= rect.right &&
            clientOffset.y >= rect.top &&
            clientOffset.y <= rect.bottom
          ) {
            overSection = true
            break
          }
        }

        overSectionRef.current = overSection

        // If over a section, don't update canvas drop index (let section handle it)
        if (overSection) {
          setDropIndexBoth(null)
          return
        }

        const newIndex = computeDropIndex(clientOffset.y, canvasEl)

        // Skip redundant updates
        if (dropIndexRef.current !== newIndex) {
          setDropIndexBoth(newIndex)
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver() && !isLockedMode,
      }),
    })

    // Clear indicator when drag leaves canvas entirely
    useEffect(() => {
      if (!isOver && !overSectionRef.current) setDropIndexBoth(null)
    }, [isOver])

    const handleAddToSection = (sectionId: string, component: EmailComponent, index?: number) => {
      const newComponent = { ...component, id: Date.now().toString() }
      
      // Find the section/column recursively (handles nested columns in multi-column sections)
      const targetSection = getSectionREcursively(sectionId, components)
      const currentChildren = targetSection?.children || []
      
      const updatedChildren = index !== undefined
        ? [
            ...currentChildren.slice(0, index),
            newComponent,
            ...currentChildren.slice(index),
          ]
        : [...currentChildren, newComponent]
      
      onUpdateComponent(sectionId, { children: updatedChildren })
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
          className={`bg-white shadow-sm ring-1 ring-gray-200 w-full max-w-[600px] min-h-[600px] relative pb-10 rounded-md transition-shadow ${isOver ? "ring-2 ring-blue-400 shadow-lg" : ""}`}
          onClick={() => !previewMode && onSelectComponent(null)}
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
              <div key={component.id || index} className="relative mb-2" data-component-id={component.id}>
                {/* Drop indicator line ABOVE this component */}
                {dropIndex === index && isOver && !previewMode && (
                  <div className="pointer-events-none mx-3 mb-2 h-[3px] rounded-full bg-blue-500 shadow-sm shadow-blue-300" />
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
                  showCopyToOption={showCopyToOption}
                  onCopyToOptions={onCopyToOptions}
                />
              </div>
            )
          })}

          {/* Drop indicator line AFTER last component */}
          {dropIndex === components.length && isOver && !previewMode && (
            <div className="pointer-events-none mx-3 mt-2 h-[3px] rounded-full bg-blue-500 shadow-sm shadow-blue-300" />
          )}

          {/* Empty canvas hint */}
          {components.length === 0 && isOver && !previewMode && (
            <div className="mx-4 mb-4 flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/60">
              <p className="text-sm font-medium text-blue-500">Drop here</p>
            </div>
          )}
        </div>
      </div>
    )
  },
)

EmailCanvas.displayName = "EmailCanvas"
