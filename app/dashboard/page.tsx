"use client"

export const dynamic = "force-dynamic"

import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Plus, ChevronDown, Mail, Layers, ArrowRight, Send, Globe, LoaderCircle, RotateCw,
} from "lucide-react"
import { BrandSelectionModal, type Brand } from "@/components/brand-selection-modal"
import { useClient } from "@/lib/use-client"
import { firebaseService } from "@/services/firebase-service"
import type { EmailTemplate } from "@/types/template"
import { matchesBrand } from "@/lib/brand-filter"
import { useLoggedInUserStore } from "@/store/logged-in-user"

// ── Category metadata ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "rte",       label: "RTE",       description: "Rep triggered emailers",          color: "#BC2030", bg: "#fff5f5", icon: Mail },
  { id: "sfmc",      label: "SFMC",      description: "Salesforce Marketing Cloud",      color: "#7e22ce", bg: "#faf5ff", icon: Send },
  { id: "unbranded", label: "Unbranded", description: "Disease-state emailers",          color: "#1a56db", bg: "#eff6ff", icon: Globe },
  { id: "other",     label: "Other",     description: "Other email formats",             color: "#374151", bg: "#f9fafb", icon: Layers },
] as const

// ── Greeting helper ──────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const { clientId, client } = useClient()
  const { userEmail } = useLoggedInUserStore()

  const [brandModalOpen, setBrandModalOpen] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  // Stop showing the skeleton if a network request stalls; retries remain available.
  useEffect(() => {
    let isActive = true
    setLoading(true)
    setLoadError(false)

    const timeoutId = window.setTimeout(() => {
      if (isActive) {
        setLoading(false)
        setLoadError(true)
      }
    }, 15000)

    firebaseService
      .getAllTemplates()
      .then((all) => {
        if (!isActive) return
        setTemplates(
          [...all].sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
        )
        setLoadError(false)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Failed to load dashboard templates:", error)
        if (isActive) {
          setLoadError(true)
          setLoading(false)
        }
      })
      .finally(() => window.clearTimeout(timeoutId))

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
    }
  }, [loadAttempt])

  const retryLoading = useCallback(() => setLoadAttempt((attempt) => attempt + 1), [])

  // Re-filter whenever the client changes (no extra fetch needed)
  const clientTemplates = useMemo(
    () => templates.filter((t) => matchesBrand(t, clientId)),
    [templates, clientId]
  )

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of clientTemplates.filter((template) => template.isUserCreated)) {
      map[t.category] = (map[t.category] ?? 0) + 1
    }
    return map
  }, [clientTemplates])

  const standardCountByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of clientTemplates.filter((template) => !template.isUserCreated)) {
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

  const handleViewCategory = (catId: string) =>
    router.push(`/dashboard/templates/category/${catId}?brand=${clientId}`)

  const handleViewStandardCategory = (catId: string) =>
    router.push(`/dashboard/standard-templates?brand=${clientId}&category=${catId}`)

  const name = userEmail?.split("@")[0] ?? "there"

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: "#f7f7f5" }}>
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
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-9">
        {loadError && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">Template counts are taking longer than expected</p>
              <p className="mt-0.5 text-xs text-amber-800">
                You can still open emailer categories. Retry to refresh their counts.
              </p>
            </div>
            <button
              onClick={retryLoading}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 sm:self-auto"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* ── Standard emailer categories ───────────────────────────── */}
        <section
          className="rounded-3xl p-5 sm:p-7"
          style={{
            background: `linear-gradient(135deg, ${client.iconBg} 0%, #ffffff 72%)`,
            border: `1px solid ${client.accentColor}20`,
          }}
        >
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="mb-1 text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: client.accentColor }}
              >
                Start with a template
              </p>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Standard emailers
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Browse ready-made emailers by channel.
              </p>
            </div>
            <span className="text-xs font-medium text-gray-400">
              {client.label} library
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {loading
              ? CATEGORIES.map(({ id, color, bg }) => (
                  <div
                    key={id}
                    className="animate-pulse rounded-2xl border border-white/80 bg-white p-5 shadow-sm"
                    aria-hidden="true"
                  >
                    <div className="mb-5 h-11 w-11 rounded-xl" style={{ backgroundColor: bg }} />
                    <div className="h-4 w-16 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
                    <div className="mt-5 h-6 w-20 rounded-full" style={{ backgroundColor: `${color}12` }} />
                  </div>
                ))
              : CATEGORIES.map(({ id, label, description, color, bg, icon: Icon }) => {
              const count = standardCountByCategory[id] ?? 0
              return (
                <button
                  key={id}
                  onClick={() => handleViewStandardCategory(id)}
                  className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ outlineColor: color }}
                >
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
                    </div>
                    <ArrowRight
                      className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-1"
                      style={{ color }}
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: bg, color }}
                    >
                      {loadError ? "— templates" : `${count} template${count !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500" role="status">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" style={{ color: client.accentColor }} />
              <span>Loading {client.label} templates…</span>
            </div>
          )}
        </section>

        {/* ── Category modules ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Your emailers
            </h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
              {CATEGORIES.map(({ id }) => (
                <div key={id} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
                  <div className="mb-3 h-9 w-9 rounded-xl bg-gray-100" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-3/4 rounded bg-gray-100" />
                  <div className="mt-4 h-6 w-16 rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {CATEGORIES.map(({ id, label, description, color, bg, icon: Icon }) => {
              const count = countByCategory[id] ?? 0
              return (
                <button
                  key={id}
                  onClick={() => handleViewCategory(id)}
                  className="group text-left rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ outlineColor: color }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 mb-3">{description}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: bg, color }}
                    >
                      {loadError ? "— emails" : `${count} email${count !== 1 ? "s" : ""}`}
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
