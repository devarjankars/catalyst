import type { EmailComponent } from "@/types/email-builder";

export function getOrserduImageTextContent(
  component: Pick<EmailComponent, "imageTextSections" | "imageTextText1">,
): string {
  if (Array.isArray(component.imageTextSections)) {
    return component.imageTextSections.map((section) =>
      `<div style="color:${section.color};font-size:${section.fontSize}px;font-weight:${section.fontWeight};">${section.content}</div>`
    ).join("");
  }

  return component.imageTextText1 || "";
}
