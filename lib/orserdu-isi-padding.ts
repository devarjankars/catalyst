import { getEmailComponentPadding } from "./email-padding";

const isiOuterPadding = "0 0 10px 4px";

export function getOrserduIsiOuterPadding(value: unknown, isNested = false): string {
  if (typeof value !== "string" || !value.trim() || value.trim() === "0") {
    return isNested ? "0" : isiOuterPadding;
  }

  return getEmailComponentPadding(value, isiOuterPadding, isNested);
}

export function getOrserduIsiSelectPadding(value: unknown, isNested = false): string {
  const rawPadding = typeof value === "string" && value.trim()
    ? value.trim().replace(/\s+/g, " ")
    : "0 20px 10px 20px";
  const values = rawPadding.split(" ");
  const top = values[0] || "0";
  const bottom = values.length === 3 ? values[2] : values[2] || top;

  if (isNested) return `${top} 0 ${bottom} 0`;
  return `${top} 20px ${bottom} 20px`;
}

export function getOrserduIsiPadding(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "0";
  return value.trim().replace(/\s+/g, " ");
}

export function getOrserduIsiBulletSpacing(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "0").trim().replace(/px$/i, ""));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(200, parsed)) : 0;
}
