import { getEmailComponentPadding } from "./email-padding";

const legacyDefaultPadding = new Set([
  "10px 0 10px 0",
  "15px 0 10px 0",
  "15px 0 12px 0",
  "0 0 10px 0",
]);

const isiOuterPadding = "0 0 10px 4px";

function removeLegacyDefaultHorizontalPadding(padding: string): string {
  const values = padding.split(" ");
  if (values.length === 4 && values[1] === "20px" && values[3] === "20px") {
    values[1] = "0";
    values[3] = "0";
  }
  return values.join(" ");
}

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
  const padding = removeLegacyDefaultHorizontalPadding(value.trim().replace(/\s+/g, " "));
  return legacyDefaultPadding.has(padding) ? "0" : padding;
}
