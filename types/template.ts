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
 * An immutable snapshot of an email at a point in time.
 * Stored in the "email-versions" Firestore sub-collection under each template.
 */
export interface EmailVersion {
  id: string
  templateId: string
  versionNumber: number           // 1, 2, 3, ...
  changeNote: string              // user-supplied note e.g. "Updated CTA and ISI copy"
  createdAt: Date | null
  createdBy: string               // user email

  // Complete editor state snapshot
  components: EmailComponent[]
  option2Components: EmailComponent[]
  option3Components: EmailComponent[]
  optionMode: "single" | "two" | "three"
  optionSubMode: "header-only" | "completely-different"
  preheaderText: string

  // Template metadata at time of version
  name: string
  description: string
  category: string
  brand?: BrandId

  // Generated source HTML for each option
  sourceHtml: string              // Option 1 (or single)
  sourceHtml2?: string            // Option 2 (three-mode only)
  sourceHtml3?: string            // Option 3 (three-mode only)
}
