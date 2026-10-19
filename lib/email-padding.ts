export function getEmailComponentPadding(
  value: unknown,
  fallback: string,
  isNested: boolean,
): string {
  const padding = typeof value === "string" && value.trim()
    ? value.trim().replace(/\s+/g, " ")
    : fallback;
  const normalizedPadding = padding === "15px 16px 15px 16px"
    ? "15px 20px 15px 20px"
    : padding;

  if (!isNested) return normalizedPadding;

  const values = normalizedPadding.split(" ");
  const top = values[0] || "0";
  const bottom = values.length === 3 ? values[2] : values[2] || top;
  return `${top} 0 ${bottom} 0`;
}
