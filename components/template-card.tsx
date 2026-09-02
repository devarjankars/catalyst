"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Calendar, Play, Sparkles, Grid } from "lucide-react"
import type { EmailTemplate } from "@/types/template"
import { generateEmailHTML } from "@/lib/email-generator"

interface TemplateCardProps {
  template: EmailTemplate
  onUse: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  readOnly?: boolean
}

export function TemplateCard({ template, onUse, onEdit, onDelete, onDuplicate, readOnly = false }: TemplateCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const previewRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  // Standard templates (isUserCreated: false) are view/use only — no edit or delete
  const isStandard = !template.isUserCreated
  // Only explicitly marked read-only blocks edit/delete — standard templates are now editable
  const isReadOnly = readOnly

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
      case "rte":       return "bg-blue-100 text-blue-800"
      case "sfmc":      return "bg-green-100 text-green-800"
      case "unbranded": return "bg-purple-100 text-purple-800"
      default:          return "bg-gray-100 text-gray-800"
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

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-xl h-full"
    >
      <Card className="group flex flex-col h-full transition-all duration-200 border border-gray-200 hover:border-[#BC2030]/30 overflow-hidden">
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

            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-35 transition-all duration-200" />

            {/* Hover action bar */}
            <div className="absolute bottom-0 inset-x-0 flex translate-y-2 items-center justify-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
              {/* Edit — hidden for standard/read-only templates */}
              {!isReadOnly && (
                <Button
                  size="sm"
                  className="bg-white/95 text-gray-800 hover:bg-white hover:text-gray-900 border-0 shadow-md shadow-black/20"
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              )}
              <Button
                size="sm"
                className="bg-[#BC2030] hover:bg-[#A81B29] shadow-md shadow-black/20"
                onClick={(e) => { e.stopPropagation(); onUse() }}
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                {isStandard ? "Use Template" : "Use"}
              </Button>
            </div>

            {/* Delete — hidden for standard/read-only templates */}
            {!isReadOnly && (
              <Button
                size="icon"
                className="absolute top-2 right-2 rounded-full bg-white/95 text-red-600 shadow-md shadow-black/20 border-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 hover:text-red-700"
                onClick={(e) => { e.stopPropagation(); onDelete() }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <div className="absolute top-2 left-2 flex gap-2">
              {isStandard && (
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
          <div className="mb-2 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{template.description}</p>
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
