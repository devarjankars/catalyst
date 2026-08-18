import type { EmailTemplate } from "@/types/template"

class TemplateService {
  private storageKey = "email-templates"

  // Get all templates
  async getAllTemplates(): Promise<EmailTemplate[]> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        // Return sample templates if none exist
        const sampleTemplates = this.getSampleTemplates()
        await this.saveTemplates(sampleTemplates)
        return sampleTemplates
      }
      const templates = JSON.parse(stored)
      return templates.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }))
    } catch (error) {
      console.error("Failed to load templates:", error)
      return []
    }
  }

  // Get single template
  async getTemplate(id: string): Promise<EmailTemplate | null> {
    const templates = await this.getAllTemplates()
    return templates.find((t) => t.id === id) || null
  }

  // Create new template
  async createTemplate(data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">): Promise<EmailTemplate> {
    const templates = await this.getAllTemplates()
    const newTemplate: EmailTemplate = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    templates.unshift(newTemplate)
    await this.saveTemplates(templates)
    return newTemplate
  }

  // Create a copy of a template for user to work with
  async createTemplateCopy(template: EmailTemplate): Promise<EmailTemplate> {
    const copyName = template.isUserCreated ? `${template.name} (Copy)` : `My ${template.name}`

    return this.createTemplate({
      name: copyName,
      description: template.description,
      category: template.category,
      components: this.deepCloneComponents(template.components),
      isUserCreated: true,
    })
  }

  // Deep clone components with new IDs
  private deepCloneComponents(components: any[]): any[] {
    return components.map((component) => ({
      ...component,
      id: `${component.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      children: component.children ? this.deepCloneComponents(component.children) : undefined,
    }))
  }

  // Update existing template
  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    const templates = await this.getAllTemplates()
    const index = templates.findIndex((t) => t.id === id)
    if (index === -1) return null

    templates[index] = { ...templates[index], ...updates, updatedAt: new Date() }
    await this.saveTemplates(templates)
    return templates[index]
  }

  // Delete template
  async deleteTemplate(id: string): Promise<boolean> {
    const templates = await this.getAllTemplates()
    const filtered = templates.filter((t) => t.id !== id)
    if (filtered.length === templates.length) return false

    await this.saveTemplates(filtered)
    return true
  }

  // Duplicate template
  async duplicateTemplate(id: string): Promise<EmailTemplate> {
    const template = await this.getTemplate(id)
    if (!template) throw new Error("Template not found")

    return this.createTemplate({
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      components: this.deepCloneComponents(template.components),
      isUserCreated: true,
    })
  }

  private async saveTemplates(templates: EmailTemplate[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(templates))
    } catch (error) {
      console.error("Failed to save templates:", error)
      throw error
    }
  }

  private getSampleTemplates(): Array<
    Omit<EmailTemplate, "components"> & { components: any[] }
  > {
    return [
      {
        id: "sample-1",
        name: "Welcome Newsletter",
        description: "A warm welcome email template for new subscribers",
        category: "rte",
        components: [
          {
            id: "hero-1",
            type: "section",
            backgroundColor: "#4f46e5",
            padding: "40px 20px",
            borderRadius: "8px",
            direction: "column",
            children: [
              {
                id: "hero-text-1",
                type: "text",
                content:
                  "<h1>Welcome to Our Community!</h1><p>Thank you for joining us. We're excited to have you aboard.</p>",
                fontSize: "24px",
                color: "#ffffff",
                textAlign: "center",
                fontWeight: "bold",
                padding: "20px",
              },
            ],
          },
        ],
        thumbnail: "/placeholder.svg?height=200&width=300&text=Welcome Newsletter",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        isUserCreated: false,
      },
      {
        id: "sample-2",
        name: "Product Launch",
        description: "Announce your latest product with style",
        category: "sfmc",
        components: [
          {
            id: "product-section-1",
            type: "section",
            backgroundColor: "#ffffff",
            padding: "30px",
            direction: "row",
            children: [
              {
                id: "product-image-1",
                type: "image",
                src: "/placeholder.svg?height=300&width=300&text=Product Image",
                alt: "New Product",
                width: "100%",
                padding: "10px",
              },
              {
                id: "product-text-1",
                type: "text",
                content:
                  "<h2>Introducing Our Latest Innovation</h2><p>Experience the future with our groundbreaking new product.</p>",
                fontSize: "18px",
                color: "#333333",
                padding: "10px",
              },
            ],
          },
        ],
        thumbnail: "/placeholder.svg?height=200&width=300&text=Product Launch",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-12"),
        isUserCreated: false,
      },
      {
        id: "sample-3",
        name: "Simple Newsletter",
        description: "Clean and minimal newsletter template",
        category: "unbranded",
        components: [
          {
            id: "simple-text-1",
            type: "text",
            content: "<h2>Monthly Update</h2><p>Here's what's been happening this month...</p>",
            fontSize: "16px",
            color: "#444444",
            padding: "20px",
          },
          {
            id: "simple-divider-1",
            type: "divider",
            height: "2px",
            backgroundColor: "#e5e7eb",
            margin: "20px 0",
          },
        ],
        thumbnail: "/placeholder.svg?height=200&width=300&text=Simple Newsletter",
        createdAt: new Date("2024-01-08"),
        updatedAt: new Date("2024-01-08"),
        isUserCreated: false,
      },
    ]
  }
}

export const templateService = new TemplateService()
