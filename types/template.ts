import type { EmailComponent } from "./email-builder"

export interface EmailTemplate {
  id: string
  name: string
  description: string
  category: "rte" | "sfmc" | "unbranded" | "other"
  components: EmailComponent[]
  thumbnail?: string
  html?: string
  createdAt: Date | null
  updatedAt: Date | null
  isUserCreated?: boolean
  preheaderText?: string
}
