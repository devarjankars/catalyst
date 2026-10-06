import type { EmailComponent } from "./email-builder"

export type BrandId = "orserdu" | "ferring" | "idorsia" | "elzonris"

export interface EmailTemplate {
  id: string
  name: string
  description: string
  category: "rte" | "sfmc" | "unbranded" | "other" | "tpe"
  /** Brand this template belongs to. Unset = visible for all brands (legacy). */
  brand?: BrandId
  components: EmailComponent[]
  
  // Multi-option support
  optionMode?: "single" | "two" | "three"
  optionSubMode?: "header-only" | "completely-different"
  option2Components?: EmailComponent[]
  option3Components?: EmailComponent[]

  thumbnail?: string
  html?: string
  createdAt: Date | null
  updatedAt: Date | null
  isUserCreated?: boolean
  preheaderText?: string

  /** ID of the latest saved version (from email-versions collection) */
  currentVersionId?: string
}

/**
 * VSB data embedded inside a version snapshot.
 * This is NOT a separate Firestore document — it lives inside the EmailVersion.
 */
export interface VersionVsbData {
  name?: string
  variableCopy: any[]
  variableCopyHeadingColor?: string
  altNamePage: { images: Array<{ name: string; value: string }>; headingColor?: string }
  headerDetails?: Array<{ name: string; value: string }>
  desktopView?: any[]
  mobileView?: any[]
  /** Original VSB document id this data was copied from (for reference only) */
  sourcVsbId?: string
}

export interface EmailEditorSnapshot {
  components: EmailComponent[]
  preheaderText: string
  optionMode: "single" | "two" | "three"
  optionSubMode: "header-only" | "completely-different"
  option2Components: EmailComponent[]
  option3Components: EmailComponent[]
  metadata: {
    name: string
    description: string
    category: EmailTemplate["category"]
    brand?: BrandId
    thumbnail?: string
    html?: string
    isUserCreated?: boolean
    [key: string]: unknown
  }
  settings: Record<string, unknown>
  vsbData?: VersionVsbData
}

/**
 * One immutable snapshot of an email at a point in time.
 * Stored in the flat "email-versions" Firestore collection.
 *
 * Rule: one version = one complete email snapshot.
 * VSB data lives here — there are no separate VSB version records.
 */
export interface EmailVersion {
  id: string
  templateId: string
  versionNumber: number           // 1, 2, 3, …
  changeNote: string              // e.g. "Updated CTA and ISI copy"
  createdAt: Date | null
  createdBy: string               // user email

  editorSnapshot: EmailEditorSnapshot

  // ── Generated source HTML (frozen at version-create time) ─────────────────
  sourceHtml: string              // Option 1 (or single)
  sourceHtml2?: string            // Option 2 (two/three-mode)
  sourceHtml3?: string            // Option 3 (three-mode only)
}
