'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, Plus, Search, Mail, Send, Globe, Layers, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { firebaseService } from '@/services/firebase-service'
import type { EmailTemplate } from '@/types/template'
import { TemplateCard } from '@/components/template-card'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { useLoggedInUserStore } from '@/store/logged-in-user'
import { useClient } from '@/lib/use-client'
import { matchesBrand } from '@/lib/brand-filter'

const CATEGORIES = [
  { id: 'rte',       label: 'RTE',       description: 'Ready-to-execute emailers',        icon: Mail,   color: '#BC2030', bg: '#fff5f5' },
  { id: 'sfmc',      label: 'SFMC',      description: 'Salesforce Marketing Cloud',       icon: Send,   color: '#7e22ce', bg: '#faf5ff' },
  { id: 'unbranded', label: 'Unbranded', description: 'Disease-state / unbranded emails', icon: Globe,  color: '#1a56db', bg: '#eff6ff' },
  { id: 'other',     label: 'Other',     description: 'Miscellaneous emailers',           icon: Layers, color: '#374151', bg: '#f9fafb' },
] as const

type CategoryId = typeof CATEGORIES[number]['id']

export default function StandardTemplatesPage() {
  const router = useRouter()
  const { clientId, client } = useClient()
  const { userRole } = useLoggedInUserStore()

  const [allTemplates, setAllTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<CategoryId | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: EmailTemplate | null }>({ open: false, template: null })

  useEffect(() => {
    setLoading(true)
    firebaseService
      .getAllTemplates()
      .then((all) => setAllTemplates(all.filter((t) => !t.isUserCreated)))
      .catch((err) => console.error('Failed to load templates:', err))
      .finally(() => setLoading(false))
  }, [])

  // Brand-filtered templates
  const brandTemplates = useMemo(
    () => allTemplates.filter((t) => matchesBrand(t, clientId)),
    [allTemplates, clientId]
  )

  // Per-category counts
  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of brandTemplates) map[t.category] = (map[t.category] ?? 0) + 1
    return map
  }, [brandTemplates])

  // Templates for the expanded category, with optional search
  const expandedTemplates = useMemo(() => {
    if (!expandedCategory) return []
    const q = searchQuery.trim().toLowerCase()
    return brandTemplates
      .filter((t) => t.category === expandedCategory)
      .filter((t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
  }, [brandTemplates, expandedCategory, searchQuery])

  const handleUseTemplate = (template: EmailTemplate) =>
    router.push(`/builder?template=${template.id}&copy=true&keepImages=true&name=${encodeURIComponent(template.name)}&selectMode=true&brand=${clientId}`)

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
      alert('Failed to delete template. Please try again.')
    }
  }

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      const duplicated = await firebaseService.duplicateTemplate(template.id)
      setAllTemplates((prev) => [duplicated, ...prev])
    } catch {
      alert('Failed to duplicate template. Please try again.')
    }
  }

  const toggleCategory = (id: CategoryId) => {
    setExpandedCategory((prev) => (prev === id ? null : id))
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f5' }}>
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/dashboard?brand=${clientId}`)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: client.iconBg, color: client.accentColor }}
                >
                  {client.label}
                </span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">Standard Templates</h1>
              <p className="text-sm text-gray-400">Pre-built starting points for new emailers</p>
            </div>

            {(userRole === 'superadmin' || userRole === 'admin') && (
              <button
                onClick={() => router.push(`/builder?selectMode=true&brand=${clientId}`)}
                className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm self-start sm:self-auto"
                style={{ backgroundColor: client.accentColor }}
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading templates…</span>
          </div>
        ) : (
          CATEGORIES.map(({ id, label, description, icon: Icon, color, bg }) => {
            const count = countByCategory[id] ?? 0
            const isOpen = expandedCategory === id

            return (
              <div
                key={id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200"
                style={{ boxShadow: isOpen ? `0 4px 24px ${color}18` : undefined, borderColor: isOpen ? color + '40' : undefined }}
              >
                {/* Category row — always visible */}
                <button
                  onClick={() => toggleCategory(id)}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50/60 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{description}</p>
                  </div>

                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: bg, color }}
                  >
                    {count} template{count !== 1 ? 's' : ''}
                  </span>

                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
                  }
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t px-6 py-5" style={{ borderColor: color + '20' }}>
                    {/* Search within category */}
                    <div className="relative mb-5 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        placeholder={`Search ${label} templates…`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9 h-9 rounded-full text-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {expandedTemplates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
                          <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {searchQuery ? 'No templates match your search' : `No ${client.label} ${label} templates yet`}
                        </p>
                        {!searchQuery && (userRole === 'superadmin' || userRole === 'admin') && (
                          <button
                            onClick={() => router.push(`/builder?selectMode=true&brand=${clientId}`)}
                            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: color }}
                          >
                            <Plus className="w-3.5 h-3.5" /> Create first template
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {expandedTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onUse={() => handleUseTemplate(template)}
                            onEdit={() => handleEditTemplate(template)}
                            onDelete={() => setDeleteDialog({ open: true, template })}
                            onDuplicate={() => handleDuplicateTemplate(template)}
                            readOnly
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
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
