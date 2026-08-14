"use client"

import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, Copy, Trash2, SendToBack } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

function ToolbarButton({
  onClick,
  disabled,
  title,
  danger,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={`h-7 w-7 rounded-full p-0 text-gray-600 transition-colors hover:bg-gray-100 ${
        danger ? "text-red-500 hover:bg-red-50 hover:text-red-600" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  )
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-gray-200" aria-hidden="true" />
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
    <div
      className="absolute -top-3 right-2 z-[60] flex items-center rounded-full border border-gray-200 bg-white/95 py-1 pl-1.5 pr-1 shadow-lg shadow-gray-900/5 backdrop-blur"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-0.5">
        <ToolbarButton title="Move up" onClick={onMoveUp} disabled={index === 0}>
          <ArrowUp className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Move down" onClick={onMoveDown} disabled={index === totalComponents - 1}>
          <ArrowDown className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <Divider />

      <div className="flex items-center gap-0.5">
        <ToolbarButton title="Duplicate" onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5" />
        </ToolbarButton>

        {showCopyToOption && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton title="Copy to another option" onClick={() => {}}>
                <SendToBack className="h-3.5 w-3.5 text-blue-500" />
              </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-44">
              <DropdownMenuLabel className="text-xs font-medium text-gray-500">
                Copy to…
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {otherOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => {
                    onCopyToOption(opt)
                  }}
                >
                  Option {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Divider />

      <div className="flex items-center gap-0.5">
        <ToolbarButton title="Delete" danger onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
    </div>
  )
}
