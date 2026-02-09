"use client";


import { SectionDropZone } from "../section-drop-zone";
import type { EmailComponent } from "@/types/email-builder";


interface SingleColumnSectionProps {
    sectionId: string,
    component: EmailComponent,
    renderSectionChild: (child: EmailComponent, childIndex: number, sectionId: string) => React.ReactNode,
    onAddToSection: (sectionId: string, component: EmailComponent, index?: number) => void,
    onMoveWithinSection: (sectionId: string, dragIndex: number, hoverIndex: number) => void,
    onUpdateChild: (sectionId: string, childId: string, updates: Partial<EmailComponent>) => void,
    onSelectSection: (id: string) => void,
    selectedComponent?: string | null
}

export default function SingleColumnSection({sectionId,component,renderSectionChild,onAddToSection,onMoveWithinSection,onUpdateChild,onSelectSection,selectedComponent}: SingleColumnSectionProps) {
    return (
        <div className="mt-2 w-full p-[16px]" 
        >
            <div
                style={{
                    backgroundColor: component.backgroundColor || "#ffffff",
                }}
            >

            <SectionDropZone 
                sectionId={sectionId}
                children={component.children}
                onSelect={onSelectSection}
                isSelected={selectedComponent === component.id}
                previewMode={false}
                renderChildren={() => (
                    <div className="flex flex-col gap-2 ">
                    {(component.children || []).map(
                        (child, childIndex) => {
                            if (!child) return null;
                            return (
                                <div key={child.id} >
                                    {renderSectionChild(child,childIndex,sectionId,)}
                                </div>
                            )
                        }
                    )}
                    </div>
                )}
                onAddToSection={onAddToSection}
                onMoveWithinSection={onMoveWithinSection}
            />
            </div>
        </div>
    )
}