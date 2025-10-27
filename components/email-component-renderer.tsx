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
import SingleColumnSection from "./section-components/single-column-section";
import { secondsInDay } from "date-fns/constants";
import DoubleColumnSection from "./section-components/double-column-section";
import ThreeColumnSection from "./section-components/three-column-section";

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

  const renderSectionChild = (
    child: EmailComponent,
    childIndex: number,
    sectionId: string,
  ) => {
    return (
      <div key={child.id} data-section-child={sectionId} className="relative">
        <EmailComponentRenderer
          component={child}
          index={childIndex}
          isSelected={selectedComponent === child.id}
          onSelect={() => onSelectChild?.(child.id)}
          onUpdate={(updates) => onUpdateChild?.(sectionId, child.id, updates)}
          onDelete={() => onDeleteChild?.(sectionId, child.id)}
          onMove={(dragIndex, hoverIndex) =>
            onMoveWithinSection?.(sectionId, dragIndex, hoverIndex)
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
        switch (component.columns) {
          case 1:
            return (
              <SingleColumnSection
                component={component}
                selectedComponent={selectedComponent}
                onSelectSection={onSelectChild}
                sectionId={component.id}
                onUpdateChild={onUpdateChild}
                renderSectionChild={renderSectionChild}
                onAddToSection={onAddToSection}
                onMoveWithinSection={onMoveWithinSection}
              />
            );

          case 2:
            return (
              <DoubleColumnSection
                onSelectSection={onSelectChild}
                selectedComponent={selectedComponent}
                onAddToSection={onAddToSection}
                renderSectionChild={renderSectionChild}
                onMoveWithinSection={onMoveWithinSection}
                onUpdateChild={onUpdateChild}
                component={component}
                sectionId={component.id}
                direction={component.direction || "column"}
              />
            );
          case 3:
            return (
              <ThreeColumnSection
                onSelectSection={onSelectChild}
                selectedComponent={selectedComponent}
                onAddToSection={onAddToSection}
                renderSectionChild={renderSectionChild}
                onMoveWithinSection={onMoveWithinSection}
                onUpdateChild={onUpdateChild}
                component={component}
                sectionId={component.id}
                direction={component.direction || "column"}
              />
            );

          default:
            break;
        }

      case "text":
        return (
          <div className="mt-2 z-50">
            <RichTextEditor
              isSelected={isSelected}
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
          </div>
        );

      case "image":
        return (
          <div
            style={baseStyle}
            className={`flex flex-col items-${
              component.textAlign || "center"
            } mt-2`}
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
        return (
          <div
            className="mt-2"
            dangerouslySetInnerHTML={{ __html: component.html }}
          ></div>
        );

      case "cta-button":
        return (
          <div
            style={baseStyle}
            className="flex align-center justify-center mt-2"
          >
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

      case "bullet-list":
        return (
          <BulletList
            component={component}
            onUpdate={onUpdate}
            isSelected={isSelected}
          />
        );

      case "header-image":
        return (
          <div className="mt-2 z-50 flex justify-center">
            <img
              src={component.src || "/header-placeholder.png"}
              alt={component.alt || "Header Image"}
              style={{
                width: component.width || "100%",
                height: component.height || "auto",
                maxWidth: component.maxWidth || "600px",
                display: "block",
              }}
              onClick={() => !previewMode && onSelect()}
            />
          </div>
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
          { !isColumn && 
            <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <GripVertical
                className={`w-4 h-4 cursor-move ${
                  isColumn ? "text-green-400" : "text-gray-400"
                }`}
              />
            </div>
          }

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
