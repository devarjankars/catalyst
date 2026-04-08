"use client";

import { SectionDropZone } from "../section-drop-zone";
import type { EmailComponent } from "@/types/email-builder";

interface FourColumnSectionProps {
    direction: "row" | "column",
    sectionId: string, 
    component: EmailComponent,
    renderSectionChild: (child: EmailComponent, childIndex: number, sectionId: string) => React.ReactNode,
    onAddToSection: (sectionId: string, component: EmailComponent, index?: number) => void,
    onMoveWithinSection: (sectionId: string, dragIndex: number, hoverIndex: number) => void,
    onUpdateChild: (sectionId: string, childId: string, updates: Partial<EmailComponent>) => void,
    onSelectSection: (id: string) => void,
    selectedComponent?: string | null
}

export default function FourColumnSection({
    direction,
    sectionId,
    component,
    renderSectionChild,
    onAddToSection,
    onMoveWithinSection,
    onUpdateChild,
    onSelectSection,
    selectedComponent
}: FourColumnSectionProps) {
    return (
        <div className="mt-2 w-full flex gap-2  p-[16px]" 
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
                       
                        children={child.children}
                        onSelect={onSelectSection}
                        isSelected={selectedComponent === child.id}
                        previewMode={false}
                        isColumn={true}
                        renderChildren={() => (
                            <div className="flex flex-col gap-2 p-2">
                            {(child.children || []).map(
                                (grandChild, childIndex) => {
                                if (!grandChild) return null;
                                return (
                                <div key={grandChild.id}
                                    
                                > 
                                    {/* {console.log("Rendering grand child", grandChild)} */}
                                    {renderSectionChild(
                                    grandChild,
                                    childIndex,
                                    child.id,
                                    )}
                                </div>
                                )
                                }
                            )}
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
