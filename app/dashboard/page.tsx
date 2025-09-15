"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter } from "lucide-react"
import { TemplateCard } from "@/components/template-card"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { EmailTemplate } from "@/types/template"
import { firebaseService } from "@/services/firebase-service"

export default function Dashboard() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: EmailTemplate | null }>({
    open: false,
    template: null,
  })

  const categories = [
    { id: "all", label: "All Templates", count: 0 },
    { id: "rte", label: "RTE", count: 0 },
    { id: "sfmc", label: "SFMC", count: 0 },
    { id: "unbranded", label: "Unbranded", count: 0 },
    { id: "other", label: "Other", count: 0 },
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchQuery, selectedCategory])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const loadedTemplates = await firebaseService.getAllTemplates()
      setTemplates(loadedTemplates)
    } catch (error) {
      console.error("Failed to load templates:", error)
    } finally {
      setLoading(false)
    }
  }

  
  

  const filterTemplates = () => {
    let filtered = templates

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((template) => template.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredTemplates(filtered)
  }

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === "all") return templates.length
    return templates.filter((template) => template.category === categoryId).length
  }

  const handleCreateBlank = () => {
    router.push("/builder")
  }

  const handleUseTemplate = async (template: EmailTemplate) => {
    // Navigate to builder with copy flag - template will be loaded but not saved until user saves
    router.push(`/builder?template=${template.id}&copy=true&name=${encodeURIComponent(template.name)}`)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    // Only allow editing of user-created templates (not sample templates)
    if (template.isUserCreated) {
      router.push(`/builder?template=${template.id}&edit=true`)
    } else {
      // For sample templates, create a copy instead
      handleUseTemplate(template)
    }
  }

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    try {
      await firebaseService.deleteTemplate(template.id)
      setTemplates((prev) => prev.filter((t) => t.id !== template.id))
      setDeleteDialog({ open: false, template: null })
    } catch (error) {
      console.error("Failed to delete template:", error)
      alert("Failed to delete template. Please try again.")
    }
  }

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      const duplicated = await firebaseService.duplicateTemplate(template.id)
      setTemplates((prev) => [duplicated, ...prev])
    } catch (error) {
      console.error("Failed to duplicate template:", error)
      alert("Failed to duplicate template. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Loading your email templates..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
              <p className="text-sm text-gray-600">Create and manage your email templates</p>
            </div>
            <Button onClick={handleCreateBlank} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Blank Template
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filter by category</span>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  {category.label}
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryCount(category.id)}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedCategory !== "all" ? "No templates found" : "No templates yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first email template"}
            </p>
            <Button onClick={handleCreateBlank} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => handleEditTemplate(template)}
                onDelete={() => setDeleteDialog({ open: true, template })}
                onDuplicate={() => handleDuplicateTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        template={deleteDialog.template}
        onConfirm={() => deleteDialog.template && handleDeleteTemplate(deleteDialog.template)}
        onCancel={() => setDeleteDialog({ open: false, template: null })}
      />
    </div>
  )
}
