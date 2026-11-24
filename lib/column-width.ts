export function normalizeColumnSize(value: string | undefined, allowPercent: boolean): string {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)(px|%)?$/i);
  if (!match || (match[2] === "%" && (!allowPercent || Number(match[1]) > 100))) return "";
  return match[1] + (match[2] || "px").toLowerCase();
}

export function getColumnWidth(value?: string): string {
  return normalizeColumnSize(value, true) || "auto";
}

export function getColumnHeight(value?: string): string {
  return normalizeColumnSize(value, false) || "120px";
}
