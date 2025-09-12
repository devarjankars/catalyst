"use client";

import { on } from "events";
import { SectionDropZone } from "../section-drop-zone";
import type { EmailComponent } from "@/types/email-builder";

export default function DoubleColumnSection({
    direction,
    sectionId,
    component,
    renderSectionChild,
    onAddToSection,
    onMoveWithinSection,
    onUpdateChild,
    onSelectSection,
    isSelected,
}) {
    return (
        <div className="mt-2 w-full flex gap-2  p-[16px]" style={{flexDirection: direction === "row" ? "row" : "column"}}>
            {(component.children || []).map((child,index)=>(
                <div key={child.id} className="flex-1 ">
                    <SectionDropZone 
                        sectionId={child.id}
                        children={child.children}
                        onSelect={onSelectSection}
                        previewMode={false}
                        isColumn={true}
                        renderChildren={() => (
                            <div className="flex flex-col gap-2 p-2">
                            {(child.children || []).map(
                                (grandChild, childIndex) => (
                                <div key={grandChild.id} > 
                                    {/* {console.log("Rendering grand child", grandChild)} */}
                                    {renderSectionChild(
                                    grandChild,
                                    childIndex,
                                    child.id,
                                    )}
                                </div>
                                )
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
            ))}
        </div>
    )
}

