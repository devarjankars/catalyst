"use client"

import { useEmailBuilderStore } from "@/store/email-builder-store"
import { toast } from "sonner"
import { ImageIcon, Trash2, Loader2 } from "lucide-react"
import { firebaseService } from "@/services/firebase-service"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function ImageGallery() {
  const { templateImages, selectedComponent, components, updateComponent, removeTemplateImage } = useEmailBuilderStore()
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Helper to find the selected component
  const getSelectedComponentData = () => {
    if (!selectedComponent) return null
    const findSelected = (items: any[]): any | null => {
      for (const item of items) {
        if (item.id === selectedComponent) return item
        if (item.children) {
          const found = findSelected(item.children)
          if (found) return found
        }
      }
      return null
    }
    return findSelected(components)
  }

  const selectedData = getSelectedComponentData()
  const imageSupportedTypes = ["image", "header-image", "cta-button", "footer-link-2"]
  const isImageComponentSelected = selectedData && imageSupportedTypes.includes(selectedData.type)

  const handleImageSelect = (imageUrl: string) => {
    if (!isImageComponentSelected) {
      toast.info("Please select an image component on the canvas first")
      return
    }

    const component = selectedData
    if (!component) return

    // Determine the parent ID for updateComponent
    const findParentId = (items: any[], targetId: string, currentParentId: string | null = null): string | null => {
      for (const item of items) {
        if (item.id === targetId) return currentParentId
        if (item.children) {
          const found = findParentId(item.children, targetId, item.id)
          if (found) return found
        }
      }
      return null
    }

    const parentId = findParentId(components, selectedComponent!)

    // Update based on component type
    if (component.type === "cta-button") {
      updateComponent(selectedComponent!, { imageSrc: imageUrl }, parentId)
    } else if (component.type === "footer-link-2") {
      updateComponent(selectedComponent!, { logoA: { ...component.logoA, imgSrc: imageUrl } }, parentId)
    } else {
      updateComponent(selectedComponent!, { src: imageUrl }, parentId)
    }

    toast.success("Image applied to component")
  }

  const handleDeleteFromStorage = async () => {
    if (!imageToDelete) return

    setIsDeleting(true)
    try {
      await firebaseService.deleteImage(imageToDelete)
      removeTemplateImage(imageToDelete)
      toast.success("Image permanently deleted from storage")
    } catch (error) {
      console.error("Failed to delete image:", error)
      toast.error("Failed to delete image")
    } finally {
      setIsDeleting(false)
      setImageToDelete(null)
    }
  }

  if (templateImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-sm">No images uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-2 max-h-[40vh] overflow-y-auto">
      {templateImages.map((url, index) => (
        <div
          key={index}
          className={`relative group aspect-square border-2 border-transparent rounded-md overflow-hidden transition-all bg-gray-50 ${isImageComponentSelected ? "hover:border-blue-500 cursor-pointer" : "cursor-default opacity-80"}`}
        >
          <img
            src={url}
            alt={`Gallery image ${index}`}
            className="w-full h-full object-contain"
            onClick={() => handleImageSelect(url)}
          />
          
          <div className="absolute top-1 right-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <AlertDialog open={imageToDelete === url} onOpenChange={(open) => !open && setImageToDelete(null)}>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="destructive"
                  className="w-6 h-6 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageToDelete(url)
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the image from storage. Any email component currently using this image will show a broken link.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteFromStorage}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {isImageComponentSelected && (
            <div 
              className="absolute inset-x-0 bottom-0 py-1 bg-blue-600/90 text-[10px] text-white font-medium text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Click to Apply
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
