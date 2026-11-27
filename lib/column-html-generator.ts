import type { EmailComponent } from "@/types/email-builder";
import { getColumnWidth } from "./column-width";
import { getSectionColumns } from "./section-columns";
import { getDisplayAttributes } from "./style-generator";

function visibility(display: EmailComponent["displayType"], element: "table" | "cell") {
  if (display === "mobile-only") return `class="mbl-show-${element}"`;
  if (display === "desktop-only") return `class="desk-show-${element}"`;
  return "";
}

function widthAttribute(width: string): string {
  return width === "auto" ? "" : `width="${width.replace(/px$/, "")}"`;
}

export function generateColumnHtml(
  section: EmailComponent,
  renderContent: (component: EmailComponent) => string,
): string {
  const columns = getSectionColumns(section);
  const horizontal = columns.length > 1 && (section.direction ?? "column") === "row";
  const rows = horizontal ? [columns] : columns.map(column => [column]);
  const sectionDisplay = section.displayType;
  const sectionStyle = getDisplayAttributes(sectionDisplay).innerStyle || "";
  const bgcolor = section.backgroundColor || "transparent";

  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
  ${visibility(sectionDisplay, "table")} style="background-color:${bgcolor};border-radius:${section.borderRadius || "0"};margin:${section.margin || "0"};${sectionStyle}">
  <tr><td ${visibility(sectionDisplay, "cell")} style="padding:${section.padding || "0 20px"};${sectionStyle}">
    <table role="presentation" width="100%" align="center" cellspacing="0" cellpadding="0" border="0"
      style="width:100%;max-width:${section.maxWidth || "600px"};">
      ${rows.map(row => {
        const width = horizontal || getColumnWidth(row[0].columnWidth) === "auto" ? "100%" : getColumnWidth(row[0].columnWidth);
        return `<tr><td>
          <table role="presentation" ${widthAttribute(width)} cellspacing="0" cellpadding="0" border="0"
            style="width:${width};max-width:100%;table-layout:fixed;">
            <tr>${row.map(column => {
              const cellWidth = horizontal ? getColumnWidth(column.columnWidth) : "100%";
              const align = column.columnAlignment || "left";
              const valign = column.columnVerticalAlignment || "top";
              const padding = column === section ? "0" : column.padding || "0 20px";
              const display = column === section ? undefined : column.displayType;
              const displayStyle = getDisplayAttributes(display).innerStyle || "";
              return `
                <td ${widthAttribute(cellWidth)} align="${align}" valign="${valign}"
                  ${visibility(display, "cell")} bgcolor="${column.backgroundColor || "transparent"}"
                  style="width:${cellWidth};padding:${padding};text-align:${align};vertical-align:${valign};background-color:${column.backgroundColor || "transparent"};border-radius:${column.borderRadius || "0"};${displayStyle}">
                  ${(column.children ?? []).filter(Boolean).map(renderContent).join("")}
                </td>`;
            }).join("")}</tr>
          </table>
        </td></tr>`;
      }).join("")}
    </table>
  </td></tr>
</table>`.trim();
}
