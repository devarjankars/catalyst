import type { EmailComponent } from "./email-builder"

export interface EmailTemplate {
  id: string
  name: string
  description: string
  category: "rte" | "sfmc" | "unbranded" | "other"
  components: EmailComponent[]
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
  isUserCreated?: boolean
  preheaderText?: string
}
