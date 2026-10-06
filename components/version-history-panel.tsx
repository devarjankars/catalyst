"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  History,
  Download,
  Eye,
  RotateCcw,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Layers,
  FileText,
  FilePlus,
  ArrowLeft,
} from "lucide-react"
import type { EmailVersion } from "@/types/template"

interface VersionHistoryPanelProps {
  versions: EmailVersion[]
  loading: boolean
  /** ID of the version currently loaded on the canvas (null = live draft) */
  viewingVersionId: string | null
  currentTemplateName: string
  onViewVersion: (v: EmailVersion) => void
  onExitVersionView: () => void
  onRestoreAsDraft: (v: EmailVersion) => void
  onExportHtml: (v: EmailVersion) => void
  onPreview: (v: EmailVersion) => void
  onExportPdf?: (v: EmailVersion) => void
  onCreateVsb?: (v: EmailVersion) => void
}

const MODE_LABELS: Record<string, string> = {
  single: "Single",
  two: "2 Options",
  three: "3 Options",
}

function VersionCard({
  v,
  isViewing,
  isLatest,
  onView,
  onRestoreAsDraft,
  onExportHtml,
  onPreview,
  onExportPdf,
  onCreateVsb,
}: {
  v: EmailVersion
  isViewing: boolean
  isLatest: boolean
  onView: () => void
  onRestoreAsDraft: () => void
  onExportHtml: () => void
  onPreview: () => void
  onExportPdf?: () => void
  onCreateVsb?: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const dateStr = v.createdAt
    ? new Date(v.createdAt as any).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—"

  const authorName = v.createdBy
    ? v.createdBy.split("@")[0].replace(/[._]/g, " ")
    : null

  return (
    <div
      className={`rounded-xl border transition-all duration-150 overflow-hidden ${
        isViewing
          ? "border-amber-400 bg-amber-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* Main row */}
      <div
        className="flex items-start gap-2.5 p-2.5 cursor-pointer"
        onClick={() => { onView(); setExpanded(true) }}
      >
        {/* Version badge */}
        <div className="shrink-0 mt-0.5">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold font-mono ${
              isViewing
                ? "bg-amber-200 text-amber-900"
                : isLatest
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            v{v.versionNumber}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap mb-0.5">
            {isLatest && (
              <Badge className="text-[9px] px-1.5 py-0 h-3.5 bg-green-100 text-green-800 border-0 font-bold uppercase tracking-wide">
                Current
              </Badge>
            )}
            {isViewing && (
              <Badge className="text-[9px] px-1.5 py-0 h-3.5 bg-amber-200 text-amber-900 border-0 font-bold uppercase tracking-wide">
                Viewing
              </Badge>
            )}
            {v.editorSnapshot.optionMode !== "single" && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5">
                <Layers className="w-2.5 h-2.5" />
                {MODE_LABELS[v.editorSnapshot.optionMode] ?? v.editorSnapshot.optionMode}
              </Badge>
            )}
          </div>

          <p className="text-xs font-medium text-gray-900 truncate leading-snug">
            {v.changeNote || `Version ${v.versionNumber}`}
          </p>

          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {dateStr}
            </span>
            {authorName && (
              <span className="flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                {authorName}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          className="shrink-0 text-gray-400 hover:text-gray-600 p-0.5 mt-0.5"
          onClick={(e) => { e.stopPropagation(); setExpanded((x) => !x) }}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-2.5 pb-2.5 pt-0 border-t border-gray-100 space-y-1.5">
          {/* View/Load onto canvas */}
          {!isViewing && (
            <button
              className="w-full text-left flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors font-medium"
              onClick={(e) => { e.stopPropagation(); onView() }}
            >
              <Eye className="w-3 h-3" /> Load this version
            </button>
          )}

          {/* Actions available when this version is loaded */}
          <div className="flex flex-wrap gap-1">
            <button
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={(e) => { e.stopPropagation(); onPreview() }}
            >
              <Eye className="w-2.5 h-2.5" /> Preview this version
            </button>
            <button
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={(e) => { e.stopPropagation(); onExportHtml() }}
            >
              <Download className="w-2.5 h-2.5" /> Export HTML
            </button>
            {onExportPdf && (
              <button
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={(e) => { e.stopPropagation(); onExportPdf() }}
              >
                <FileText className="w-2.5 h-2.5" /> Export PDF
              </button>
            )}
            {onCreateVsb && (
              <button
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={(e) => { e.stopPropagation(); onCreateVsb() }}
              >
                <FilePlus className="w-2.5 h-2.5" /> Create VSB
              </button>
            )}
          </div>

          {/* Restore as draft — not available on the latest version since it IS the draft */}
          {!isLatest && (
            <button
              className="w-full flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md bg-[#006937] hover:bg-[#005229] text-white transition-colors font-medium"
              onClick={(e) => { e.stopPropagation(); onRestoreAsDraft() }}
            >
              <RotateCcw className="w-3 h-3" /> Restore as Draft
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Unified version history panel — rendered as an inline right-side panel
 * inside the builder layout (not a Sheet/drawer).
 */
export function VersionHistoryPanel({
  versions,
  loading,
  viewingVersionId,
  currentTemplateName,
  onViewVersion,
  onExitVersionView,
  onRestoreAsDraft,
  onExportHtml,
  onPreview,
  onExportPdf,
  onCreateVsb,
}: VersionHistoryPanelProps) {
  // Newest first
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)
  const isViewingOldVersion = viewingVersionId !== null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
              Version History
            </span>
            {versions.length > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {versions.length}
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{currentTemplateName}</p>
      </div>

      {/* "Back to current" bar — shown while viewing an old version */}
      {isViewingOldVersion && (
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
          <button
            onClick={onExitVersionView}
            className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800 hover:text-amber-900 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to current draft
          </button>
          <p className="text-[10px] text-amber-600 mt-0.5">
            Read-only — restore as draft to edit
          </p>
        </div>
      )}

      {/* Version list */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center mb-2">
              <History className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs font-medium text-gray-700 mb-1">No versions yet</p>
            <p className="text-[10px] text-gray-400">
              Create a version from the builder toolbar to save a complete email snapshot.
            </p>
          </div>
        ) : (
          sorted.map((v, i) => (
            <VersionCard
              key={v.id}
              v={v}
              isViewing={viewingVersionId === v.id}
              isLatest={i === 0}
              onView={() => onViewVersion(v)}
              onRestoreAsDraft={() => onRestoreAsDraft(v)}
              onExportHtml={() => onExportHtml(v)}
              onPreview={() => onPreview(v)}
              onExportPdf={onExportPdf ? () => onExportPdf(v) : undefined}
              onCreateVsb={onCreateVsb ? () => onCreateVsb(v) : undefined}
            />
          ))
        )}
      </div>
    </div>
  )
}
