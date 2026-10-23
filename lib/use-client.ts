"use client"

import { useSearchParams } from "next/navigation"
import { BRANDS, type BrandConfig } from "@/components/brand-selection-modal"
import type { Brand } from "@/components/brand-selection-modal"

const VALID_IDS = new Set<Brand>(BRANDS.map((b) => b.id))
const DEFAULT_BRAND: Brand = "orserdu"

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
export function useClient(): { clientId: Brand; client: BrandConfig } {
  const searchParams = useSearchParams()
  const raw = searchParams.get("brand") ?? ""
  const clientId: Brand = VALID_IDS.has(raw as Brand)
    ? (raw as Brand)
    : DEFAULT_BRAND

  const client = BRANDS.find((b) => b.id === clientId) ?? BRANDS[0]
  return { clientId, client }
}
