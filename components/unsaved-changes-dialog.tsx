"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Save, Trash2, FileText, Edit } from "lucide-react"

interface UnsavedChangesDialogProps {
  open: boolean
  onAction: (action: "save" | "discard" | "cancel") => void
  templateName: string
  hasComponentChanges?: boolean
  hasUnsavedTemplate?: boolean
}

export function UnsavedChangesDialog({
  open,
  onAction,
  templateName,
  hasComponentChanges = false,
  hasUnsavedTemplate = false,
}: UnsavedChangesDialogProps) {
  const getTitle = () => {
    if (hasComponentChanges && hasUnsavedTemplate) return "Unsaved Changes & Template"
    if (hasComponentChanges) return "Unsaved Component Changes"
    if (hasUnsavedTemplate) return "Unsaved Template"
    return "Unsaved Work"
  }

  const getDescription = () => {
    if (hasComponentChanges && hasUnsavedTemplate) {
      return "You have unsaved component changes and this template hasn't been saved yet."
    }
    if (hasComponentChanges) {
      return "You have unsaved changes to your components."
    }
    if (hasUnsavedTemplate) {
      return "This template hasn't been saved yet."
    }
    return "You have unsaved work."
  }

  const getDetailMessage = () => {
    const parts = []
    if (hasComponentChanges) parts.push("component modifications")
    if (hasUnsavedTemplate) parts.push("template data")

    return `You have unsaved ${parts.join(" and ")} in "${templateName}". What would you like to do?`
  }

  return (
    <Dialog open={open} onOpenChange={() => onAction("cancel")}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>{getTitle()}</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700">{getDetailMessage()}</p>

          {(hasComponentChanges || hasUnsavedTemplate) && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-4 text-sm">
                {hasComponentChanges && (
                  <span className="inline-flex items-center gap-1 text-orange-700">
                    <Edit className="w-3 h-3" />
                    Component changes
                  </span>
                )}
                {hasUnsavedTemplate && (
                  <span className="inline-flex items-center gap-1 text-blue-700">
                    <FileText className="w-3 h-3" />
                    Template not saved
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onAction("cancel")} className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onAction("discard")} className="flex-1">
            <Trash2 className="w-4 h-4 mr-2" />
            Discard
          </Button>
          <Button onClick={() => onAction("save")} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
