import type { EmailComponent } from "./email-builder"

export interface EmailTemplate {
  id: string
  name: string
  description: string
  category: "rte" | "sfmc" | "unbranded" | "other" | "tpe"
  components: EmailComponent[]
  
  // Multi-option support
  optionMode?: "single" | "three"
  optionSubMode?: "header-only" | "completely-different"
  option2Components?: EmailComponent[]
  option3Components?: EmailComponent[]

  thumbnail?: string
  html?: string
  createdAt: Date | null
  updatedAt: Date | null
  isUserCreated?: boolean
  preheaderText?: string
}
