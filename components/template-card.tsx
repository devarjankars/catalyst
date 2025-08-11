"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Copy, MoreVertical, Calendar, Play, Sparkles } from "lucide-react"
import type { EmailTemplate } from "@/types/template"

interface TemplateCardProps {
  template: EmailTemplate
  onUse: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export function TemplateCard({ template, onUse, onEdit, onDelete, onDuplicate }: TemplateCardProps) {
  const [imageLoading, setImageLoading] = useState(true)

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-110" onClick={onUse}>
      <CardHeader className="p-0">
        <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
          <img
            src={template.thumbnail || "/placeholder.svg?height=200&width=300&text=Email Template"}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
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
          {!template.isUserCreated && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Sample
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{template.description}</p>
          </div>
          <DropdownMenu>
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
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onUse()
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Use Template
              </DropdownMenuItem>
              {template.isUserCreated && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Original
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate()
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {template.isUserCreated && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mt-3">
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
  )
}
