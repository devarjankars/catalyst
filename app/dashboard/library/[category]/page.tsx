"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { firebaseService } from "@/services/firebase-service"
import type { EmailTemplate, BrandId } from "@/types/template"
import {
  ArrowLeft, FileText, Loader2, Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  rte:       { label: "RTE",       color: "#BC2030" },
  unbranded: { label: "Unbranded", color: "#1a56db" },
  sfmc:      { label: "SFMC",      color: "#7e22ce" },
  tpe:       { label: "TPE",       color: "#d97706" },
  other:     { label: "Other",     color: "#374151" },
}

function fmtDate(d: Date | null | string | undefined): string {
  if (!d) return "—"
  try { return format(new Date(d as any), "MMM d, yyyy 'at' h:mm a") } catch { return "—" }
}

export default function LibraryCategoryPage() {
  const { category } = useParams<{ category: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  // brand is used for navigation context only — we show ALL brands in this category
  const selectedBrand = (searchParams.get("brand") || "orserdu") as BrandId
  const meta = CATEGORY_META[category] ?? { label: category, color: "#374151" }

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Load ALL user-created templates in this category (regardless of brand)
  useEffect(() => {
    setLoading(true)
    firebaseService.getAllTemplates().then((all) => {
      const filtered = all.filter(
        (t) => t.isUserCreated && t.category === category
      )
      setTemplates(filtered)
      setLoading(false)
    })
  }, [category])

  const handleSelectFile = (template: EmailTemplate) => {
    router.push(`/builder?template=${template.id}&edit=true&brand=${template.brand || selectedBrand}`);
  };

  const filtered = templates.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── LEFT: file list ───────────────────────────────────────────── */}
      <div className="flex flex-col w-72 border-r border-gray-200 bg-white shrink-0">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => router.push(`/dashboard?brand=${selectedBrand}`)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded"
              style={{ backgroundColor: meta.color + "15", color: meta.color }}
            >
              {meta.label}
            </span>
            <span className="text-xs text-gray-400">All brands</span>
          </div>
          <Input
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 px-4 text-center text-sm text-gray-400">
              No emailers in {meta.label} yet.
              <br />
              <button
                className="mt-2 text-[#BC2030] font-medium hover:underline text-xs"
                onClick={() => router.push(`/builder?selectMode=true&brand=${selectedBrand}`)}
              >
                Create one →
              </button>
            </div>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectFile(t)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors `}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">{t.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 ml-6">
                  {t.brand && (
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{t.brand}</span>
                  )}
                  <p className="text-xs text-gray-400">
                    {t.updatedAt ? fmtDate(t.updatedAt) : "—"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-100">
          <Button
            size="sm"
            className="w-full bg-[#BC2030] hover:bg-[#a01c29] text-white rounded-full"
            onClick={() =>
              router.push(`/builder?selectMode=true&brand=${selectedBrand}`)
            }
          >
            <Plus className="w-4 h-4 mr-1" /> New Email
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Choose an email file to open it in the builder.</div>
    </div>
  )
}
