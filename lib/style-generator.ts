import { EmailComponent } from "@/types/email-builder";

export function getDisplayAttributes(displayType: EmailComponent["displayType"]): {
  classAttr: string;
  innerStyle: string;
} {
  let classAttr = "";
  let innerStyle = "";

  // console.log("displayType:", displayType);
  

  switch (displayType) {
    case "mobile-only":
      classAttr = "mobile";
      innerStyle = "display: none ";
      break;
    case "desktop-only":
      classAttr = "desktop";
      break;
    // case "all": keep everything empty
  }

  return {
    classAttr: classAttr ? `class="${classAttr}"` : "",
    innerStyle, // string only; you embed this directly inside other styles
  };
}
