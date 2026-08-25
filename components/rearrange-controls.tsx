"use client"

import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, Copy, Trash2, ClipboardCopy } from "lucide-react"

interface RearrangeControlsProps {
  componentId: string
  index: number
  totalComponents: number
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
  // Optional: only shown in 3-option completely-different mode
  showCopyToOption?: boolean
  onCopyToOptions?: () => void
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
  return <div className="my-1 h-px w-4 bg-gray-200" aria-hidden="true" />
}

export function RearrangeControls({
  componentId,
  index,
  totalComponents,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  showCopyToOption,
  onCopyToOptions,
}: RearrangeControlsProps) {
  return (
    <div
      className="absolute -right-10 top-1/2 z-[60] flex -translate-y-1/2 flex-col items-center rounded-full border border-gray-200 bg-white/95 py-1.5 pl-1 pr-1 shadow-lg shadow-gray-900/5 backdrop-blur"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-center gap-0.5">
        <ToolbarButton title="Move up" onClick={onMoveUp} disabled={index === 0}>
          <ArrowUp className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Move down" onClick={onMoveDown} disabled={index === totalComponents - 1}>
          <ArrowDown className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <Divider />

      <div className="flex flex-col items-center gap-0.5">
        <ToolbarButton title="Duplicate" onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5" />
        </ToolbarButton>

        {showCopyToOption && (
<<<<<<< HEAD
          <ToolbarButton title="Copy to another option" onClick={() => onCopyToOptions?.()}>
            <ClipboardCopy className="h-3.5 w-3.5 text-blue-500" />
          </ToolbarButton>
=======
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Copy to another option"
                className="h-7 w-7 rounded-full p-0 text-blue-500 transition-colors hover:bg-blue-50"
                onClick={(e) => e.stopPropagation()}
              >
                <SendToBack className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="left"
              align="center"
              className="w-44"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel className="text-xs font-medium text-gray-500">
                Copy to…
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {otherOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onSelect={(e) => {
                    e.preventDefault()
                    onCopyToOption(opt)
                  }}
                >
                  Option {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
>>>>>>> origin/sanjay_emailBuilder
        )}
      </div>

      <Divider />

      <div className="flex flex-col items-center gap-0.5">
        <ToolbarButton title="Delete" danger onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
    </div>
  )
}
