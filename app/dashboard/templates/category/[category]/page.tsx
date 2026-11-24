'use client'

export const dynamic = 'force-dynamic'

import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Search, Mail, Send, Globe, Layers, Loader2 } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import type { EmailTemplate } from "@/types/template"
import { firebaseService } from "@/services/firebase-service"
import { TemplateCard } from "@/components/template-card"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useLoggedInUserStore } from "@/store/logged-in-user"
import { useClient } from "@/lib/use-client"
import { matchesBrand } from "@/lib/brand-filter"

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  rte:       { label: "RTE",       icon: Mail,   color: "#BC2030", bg: "#fff5f5" },
  sfmc:      { label: "SFMC",      icon: Send,   color: "#7e22ce", bg: "#faf5ff" },
  unbranded: { label: "Unbranded", icon: Globe,  color: "#1a56db", bg: "#eff6ff" },
  other:     { label: "Other",     icon: Layers, color: "#374151", bg: "#f9fafb" },
}

export default function CategoryTemplatesPage() {
  const params = useParams()
  const category = (params.category as string).toLowerCase()
  const meta = CATEGORY_META[category]
  const router = useRouter()
  const { userRole } = useLoggedInUserStore()
  const { clientId, client } = useClient()

  const [allTemplates, setAllTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [folderFilter, setFolderFilter] = useState("")
  const [folderTarget, setFolderTarget] = useState<EmailTemplate | null>(null)
  const [folderName, setFolderName] = useState("")
  const [savingFolder, setSavingFolder] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: EmailTemplate | null }>({
    open: false,
    template: null,
  })

  // Fetch once; brand + category filtering is done client-side via useMemo
  useEffect(() => {
    setLoading(true)
    firebaseService
      .getAllTemplates()
      .then((all) =>
        setAllTemplates(
          all
            .filter((t) => t.isUserCreated)
            .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
        )
      )
      .catch((err) => console.error("Failed to load templates:", err))
      .finally(() => setLoading(false))
  }, [])

  // Apply brand + category filter reactively — no stale data when client changes
  const brandCategoryTemplates = useMemo(
    () =>
      allTemplates
        .filter((t) => matchesBrand(t, clientId))
        .filter((t) => t.category === category),
    [allTemplates, clientId, category]
  )

  const folders = [...new Set(brandCategoryTemplates.map(template => template.folder).filter((folder): folder is string => !!folder))].sort()

  useEffect(() => setFolderFilter(""), [clientId, category])

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return brandCategoryTemplates.filter(template => {
      const matchesFolder = folderFilter === "" || (folderFilter === "unfiled" ? !template.folder : `folder:${template.folder}` === folderFilter)
      return matchesFolder && (!q || template.name.toLowerCase().includes(q) || template.description.toLowerCase().includes(q))
    })
  }, [brandCategoryTemplates, searchQuery, folderFilter])

  const saveFolder = async () => {
    if (!folderTarget) return
    setSavingFolder(true)
    try {
      const folder = folderName.split("/").map(part => part.trim()).filter(Boolean).join(" / ")
      const updated = await firebaseService.updateTemplate(folderTarget.id, { folder })
      if (!updated) throw new Error("Folder update failed")
      setAllTemplates(templates => templates.map(template => template.id === folderTarget.id ? updated : template))
      setFolderTarget(null)
      if (folderFilter !== "" && folders.includes(folderTarget.folder ?? "")) setFolderFilter("")
    } catch {
      toast.error("Could not move emailer")
    } finally {
      setSavingFolder(false)
    }
  }

  const handleUseTemplate = (template: EmailTemplate) =>
    router.push(
      `/builder?template=${template.id}&copy=true&keepImages=true&name=${encodeURIComponent(template.name)}&selectMode=true&brand=${clientId}`
    )

  const handleEditTemplate = (template: EmailTemplate) => {
    if (template.isUserCreated) {
      router.push(`/builder?template=${template.id}&edit=true&brand=${clientId}`)
    } else {
      handleUseTemplate(template)
    }
  }

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    try {
      await firebaseService.deleteTemplate(template.id)
      setAllTemplates((prev) => prev.filter((t) => t.id !== template.id))
      setDeleteDialog({ open: false, template: null })
    } catch {
      alert("Failed to delete template. Please try again.")
    }
  }

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      const duplicated = await firebaseService.duplicateTemplate(template.id)
      setAllTemplates((prev) => [duplicated, ...prev])
    } catch {
      alert("Failed to duplicate template. Please try again.")
    }
  }

  const Icon = meta?.icon ?? Mail
  const catLabel = meta?.label ?? category.toUpperCase()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f7f7f5" }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <button
            onClick={() => router.push(`/dashboard?brand=${clientId}`)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title: Client / Category */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: meta?.bg ?? "#f9fafb" }}
              >
                <Icon className="w-5 h-5" style={{ color: meta?.color ?? "#374151" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: client.iconBg, color: client.accentColor }}
                  >
                    {client.label}
                  </span>
                  <span className="text-xs text-gray-300">/</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: meta?.bg ?? "#f9fafb", color: meta?.color ?? "#374151" }}
                  >
                    {catLabel}
                  </span>
                </div>
                <h1 className="text-lg font-bold text-gray-900 mt-0.5">
                  {client.label} · {catLabel} Emailers
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <Input
                  placeholder="Search emailers…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-56 rounded-full text-sm"
                />
              </div>
              {(userRole === "superadmin" || userRole === "admin") && (
                <Button
                  className="flex items-center gap-2 rounded-full px-5 h-9 text-sm font-semibold text-white"
                  style={{ backgroundColor: client.accentColor }}
                  onClick={() => router.push(`/builder?selectMode=true&brand=${clientId}`)}
                >
                  <Plus className="w-4 h-4" />
                  New Email
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex-1">
        {/* Count badge */}
        {!loading && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium text-gray-500">
              {filteredTemplates.length} emailer{filteredTemplates.length !== 1 ? "s" : ""}
              {searchQuery && " matching your search"}
            </span>
            <select aria-label="Filter by folder" value={folderFilter} onChange={event => setFolderFilter(event.target.value)}
              className="ml-auto rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">All folders</option>
              <option value="unfiled">Unfiled</option>
              {folders.map(folder => <option key={folder} value={`folder:${folder}`}>{folder}</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading emailers…</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 px-6 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: client.iconBg }}
            >
              <Icon className="w-7 h-7" style={{ color: client.accentColor }} />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              {searchQuery || folderFilter
                ? "No emailers match your filters"
                : `No ${client.label} ${catLabel} emailers yet`}
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              {searchQuery || folderFilter
                ? "Try a different search or folder."
                : `Create the first ${catLabel} email for ${client.label} to get started.`}
            </p>
            {!searchQuery && !folderFilter && (
              <button
                onClick={() => router.push(`/builder?selectMode=true&brand=${clientId}`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: client.accentColor }}
              >
                <Plus className="w-4 h-4" /> Create first emailer
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="flex flex-col gap-2">
              <TemplateCard
                template={template}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => handleEditTemplate(template)}
                onDelete={() => setDeleteDialog({ open: true, template })}
                onDuplicate={() => handleDuplicateTemplate(template)}
              />
              <Button variant="outline" size="sm" onClick={() => {
                setFolderName(template.folder ?? "")
                setFolderTarget(template)
              }}>
                {template.folder ? `Move from ${template.folder}` : "Move to folder"}
              </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!folderTarget} onOpenChange={open => { if (!open && !savingFolder) setFolderTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move emailer to folder</DialogTitle>
            <DialogDescription>Use slashes to nest folders. Leave the field empty to move the emailer to Unfiled.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={event => { event.preventDefault(); void saveFolder() }}>
            <Input aria-label="Folder path" list="emailer-folders" maxLength={120} value={folderName} onChange={event => setFolderName(event.target.value)} />
            <datalist id="emailer-folders">{folders.map(folder => <option key={folder} value={folder} />)}</datalist>
            <DialogFooter>
              <Button type="submit" disabled={savingFolder}>{savingFolder ? "Moving…" : "Move emailer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        template={deleteDialog.template}
        onConfirm={() => deleteDialog.template && handleDeleteTemplate(deleteDialog.template)}
        onCancel={() => setDeleteDialog({ open: false, template: null })}
      />
    </div>
  )
}
