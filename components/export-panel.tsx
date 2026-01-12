"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, FileText, Upload } from "lucide-react"
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
  const { currentTemplate, preHeaderText } = useEmailBuilderStore()

  const handleExport = async () => {
    if (!canvasRef.current) return

    setIsExporting(true)
    try {
      await exportToZip(components, canvasRef.current, currentTemplate?.name,preHeaderText)
      setIsOpen(false) // Close the dialog after successful export
    } catch (error) {
      console.error("Export failed:", error)
      // Optionally keep the dialog open on error so user can retry
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
          <Button
            onClick={handleExport}
            disabled={isExporting || components.length === 0}
            className="w-full flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Download ZIP (HTML + Image)"}
          </Button>

          <p className="text-sm text-gray-600">
            The ZIP file will contain both the HTML file and a PNG image of your email.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}