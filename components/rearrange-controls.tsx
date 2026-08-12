"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, Copy, Trash2, SendToBack } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RearrangeControlsProps {
  componentId: string
  index: number
  totalComponents: number
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
  // Optional: only shown in 3-option completely-different mode
  activeOption?: 1 | 2 | 3
  onCopyToOption?: (targetOption: 1 | 2 | 3) => void
}

export function RearrangeControls({
  componentId,
  index,
  totalComponents,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  activeOption,
  onCopyToOption,
}: RearrangeControlsProps) {
  const otherOptions = ([1, 2, 3] as const).filter((o) => o !== activeOption)
  const showCopyToOption = !!onCopyToOption && !!activeOption

  return (
    <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
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
        title="Duplicate within this option"
      >
        <Copy className="w-3 h-3" />
      </Button>

      {showCopyToOption && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="w-8 h-8 p-0 bg-white shadow-sm text-blue-600 border-blue-200 hover:bg-blue-50"
              title="Copy to another option"
              onClick={(e) => e.stopPropagation()}
            >
              <SendToBack className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left" align="center" className="w-40">
            <p className="px-2 py-1 text-xs text-gray-500 font-medium">Copy to…</p>
            {otherOptions.map((opt) => (
              <DropdownMenuItem
                key={opt}
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyToOption(opt)
                }}
              >
                Option {opt}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

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
