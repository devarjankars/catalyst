'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { Plus, Search, Mail, Send, Globe } from "lucide-react"
import { useEffect, useState } from "react"
import { EmailTemplate } from "@/types/template"
import { LoadingSpinner } from "@/components/loading-spinner"
import { firebaseService } from "@/services/firebase-service"
import { TemplateCard } from "@/components/template-card"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useLoggedInUserStore } from "@/store/logged-in-user"

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  rte:       { label: "RTE Emailers",       icon: Mail,  color: "bg-blue-100 text-blue-800" },
  sfmc:      { label: "SFMC Emailers",      icon: Send,  color: "bg-green-100 text-green-800" },
  unbranded: { label: "Unbranded",          icon: Globe, color: "bg-purple-100 text-purple-800" },
}

export default function CategoryTemplatesPage() {
  const params = useParams()
  const category = (params.category as string).toLowerCase()
  const meta = CATEGORY_META[category]

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: EmailTemplate | null }>({
    open: false,
    template: null,
  })
  const router = useRouter()
  const { userRole } = useLoggedInUserStore()

  useEffect(() => {
    loadTemplates()
  }, [category])

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    const results = templates.filter(t =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    )
    setFilteredTemplates(results)
  }, [templates, searchQuery])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const all = await firebaseService.getAllTemplates()
      const sorted = all
        .filter(t => t.isUserCreated && t.category === category)
        .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
      setTemplates(sorted)
    } catch (err) {
      console.error("Failed to load templates:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = (template: EmailTemplate) => {
    router.push(`/builder?template=${template.id}&copy=true&name=${encodeURIComponent(template.name)}&selectMode=true`)
  }

  const handleOpenThreeCanvas = (template: EmailTemplate) => {
    router.push(`/builder?template=${template.id}&copy=true&name=${encodeURIComponent(template.name)}&selectMode=true`)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    if (template.isUserCreated) {
      router.push(`/builder?template=${template.id}&edit=true&selectMode=true`)
    } else {
      handleUseTemplate(template)
    }
  }

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    try {
      await firebaseService.deleteTemplate(template.id)
      setTemplates(prev => prev.filter(t => t.id !== template.id))
      setDeleteDialog({ open: false, template: null })
    } catch {
      alert("Failed to delete template. Please try again.")
    }
  }

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      const duplicated = await firebaseService.duplicateTemplate(template.id)
      setTemplates(prev => [duplicated, ...prev])
    } catch {
      alert("Failed to duplicate template. Please try again.")
    }
  }

  const Icon = meta?.icon

  return (
    <div className="h-screen bg-gray-50 flex flex-col py-2 px-8">
      <div className="mt-4">
        <div className="px-4 sm:px-6 lg:px-8 py-8 border rounded-lg bg-[linear-gradient(168deg,rgba(255,160,162,1)_0%,rgba(255,239,239,1)_100%)]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {Icon && <Icon className="w-6 h-6 text-[#4A5565]" />}
              <h1 className="text-xl font-bold text-[#4A5565]">
                {meta?.label ?? category.toUpperCase()}
              </h1>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${meta?.color ?? "bg-gray-100 text-gray-800"}`}>
                {templates.length} template{templates.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-2/3 rounded-full"
                />
              </div>
              {(userRole === "superadmin" || userRole === "admin") && (
                <Button
                  className="flex items-center gap-2 rounded-full px-6"
                  onClick={() => router.push("/builder?selectMode=true")}
                >
                  <Plus className="w-4 h-4" />
                  Create template
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto p-4 h-full">
        <div className="mt-6">
          <h2 className="font-bold mb-4">
            {meta?.label ?? category.toUpperCase()} — All Emailers
          </h2>

          {loading ? (
            <div className="h-[30vh] flex items-center justify-center">
              <LoadingSpinner message="Loading templates..." />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No templates found" : `No ${meta?.label ?? category} templates yet`}
              </h3>
              {searchQuery && (
                <p className="text-gray-600">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template)}
                  onEdit={() => handleEditTemplate(template)}
                  onOpenThreeMode={() => handleOpenThreeCanvas(template)}
                  onDelete={() => setDeleteDialog({ open: true, template })}
                  onDuplicate={() => handleDuplicateTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        template={deleteDialog.template}
        onConfirm={() => deleteDialog.template && handleDeleteTemplate(deleteDialog.template)}
        onCancel={() => setDeleteDialog({ open: false, template: null })}
      />
    </div>
  )
}
