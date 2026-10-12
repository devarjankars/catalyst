export type SenderRowSeparator = "double" | "normal";

export function getSenderRowSeparator(
  rowIndex: number,
  rowCount: number,
): SenderRowSeparator {
  if (rowCount <= 2) return "normal";
  if (rowIndex < rowCount - 1) return "double";
  return "normal";
}
