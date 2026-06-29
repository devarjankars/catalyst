"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, Upload } from "lucide-react"
import { exportToZip } from "@/lib/export-utils"
import type { EmailComponent } from "@/types/email-builder"
import { useEmailBuilderStore } from "@/store/email-builder-store"

interface ExportPanelProps {
  components: EmailComponent[]
  canvasRef: React.RefObject<HTMLDivElement>
}

export function ExportPanel({ components, canvasRef }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<1 | 2 | 3, boolean>>({ 1: true, 2: true, 3: true })
  const { currentTemplate, preheaderText, optionMode, option2Components, option3Components } = useEmailBuilderStore()

  const handleExport = async () => {
    if (!canvasRef.current) return

    setIsExporting(true)
    try {
      const isThreeMode = optionMode === "three"
      const optionsToExport = isThreeMode
        ? [
            { id: 1 as const, name: "Option1", components },
            { id: 2 as const, name: "Option2", components: option2Components },
            { id: 3 as const, name: "Option3", components: option3Components },
          ]
            .filter((option) => selectedOptions[option.id])
            .map(({ name, components }) => ({ name, components }))
        : [{ name: "index", components }]

      if (optionsToExport.length === 0) return

      await exportToZip(optionsToExport, currentTemplate?.name, preheaderText)
      setIsOpen(false)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {optionMode === "three" && (
            <div className="rounded-md border p-3 space-y-3">
              {[1, 2, 3].map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={selectedOptions[option as 1 | 2 | 3]}
                    onCheckedChange={(checked) =>
                      setSelectedOptions((prev) => ({ ...prev, [option]: checked === true }))
                    }
                  />
                  Export Option {option}
                </label>
              ))}
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={
              isExporting ||
              (optionMode === "three" && !Object.values(selectedOptions).some(Boolean)) ||
              (components.length === 0 && option2Components.length === 0 && option3Components.length === 0)
            }
            className="w-full flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Download ZIP (HTML + Images)"}
          </Button>

          <p className="text-sm text-gray-600">
            The ZIP file will contain separate HTML files for each selected email option and a shared images folder.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
