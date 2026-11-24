export function getColumnWidth(columnCount: number, width?: string): string {
  const configuredWidth = width?.trim();
  if (configuredWidth && configuredWidth.toLowerCase() !== "auto") {
    return configuredWidth;
  }

  return columnCount > 1 ? `${100 / columnCount}%` : "100%";
}
