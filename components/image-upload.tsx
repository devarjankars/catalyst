"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Trash } from "lucide-react"
import { firebaseService } from "@/services/firebase-service"
import { useEmailBuilderStore } from "@/store/email-builder-store"
import { toast } from "sonner"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  currentImage?: string
}

export function ImageUpload({ onImageUpload, currentImage }: ImageUploadProps) {
  const [isUploading, setIsUploading]   = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string>(currentImage || "")
  const [isDragging, setIsDragging]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef  = useRef<HTMLDivElement>(null)
  const { currentTemplate, addTemplateImage } = useEmailBuilderStore()

  const acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]

  useEffect(() => {
    setUploadedImage(currentImage || "")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [currentImage])

  // ── Core upload handler — shared by click and drag ──────────────────────
  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file")
      return
    }

    setIsUploading(true)
    try {
      const imageUrl = await firebaseService.uploadImage(file, currentTemplate?.id)

      if (imageUrl === "PATH_NOT_FOUND") {
        toast.warning("Please save the email first!")
        return
      }

      setUploadedImage(imageUrl)
      onImageUpload(imageUrl)
      addTemplateImage(imageUrl)
    } catch (error) {
      console.error("Failed to upload image:", error)
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [currentTemplate?.id, onImageUpload, addTemplateImage])

  // ── File input change ────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
  }

  // ── Drag events ──────────────────────────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Tell the browser we accept this drop
    e.dataTransfer.dropEffect = "copy"
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear when leaving the drop zone itself, not a child element
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }

  const handleRemoveImage = () => {
    setUploadedImage("")
    onImageUpload("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const hasImage = uploadedImage && uploadedImage.length > 0

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

      {hasImage ? (
        /* ── Preview with remove button ── */
        <div className="relative">
          <img
            src={uploadedImage}
            alt="Uploaded"
            className="w-full h-32 object-contain rounded-md border"
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
          {/* Allow re-upload by dropping onto the preview */}
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              absolute inset-0 rounded-md flex flex-col items-center justify-center gap-1
              cursor-pointer transition-all
              ${isDragging
                ? "bg-blue-500/70 border-2 border-blue-400 border-dashed"
                : "bg-transparent hover:bg-black/10"}
            `}
          >
            {isDragging && (
              <>
                <Upload className="w-6 h-6 text-white" />
                <span className="text-xs text-white font-medium">Drop to replace</span>
              </>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-white/70 rounded-md flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Empty drop zone ── */
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            w-full h-32 rounded-md border-2 border-dashed flex flex-col items-center
            justify-center gap-2 cursor-pointer transition-all select-none
            ${isDragging
              ? "border-blue-400 bg-blue-50 scale-[1.01]"
              : "border-gray-300 bg-transparent hover:border-gray-400 hover:bg-gray-50"}
            ${isUploading ? "pointer-events-none opacity-70" : ""}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">Uploading...</span>
            </>
          ) : isDragging ? (
            <>
              <Upload className="w-6 h-6 text-blue-500" />
              <span className="text-sm text-blue-600 font-medium">Drop image here</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-500">Click or drag image here</span>
              <span className="text-xs text-gray-400">PNG, JPG, GIF, WebP</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
