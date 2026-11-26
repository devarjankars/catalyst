import type { EmailComponent } from "@/types/email-builder";
import { normalizeColumnSize } from "./column-width";

export const DEFAULT_DIVIDER_COLOR = "#C1C1C1";

export function getDividerDimensions(component: EmailComponent) {
  const vertical = component.dividerOrientation === "vertical";
  const stroke = normalizeColumnSize(component.dividerStroke || component.height, false) || "1px";
  const length = normalizeColumnSize(component.dividerLength, !vertical) || (vertical ? "48px" : "100%");
  return {
    width: vertical ? stroke : length,
    height: vertical ? length : stroke,
    color: component.backgroundColor || DEFAULT_DIVIDER_COLOR,
    align: component.textAlign || (vertical ? "center" : "left"),
    padding: component.padding || "0 20px 20px 20px",
  };
}
