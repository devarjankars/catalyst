"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2 } from "lucide-react"
import { firebaseService } from "@/services/firebase-service"
import { useEmailBuilderStore } from "@/store/email-builder-store"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  currentImage?: string
}

export function ImageUpload({ onImageUpload, currentImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string>(currentImage || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentTemplate } = useEmailBuilderStore()


  useEffect(() => {
    console.log("current image from upload image",currentImage);
    
    setUploadedImage(currentImage || "")
  }, [currentImage])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    setIsUploading(true)

    try {
      // Upload to Firebase Storage
      const imageUrl = await firebaseService.uploadImage(file, currentTemplate?.id)
      setUploadedImage(imageUrl)
      onImageUpload(imageUrl)
    } catch (error) {
      console.error("Failed to upload image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (uploadedImage && uploadedImage.includes("firebase")) {
      try {
        await firebaseService.deleteImage(uploadedImage)
      } catch (error) {
        console.error("Failed to delete image:", error)
      }
    }

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
            <X className="w-3 h-3" />
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
              <span className="text-xs text-gray-400">Max 5MB</span>
            </>
          )}
        </Button>
      )}

    </div>
  )
}
