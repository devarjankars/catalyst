"use client"

import type { EmailComponent } from "@/types/email-builder"
import { getDisplayAttributes } from "./style-generator";

/*
takes column component and generates html for it
based on number of columns and their type (equal or custom)

Props needed:
- the component itself

Returns:
- html string

*/ 

interface GenerateColumnHtmlProps {
  component: EmailComponent
  generateComponentHTML: (component: EmailComponent) => string,
  childHtml?: string
}


export function generateColumnHtml({component,generateComponentHTML,childHtml}:GenerateColumnHtmlProps): string {
const { children, columns, columnsType, gap , direction} = component;
const { classAttr, innerStyle } = getDisplayAttributes(component.displayType);


const getWidth = (colCount: number | undefined,width : string): string => {
    if (width && width !== "auto") return width;
    if (!colCount || colCount <= 1) return "100%";
    return `${100 / colCount}%`;
}


function generateTdHTML(
  child: EmailComponent,
  index: number,
  totalColumns: number,
  gap: string = "0%",
): string {
  const verticalAlign = child.columnVerticalAlignment || "center";
  const alignment = child.columnAlignment || "center";

  return `
    <td
    
      bgcolor="${child.backgroundColor || "transparent"}"
      valign="${verticalAlign}"
      align="${alignment }"
      width="${getWidth(totalColumns,child.columnWidth || "")}"
      ${child.displayType === "mobile-only" ? 'class="mbl-show-cell"' : child.displayType === "desktop-only" ? 'class="desk-show-cell"' : ""}
      style="
        vertical-align: ${verticalAlign};
        background-color: ${child.backgroundColor || "transparent"};
        border-radius: ${child.borderRadius || "0px"};
        width: ${getWidth(totalColumns,child.columnWidth || "")};
        min-height: ${child.columnMinHeight || "120px"};
        padding : ${child.padding || 0}
       ${ innerStyle ? innerStyle : "" }
      "
    >
      ${generateComponentHTML(child)}
    </td>
    
  `.trim();
}
// ${index < totalColumns - 1 ? `<td width="${gap}" style="width: ${gap};">&nbsp;</td>` : ""}
// Wrap in a table row for email compatibility
if((columns || 1) > 1 && direction === "row"){
    return `
    <tr bgcolor="${component.backgroundColor}" style="background-color='${component.backgroundColor}'" ${component.displayType === "mobile-only" ? 'class="mbl-show-tr"' : component.displayType === "desktop-only" ? 'class="desk-show-tr"' : ""}>
      ${children
        ?.map((child, index) =>
          generateTdHTML(child, index, children?.length, gap)
        )
        .join("")}
    </tr>
  `;
}

// this is for vertical alignment
if ((columns || 1) > 1 && direction === "column") {
    return (children
    ?.map(
        (child,index) => `
        <tr ${component.displayType === "mobile-only" ? 'class="mbl-show-tr"' : component.displayType === "desktop-only" ? 'class="desk-show-tr"' : ""}>
            <td
                bgcolor="${child.backgroundColor || "transparent"}"
                valign="${child.columnVerticalAlignment || "top"}"
                align="${child.columnAlignment || "center"}"
                ${child.displayType === "mobile-only" ? 'class="mbl-show-cell"' : child.displayType === "desktop-only" ? 'class="desk-show-cell"' : ""}
                style="
                background-color: ${child.backgroundColor || "transparent"};
                border-radius: ${child.borderRadius || "0px"};
                min-height: ${child.columnMinHeight || "120px"};
                width: 100%;
                padding:${child.padding || 0}
                "
            >
                ${generateComponentHTML(child)}
            </td>
        </tr>
        
    `
    )
    .join("")) || ""
  }
// ${index < (children?.length || 0) - 1 ? `<tr ${component.displayType === "mobile-only" ? 'class="mbl-show-tr"' : component.displayType === "desktop-only" ? 'class="desk-show-tr"' : ""}><td height="${gap}" style="height: ${gap};">&nbsp;</td></tr>` : ""}
  // single column section 

  return `
  <tr>
    <td
      ${component.displayType === "mobile-only" ? 'class="mbl-show-cell"' : component.displayType === "desktop-only" ? 'class="desk-show-cell"' : ""}
        bgcolor="${component.backgroundColor || "transparent"}"
        valign="top"
        align="left"
        style="
        width: 100%;
        background-color: ${component.backgroundColor || "transparent"};
        ${ innerStyle ? innerStyle : "" }
        "
    >
       ${childHtml}
    </td>
  </tr>
    
  
  `
 
}