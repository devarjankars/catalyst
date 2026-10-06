"use client"

export const dynamic = "force-dynamic"

import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import {
  Plus, ChevronDown, Mail, Layers, LayoutTemplate,
  Clock, ArrowRight, Loader2, Check,
} from "lucide-react"
import { BrandSelectionModal, BRANDS, type Brand } from "@/components/brand-selection-modal"
import { useClient } from "@/lib/use-client"
import { firebaseService } from "@/services/firebase-service"
import type { EmailTemplate } from "@/types/template"
import { matchesBrand } from "@/lib/brand-filter"
import { useLoggedInUserStore } from "@/store/logged-in-user"

// ── Category metadata ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "rte",       label: "Rep Triggered",  description: "Rep triggered emailers",              color: "#BC2030", bg: "#fff5f5" },
  { id: "sfmc",      label: "SFMC",           description: "Salesforce Marketing Cloud",           color: "#7e22ce", bg: "#faf5ff" },
  { id: "unbranded", label: "Unbranded",      description: "Disease-state / unbranded emails",     color: "#1a56db", bg: "#eff6ff" },
  { id: "other",     label: "Other",          description: "Miscellaneous emailers",               color: "#374151", bg: "#f9fafb" },
] as const

type CategoryId = typeof CATEGORIES[number]["id"]

// ── Greeting helper ──────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

// ── Mini template card ───────────────────────────────────────────────────────
function MiniCard({
  template,
  accent,
  onEdit,
  onUse,
}: {
  template: EmailTemplate
  accent: string
  onEdit: () => void
  onUse: () => void
}) {
  const cat = CATEGORIES.find((c) => c.id === template.category)
  const updated = template.updatedAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
        template.updatedAt instanceof Date ? template.updatedAt : new Date(template.updatedAt)
      )
    : "—"

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-200"
      style={{ ["--accent" as any]: accent }}
    >
      {/* Accent top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Category chip */}
        {cat && (
          <span
            className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: cat.bg, color: cat.color }}
          >
            {cat.label}
          </span>
        )}

        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {template.name}
          </h4>
          {template.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{template.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {updated}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {template.isUserCreated && (
              <button
                onClick={onEdit}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onUse}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg text-white transition-colors"
              style={{ backgroundColor: accent }}
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  label,
  accent,
  onCreateNew,
}: {
  label: string
  accent: string
  onCreateNew: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: accent + "15" }}
      >
        <Mail className="w-7 h-7" style={{ color: accent }} />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        No {label} emailers yet
      </h3>
      <p className="text-sm text-gray-400 mb-5 max-w-xs">
        Create your first email for this client to get started.
      </p>
      <button
        onClick={onCreateNew}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ backgroundColor: accent }}
      >
        <Plus className="w-4 h-4" /> Create first emailer
      </button>
    </div>
  )
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const { clientId, client } = useClient()
  const { userEmail } = useLoggedInUserStore()

  const [brandModalOpen, setBrandModalOpen] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // Load all user-created templates once; filter client-side
  useEffect(() => {
    setLoading(true)
    firebaseService
      .getAllTemplates()
      .then((all) =>
        setTemplates(
          all
            .filter((t) => t.isUserCreated)
            .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
        )
      )
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Re-filter whenever the client changes (no extra fetch needed)
  const clientTemplates = useMemo(
    () => templates.filter((t) => matchesBrand(t, clientId)),
    [templates, clientId]
  )

  const recentTemplates = useMemo(() => clientTemplates.slice(0, 8), [clientTemplates])

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of clientTemplates) {
      map[t.category] = (map[t.category] ?? 0) + 1
    }
    return map
  }, [clientTemplates])

  const handleBrandSelect = (brand: Brand) => {
    setBrandModalOpen(false)
    router.push(`/dashboard?brand=${brand}`)
  }

  const handleCreateNew = () =>
    router.push(`/builder?selectMode=true&brand=${clientId}`)

  const handleEdit = (t: EmailTemplate) =>
    router.push(`/builder?template=${t.id}&edit=true&brand=${clientId}`)

  const handleUse = (t: EmailTemplate) =>
    router.push(
      `/builder?template=${t.id}&copy=true&keepImages=true&name=${encodeURIComponent(t.name)}&selectMode=true&brand=${clientId}`
    )

  const handleViewAll = () =>
    router.push(`/dashboard/templates?brand=${clientId}`)

  const handleViewCategory = (catId: string) =>
    router.push(`/dashboard/templates/category/${catId}?brand=${clientId}`)

  const name = userEmail?.split("@")[0] ?? "there"

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f7f5" }}>
      {/* ── Workspace header ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Greeting */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {greeting()}, {name}.
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage approved email experiences for your client.
            </p>
          </div>

          {/* Right: client switcher + create */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Client pill */}
            <button
              onClick={() => setBrandModalOpen(true)}
              className="flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all hover:shadow-md active:scale-95"
              style={{
                borderColor: client.accentColor,
                backgroundColor: client.iconBg,
                color: client.accentColor,
              }}
              aria-label="Switch client"
            >
              <span
                className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: client.accentColor }}
              >
                {client.symbol}
              </span>
              {client.label}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {/* Create new email */}
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
              style={{ backgroundColor: client.accentColor }}
            >
              <Plus className="h-4 w-4" />
              Create New Email
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Standard templates shortcut ───────────────────────────── */}
        <section>
          <button
            onClick={() => router.push(`/dashboard/standard-templates?brand=${clientId}`)}
            className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-6 py-5 transition-all duration-200 hover:shadow-md hover:border-gray-200 group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: client.iconBg }}
              >
                <LayoutTemplate className="w-5 h-5" style={{ color: client.accentColor }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Standard Templates</p>
                <p className="text-xs text-gray-400">
                  Pre-built starting points for new emailers
                </p>
              </div>
            </div>
            <ArrowRight
              className="w-4 h-4 text-gray-300 transition-transform duration-150 group-hover:translate-x-0.5"
              style={{ color: client.accentColor }}
            />
          </button>
        </section>

        {/* ── Category modules ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Categories
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(({ id, label, description, color, bg }) => {
              const count = countByCategory[id] ?? 0
              return (
                <button
                  key={id}
                  onClick={() => handleViewCategory(id)}
                  className="group text-left rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200 focus:outline-none focus-visible:ring-2"
                  style={{ ["--ring-color" as any]: color }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: bg }}
                  >
                    <Mail className="w-4 h-4" style={{ color }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 mb-3">{description}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: bg, color }}
                    >
                      {count} email{count !== 1 ? "s" : ""}
                    </span>
                    <ArrowRight
                      className="w-3.5 h-3.5 text-gray-300 transition-transform duration-150 group-hover:translate-x-0.5"
                      style={{ color }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Recent emailers ───────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Recent Emailers
              </h2>
              {!loading && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: client.iconBg, color: client.accentColor }}
                >
                  {clientTemplates.length}
                </span>
              )}
            </div>
            {clientTemplates.length > 0 && (
              <button
                onClick={handleViewAll}
                className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: client.accentColor }}
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading emailers…</span>
            </div>
          ) : clientTemplates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100">
              <EmptyState
                label={client.label}
                accent={client.accentColor}
                onCreateNew={handleCreateNew}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentTemplates.map((t) => (
                <MiniCard
                  key={t.id}
                  template={t}
                  accent={client.accentColor}
                  onEdit={() => handleEdit(t)}
                  onUse={() => handleUse(t)}
                />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ── Client selector modal ─────────────────────────────────────── */}
      <BrandSelectionModal
        open={brandModalOpen}
        onOpenChange={setBrandModalOpen}
        onSelect={handleBrandSelect}
        currentBrand={clientId}
      />
    </div>
  )
}
