"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { firebaseService } from "@/services/firebase-service"
import type { EmailTemplate, EmailVersion } from "@/types/template"
import {
  ArrowLeft, Clock, ChevronRight, RotateCcw,
  Copy, Download, Eye, FileText, Loader2, X, Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
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

export default function OrserduLibraryPage() {
  const router = useRouter()

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [selectedFile, setSelectedFile] = useState<EmailTemplate | null>(null)
  const [versions, setVersions] = useState<EmailVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<EmailVersion | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [sourceHtml, setSourceHtml] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    firebaseService.getAllTemplates().then((all) => {
      const filtered = all
        .filter((t) => t.isUserCreated && t.brand === "orserdu")
        .sort((a, b) => {
          const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          return tb - ta
        })
      setTemplates(filtered)
      setLoading(false)
    })
  }, [])

  const loadVersions = useCallback(async (templateId: string) => {
    setVersionsLoading(true)
    setVersions([])
    setSelectedVersion(null)
    const vlist = await firebaseService.getVersions(templateId)
    setVersions(vlist)
    setVersionsLoading(false)
  }, [])

  const handleSelectFile = (t: EmailTemplate) => {
    setSelectedFile(t)
    setSelectedVersion(null)
    loadVersions(t.id)
  }

  const handleRestoreVersion = (v: EmailVersion) => {
    if (!selectedFile) return
    router.push(`/builder?template=${selectedFile.id}&edit=true&brand=orserdu&restoreVersion=${v.id}`)
  }

  const handleCopyHtml = async (html: string) => {
    await navigator.clipboard.writeText(html)
    toast.success("HTML copied to clipboard")
  }

  const handleDownloadHtml = (html: string, name: string, vNum: number) => {
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${name.replace(/\s+/g, "_")}_v${vNum}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = templates.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* LEFT: file list */}
      <div className="flex flex-col w-72 border-r border-gray-200 bg-white shrink-0">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => router.push("/dashboard?brand=orserdu")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded" style={{ backgroundColor: "#00693715", color: "#006937" }}>
              Orserdu
            </span>
            <span className="text-xs text-gray-400">All categories</span>
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
              No Orserdu emailers yet.
              <br />
              <button
                className="mt-2 text-[#006937] font-medium hover:underline text-xs"
                onClick={() => router.push("/builder?selectMode=true&brand=orserdu")}
              >
                Create one →
              </button>
            </div>
          ) : (
            filtered.map((t) => {
              const catMeta = CATEGORY_META[t.category] ?? { label: t.category, color: "#374151" }
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectFile(t)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedFile?.id === t.id ? "bg-green-50 border-l-2 border-l-[#006937]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 ml-6">
                    <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: catMeta.color + "15", color: catMeta.color }}>
                      {catMeta.label}
                    </span>
                    <p className="text-xs text-gray-400">{fmtDate(t.updatedAt)}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="p-3 border-t border-gray-100">
          <Button
            size="sm"
            className="w-full text-white rounded-full"
            style={{ backgroundColor: "#006937" }}
            onClick={() => router.push("/builder?selectMode=true&brand=orserdu")}
          >
            <Plus className="w-4 h-4 mr-1" /> New Email
          </Button>
        </div>
      </div>

      {/* RIGHT: version history panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Select an email file to see its version history</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedFile.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedFile.optionMode === "three" ? "3-Option emailer" : "Single emailer"} ·{" "}
                  {versions.length} version{versions.length !== 1 ? "s" : ""}
                  {selectedFile.category && (
                    <> · <span className="uppercase">{selectedFile.category}</span></>
                  )}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => router.push(`/builder?template=${selectedFile.id}&edit=true&brand=orserdu`)}
              >
                Open in Editor
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {versionsLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading versions…
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  No versions saved yet.
                  <br />
                  <span className="text-xs">Open in Editor and click "Create Version" to save a snapshot.</span>
                </div>
              ) : (
                [...versions].reverse().map((v) => (
                  <div
                    key={v.id}
                    className={`rounded-xl border p-4 transition-all cursor-pointer hover:border-gray-300 ${
                      selectedVersion?.id === v.id ? "border-[#006937] bg-green-50" : "border-gray-200 bg-white"
                    }`}
                    onClick={() => setSelectedVersion(selectedVersion?.id === v.id ? null : v)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs px-2" style={{ borderColor: "#006937", color: "#006937" }}>
                          v{v.versionNumber}
                        </Badge>
                        <span className="text-sm font-medium text-gray-800">
                          {v.changeNote || `Version ${v.versionNumber}`}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${selectedVersion?.id === v.id ? "rotate-90" : ""}`} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {fmtDate(v.createdAt)}
                      {v.createdBy && <span>· {v.createdBy}</span>}
                      <span>·</span>
                      <span>{v.editorSnapshot.optionMode === "three" ? "3-option" : v.editorSnapshot.optionMode === "two" ? "2-option" : "single"}</span>
                    </div>

                    {selectedVersion?.id === v.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="rounded-full text-xs h-7 gap-1"
                          onClick={(e) => { e.stopPropagation(); setPreviewHtml(v.sourceHtml) }}>
                          <Eye className="w-3 h-3" /> Preview
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full text-xs h-7 gap-1"
                          onClick={(e) => { e.stopPropagation(); setSourceHtml(v.sourceHtml) }}>
                          <FileText className="w-3 h-3" /> Source HTML
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full text-xs h-7 gap-1"
                          onClick={(e) => { e.stopPropagation(); handleDownloadHtml(v.sourceHtml, selectedFile.name, v.versionNumber) }}>
                          <Download className="w-3 h-3" /> Export HTML
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full text-xs h-7 gap-1"
                          onClick={(e) => { e.stopPropagation();                           router.push(`/vsb/${selectedFile.id}?versionId=${v.id}`) }}>
                          Create VSB
                        </Button>
                        <Button size="sm" className="rounded-full text-xs h-7 gap-1 bg-[#006937] hover:bg-[#005229] text-white"
                          onClick={(e) => { e.stopPropagation(); handleRestoreVersion(v) }}>
                          <RotateCcw className="w-3 h-3" /> Restore as Draft
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-[650px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Version Preview</h3>
              <button onClick={() => setPreviewHtml(null)}><X className="w-5 h-5 text-gray-500 hover:text-gray-900" /></button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              <iframe srcDoc={previewHtml} title="Version Preview" className="w-[600px] min-h-[600px] bg-white border border-gray-200 rounded mx-auto block" />
            </div>
          </div>
        </div>
      )}

      {/* SOURCE HTML MODAL */}
      {sourceHtml && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-[700px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Source HTML</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="rounded-full h-7 text-xs" onClick={() => handleCopyHtml(sourceHtml)}>
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
                <button onClick={() => setSourceHtml(null)}><X className="w-5 h-5 text-gray-500 hover:text-gray-900" /></button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-5 text-xs font-mono text-gray-700 bg-gray-50 whitespace-pre-wrap break-all">{sourceHtml}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
