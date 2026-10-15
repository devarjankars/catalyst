const legacyDefaultPadding = new Set([
  "10px 0 10px 0",
  "15px 0 10px 0",
  "15px 0 12px 0",
  "0 0 10px 0",
]);

const isiOuterPadding = "0 0 10px 0";

function removeHorizontalPadding(padding: string): string {
  const values = padding.split(" ");
  if (values.length === 1) return `${values[0]} 0`;
  if (values.length === 2) return `${values[0]} 0`;
  if (values.length === 3) return `${values[0]} 0 ${values[2]}`;
  if (values.length === 4) return `${values[0]} 0 ${values[2]} 0`;
  return padding;
}

export function getOrserduIsiOuterPadding(value: unknown, isNested = false): string {
  if (typeof value !== "string" || !value.trim() || value.trim() === "0") {
    return isNested ? "0" : isiOuterPadding;
  }

  const padding = removeHorizontalPadding(value.trim().replace(/\s+/g, " "));
  if (padding === isiOuterPadding) {
    return isNested ? "0" : isiOuterPadding;
  }
  return padding;
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

export function getOrserduIsiContentPadding(): string {
  return "0";
}

export function getOrserduIsiPadding(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "0";
  const padding = removeHorizontalPadding(value.trim().replace(/\s+/g, " "));
  return legacyDefaultPadding.has(padding) ? "0" : padding;
}
