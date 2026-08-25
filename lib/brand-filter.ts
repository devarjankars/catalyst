/**
 * Brand filtering utilities for templates.
 *
 * Priority:
 * 1. If template.brand is set → use it (exact match)
 * 2. If template.brand is NOT set → infer from name/description keywords
 * 3. If no inference matches → treat as "unbranded" (hide when a brand IS active)
 */

import type { EmailTemplate, BrandId } from "@/types/template"

/** Keywords that identify a template as belonging to a brand */
const BRAND_KEYWORDS: Record<BrandId, string[]> = {
  orserdu:  ["orserdu", "orserdu", "elacestrant", "emerald", "stemline", "menarini"],
  ferring:  ["ferring", "rekovelle", "firmagon", "minirin", "desmopressin"],
  idorsia:  ["idorsia", "tryvio", "aprocitentan", "pivlaz", "selatogrel"],
  elzonris: ["elzonris", "tagraxofusp", "bpdcn", "cd123"],
}

/**
 * Returns the brand of a template.
 * - If `brand` field is set on the template, returns it directly.
 * - Otherwise, tries to infer from name + description keywords.
 * - Returns `null` if no brand can be determined.
 */
export function resolveTemplateBrand(template: EmailTemplate): BrandId | null {
  if (template.brand) return template.brand

  const haystack = `${template.name} ${template.description}`.toLowerCase()

  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS) as [BrandId, string[]][]) {
    if (keywords.some(kw => haystack.includes(kw))) {
      return brand
    }
  }

  return null
}

/**
 * Returns true if the template should be shown for the given brand.
 *
 * Rules:
 * - No active brand → show everything
 * - Active brand + template has resolved brand → only show if it matches
 * - Active brand + template has NO resolved brand → hide it (strict mode)
 */
export function matchesBrand(template: EmailTemplate, selectedBrand?: BrandId): boolean {
  if (!selectedBrand) return true

  const resolved = resolveTemplateBrand(template)

  // Unresolvable brand — hide when filtering is active
  if (!resolved) return false

  return resolved === selectedBrand
}
