export function getEmailComponentPadding(
  value: unknown,
  fallback: string,
  isNested: boolean,
): string {
  const padding = typeof value === "string" && value.trim()
    ? value.trim().replace(/\s+/g, " ")
    : fallback;

  if (!isNested) return padding;

  const values = padding.split(" ");
  const top = values[0] || "0";
  const bottom = values.length === 3 ? values[2] : values[2] || top;
  return `${top} 0 ${bottom} 0`;
}
