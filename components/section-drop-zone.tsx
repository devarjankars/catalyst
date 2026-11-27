"use client"

import React from "react"
import { useEffect, useRef, useState } from "react"
import { useDrop } from "react-dnd"
import type { EmailComponent } from "@/types/email-builder"

interface SectionDropZoneProps {
  sectionId: string
  children: EmailComponent[]
  onAddToSection?: (sectionId: string, component: EmailComponent, index?: number) => void
  onSelect?: (id: string) => void
  renderSectionChild: (child: EmailComponent, childIndex: number, sectionId: string) => React.ReactNode
  isSelected?: boolean
  previewMode: boolean
  isColumn?: boolean
  minHeight?: string
  columnAlignment?: "left" | "center" | "right"
}

export function SectionDropZone({
  onSelect,
  sectionId,
  children,
  onAddToSection,
  renderSectionChild,
  previewMode,
  isColumn = false,
  minHeight,
  columnAlignment = "left",
  isSelected,
}: SectionDropZoneProps) {
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)
  // Track last computed index to skip redundant setState calls
  const lastDropIndex = useRef<number | null>(null)

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "component",
    canDrop: (item: { fromPalette?: boolean; type?: string }) => !!item.fromPalette && item.type !== "section" && !!onAddToSection,
    drop: (item: any, monitor) => {
      if (monitor.getDropResult<{ handled?: boolean }>()?.handled) return

      if (item.fromPalette && typeof onAddToSection === "function" && item.type !== "section") {
        const idx = lastDropIndex.current ?? children.length
        onAddToSection(sectionId, item, idx)
        setDropIndex(null)
        lastDropIndex.current = null
        return { handled: true, dropZone: "section" }
      }
    },
    hover: (item: any, monitor) => {
      if (!item.fromPalette || item.type === "section" || !dropRef.current) return

      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) return

      const rect = dropRef.current.getBoundingClientRect()
      // cursor Y relative to the top of this drop zone (scroll-safe)
      const cursorY = clientOffset.y - rect.top

      let newIndex = children.length

      const childEls = dropRef.current.querySelectorAll(`:scope > div > [data-section-child="${sectionId}"]`)
      for (let i = 0; i < childEls.length; i++) {
        const el = childEls[i] as HTMLElement
        const elRect = el.getBoundingClientRect()
        const elMidY = elRect.top - rect.top + elRect.height / 2
        if (cursorY < elMidY) {
          newIndex = i
          break
        } else {
          newIndex = i + 1
        }
      }

      // Only update state when the value actually changes
      if (lastDropIndex.current !== newIndex) {
        lastDropIndex.current = newIndex
        setDropIndex(newIndex)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: false }),
      canDrop: monitor.canDrop(),
    }),
  })

  useEffect(() => {
    if (isOver) return
    setDropIndex(null)
    lastDropIndex.current = null
  }, [isOver])

  if (!onAddToSection) {
    return (
      <div className={`relative p-2 ${isColumn ? "min-h-[120px]" : "min-h-[80px]"}`}>
        {children.length === 0 && !previewMode ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium">
            {isColumn ? "Column" : "Section content"}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {children.map((child, i) => (
              <div key={child.id} data-section-child={sectionId}>
                {renderSectionChild(child, i, sectionId)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const minimumClass = minHeight ? "" : isColumn ? "min-h-[150px]" : "min-h-[80px]"
  const activeColor = isColumn ? "ring-green-400 bg-green-50/40" : "ring-blue-400 bg-blue-50/40"
  const indicatorColor = isColumn ? "bg-green-500" : "bg-blue-500"

  return (
    <div
      ref={(node) => {
        dropRef.current = node
        drop(node)
      }}
      data-section-drop-zone={sectionId}
      className={`
        ${minimumClass} relative rounded-lg transition-colors duration-150
        ${isOver && canDrop && !previewMode ? `ring-2 ring-dashed ${activeColor}` : ""}
        ${!previewMode
          ? `border border-dashed ${
              isSelected
                ? "border-green-400 bg-green-50/40 hover:border-green-500"
                : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50"
            }`
          : ""}
        ${isColumn ? "flex" : "w-full"}
      `}
      style={{ minHeight, textAlign: columnAlignment }}
      onClick={(e) => { e.stopPropagation(); onSelect?.(sectionId) }}
    >
      {children.length === 0 && !previewMode && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium pointer-events-none">
          <span>Drop here</span>
        </div>
      )}

      <div className="relative w-full">
        {/* Drop indicators and children rendered together */}
        {children.map((child, i) => (
          <React.Fragment key={child.id}>
            <div data-section-child={sectionId} className="relative mb-2">
              {isOver && canDrop && dropIndex === i && !previewMode && (
                <div className={`pointer-events-none absolute inset-x-2 top-0 z-10 h-[3px] -translate-y-1/2 rounded-full ${indicatorColor}`} />
              )}
              {renderSectionChild(child, i, sectionId)}
            </div>
          </React.Fragment>
        ))}
        {/* Drop indicator after last child */}
        {isOver && canDrop && dropIndex === children.length && !previewMode && (
          <div className={`mx-2 mt-2 h-[3px] rounded-full ${indicatorColor}`} />
        )}
      </div>
    </div>
  )
}
