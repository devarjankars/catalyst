const isiOuterPadding = "0 10px 10px 10px";

function normalizeIsiOuterPadding(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return isiOuterPadding;

  const parts = value.trim().replace(/\s+/g, " ").split(" ");
  return parts.length <= 4 ? parts.join(" ") : isiOuterPadding;
}

export function getOrserduIsiOuterPadding(value: unknown, _isNested = false): string {
  return normalizeIsiOuterPadding(value);
}

export function getOrserduIsiSelectPadding(value: unknown, isNested = false): string {
  const rawPadding = typeof value === "string" && value.trim()
    ? value.trim().replace(/\s+/g, " ")
    : "0 10px 10px 10px";
  const values = rawPadding.split(" ");
  const top = values[0] || "0";
  const bottom = values.length === 3 ? values[2] : values[2] || top;

  if (isNested) return `${top} 0 ${bottom} 0`;
  return `${top} 10px ${bottom} 10px`;
}

export function getOrserduIsiPadding(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "0";
  return value.trim().replace(/\s+/g, " ");
}

export function getOrserduIsiBulletSpacing(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "0").trim().replace(/px$/i, ""));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(200, parsed)) : 0;
}
