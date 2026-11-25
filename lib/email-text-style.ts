export const DEFAULT_CUSTOM_TEXT_COLOR = "#ff66cc";

export const TEXT_COLOR_PRESETS = [
  { name: "Primary green", hex: "#006937" },
  { name: "Secondary teal", hex: "#6bcdb2" },
  { name: "Accent yellow", hex: "#ffd506" },
  { name: "Black", hex: "#000000" },
  { name: "Gray", hex: "#4d4d4f" },
  { name: "Dark teal", hex: "#61ae9a" },
  { name: "Magenta", hex: DEFAULT_CUSTOM_TEXT_COLOR },
  { name: "Blue", hex: "#183559" },
] as const;

export function getOrserduFooterLinkColor(color?: string): string {
  const normalized = color?.trim().toLowerCase();
  return !normalized || normalized === "#0463c1" || normalized === "#007bff"
    ? "#0563C1"
    : color ?? "#0563C1";
}
