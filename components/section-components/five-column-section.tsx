"use client";

import { SectionDropZone } from "../section-drop-zone";
import type { EmailComponent } from "@/types/email-builder";

interface FiveColumnSectionProps {
    direction: "row" | "column",
    sectionId: string, 
    component: EmailComponent,
    renderSectionChild: (child: EmailComponent, childIndex: number, sectionId: string) => React.ReactNode,
    onAddToSection?: (sectionId: string, component: EmailComponent, index?: number) => void,
    onMoveWithinSection?: (sectionId: string, dragIndex: number, hoverIndex: number) => void,
    onUpdateChild?: (sectionId: string, childId: string, updates: Partial<EmailComponent>) => void,
    onSelectSection?: (id: string) => void,
    selectedComponent?: string | null
}

export default function FiveColumnSection({
    direction,
    sectionId,
    component,
    renderSectionChild,
    onAddToSection,
    onMoveWithinSection,
    onUpdateChild,
    onSelectSection,
    selectedComponent
}: FiveColumnSectionProps) {
    return (
        <div className="mt-2 w-full flex gap-2  p-[16px]" data-section-id={sectionId}
        style={{
            flexDirection: direction === "row" ? "row" : "column",
            backgroundColor: component.backgroundColor || "#ffffff"
            }}>
            {(component.children || []).map((child,index)=> {
                if (!child) return null;
                return (
                <div key={child.id} 
                style={{
                    backgroundColor: child.backgroundColor || "#ffffff",
                    width : child.columnWidth ? `${child.columnWidth}` : "100%",
                    
                }}
                >
                    <SectionDropZone 
                        sectionId={child.id}
                       
                        children={child.children || []}
                        onSelect={onSelectSection}
                        isSelected={selectedComponent === child.id}
                        previewMode={false}
                        isColumn={true}
                        renderSectionChild={(grandChild, childIndex, sectionId) => (
                          <div key={grandChild.id}>
                            {renderSectionChild(grandChild, childIndex, sectionId)}
                          </div>
                        )}
                         onAddToSection={(sectionId, newComponent, index) => {
                            // Add component directly to this column
                            const newComp = {
                              ...newComponent,
                              id: Date.now().toString(),
                            };
                            const currentChildren = child.children || [];
                            const updatedChildren =
                              index !== undefined
                                ? [
                                    ...currentChildren.slice(0, index),
                                    newComp,
                                    ...currentChildren.slice(index),
                                  ]
                                : [...currentChildren, newComp];

                            onUpdateChild?.(component.id, child.id, {
                              children: updatedChildren,
                            });
                          }}
                        onMoveWithinSection={onMoveWithinSection}
                    />
                </div>
            )})}
        </div>
    )
}
