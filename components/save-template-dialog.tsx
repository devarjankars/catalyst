"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"

interface SaveTemplateDialogProps {
  open: boolean
  onClose: () => void
  onSave: (name: string, description: string, category: string) => Promise<void>
  initialName?: string
  initialDescription?: string
  initialCategory?: string
  isEditing?: boolean
}

export function SaveTemplateDialog({
  open,
  onClose,
  onSave,
  initialName = "",
  initialDescription = "",
  initialCategory = "other",
  isEditing = false,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [category, setCategory] = useState(initialCategory)
  const [isSaving, setIsSaving] = useState(false)

  // Update form when props change
  useEffect(() => {
    setName(initialName)
    setDescription(initialDescription)
    setCategory(initialCategory)
  }, [initialName, initialDescription, initialCategory])

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      await onSave(name.trim(), description.trim(), category)
      if (!isEditing) {
        // Reset form for new templates
        setName("")
        setDescription("")
        setCategory("other")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
      if (!isEditing) {
        setName("")
        setDescription("")
        setCategory("other")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Update Template" : "Save Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your template (optional)"
              rows={3}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={isSaving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rte">RTE</SelectItem>
                <SelectItem value="sfmc">SFMC</SelectItem>
                <SelectItem value="unbranded">Unbranded</SelectItem>
                <SelectItem value="tpe">Third-party</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Update Template" : "Save Template"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
