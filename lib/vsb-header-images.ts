import type { EmailComponent } from "@/types/email-builder";

export function getVsbHeaderImages(variableCopy: unknown): string[] {
  if (!Array.isArray(variableCopy)) return [];
  const section = variableCopy.find(
    (item): item is { heading: string; structure: string; options: unknown[] } =>
      !!item &&
      typeof item === "object" &&
      "heading" in item &&
      typeof item.heading === "string" &&
      item.heading.toLowerCase().includes("header image") &&
      "structure" in item &&
      item.structure === "normal" &&
      "options" in item &&
      Array.isArray(item.options),
  );

  return section
    ? section.options.filter((option): option is string => typeof option === "string" && option.trim() !== "")
    : [];
}

export function applyVsbHeaderImage(components: EmailComponent[], src: string): EmailComponent[] {
  return components.map((component) => ({
    ...component,
    ...(component.type === "header-image" ? { src } : {}),
    ...(component.children ? { children: applyVsbHeaderImage(component.children, src) } : {}),
  }));
}
