import type { EmailComponent } from "./email-builder"

export type BrandId = "orserdu" | "ferring" | "geron" | "idorsia" | "elzonris"

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

  folder?: string
  thumbnail?: string
  html?: string
  createdAt: Date | null
  updatedAt: Date | null
  isUserCreated?: boolean
  preheaderText?: string
}


export type EmailTemplateVersionContent = Pick<EmailTemplate,
  "components" | "preheaderText" | "optionMode" | "optionSubMode" | "option2Components" | "option3Components"
>

export interface EmailTemplateVersion {
  id: string
  name: string
  savedAt: Date | null
  content: EmailTemplateVersionContent
}
