"use client"

import { useSearchParams } from "next/navigation"
import { BRANDS, type BrandConfig } from "@/components/brand-selection-modal"
import type { BrandId } from "@/types/template"

const VALID_IDS = new Set(BRANDS.map((b) => b.id))
const DEFAULT_BRAND: BrandId = "orserdu"

/**
 * Single source of truth for the active client.
 *
 * Reads `?brand=` from the URL, validates it against the known list,
 * and falls back to "orserdu" for unknown values.
 *
 * Returns:
 *   - `clientId`  — the validated BrandId
 *   - `client`    — the full BrandConfig (label, accent color, symbol, …)
 */
export function useClient(): { clientId: BrandId; client: BrandConfig } {
  const searchParams = useSearchParams()
  const raw = searchParams.get("brand") ?? ""
  const clientId: BrandId = VALID_IDS.has(raw as BrandId)
    ? (raw as BrandId)
    : DEFAULT_BRAND

  const client = BRANDS.find((b) => b.id === clientId) ?? BRANDS[0]
  return { clientId, client }
}
