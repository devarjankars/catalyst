"use client";

import React, { useRef, useState, useCallback } from "react";
import { useDrag, useDrop } from "react-dnd";
import { GripVertical, Loader2 } from "lucide-react";
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
import FourColumnSection from "./section-components/four-column-section";
import FiveColumnSection from "./section-components/five-column-section";
import SixColumnSection from "./section-components/six-column-section";
import { se } from "date-fns/locale";
import { firebaseService } from "@/services/firebase-service";
import { useEmailBuilderStore } from "@/store/email-builder-store";
import { toast } from "sonner";

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
  parentId?: string; // New prop for container isolation
  isLockedMode?: boolean; // New prop for header-only lock
  activeOption?: 1 | 2 | 3;
  onCopyToOption?: (targetOption: 1 | 2 | 3) => void;
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
  parentId = "root", // Default to root
  isLockedMode = false,
  activeOption,
  onCopyToOption,
}: EmailComponentRendererProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // --- Image drag-and-drop state (declared at component level to satisfy Rules of Hooks) ---
  const [imgDragOver, setImgDragOver] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const { currentTemplate, addTemplateImage } = useEmailBuilderStore();

  const handleImageFileDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return; // let palette/reorder drops bubble to the canvas
    e.preventDefault();
    e.stopPropagation();
    setImgDragOver(false);
    if (previewMode || isLockedMode) return;
    setImgUploading(true);
    try {
      const url = await firebaseService.uploadImage(file, currentTemplate?.id);
      if (url === "PATH_NOT_FOUND") { toast.warning("Please save the email first!"); return; }
      onUpdate({ src: url });
      addTemplateImage(url);
      toast.success("Image updated");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setImgUploading(false);
    }
  }, [previewMode, isLockedMode, currentTemplate, onUpdate, addTemplateImage]);

  const [{ handlerId }, drop] = useDrop({
    accept: "component",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current || isLockedMode) return;
      if (item.fromPalette) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      // STRICT CONTEXT CHECK: Only allow sorting if items are in the same container
      if (item.parentId !== parentId) return;

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

  const [{ isDragging }, drag, preview] = useDrag({
    type: "component",
    item: () => ({ id: component.id, index, parentId }), // Include parentId in drag item
    canDrag: () => !isLockedMode,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  preview(drop(ref));
  drag(dragHandleRef);

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
    if (!child) return null; // Defensive check
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
          parentId={sectionId} // Pass sectionId as parentId for children
          isLockedMode={isLockedMode}
        />
      </div>
    );
  };


  const ImageAlimentMap = {
    "left" : "start",
    "right" : "end",
    "center" : "center"
  }

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
          case 4:
            return (
              <FourColumnSection
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
          case 5:
            return (
              <FiveColumnSection
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
          case 6:
            return (
              <SixColumnSection
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

      case "image": {
        return (
          <div
            style={baseStyle}
            className={`flex flex-col items-${ImageAlimentMap[component?.textAlign || "center"] || "center"} mt-2 relative`}
            onDragOver={(e) => { e.preventDefault(); if (!previewMode && !isLockedMode && Array.from(e.dataTransfer?.types || []).includes("Files")) setImgDragOver(true); }}
            onDragLeave={(e) => { setImgDragOver(false); }}
            onDrop={handleImageFileDrop}
          >
            <img
              src={component.src || "/placeholder.svg?height=200&width=400&text=Click to edit"}
              alt={component.alt || "Image"}
              style={{
                width: component.width || "100%",
                height: component.height || "auto",
                display: "block",
                maxWidth: "100%",
                opacity: imgUploading ? 0.4 : 1,
                transition: "opacity 0.2s",
              }}
              onClick={(e) => { e.stopPropagation(); !previewMode && !isLockedMode && onSelect(); }}
            />
            {/* Drop overlay */}
            {imgDragOver && !imgUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/80 border-2 border-dashed border-blue-400 rounded pointer-events-none z-10">
                <svg className="w-8 h-8 text-blue-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-blue-500">Drop to replace image</span>
              </div>
            )}
            {/* Upload spinner */}
            {imgUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded z-10">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        );
      }

      case "button":
        return (
          <div
            style={{ ...baseStyle, textAlign: component.textAlign || "center" }}
            className="mt-2"
          >
            {!previewMode && isSelected && (
              <div className="mb-2 space-y-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-2">
                <Input
                  value={component.text || ""}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  placeholder="Button text"
                />
                <Input
                  type="url"
                  value={component.href || ""}
                  onChange={(e) => onUpdate({ href: e.target.value })}
                  placeholder="Button link URL"
                />
              </div>
            )}
            <a
              href={component.href || "#"}
              title={component.linkTitle || undefined}
              target="_blank"
              rel="noopener noreferrer"
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
                  if (!isLockedMode) onSelect();
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
      case "raw-html":
        return (
          <div
            className="mt-2 p-5"
            dangerouslySetInnerHTML={{ __html: component.html || "" }}
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
              title={component.linkTitle || undefined}
              target="_blank"
              rel="noopener noreferrer"
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
                  if (!isLockedMode) onSelect();
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
                <React.Fragment key={linkIndex}>
                  <a
                    href={link.href || "#"}
                    title={link.title || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: component.color || "#007bff",
                      textDecoration: "underline",
                    }}
                    onClick={(e) => {
                      if (!previewMode) {
                        e.preventDefault();
                        if (!isLockedMode) onSelect();
                      }
                    }}
                  >
                    {link.text}
                  </a>

                  {linkIndex < component.links!.length - 1 && (
                    <span className="text-gray-500">
                      |
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
        case "footer-link-2" :
        return (
          <div className="flex flex-col gap-3 " style={baseStyle}>
            <div className="flex items-center justify-between w-full mb-2">
              <div className="w-[45%]">
               
                  <img width={"100%"} src={component?.logoA?.imgSrc} alt={component?.logoA?.altTex}/>
          
              </div>
              <div className="w-[35%]">
               
                  <img width={"100%"} src={component?.logoB.imgSrc} alt={component.logoB.altTex}/>
           
              </div>
            </div>
            <div className="flex flex-wrap justify-evenly gap-10">
              {component.links?.map((link, linkIndex) => (
                <React.Fragment key={linkIndex}>
                  <a
                    href={link.href || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: component.color || "#007bff",
                      textDecoration: "underline",
                    }}
                    onClick={(e) => {
                      if (!previewMode) {
                        e.preventDefault();
                        if (!isLockedMode) onSelect();
                      }
                    }}
                  >
                    {link.text}
                  </a>

                 
                </React.Fragment>
              ))}
            </div>
          </div>
        )  

      case "elzonris-view-in-browser":
        return (
          <div style={{
            textAlign: (component.textAlign as any) || "center",
            padding: component.padding || "10px 20px",
            backgroundColor: component.backgroundColor || "transparent",
            lineHeight: component.lineHeight || "16px",
          }}>
            <a
              href={component.href || "#"}
              title={component.linkTitle || undefined}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: component.color || "#2360d9",
                textDecoration: "underline",
                fontSize: component.fontSize || "12px",
                lineHeight: component.lineHeight || "16px",
                fontFamily: "Arial, sans-serif",
                fontWeight: 400,
              }}
              onClick={(e) => !previewMode && e.preventDefault()}
            >
              View in Browser
            </a>
          </div>
        );

      case "elzonris-pi":
        return (
          <div style={{ ...baseStyle, padding: component.padding || "0 20px 10px 20px", textAlign: "left", fontSize: component.fontSize || "12px", color: component.color || "#000000", fontFamily: "Arial, sans-serif" }}>
            <p style={{ marginBottom: "10px", fontWeight: "bold" }}>
              Please see Full <a href={component.piHref || "#"} title={component.piTitle || undefined} target="_blank" rel="noopener noreferrer" style={{ color: component.linkColor || "#009877", textDecoration: "underline", fontWeight: "bold" }} onClick={(e) => !previewMode && e.preventDefault()}>Prescribing Information</a>, including Boxed WARNING.
            </p>
            <p style={{ fontWeight: "bold" }}>
              Please click <a href={component.isiHref || "#"} title={component.isiTitle || undefined} target="_blank" rel="noopener noreferrer" style={{ color: component.linkColor || "#009877", textDecoration: "underline", fontWeight: "bold" }} onClick={(e) => !previewMode && e.preventDefault()}>here</a>&nbsp;for Important Safety Information, including Boxed WARNING.
            </p>
          </div>
        );

      case "elzonris-brand-logo":
        return (
          <div className="flex flex-row sm:flex-row sm:gap-2 flex-wrap items-center justify-between w-full" style={baseStyle}>
            <div className="w-full sm:w-[45%]" style={{ minWidth: 0 }}>
              <a href={component?.logoA?.href || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => !previewMode && e.preventDefault()}>
                <img width="100%" src={component?.logoA?.imgSrc} alt={component?.logoA?.altTex} style={{ display: "block" }} />
              </a>
            </div>
            <div className="w-full sm:w-[35%]" style={{ minWidth: 0 }}>
              <a href={component?.logoB?.href || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => !previewMode && e.preventDefault()}>
                <img width="100%" src={component?.logoB?.imgSrc} alt={component?.logoB?.altTex} style={{ display: "block" }} />
              </a>
            </div>
          </div>
        );

      case "footer-link-3":
        return (
          <div style={{ ...baseStyle, padding: component.padding || "0 20px 10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {component.links?.map((link, linkIndex) => (
              <a
                key={linkIndex}
                href={link.href || "#"}
                title={link.title || undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: component.color || "#009877", textDecoration: "underline", fontSize: component.fontSize || "12px", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap" }}
                onClick={(e) => { if (!previewMode) { e.preventDefault(); if (!isLockedMode) onSelect(); } }}
              >
                {link.text}
              </a>
            ))}
          </div>
        );

      case "email-footer": {
        const links = component.links || [];
        return (
          <div
            style={{
              backgroundColor: component.backgroundColor || "#ffffff",
              padding: component.padding || "0px",
              width: "100%",
              boxSizing: "border-box",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: component.fontSize || "12px", lineHeight: component.fontSize || "12px" }}>
              {links.map((link, linkIndex) => {
                const isLast = linkIndex === links.length - 1;
                const isEven = (linkIndex + 1) % 2 === 0;
                return (
                  <React.Fragment key={linkIndex}>
                    <a
                      href={link.href || "#"}
                      title={link.title || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: component.color || "#0563C1",
                        textDecoration: "underline",
                        fontSize: component.fontSize || "12px",
                        fontFamily: "Arial, sans-serif",
                      }}
                      onClick={(e) => {
                        if (!previewMode) {
                          e.preventDefault();
                          if (!isLockedMode) onSelect();
                        }
                      }}
                    >
                      {link.text}
                    </a>
                    {!isLast && (
                      <span style={{ color: component.color || "#0563C1", fontSize: component.fontSize || "12px" }}>
                        &nbsp;&nbsp;|&nbsp;
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      }

      case "footer-with-Preferences": {
  const links = component.links || [];
  const storedPadding = component.padding || "";
  const parts = storedPadding.trim().split(/\s+/);
  const vertTop = parts[0] || "0";
  const vertBottom = parts[2] || parts[0] || "0";
  const canvasPadding = `${vertTop} 0 ${vertBottom} 0`;

  return (
    <div style={{ padding: canvasPadding, paddingLeft: "20px", paddingRight: "20px", backgroundColor: component.backgroundColor || "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href || "#"}
          title={link.title || undefined}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: component.color || "#0563C1",
            textDecoration: "underline",
            fontSize: component.fontSize || "12px",
            fontFamily: "Arial, sans-serif",
            whiteSpace: "nowrap",
          }}
          onClick={(e) => {
            if (!previewMode) {
              e.preventDefault();
              if (!isLockedMode) onSelect();
            }
          }}
        >
          {link.text}
        </a>
      ))}
    </div>
  );
}
    
      case "isi":
        return (
          <div style={{ ...baseStyle, backgroundColor: '#ffffff' }} className="flex flex-col gap-2">
            <h2 style={{ color: '#006937', fontSize: '16px', fontWeight: 600, fontFamily: 'Arial, sans-serif' }}>
              IMPORTANT SAFETY INFORMATION
            </h2>
            {component.importantSafetyInformation?.sections?.map((section, sectionIndex) =>
              section.title ? (
                <div key={sectionIndex} className="mb-4">
                  <h3 style={{ color: '#2B2E34', fontSize: '14px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>{section.title}</h3>
                  {section.items && section.items.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                      <tbody>
                        {section.items.map((subsection, subIndex) => (
                          <tr key={subIndex}>
                            <td style={{ color: '#69D6B5', fontSize: '16px', lineHeight: '16px', verticalAlign: 'top', width: '12px', paddingTop: '2px' }}>&#8226;</td>
                            <td style={{ color: '#2B2E34', fontSize: '14px', lineHeight: '18px', fontFamily: 'Arial, sans-serif', paddingLeft: '5px' }}
                              dangerouslySetInnerHTML={{ __html: subsection.content }} />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div key={sectionIndex}>
                  {section.items?.map((subsection, subIndex) => (
                    <div key={subIndex} style={{ color: '#2B2E34', fontSize: '14px', fontFamily: 'Arial, sans-serif', marginTop: '8px' }}
                      dangerouslySetInnerHTML={{ __html: subsection.content }} />
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
            previewMode={previewMode}
          />
        );

      case "header-image":
        return (
          <div
            className="mt-2 z-50 flex justify-center relative"
            onDragOver={(e) => { e.preventDefault(); if (!previewMode && !isLockedMode && Array.from(e.dataTransfer?.types || []).includes("Files")) setImgDragOver(true); }}
            onDragLeave={(e) => { setImgDragOver(false); }}
            onDrop={handleImageFileDrop}
          >
            <img
              src={component.src || "/header-placeholder.png"}
              alt={component.alt || "Header Image"}
              style={{
                width: component.width || "100%",
                height: component.height || "auto",
                maxWidth: component.maxWidth || "600px",
                display: "block",
                opacity: imgUploading ? 0.4 : 1,
                transition: "opacity 0.2s",
              }}
              onClick={(e) => { e.stopPropagation(); !previewMode && !isLockedMode && onSelect(); }}
            />
            {imgDragOver && !imgUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/80 border-2 border-dashed border-blue-400 rounded pointer-events-none z-10">
                <svg className="w-8 h-8 text-blue-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-blue-500">Drop to replace image</span>
              </div>
            )}
            {imgUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded z-10">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        );
        case "chevron-divider":
        return (
          <div className="mt-2 z-50 flex justify-center">
            <img
              src={component.src || "/chevron.png"}
              alt={component.alt || "Header Image"}
              style={{
                width: component.width || "100%",
                height: component.height || "auto",
                maxWidth: component.maxWidth || "600px",
                display: "block",
              }}
              onClick={(e) => {
                e.stopPropagation()
                !previewMode && !isLockedMode && onSelect()
              }}
            />
          </div>
        );
      case "custom-text": {
        const opts = component.customTextOptions || [];
        const tokenPreview = opts.length
          ? `{{customText[${opts.join("|")}]}}`
          : "{{customText[…]}}";
        return (
          <div style={{
            ...baseStyle,
            backgroundColor: component.backgroundColor || "#ffffff",
          }}>
            {/* Preview: show the token label and then each option */}
            <div style={{
              border: "1px dashed #aaa",
              borderRadius: "4px",
              padding: "6px 8px",
              backgroundColor: "#f9f9f9",
            }}>
              <div style={{
                fontSize: "10px",
                color: "#888",
                marginBottom: "4px",
                fontFamily: "Arial, sans-serif",
              }}>
                Veeva customText token — user picks one option at send time:
              </div>
              {opts.map((opt, i) => (
                <div key={i} style={{
                  fontSize: component.fontSize || "12px",
                  color: component.color || "#5D5D5D",
                  fontFamily: component.fontFamily || "Arial, sans-serif",
                  fontWeight: component.fontWeight || "normal",
                  lineHeight: component.lineHeight || "14px",
                  textAlign: component.textAlign || "left",
                  padding: "2px 0",
                  borderBottom: i < opts.length - 1 ? "1px dotted #e0e0e0" : "none",
                }}>
                  <span style={{ color: "#aaa", fontSize: "10px", marginRight: "6px" }}>{i + 1}.</span>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        );
      }

        case "Salutation":
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
        case "footer-tokens":
        {
          const tokens = component.footerTokens || {};
          const combinedValue = [tokens.regards, tokens.userName, tokens.company, tokens.userEmailAddress, tokens.userPhone]
            .filter((v) => v !== undefined && v !== null)
            .join("<br/>");

          const handleFooterChange = (content: string) => {
            const parts = content.split(/<br\s*\/?>/i);
            const [regards, userName, company, userEmailAddress, userPhone] = parts;
            onUpdate({
              footerTokens: {
                ...tokens,
                regards,
                userName,
                company,
                userEmailAddress,
                userPhone,
              },
            });
          };

          return (
            <div style={{ ...baseStyle, paddingBottom: component.padding ? undefined : "5px", paddingLeft: component.padding ? undefined : "20px" }} className="z-50 flex flex-col justify-start text-[#000000]">
              <RichTextEditor
                isSelected={isSelected}
                value={combinedValue}
                onChange={handleFooterChange}
                style={{
                  fontSize: component.fontSize || "16px",
                  color: component.color || "#000000",
                  textAlign: component.textAlign || "left",
                  fontWeight: component.fontWeight || "normal",
                  lineHeight: component.lineHeight || "18px",
                }}
              />
            </div>
          );
        }
        case "orsedu-footer":
        return (
          <div style={baseStyle} className="z-50 mt-2 flex flex-col w-full justify-start text-[#000000] bg-[#F1F1F1]">
            <img
              src={component.src || "/footer-logo-a.png"}
              alt={component.alt || "Header Image"}
              style={{
                width: component.width || "100%",
                height: component.height || "auto",
                maxWidth: component.maxWidth || "600px",
                display: "block",
              }}
              onClick={(e) => {
                e.stopPropagation()
                !previewMode && !isLockedMode && onSelect()
              }}
            />
            <div style={{fontSize: component.fontSize || "12px"}}>{component.footerText?.reg}</div>
            <div style={{fontSize: component.fontSize || "12px"}}>{component.footerText?.year}</div>
            <div style={{fontSize: component.fontSize || "12px"}}>{component.footerText?.address}</div>
            <div style={{fontSize: component.fontSize || "12px",display : "grid",gap : 2, width : "100%",gridTemplateColumns : "100px 1fr",alignItems : "center"}}>{component.footerText?.rights}  <RichTextEditor
              isSelected={isSelected}
              value={component.footerText?.jobcode || ""}
              onChange={(content) => onUpdate({ footerText: { ...component.footerText, jobcode: content } })}
              style={{
                fontSize: component.fontSize || "12px",
                color: component.color || "#000000",
                textAlign: component.textAlign || "left",
                fontWeight: component.fontWeight || "normal",
                backgroundColor: component.backgroundColor || "transparent",
                lineHeight: component.lineHeight || "14px",
                padding: "0px",
              }}
            /></div>
            
          </div>
        );
        case "orserdu-emerald-stats": {
          const {
            emeraldLeftIconSrc, emeraldLeftIconAlt,
            emeraldLeftHeading, emeraldLeftStat, emeraldLeftHR,
            emeraldRightStatNumber, emeraldRightStatLabel, emeraldRightDesc,
            emeraldRightStat, emeraldRightHR,
          } = component;

          // Right stat label lines (split on \n)
          const rightLabelLines = (emeraldRightStatLabel || "months\nmPFS").split("\n");

          return (
            <div style={{ padding: component.padding || "0 20px 10px 20px", backgroundColor: "#ffffff" }}>
              <style>{`
                .emerald-wrap { display: flex; flex-wrap: wrap; gap: 0; width: 100%; }
                .emerald-left { flex: 1 1 240px; min-width: 200px; padding-right: 16px; border-right: 1px solid #c1c1c1; box-sizing: border-box; }
                .emerald-sep  { display: none; }
                .emerald-right { flex: 1 1 240px; min-width: 200px; padding-left: 16px; box-sizing: border-box; }
                @media screen and (max-width: 480px) {
                  .emerald-left  { border-right: none !important; padding-right: 0 !important; border-bottom: 1px solid #c1c1c1; padding-bottom: 16px; margin-bottom: 0; }
                  .emerald-sep   { display: block; height: 0; }
                  .emerald-right { padding-left: 0 !important; padding-top: 16px; }
                }
              `}</style>
              <div className="emerald-wrap">
              {/* ── LEFT COLUMN ── */}
                <div className="emerald-left">
                  {/* icon + heading row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                    {isSelected ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                        <p style={{ fontSize: "10px", color: "#888", margin: 0 }}>Left icon URL</p>
                        <input type="text" className="w-full border rounded px-2 py-1 text-xs"
                          value={emeraldLeftIconSrc || ""} onChange={(e) => onUpdate({ emeraldLeftIconSrc: e.target.value })} />
                        <p style={{ fontSize: "10px", color: "#888", margin: 0 }}>Left icon alt</p>
                        <input type="text" className="w-full border rounded px-2 py-1 text-xs"
                          value={emeraldLeftIconAlt || ""} onChange={(e) => onUpdate({ emeraldLeftIconAlt: e.target.value })} />
                      </div>
                    ) : (
                      <img src={emeraldLeftIconSrc || "/placeholder.svg?width=72&height=72&text=2X"}
                        alt={emeraldLeftIconAlt || "mPFS icon"} width={72}
                        style={{ display: "block", flexShrink: 0, border: 0, outline: "none", textDecoration: "none" }} />
                    )}
                    {isSelected ? (
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "10px", color: "#888", margin: 0 }}>Left heading</p>
                        <input type="text" className="w-full border rounded px-2 py-1 text-xs"
                          value={emeraldLeftHeading || ""} onChange={(e) => onUpdate({ emeraldLeftHeading: e.target.value })} />
                      </div>
                    ) : (
                      <span style={{ color: "#006937", fontFamily: "Arial, sans-serif", fontSize: "14px", lineHeight: "16px", fontWeight: 700 }}>
                        {emeraldLeftHeading || "Primary endpoint in EMERALD"}
                      </span>
                    )}
                  </div>

                  {/* Left stat */}
                  {isSelected ? (
                    <div style={{ marginBottom: "8px" }}>
                      <p style={{ fontSize: "10px", color: "#888", margin: "0 0 2px" }}>Left stat (HTML supported)</p>
                      <textarea className="w-full border rounded px-2 py-1 text-xs" rows={3}
                        value={emeraldLeftStat || ""} onChange={(e) => onUpdate({ emeraldLeftStat: e.target.value })} />
                    </div>
                  ) : (
                    <div style={{ color: "#2B2E34", fontFamily: "Arial, sans-serif", fontSize: "14px", fontWeight: 400, marginBottom: "8px" }}
                      dangerouslySetInnerHTML={{ __html: emeraldLeftStat || "" }} />
                  )}

                  {/* Left HR */}
                  {isSelected ? (
                    <div>
                      <p style={{ fontSize: "10px", color: "#888", margin: "0 0 2px" }}>Left HR (HTML supported)</p>
                      <input type="text" className="w-full border rounded px-2 py-1 text-xs"
                        value={emeraldLeftHR || ""} onChange={(e) => onUpdate({ emeraldLeftHR: e.target.value })} />
                    </div>
                  ) : (
                    <div style={{ fontWeight: "bold", color: "#0C6938", fontFamily: "Arial, sans-serif", fontSize: "14px", lineHeight: "16px" }}
                      dangerouslySetInnerHTML={{ __html: emeraldLeftHR || "" }} />
                  )}
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="emerald-right">
                  {/* stat number + label + desc row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                    {/* big number */}
                    {isSelected ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "80px" }}>
                        <p style={{ fontSize: "10px", color: "#888", margin: 0 }}>Stat number</p>
                        <input type="text" className="w-full border rounded px-2 py-1 text-xs"
                          value={emeraldRightStatNumber || ""} onChange={(e) => onUpdate({ emeraldRightStatNumber: e.target.value })} />
                        <p style={{ fontSize: "10px", color: "#888", margin: 0 }}>Stat label (use \n for line breaks)</p>
                        <input type="text" className="w-full border rounded px-2 py-1 text-xs"
                          value={emeraldRightStatLabel || ""} onChange={(e) => onUpdate({ emeraldRightStatLabel: e.target.value })} />
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", color: "#000", fontFamily: "Arial, sans-serif", flexShrink: 0, paddingRight: "10px", minWidth: "60px" }}>
                        <div style={{ fontSize: "22px", fontWeight: 700, lineHeight: "24px" }}>{emeraldRightStatNumber || "8.6"}</div>
                        <div style={{ fontSize: "12px", lineHeight: "14px", fontWeight: 400 }}>
                          {rightLabelLines.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                      </div>
                    )}
                    {/* description */}
                    {isSelected ? (
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "10px", color: "#888", margin: 0 }}>Right description</p>
                        <textarea className="w-full border rounded px-2 py-1 text-xs" rows={3}
                          value={emeraldRightDesc || ""} onChange={(e) => onUpdate({ emeraldRightDesc: e.target.value })} />
                      </div>
                    ) : (
                      <div style={{ color: "#231F20", fontFamily: "Arial, sans-serif", fontSize: "14px", lineHeight: "16px", fontWeight: 400, flex: 1 }}>
                        {emeraldRightDesc}
                      </div>
                    )}
                  </div>

                  {/* Right stat */}
                  {isSelected ? (
                    <div style={{ marginBottom: "8px" }}>
                      <p style={{ fontSize: "10px", color: "#888", margin: "0 0 2px" }}>Right stat text (HTML supported)</p>
                      <textarea className="w-full border rounded px-2 py-1 text-xs" rows={2}
                        value={emeraldRightStat || ""} onChange={(e) => onUpdate({ emeraldRightStat: e.target.value })} />
                    </div>
                  ) : (
                    <div style={{ color: "#000", fontFamily: "Arial, sans-serif", fontSize: "14px", fontWeight: 400, marginBottom: "8px" }}
                      dangerouslySetInnerHTML={{ __html: emeraldRightStat || "" }} />
                  )}

                  {/* Right HR */}
                  {isSelected ? (
                    <div>
                      <p style={{ fontSize: "10px", color: "#888", margin: "0 0 2px" }}>Right HR (HTML supported)</p>
                      <input type="text" className="w-full border rounded px-2 py-1 text-xs"
                        value={emeraldRightHR || ""} onChange={(e) => onUpdate({ emeraldRightHR: e.target.value })} />
                    </div>
                  ) : (
                    <div style={{ color: "#000", fontFamily: "Arial, sans-serif", fontSize: "14px", fontWeight: 400 }}
                      dangerouslySetInnerHTML={{ __html: emeraldRightHR || "" }} />
                  )}
                </div>
              </div>
            </div>
          );
        }

        case "elzonris-isi":
        return (
          <div style={{ ...baseStyle, fontFamily: component.fontFamily || "Arial, sans-serif" }} dangerouslySetInnerHTML={{ __html: component.html || "" }} />
        );
            case "elzonris-divider":
        return (
          <div style={{ width: "100%", paddingBottom: "10px" }}>
            <img src={component.src || "./footer-line.png"} alt="" style={{ display: "block", width: "100%", height: "3px" }} />
            <div style={{ color: component.color || "#646464", fontSize: component.fontSize || "15px", fontWeight: component.fontWeight || "bold", padding: "10px 20px", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
              VISIT <a href={component.href || "#"} title={component.linkTitle || undefined} target="_blank" rel="noopener noreferrer" style={{ color: "#F15625", textDecoration: "none" }}>ELZONRIS.COM/HCP</a> FOR MORE INFORMATION.
            </div>
            <img src={component.src || "./footer-line.png"} alt="" style={{ display: "block", width: "100%", height: "3px" }} />
          </div>
        );

        case "elzonris-references":
          return (
            <div style={{ padding: component.padding || "0 20px 10px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#646464", lineHeight: "14px", fontWeight: "bold", whiteSpace: "nowrap", paddingTop: "2px" }}>References:&nbsp;</span>
                <RichTextEditor
                  isSelected={isSelected}
                  value={component.references || ""}
                  onChange={(val) => onUpdate({ references: val })}
                  style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#646464", lineHeight: "14px", fontWeight: "normal" }}
                />
              </div>
            </div>
          );

        case "elzonris-abbreviations":
          return (
            <div style={{ padding: component.padding || "0 20px 10px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#646464", lineHeight: "14px", fontWeight: "bold", whiteSpace: "nowrap", paddingTop: "2px" }}>Abbreviations:&nbsp;</span>
                <RichTextEditor
                  isSelected={isSelected}
                  value={component.abbreviations || ""}
                  onChange={(val) => onUpdate({ abbreviations: val })}
                  style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#646464", lineHeight: "14px", fontWeight: "normal" }}
                />
              </div>
            </div>
          );

        case "elzonris-ref-abbr":
          return (
            <div style={{ padding: component.padding || "0 20px 10px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "6px" }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#646464", lineHeight: "14px", fontWeight: "bold", whiteSpace: "nowrap", paddingTop: "2px" }}>References:&nbsp;</span>
                <RichTextEditor
                  isSelected={isSelected}
                  value={component.references || ""}
                  onChange={(val) => onUpdate({ references: val })}
                  style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#646464", lineHeight: "14px", fontWeight: "normal" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#646464", lineHeight: "14px", fontWeight: "bold", whiteSpace: "nowrap", paddingTop: "2px" }}>Abbreviations:&nbsp;</span>
                <RichTextEditor
                  isSelected={isSelected}
                  value={component.abbreviations || ""}
                  onChange={(val) => onUpdate({ abbreviations: val })}
                  style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#646464", lineHeight: "14px", fontWeight: "normal" }}
                />
              </div>
            </div>
          );

          case "image-with-link" :
             return (
          <div
            style={baseStyle}
            className={`flex flex-col items-${
              ImageAlimentMap[component?.textAlign || "center"] || "center"
            } mt-2`}
          >
           
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
              onClick={(e) => {
                e.stopPropagation()
                !previewMode && !isLockedMode && onSelect()
              }}
            />
          </div>
        );
        case "ferring-footer" :
          return (
            <div
              
              className="z-50 mt-2 p-[30px] flex flex-col w-full justify-start text-[#ffffff] bg-[#0083BF]"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="w-[45%]">
                  <img width={"112"} src={component?.logo?.logoSrc} alt={component?.logo?.altTex}/>
                </div>
                <div className="w-[45%] flex justify-end items-center">
                  {component.socialMediaLinks?.map((link, index) => (
                    <a key={index} href={link.href} target="_blank" rel="noopener noreferrer" className="mx-2">
                      <img src={link.iconSrc} alt={link.altText} style={{ width: "33px", height: "33px" }} />
                    </a>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-start justify-between">
                  <div className="flex flex-col gap-4">
                    <p className="text-white text-[9.5px]">
                      Ferring Pharmaceuticals, 100 Interpace Parkway, Parsippany, NJ 07054<br/>
                      { isSelected ? 
                       <Input
                       value={component.jobCode || ""}
                       onChange={(e) => onUpdate({ jobCode: e.target.value })}
                       className="bg-transparent border h-8 outline-none  text-[9.5px] focus:ring-0 focus:outline-none"
                       /> 
                       : <span>{component.jobCode}</span>
                      }
                    </p>
                     <p className="text-white text-[9.5px]">
                      © 2026 Ferring<br/>
                      FERRING and the Ferring Pharmaceuticals logo are trademarks of the Ferring.<br/>
                      This is intended for healthcare professionals only.
                    </p>
                  </div>
                 <div className="flex flex-col gap-1  items-end">
                      {component.links?.map((link, linkIndex) => (
                        <React.Fragment key={linkIndex}>
                          <a
                            href={link.href || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#FFFFFF",
                              textDecoration: "underline",
                              fontSize: "10px",
                            }}
                            >
                            {link.text}
                            </a>
                        </React.Fragment>
                      ))}
                 </div>
              </div>
            </div>
          );
      case "tryvio-footer": {
        const {
          tryvioFooterLogoSrc, tryvioFooterLogoHref, tryvioFooterLogoAlt,
          tryvioFooterEmailLine, tryvioFooterSentByLine, tryvioFooterAddressLine,
          tryvioFooterPrivacyText, tryvioFooterPrivacyHref,
          tryvioFooterUnsubscribeText, tryvioFooterUnsubscribeHref,
          tryvioFooterLinkedinSrc, tryvioFooterLinkedinHref, tryvioFooterLinkedinAlt,
          tryvioFooterCopyrightText, tryvioFooterCopyrightHref,
          tryvioFooterJobCode,
          tryvioFooterIdorsiaLogoSrc, tryvioFooterIdorsiaLogoHref, tryvioFooterIdorsiaLogoAlt,
        } = component;

        const privacyFull = tryvioFooterPrivacyText || "We respect your right to privacy - view our Privacy policy.";
        const privacySplit = privacyFull.split("Privacy policy");
        const txtStyle: React.CSSProperties = { fontWeight: 700, color: "#002D7C", fontFamily: "Arial, sans-serif", fontSize: "12px", lineHeight: "16px", margin: "0 0 10px", textAlign: "center" };
        const lnkStyle: React.CSSProperties = { textDecoration: "underline", color: "#002D7C" };

        const EditRow = ({ label, field, type = "text", value }: { label: string; field: keyof typeof component; type?: string; value: string }) => (
          <div className="mb-2">
            <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
            <input type={type} className="w-full border rounded px-2 py-1 text-xs text-center bg-white"
              value={value} onChange={(e) => onUpdate({ [field]: e.target.value } as any)} />
          </div>
        );

        return (
          <div style={{ backgroundColor: "#E7E7E7", width: "100%", overflow: "hidden" }}>
            <style>{`
              .tf-logo { width: 100%; max-width: 260px; height: auto; display: block; margin: 0 auto; }
              .tf-inner { padding: 0 30px; box-sizing: border-box; }
              .tf-linkedin { display: inline-block; width: 40px; height: auto; }
              .tf-idorsia { display: block; width: 111px; max-width: 30%; height: auto; }
              @media screen and (max-width: 480px) {
                .tf-logo { max-width: 70% !important; }
                .tf-inner { padding: 0 12px !important; }
              }
            `}</style>

            <div className="tf-inner" style={{ padding: "0 30px" }}>
              {/* ── top spacer ── */}
              <div style={{ height: "40px" }} />

              {/* ── TRYVIO logo (centered) ── */}
              <div style={{ textAlign: "center", marginBottom: "23px" }}>
                {isSelected ? (
                  <div className="text-left space-y-0">
                    <EditRow label="TRYVIO logo – image URL" field="tryvioFooterLogoSrc" value={tryvioFooterLogoSrc || ""} />
                    <EditRow label="TRYVIO logo – link URL" field="tryvioFooterLogoHref" type="url" value={tryvioFooterLogoHref || ""} />
                    <EditRow label="Alt text" field="tryvioFooterLogoAlt" value={tryvioFooterLogoAlt || ""} />
                  </div>
                ) : (
                  <a href={tryvioFooterLogoHref || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => !previewMode && e.preventDefault()}>
                    <img src={tryvioFooterLogoSrc || "/logo.png"} alt={tryvioFooterLogoAlt || "Tryvio"} className="tf-logo" />
                  </a>
                )}
              </div>

              {/* ── "Sent to" ── */}
              {isSelected
                ? <EditRow label='"Sent to" line' field="tryvioFooterEmailLine" value={tryvioFooterEmailLine || ""} />
                : <p style={txtStyle}>{tryvioFooterEmailLine || "This email was sent to {{Account.PersonEmail}}"}</p>}

              {/* ── "Sent by" ── */}
              {isSelected
                ? <EditRow label='"Sent by" line' field="tryvioFooterSentByLine" value={tryvioFooterSentByLine || ""} />
                : <p style={txtStyle}>{tryvioFooterSentByLine || "This email was sent by: Idorsia Pharmaceuticals US Inc."}</p>}

              {/* ── Address ── */}
              {isSelected
                ? <EditRow label="Address" field="tryvioFooterAddressLine" value={tryvioFooterAddressLine || ""} />
                : <p style={{ ...txtStyle, margin: "0 0 34px" }}>{tryvioFooterAddressLine || "One Radnor Corporate Center, Suite 101, Radnor, PA 19087"}</p>}

              {/* ── Privacy line ── */}
              {isSelected ? (
                <div className="mb-2">
                  <p className="text-[10px] text-gray-400 mb-0.5">Privacy line (keep "Privacy policy" as the link anchor)</p>
                  <input type="text" className="w-full border rounded px-2 py-1 text-xs text-center bg-white mb-1"
                    value={tryvioFooterPrivacyText || ""} onChange={(e) => onUpdate({ tryvioFooterPrivacyText: e.target.value })} />
                  <p className="text-[10px] text-gray-400 mb-0.5">Privacy policy URL</p>
                  <input type="url" className="w-full border rounded px-2 py-1 text-xs text-center bg-white"
                    value={tryvioFooterPrivacyHref || ""} onChange={(e) => onUpdate({ tryvioFooterPrivacyHref: e.target.value })} />
                </div>
              ) : (
                <p style={txtStyle}>
                  {privacySplit[0]}
                  <a href={tryvioFooterPrivacyHref || "#"} target="_blank" rel="noopener noreferrer" style={lnkStyle} onClick={(e) => !previewMode && e.preventDefault()}>Privacy policy</a>
                  {privacySplit[1] ?? ""}
                </p>
              )}

              {/* ── Unsubscribe ── */}
              {isSelected ? (
                <div className="mb-2">
                  <p className="text-[10px] text-gray-400 mb-0.5">Unsubscribe link text</p>
                  <input type="text" className="w-full border rounded px-2 py-1 text-xs text-center bg-white mb-1"
                    value={tryvioFooterUnsubscribeText || ""} onChange={(e) => onUpdate({ tryvioFooterUnsubscribeText: e.target.value })} />
                  <p className="text-[10px] text-gray-400 mb-0.5">Unsubscribe URL / token</p>
                  <input type="text" className="w-full border rounded px-2 py-1 text-xs text-center bg-white"
                    placeholder="e.g. {{unsubscribe_product_link}}" value={tryvioFooterUnsubscribeHref || ""} onChange={(e) => onUpdate({ tryvioFooterUnsubscribeHref: e.target.value })} />
                </div>
              ) : (
                <p style={{ ...txtStyle, margin: "0 0 40px" }}>
                  <a href={tryvioFooterUnsubscribeHref || "#"} target="_blank" rel="noopener noreferrer" style={lnkStyle} onClick={(e) => !previewMode && e.preventDefault()}>
                    {tryvioFooterUnsubscribeText || "Unsubscribe"}
                  </a>
                </p>
              )}

              {/* ── LinkedIn icon (centered) ── */}
              <div style={{ textAlign: "center", marginBottom: "30px" }}>
                {isSelected ? (
                  <div className="text-left">
                    <EditRow label="LinkedIn icon – image URL" field="tryvioFooterLinkedinSrc" value={tryvioFooterLinkedinSrc || ""} />
                    <EditRow label="LinkedIn – link URL" field="tryvioFooterLinkedinHref" type="url" value={tryvioFooterLinkedinHref || ""} />
                  </div>
                ) : (
                  <a href={tryvioFooterLinkedinHref || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => !previewMode && e.preventDefault()}>
                    <img src={tryvioFooterLinkedinSrc || "/linkedin.png"} alt={tryvioFooterLinkedinAlt || "LinkedIn"} className="tf-linkedin" />
                  </a>
                )}
              </div>

              {/* ── Copyright ── */}
              {isSelected ? (
                <div className="mb-2">
                  <EditRow label="Copyright text" field="tryvioFooterCopyrightText" value={tryvioFooterCopyrightText || ""} />
                  <EditRow label="Copyright URL" field="tryvioFooterCopyrightHref" type="url" value={tryvioFooterCopyrightHref || ""} />
                </div>
              ) : (
                <p style={{ ...txtStyle, fontSize: "10px", lineHeight: "14px" }}>
                  <a href={tryvioFooterCopyrightHref || "#"} target="_blank" rel="noopener noreferrer" style={lnkStyle} onClick={(e) => !previewMode && e.preventDefault()}>
                    {tryvioFooterCopyrightText || "©2026 Idorsia Pharmaceuticals, Ltd."}
                  </a>
                </p>
              )}

              {/* ── Job code ── */}
              {isSelected
                ? <EditRow label="Job code" field="tryvioFooterJobCode" value={tryvioFooterJobCode || ""} />
                : <p style={{ ...txtStyle, margin: "0 0 30px" }}>{tryvioFooterJobCode || "US-AP-00162 04/26"}</p>}

              {/* ── Idorsia logo (left-aligned) ── */}
              <div style={{ paddingBottom: "40px", textAlign: "left" }}>
                {isSelected ? (
                  <div>
                    <EditRow label="Idorsia logo – image URL" field="tryvioFooterIdorsiaLogoSrc" value={tryvioFooterIdorsiaLogoSrc || ""} />
                    <EditRow label="Idorsia logo – link URL" field="tryvioFooterIdorsiaLogoHref" type="url" value={tryvioFooterIdorsiaLogoHref || ""} />
                  </div>
                ) : (
                  <a href={tryvioFooterIdorsiaLogoHref || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => !previewMode && e.preventDefault()}>
                    <img src={tryvioFooterIdorsiaLogoSrc || "/Idorsia.png"} alt={tryvioFooterIdorsiaLogoAlt || "Idorsia logo"} className="tf-idorsia" />
                  </a>
                )}
              </div>

            </div>{/* /.tf-inner */}
          </div>
        );
      }

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
        relative group ${!previewMode ? "cursor-pointer" : ""}
        ${
          isSelected && !previewMode
            ? isColumn
              ? "rounded-md ring-2 ring-green-500/80 ring-offset-1"
              : "rounded-md ring-2 ring-blue-500/80 ring-offset-1"
            : ""
        }
        ${!isSelected && !previewMode && !isLockedMode ? "hover:ring-1 hover:ring-blue-200" : ""}
        ${isDragging ? "opacity-50" : ""}
      `}
      onClick={(e) => {
        e.stopPropagation();
        if (!isLockedMode) onSelect();
      }}
    >
      {!previewMode && (
        <>
          {/* Drag Handle */}
          { !isColumn && !isLockedMode && 
            <div
              ref={dragHandleRef}
              title="Drag to reorder"
              className="absolute -left-6 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 opacity-0 shadow-sm transition-opacity hover:text-gray-600 hover:shadow group-hover:opacity-100 z-10"
            >
              <GripVertical className="h-4 w-4 cursor-grab" />
            </div>
          }

          {/* Rearrange Controls */}
          {isSelected && !isLockedMode && (
            <RearrangeControls
              componentId={component.id}
              index={index}
              totalComponents={totalComponents}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDuplicate={handleDuplicate}
              onDelete={onDelete}
              activeOption={activeOption}
              onCopyToOption={onCopyToOption}
            />
          )}
        </>
      )}

      {renderComponent()}
      {isLockedMode && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-40 pointer-events-none flex items-center justify-center cursor-not-allowed z-20">
          <div className="bg-white px-2 py-1 rounded text-xs font-semibold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Header-Only Mode (Synced)
          </div>
        </div>
      )}
    </div>
  );
};


