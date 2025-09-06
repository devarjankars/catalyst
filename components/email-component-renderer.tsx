"use client";

import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { GripVertical } from "lucide-react";
import { RichTextEditor } from "./rich-text-editor";
import { SectionDropZone } from "./section-drop-zone";
import { RearrangeControls } from "./rearrange-controls";
import type { EmailComponent } from "@/types/email-builder";
import { Input } from "./ui/input";
import BulletList from "./bullet-list";

interface EmailComponentRendererProps {
  component: EmailComponent;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<EmailComponent>) => void;
  onDelete: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onAddToSection?: (
    sectionId: string,
    component: EmailComponent,
    index?: number
  ) => void;
  onMoveWithinSection?: (
    sectionId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  onUpdateChild?: (
    sectionId: string,
    childId: string,
    updates: Partial<EmailComponent>
  ) => void;
  onDeleteChild?: (sectionId: string, childId: string) => void;
  onSelectChild?: (childId: string) => void;
  selectedComponent?: string | null;
  previewMode: boolean;
  totalComponents?: number;
  onDuplicate?: () => void;
}

export function EmailComponentRenderer({
  component,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMove,
  onAddToSection,
  onMoveWithinSection,
  onUpdateChild,
  onDeleteChild,
  onSelectChild,
  selectedComponent,
  previewMode,
  totalComponents = 0,
  onDuplicate,
}: EmailComponentRendererProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: "component",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) return;
      if (item.fromPalette) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "component",
    item: () => ({ id: component.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const handleMoveUp = () => {
    if (index > 0) {
      onMove(index, index - 1);
    }
  };

  const handleMoveDown = () => {
    if (index < totalComponents - 1) {
      onMove(index, index + 1);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate();
    }
  };

  const renderSectionChild = (child: EmailComponent, childIndex: number) => {
    return (
      <div
        key={child.id}
        data-section-child={component.id}
        className="relative"
      >
        <EmailComponentRenderer
          component={child}
          index={childIndex}
          isSelected={selectedComponent === child.id}
          onSelect={() => onSelectChild?.(child.id)}
          onUpdate={(updates) =>
            onUpdateChild?.(component.id, child.id, updates)
          }
          onDelete={() => onDeleteChild?.(component.id, child.id)}
          onMove={(dragIndex, hoverIndex) =>
            onMoveWithinSection?.(component.id, dragIndex, hoverIndex)
          }
          onAddToSection={onAddToSection}
          onMoveWithinSection={onMoveWithinSection}
          onUpdateChild={onUpdateChild}
          onDeleteChild={onDeleteChild}
          onSelectChild={onSelectChild}
          selectedComponent={selectedComponent}
          previewMode={previewMode}
          totalComponents={component.children?.length || 0}
        />
      </div>
    );
  };

  const getColumnStyles = (child: EmailComponent) => {
    if (!child.isColumn) return {};

    const alignment = child.columnAlignment || "left";
    const verticalAlignment = child.columnVerticalAlignment || "top";
    const width = child.columnWidth === "auto" ? undefined : child.columnWidth;

    return {
      textAlign: alignment,
      display: "flex",
      flexDirection: "column" as const,
      justifyContent:
        verticalAlignment === "top"
          ? "flex-start"
          : verticalAlignment === "middle"
          ? "center"
          : "flex-end",
      alignItems:
        alignment === "left"
          ? "flex-start"
          : alignment === "center"
          ? "center"
          : "flex-end",
      width: width,
      minHeight: child.columnMinHeight || "120px",
    };
  };

  const renderComponent = () => {
    const baseStyle = {
      padding: component.padding || "16px",
    };

    switch (component.type) {
      case "section":
        const isMultiColumn =
          component.direction === "row" &&
          (component.children?.length || 0) > 1;
        const columnCount = component.children?.length || 1;
        const isColumn = component.isColumn;

        return (
          <div
            style={{
              backgroundColor: component.backgroundColor || "#ffffff",
              borderRadius: component.borderRadius || "0px",
              padding: component.padding || "20px",
              margin: component.margin || "0",
              maxWidth: component.maxWidth || "100%",
              border:
                !previewMode && isSelected
                  ? `2px dashed ${isColumn ? "#10b981" : "#3b82f6"}`
                  : "none",
              minHeight: isColumn
                ? component.columnMinHeight || "120px"
                : "auto",
              ...getColumnStyles(component),
            }}
            className="mt-2"
          >
            {/* {!previewMode && isSelected && (
              <div
                className={`mb-3 text-xs font-medium ${
                  isColumn ? "text-green-600" : "text-blue-600"
                }`}
              >
                {isColumn ? (
                  <>Column ({component.columnAlignment || "left"} aligned)</>
                ) : (
                  <>
                    {isMultiColumn
                      ? `${columnCount} Column Section`
                      : "Section Container"}
                    {component.isHero && " (Hero Template)"}
                  </>
                )}
              </div>
            )} */}

            {onAddToSection && onMoveWithinSection ? (
              component.direction === "row" ? (
                // Multi-column layout
                <div className="flex flex-row gap-4 w-full">
                  {(component.children || []).map((child, childIndex) => (
                    <div
                      key={child.id + childIndex}
                      className="flex-1 min-w-0"
                      style={getColumnStyles(child)}
                    >
                      {child.type === "section" && child.isColumn ? (
                        // This is a column section
                        <SectionDropZone
                          sectionId={child.id}
                          children={child.children || []}
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
                          onMoveWithinSection={(
                            sectionId,
                            dragIndex,
                            hoverIndex
                          ) => {
                            const currentChildren = [...(child.children || [])];
                            const draggedComponent = currentChildren[dragIndex];
                            currentChildren.splice(dragIndex, 1);
                            currentChildren.splice(
                              hoverIndex,
                              0,
                              draggedComponent
                            );
                            onUpdateChild?.(component.id, child.id, {
                              children: currentChildren,
                            });
                          }}
                          previewMode={previewMode}
                          isColumn={true}
                          columnCount={columnCount}
                          columnAlignment={child.columnAlignment}
                          renderChildren={() => (
                            <div className="flex flex-col gap-2 w-full">
                              {(child.children || []).map(
                                (grandChild, grandChildIndex) => (
                                  <div
                                    key={grandChild.id + new Date().getTime()}
                                  >
                                    {renderSectionChild(grandChild, grandChildIndex)}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        />
                      ) : (
                        // Regular component in row
                        renderSectionChild(child, childIndex)
                      )}
                    </div>
                  ))}
                  
               
                </div>
              ) : (
                // Single column layout
                <SectionDropZone
                  sectionId={component.id}
                  children={component.children || []}
                  onAddToSection={onAddToSection}
                  onMoveWithinSection={onMoveWithinSection}
                  isColumn={true}
                  previewMode={previewMode}
                  columnCount={1}
                  renderChildren={() => (
                    <div className="flex flex-col gap-2">
                      {(component.children || []).map((child, childIndex) =>
                        renderSectionChild(child, childIndex)
                      )}
                    </div>
                  )}
                />
              )
            ) : (
              <div
                className={`
                  ${
                    component.direction === "row"
                      ? "flex flex-row gap-4"
                      : "flex flex-col gap-2"
                  }
                `}
              >
                {(component.children || []).map((child, childIndex) =>
                  renderSectionChild(child, childIndex)
                )}
              </div>
            )}
          </div>
        );

      case "text":
        return (
          <div  className="mt-2">
            {previewMode ? (
              <div
                style={{
                  fontSize: component.fontSize || "16px",
                  color: component.color || "#000000",
                  textAlign: component.textAlign || "left",
                  fontWeight: component.fontWeight || "normal",
                  backgroundColor: component.backgroundColor || "transparent",
                }}
                dangerouslySetInnerHTML={{ __html: component.content || "" }}
              />
            ) : (
              <RichTextEditor
                value={component.content || ""}
                onChange={(content) => onUpdate({ content })}
                style={{
                  fontSize: component.fontSize || "16px",
                  color: component.color || "#000000",
                  textAlign: component.textAlign || "left",
                  fontWeight: component.fontWeight || "normal",
                  backgroundColor: component.backgroundColor || "transparent",
                  lineHeight: component.lineHeight || "18px",
                }}
              />
            )}
          </div>
        );

      case "image":
        return (
          <div
            style={baseStyle}
            className={`flex flex-col items-${component.textAlign || "center"} mt-2`}
          >
            {!previewMode && isSelected ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={component.alt || ""}
                  onChange={(e) => onUpdate({ alt: e.target.value })}
                  placeholder="Alt text"
                  className="w-full p-2 border mb-2 rounded text-sm"
                />
              </div>
            ) : null}
            <img
              src={
                component.src ||
                "/placeholder.svg?height=200&width=400&text=Click to edit"
              }
              alt={component.alt || "Image"}
              style={{
                width: component.width || "100%",
                height: component.height || "auto",
                display: "block",
                maxWidth: "100%",
              }}
              onClick={() => !previewMode && onSelect()}
            />
          </div>
        );

      case "button":
        return (
          <div
            style={{ ...baseStyle, textAlign: component.textAlign || "center" }}
            className="mt-2"
          >
            {!previewMode && isSelected ? (
              <div className="space-y-2 mb-2">
                <input
                  type="text"
                  value={component.text || ""}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  placeholder="Button text"
                  className="w-full p-2 border rounded text-sm"
                />
                <input
                  type="url"
                  value={component.href || ""}
                  onChange={(e) => onUpdate({ href: e.target.value })}
                  placeholder="Button link"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
            ) : null}
            <a
              href={component.href || "#"}
              style={{
                display: "inline-block",
                backgroundColor: component.backgroundColor || "#007bff",
                color: component.color || "#ffffff",
                padding: component.buttonPadding || "12px 24px",
                borderRadius: component.borderRadius || "4px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
              onClick={(e) => {
                if (!previewMode) {
                  e.preventDefault();
                  onSelect();
                }
              }}
            >
              {component.text || "Button"}
            </a>
          </div>
        );

      case "divider":
        return (
          <div style={baseStyle} className="mt-2">
            <hr
              style={{
                height: component.height || "1px",
                backgroundColor: component.backgroundColor || "#e0e0e0",
                border: "none",
                margin: component.margin || "20px 0",
              }}
            />
          </div>
        );
      case "custom":
        return <div className="mt-2" dangerouslySetInnerHTML={{ __html: component.html }}></div>;

      case "cta-button":
        return (
          <div style={baseStyle} className="flex align-center justify-center mt-2">
            <a
              href={component.href || "#"}
              style={{
                display: "inline-block",

                color: component.color || "#ffffff",
                padding: component.buttonPadding || "12px 24px",
                borderRadius: component.borderRadius || "4px",
                textDecoration: "none",

                fontWeight: "bold",
              }}
              onClick={(e) => {
                if (!previewMode) {
                  e.preventDefault();
                  onSelect();
                }
              }}
            >
              <img
                src={component.imageSrc || "/cta-placeholder.png"}
                alt={component.imageAlt || "CTA Image"}
                style={{
                  width: component.width || "100%",
                  height: component.height || "15%",
                  display: "block",
                  maxWidth: "100%",
                  margin: "0 auto",
                }}
              />
            </a>
          </div>
        );
      case "footer-links":
        return (
          <div style={baseStyle} className="flex flex-col gap-2 mt-2">
            <div className="flex flex-wrap gap-2">
              {component.links?.map((link, linkIndex) => (
                <>
                  <a
                    key={linkIndex}
                    href={link.href || "#"}
                    style={{
                      color: component.color || "#007bff",
                      textDecoration: "underline",
                    }}
                    onClick={(e) => {
                      if (!previewMode) {
                        e.preventDefault();
                        onSelect();
                      }
                    }}
                  >
                    {link.text}
                  </a>

                  {linkIndex < component.links!.length - 1 && (
                    <span key={linkIndex} className="text-gray-500">
                      |
                    </span>
                  )}
                </>
              ))}
            </div>
          </div>
        );

      case "isi":
        return (
          <div style={baseStyle} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-green-800 ">
              IMPORTANT SAFETY INFORMATION
            </h2>
            {component.importantSafetyInformation?.sections?.map(
              (section, sectionIndex) =>
                section.title ? (
                  <div key={sectionIndex} className="mb-4">
                    <h3 className="text-md font-semibold ">{section.title}</h3>
                    {/* <p className="text-sm text-gray-700">{section.content}</p> */}
                    {section.items && section.items.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 ml-3">
                        {section.items.map((subsection, subIndex) => (
                          <>
                            <li
                              key={subIndex}
                              className="text-sm text-gray-700 mt-2"
                            >
                              {subsection.content}
                            </li>
                          </>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div key={sectionIndex}>
                    {/* <p className="text-sm text-gray-700">{section.content}</p> */}
                    {section.items &&
                      section.items?.length > 0 &&
                      section.items.map((subsection, subIndex) => (
                        <div
                          key={subIndex}
                          className="text-sm text-gray-700 mt-2"
                        >
                          {subsection.content}
                        </div>
                      ))}
                  </div>
                )
            )}
          </div>
        );

        case "bullet-list" : 
              return (
//                 <div style={baseStyle}>
//   <ul
//     style={{
//       listStyleType: "disc",
//       color: component.markerColor || "#000000",
//       paddingLeft: "20px",
//       backgroundColor: component.backgroundColor || "transparent",
//       fontSize: component.discSize || "16px",
//     }}
//   >
//     {component.listItems?.map((item: string, index: number) => (
//       <li key={index}>
//         <RichTextEditor
//           value={item}
//           onChange={(content) => {
//             const updated = [...component.listItems]
//             updated[index] = content
//             onUpdate({ listItems: updated })
//           }}
//           style={{
//             fontSize: component.fontSize || "16px",
//             color: component.color || "#000000",
//             textAlign: component.textAlign || "left",
//             fontWeight: component.fontWeight || "normal",
//             lineHeight: component.lineHeight || "18px",
//           }}
//         />
//       </li>
//     ))}
//   </ul>

//   {/* Add new item button */}
//   {isSelected && <div className="flex justify-center">

//     <button
//       onClick={() => {
//         const updated = [...(component.listItems || []), "New Item"]
//         onUpdate({ listItems: updated })
//       }}
//       className="mt-2 px-2 py-1 text-sm border rounded-md border-dashed"
//     >
//       + 
//     </button>
//   </div>}
// </div>
                <BulletList component={component} onUpdate={onUpdate} isSelected={isSelected}/>
              );

      default:
        return <div>Unknown component type</div>;
    }
  };

  const isColumn = component.type === "section" && component.isColumn;

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      data-component-id={component.id}
      className={`
        relative group
        ${
          isSelected && !previewMode
            ? `ring-2 ${isColumn ? "ring-green-500" : "ring-blue-500"}`
            : ""
        }
        ${isDragging ? "opacity-50" : ""}
      `}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {!previewMode && (
        <>
          {/* Drag Handle */}
          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <GripVertical
              className={`w-4 h-4 cursor-move ${
                isColumn ? "text-green-400" : "text-gray-400"
              }`}
            />
          </div>

          {/* Rearrange Controls */}
          {isSelected && (
            <RearrangeControls
              componentId={component.id}
              index={index}
              totalComponents={totalComponents}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDuplicate={handleDuplicate}
              onDelete={onDelete}
            />
          )}

          {/* Edit overlay for non-text and non-section components */}
          {component.type !== "text" &&
            component.type !== "section" &&
            isSelected && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed pointer-events-none" />
            )}
        </>
      )}

      {renderComponent()}
    </div>
  );
}
