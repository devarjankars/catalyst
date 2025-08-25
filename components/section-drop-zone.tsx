"use client"

import type React from "react"
import { useState } from "react"
import { useDrop } from "react-dnd"
import type { EmailComponent } from "@/types/email-builder"

interface SectionDropZoneProps {
  sectionId: string
  children: EmailComponent[]
  onAddToSection: (sectionId: string, component: EmailComponent, index?: number) => void
  onMoveWithinSection: (sectionId: string, dragIndex: number, hoverIndex: number) => void
  renderChildren: () => React.ReactNode
  previewMode: boolean
  isColumn?: boolean
  columnCount?: number
  columnAlignment?: "left" | "center" | "right"
}

//TODO => if direction is row then not able to edit column properties

export function SectionDropZone({
  sectionId,
  children,
  onAddToSection,
  renderChildren,
  previewMode,
  isColumn = false,
  columnCount = 1,
  columnAlignment = "left",
}: SectionDropZoneProps) {
  const [dropIndicator, setDropIndicator] = useState<{ index: number; position: "top" | "bottom" } | null>(null)

  // console.log("is coulmn", isColumn);
  

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "component",
    drop: (item: any, monitor) => {
      if (monitor.didDrop()) return // Prevent double drops

      if (item.fromPalette && typeof onAddToSection === "function") {
        // Handle palette drops with positioning
        const dropIndex = dropIndicator?.index ?? children.length
        onAddToSection(sectionId, item, dropIndex)
        setDropIndicator(null)
        return { handled: true, dropZone: "section" }
      }
    },
    hover: (item: any, monitor) => {
      if (!item.fromPalette) return

      const clientOffset = monitor.getClientOffset()
      const dropTarget = monitor.getDropResult()

      if (clientOffset && drop.current) {
        const rect = drop.current.getBoundingClientRect()
        const dropY = clientOffset.y - rect.top

        // Calculate drop index based on Y position
        let dropIndex = children.length
        let position: "top" | "bottom" = "bottom"

        if (children.length > 0) {
          const childElements = drop.current.querySelectorAll(`[data-section-child="${sectionId}"]`)

          for (let i = 0; i < childElements.length; i++) {
            const element = childElements[i] as HTMLElement
            const elementRect = element.getBoundingClientRect()
            const elementY = elementRect.top - rect.top + elementRect.height / 2

            if (dropY < elementY) {
              dropIndex = i
              position = "top"
              break
            }
          }
        }

        setDropIndicator({ index: dropIndex, position })
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })

  if (!onAddToSection) {
    // Fallback rendering without drop functionality
    return (
      <div className={`relative p-2 ${isColumn ? "min-h-[120px]" : "min-h-[80px]"}`}>
        {children.length === 0 && !previewMode ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium">
            {isColumn ? "Column" : "Section content"}
          </div>
        ) : (
          renderChildren()
        )}
      </div>
    )
  }

  // Calculate minimum height based on column count and whether it's a column
  const minHeight = isColumn ? "min-h-[150px]" : columnCount > 1 ? "min-h-[120px]" : "min-h-[80px]"

  return (
    <div
      ref={drop}
      className={`
        ${minHeight} relative p-3 rounded-md transition-all w-full
        ${isOver && canDrop && !previewMode ? `${isColumn ? "bg-green-50 ring-2 ring-green-400" : "bg-blue-50 ring-2 ring-blue-400"} ring-dashed` : ""}
        ${!previewMode ? `border-2 border-dashed ${isColumn ? "border-green-500 hover:border-green-300" : "border-gray-200 hover:border-gray-300"}` : ""}
        ${isColumn ? "flex-1" : "w-full"}
      `}
      style={{
        textAlign: isColumn ? columnAlignment : "left",
      }}
      onDragLeave={() => setDropIndicator(null)}
    >
      {children.length === 0 && !previewMode ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium">
          <div className="text-center">
            <div className="mb-1">{isColumn ? `Drop in Column (${columnAlignment})` : "Drop components here"}</div>
            {isColumn && <div className="text-xs opacity-75">Column {sectionId.split("-").pop()}</div>}
          </div>
        </div>
      ) : (
        <div className="relative w-full">
          {/* Top drop indicator */}
          {dropIndicator?.index === 0 && dropIndicator.position === "top" && !previewMode && (
            <div className={`h-1 ${isColumn ? "bg-green-500" : "bg-blue-500"} rounded-full opacity-75 mb-2`} />
          )}

          {renderChildren()}

          {/* Drop indicators between and after components */}
          {children.map((_, index) => (
            <div key={`indicator-${index}`}>
              {dropIndicator?.index === index + 1 && dropIndicator.position === "top" && !previewMode && (
                <div className={`h-1 ${isColumn ? "bg-green-500" : "bg-blue-500"} rounded-full opacity-75 my-2`} />
              )}
            </div>
          ))}

          {/* Final drop indicator */}
          {dropIndicator?.index === children.length && !previewMode && (
            <div className={`h-1 ${isColumn ? "bg-green-500" : "bg-blue-500"} rounded-full opacity-75 mt-2`} />
          )}
        </div>
      )}

      {isOver && canDrop && !previewMode && (
        <div
          className={`absolute inset-0 ${isColumn ? "bg-green-100 border-green-500" : "bg-blue-100 border-blue-500"} bg-opacity-60 border-2 border-dashed rounded-md flex items-center justify-center z-10`}
        >
          <div className="text-center">
            <span className={`${isColumn ? "text-green-700" : "text-blue-700"} font-semibold text-sm`}>Drop here</span>
            {isColumn && (
              <div className={`${isColumn ? "text-green-600" : "text-blue-600"} text-xs mt-1`}>
                Add to this column ({columnAlignment})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
