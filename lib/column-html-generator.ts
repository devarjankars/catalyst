"use client"

import type { EmailComponent } from "@/types/email-builder"


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

const getWidth = (colCount: number | undefined,width : string): string => {
    if (!colCount || colCount <= 1) return "100%";
    if(columnsType === "equal"){
        return `${(100 / colCount)-5}%`;
    } else {
        return `${parseInt(width.slice(0,2))-5}%` || `${(100 / colCount)-5}%`;
    }

}


function generateTdHTML(
  child: EmailComponent,
  index: number,
  totalColumns: number,
  gap: string = "0%",
): string {
  const verticalAlign = child.columnVerticalAlignment || "center";
  const alignment = child.columnAlignment || "left";

  return `
    <td
      bgcolor="${child.backgroundColor || "transparent"}"
      valign="${verticalAlign}"
      align="${alignment}"
      width="${getWidth(totalColumns,child.columnWidth || "")}"
      style="
        vertical-align: ${verticalAlign};
        text-align: ${alignment};
        padding: ${child.padding || "15px"};
        background-color: ${child.backgroundColor || "transparent"};
        border-radius: ${child.borderRadius || "0px"};
        width: ${getWidth(totalColumns,child.columnWidth || "")};
        min-height: ${child.columnMinHeight || "120px"};
      "
    >
      ${generateComponentHTML(child)}
    </td>
    ${index < totalColumns - 1 ? `<td width="${gap}" style="width: ${gap};">&nbsp;</td>` : ""}
  `.trim();
}

// Wrap in a table row for email compatibility
if(columns > 1 &&direction === "row"){
    return `
    <tr>
      ${children
        ?.map((child, index) =>
          generateTdHTML(child, index, children?.length, gap)
        )
        .join("")}
    </tr>
  `;
}

if (columns > 1 && direction === "column") {
    return (children
    ?.map(
        (child,index) => `
        <tr>
            <td
                bgcolor="${child.backgroundColor || "transparent"}"
                valign="${child.columnVerticalAlignment || "top"}"
                align="${child.columnAlignment || "left"}"
                style="
                padding: ${child.padding || "15px"};
                background-color: ${child.backgroundColor || "transparent"};
                border-radius: ${child.borderRadius || "0px"};
                min-height: ${child.columnMinHeight || "120px"};
                width: 100%;
                "
            >
                ${generateComponentHTML(child)}
            </td>
        </tr>
        ${index < (children?.length || 0) - 1 ? `<tr><td height="${gap}" style="height: ${gap};">&nbsp;</td></tr>` : ""}
    `
    )
    .join(""))
  }

  

  return `
  <tr>
    <td
        bgcolor="${component.backgroundColor || "transparent"}"
        valign="top"
        align="left"
        style="
        width: 100%;
        background-color: ${component.backgroundColor || "transparent"};
        "
    >
       ${childHtml}
    </td>
  </tr>
    
  
  `
 
}