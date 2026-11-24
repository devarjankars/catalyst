import type { EmailComponent } from "@/types/email-builder";

export function getEmailShapeStyle(component: EmailComponent) {
  const normalize = (value: string | undefined, fallback: string, allowPercent: boolean) => {
    const match = value?.trim().match(/^(\d+(?:\.\d+)?)(px|%)?$/i);
    if (!match || (match[2] === "%" && !allowPercent)) return fallback;
    return match[1] + (match[2] || "px");
  };

  const circle = component.shape === "circle";
  const width = normalize(component.width, circle ? "60px" : "140px", !circle);
  return {
    width,
    height: circle ? width : normalize(component.height, component.shape === "line" ? "2px" : "60px", false),
    borderRadius: circle ? "50%" : "0",
  };
}
