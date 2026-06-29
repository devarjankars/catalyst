"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Copy, MoreVertical, Calendar, Play, Sparkles, Image, Grid } from "lucide-react"
import type { EmailTemplate } from "@/types/template"
import { generateEmailHTML } from "@/lib/email-generator"

interface TemplateCardProps {
  template: EmailTemplate
  onUse: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export function TemplateCard({ template, onUse, onEdit, onDelete, onDuplicate }: TemplateCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const previewRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    if (!previewRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 600)
    })
    observer.observe(previewRef.current)
    return () => observer.disconnect()
  }, [])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "rte":
        return "bg-blue-100 text-blue-800"
      case "sfmc":
        return "bg-green-100 text-green-800"
      case "unbranded":
        return "bg-purple-100 text-purple-800"
      case "other":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "—"
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return "—"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d)
  }

  const handleVSB = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Replace with your router/navigation logic
    window.location.href = `/vsb/${template.id}`;
  };

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-xl h-full"
    >
    <Card className="group flex flex-col h-full transition-all duration-200 cursor-pointer border border-gray-200 hover:border-[#BC2030]/30 overflow-hidden" onClick={onUse}>
      <CardHeader className="p-0">
        <div ref={previewRef} className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          {template.thumbnail ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            </>
          ) : template.components?.length ? (
            <iframe
              srcDoc={generateEmailHTML(template.components, template.preheaderText)}
              className="absolute inset-0 border-none"
              style={{
                width: "600px",
                height: "800px",
                transformOrigin: "top left",
                transform: `scale(${scale})`,
                pointerEvents: "none",
              }}
              scrolling="no"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium">
              No preview available
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation()
                onUse()
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Use Template
            </Button>
          </div>
          <div className="absolute top-2 left-2 flex gap-2">
            {!template.isUserCreated && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                Standard
              </Badge>
            )}
            {template.optionMode === "three" && (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-sm">
                <Grid className="w-3 h-3 mr-1" />
                3 Options
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2 flex-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{template.description}</p>
          </div>
         {template.isUserCreated && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
             
              {template.isUserCreated && (
                <DropdownMenuItem
                className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit 
                </DropdownMenuItem>
              )}
             
              {template.isUserCreated && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}

              {template.isUserCreated && (
                <DropdownMenuItem
                 onClick={handleVSB}
                 className="cursor-pointer"
                >
                  <Image  className="w-4 h-4 mr-2" />VSB
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 gap-2">
          <Badge className={getCategoryColor(template.category)} variant="secondary">
            {template.category.toUpperCase()}
          </Badge>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(template.updatedAt)}
          </div>
          
        </div>
      </CardContent>
    </Card>
    </motion.div>
  )
}
