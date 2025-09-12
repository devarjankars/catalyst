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

}

export default function SingleColumnSection({sectionId,component,renderSectionChild,onAddToSection,onMoveWithinSection,onUpdateChild}: SingleColumnSectionProps) {
    return (
        <div className="mt-2 w-full" >
            <SectionDropZone 
                sectionId={sectionId}
                children={component.children}
                previewMode={false}
                renderChildren={() => (
                    <div className="flex flex-col gap-2 ">
                    {(component.children || []).map(
                        (child, childIndex) => (
                        <div key={child.id} >
                            {renderSectionChild(
                            child,
                            childIndex,
                            sectionId,
                            )}
                        </div>
                        )
                    )}
                    </div>
                )}
                onAddToSection={onAddToSection}
                onMoveWithinSection={onMoveWithinSection}
            />
        </div>
    )
}