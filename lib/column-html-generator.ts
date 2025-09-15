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
export function generateColumnHtml(component: EmailComponent): string {
const { children, columns, columnsType, gap } = component;

// Helper to get width for each column
function getColumnWidth(index: number): string {
    if (columnsType === "equal") {
        return `${100 / columns}%`;
    }
    // Assume custom widths are provided in children[index].width
    return children[index]?.width || `${100 / columns}%`;
}

// Generate TDs for each column
const tds = children
    .map((col, idx) => {
        const width = getColumnWidth(idx);
        const colStyles = {
            background: col.backgroundColor,
            padding: col.padding,
            borderRadius: col.borderRadius,
            verticalAlign: "top",
            width,
            ...(gap && idx < children.length - 1 ? { paddingRight: gap } : {}),
        };
        const styleString = Object.entries(colStyles)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => `${k}:${v}`)
            .join(";");

        return `<td style="${styleString}">${col.children?.map(() => "").join("") || ""}</td>`;
    })
    .join("");

// Wrap in a table row for email compatibility
return `<tr>${tds}</tr>`;
}