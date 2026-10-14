const legacyDefaultPadding = new Set([
  "10px 20px 10px 20px",
  "15px 20px 10px 20px",
  "15px 20px 12px 20px",
  "0 20px 10px 20px",
]);

const isiOuterPadding = "0 20px 10px 20px";

export function getOrserduIsiOuterPadding(value: unknown, isNested = false): string {
  if (typeof value !== "string" || !value.trim() || value.trim() === "0") {
    return isNested ? "0" : isiOuterPadding;
  }

  const padding = value.trim().replace(/\s+/g, " ");
  if (padding === "0 30px 10px 30px") {
    return isNested ? "0" : isiOuterPadding;
  }
  if (padding === isiOuterPadding) {
    return isNested ? "0" : isiOuterPadding;
  }
  return padding;
}

export function getOrserduIsiPadding(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "0";
  const padding = value.trim().replace(/\s+/g, " ");
  return legacyDefaultPadding.has(padding) ? "0" : padding;
}
