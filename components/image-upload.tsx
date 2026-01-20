"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, Trash } from "lucide-react"
import { firebaseService } from "@/services/firebase-service"
import { useEmailBuilderStore } from "@/store/email-builder-store"
import { toast } from "sonner"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  currentImage?: string
}

export function ImageUpload({ onImageUpload, currentImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string>(currentImage || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentTemplate, addTemplateImage } = useEmailBuilderStore()

  const acceptedFileTypes = ["image/jpeg", "image/png"]
 

  useEffect(() => {
    setUploadedImage(currentImage || "")
    
    // Reset the file input when the current image changes
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [currentImage])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/") && !acceptedFileTypes.includes(file.type)) {
      alert("Please select an image file")
      return
    }

    // Check file size (max 1MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 1MB")
      return
    }

    setIsUploading(true)

    try {
      // Upload to Firebase Storage
      const imageUrl = await firebaseService.uploadImage(file, currentTemplate?.id)

      if(imageUrl === "PATH_NOT_FOUND"){
        toast.warning("Please save the email!")
        return
      }

      if (imageUrl === "MAX_LIMIT") {
        toast.error("Max limit of 1MB is reached")
        return
      }



      setUploadedImage(imageUrl)
      onImageUpload(imageUrl)
      addTemplateImage(imageUrl)
      
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Failed to upload image:", error)
      alert("Failed to upload image. Please try again.")
      
      // Reset the file input on error too
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    // Strategy: Only unlink from the component property.
    // We do NOT delete from Firebase here because other components might be using the same image.
    setUploadedImage("")
    onImageUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUrlInput = (url: string) => {
    setUploadedImage(url)
    onImageUpload(url)
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {uploadedImage && uploadedImage.startsWith("https://firebase") ? (
        <div className="relative">
          <img
            src={uploadedImage || "/placeholder.svg"}
            alt="Uploaded"
            className="w-[100%] h-32 object-contain rounded-md border"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-1 right-1 w-6 h-6 p-0"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <Trash className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-32 border-dashed border-2 flex flex-col items-center justify-center gap-2 bg-transparent"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-500">Click to upload image</span>
              <span className="text-xs text-gray-400">Max 1MB</span>
            </>
          )}
        </Button>
      )}

    </div>
  )
}
