"use client";

import { SectionDropZone } from "../section-drop-zone";
import type { EmailComponent } from "@/types/email-builder";
import { getColumnHeight, getColumnWidth } from "@/lib/column-width";
import { getSectionColumns } from "@/lib/section-columns";

interface ColumnSectionProps {
  component: EmailComponent;
  renderSectionChild: (child: EmailComponent, index: number, sectionId: string) => React.ReactNode;
  onAddToSection?: (sectionId: string, component: EmailComponent, index?: number) => void;
  onSelectSection?: (id: string) => void;
  selectedComponent?: string | null;
  previewMode: boolean;
}

export function ColumnSection({
  component, renderSectionChild, onAddToSection, onSelectSection, selectedComponent, previewMode,
}: ColumnSectionProps) {
  const columns = getSectionColumns(component);
  const horizontal = columns.length > 1 && (component.direction ?? "column") === "row";
  const rows = horizontal ? [columns] : columns.map(column => [column]);
  return (
    <div data-section-id={component.id} style={{
      backgroundColor: component.backgroundColor,
      borderRadius: component.borderRadius,
      padding: component.padding || "0 20px",
      margin: component.margin,
    }}>
      <div className="mx-auto" style={{ maxWidth: component.maxWidth || "600px" }}>
        {rows.map(row => (
          <table key={row[0].id} role="presentation" className="border-collapse" style={{
            tableLayout: "fixed",
            width: horizontal ? "100%" : getColumnWidth(row[0].columnWidth) === "auto" ? "100%" : getColumnWidth(row[0].columnWidth),
            maxWidth: "100%",
          }}>
            <tbody><tr>
              {row.map(column => (
                <td key={column.id} style={{
                  width: horizontal ? getColumnWidth(column.columnWidth) : "100%",
                  height: getColumnHeight(column.columnMinHeight),
                  verticalAlign: column.columnVerticalAlignment || "top",
                  textAlign: column.columnAlignment || "left",
                  padding: column === component ? 0 : column.padding || "0 20px",
                  backgroundColor: column.backgroundColor,
                  borderRadius: column.borderRadius,
                }}>
                  <SectionDropZone
                    sectionId={column.id}
                    children={(column.children ?? []).filter(Boolean)}
                    onSelect={onSelectSection}
                    isSelected={selectedComponent === column.id}
                    isColumn={column !== component}
                    minHeight={previewMode ? undefined : "24px"}
                    columnAlignment={column.columnAlignment}
                    previewMode={previewMode}
                    renderSectionChild={renderSectionChild}
                    onAddToSection={onAddToSection}
                  />
                </td>
              ))}
            </tr></tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
