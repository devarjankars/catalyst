import { EmailComponent } from "@/types/email-builder";

export function getDisplayAttributes(displayType: EmailComponent["displayType"]): {
  classAttr: string;
  tableStyle: string;
  innerStyle: string;
} {
  let classAttr = "";
  let tableStyle = "";
  let innerStyle = "";

  switch (displayType) {
    case "mobile-only":
      classAttr = "mobile";
      innerStyle = "display: none !important;";
      break;
    case "desktop-only":
      classAttr = "desktop";
      break;
    // case "all": keep everything empty
  }

  return {
    classAttr: classAttr ? `class="${classAttr}"` : "",
    tableStyle: tableStyle ? `style="${tableStyle}"` : "",
    innerStyle, // string only; you embed this directly inside other styles
  };
}
