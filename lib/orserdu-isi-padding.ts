const isiOuterPadding = "0 10px 10px 10px";

function normalizeIsiOuterPadding(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return isiOuterPadding;

  const parts = value.trim().replace(/\s+/g, " ").split(" ");
  return parts.length <= 4 ? parts.join(" ") : isiOuterPadding;
}

export function getOrserduIsiOuterPadding(value: unknown, _isNested = false): string {
  return normalizeIsiOuterPadding(value);
}

export function getOrserduIsiSelectPadding(value: unknown): string {
  const [top, , bottom = top] = normalizeIsiOuterPadding(value).split(" ");
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
