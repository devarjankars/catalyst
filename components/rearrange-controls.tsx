"use client"

import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, Copy, Trash2 } from "lucide-react"

interface RearrangeControlsProps {
  componentId: string
  index: number
  totalComponents: number
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function RearrangeControls({
  componentId,
  index,
  totalComponents,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: RearrangeControlsProps) {
  return (
    <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-20">
      <Button
        size="sm"
        variant="outline"
        className="w-8 h-8 p-0 bg-white shadow-sm"
        onClick={(e) => {
          e.stopPropagation()
          onMoveUp()
        }}
        disabled={index === 0}
        title="Move up"
      >
        <ArrowUp className="w-3 h-3" />
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="w-8 h-8 p-0 bg-white shadow-sm"
        onClick={(e) => {
          e.stopPropagation()
          onMoveDown()
        }}
        disabled={index === totalComponents - 1}
        title="Move down"
      >
        <ArrowDown className="w-3 h-3" />
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="w-8 h-8 p-0 bg-white shadow-sm"
        onClick={(e) => {
          e.stopPropagation()
          onDuplicate()
        }}
        title="Duplicate"
      >
        <Copy className="w-3 h-3" />
      </Button>

      <Button
        size="sm"
        variant="destructive"
        className="w-8 h-8 p-0"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Delete"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  )
}
