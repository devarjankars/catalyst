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
}: EmailComponentRendererProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // --- Image drag-and-drop state (declared at component level to satisfy Rules of Hooks) ---
  const [imgDragOver, setImgDragOver] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const { currentTemplate, addTemplateImage } = useEmailBuilderStore();

  const handleImageFileDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setImgDragOver(false);
    if (previewMode || isLockedMode) return;
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please drop an image file");
      return;
    }
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
            className={`flex flex-col items-${ImageAlimentMap[component?.textAlign] || "center"} mt-2 relative`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!previewMode && !isLockedMode) setImgDragOver(true); }}
            onDragLeave={(e) => { e.stopPropagation(); setImgDragOver(false); }}
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
            backgroundColor: "#FFFFFF",
            lineHeight: component.lineHeight || "16px",
          }}>
            <a
              href={component.href || "#"}
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
              Please see Full <a href={component.piHref || "#"} style={{ color: component.linkColor || "#009877", textDecoration: "underline", fontWeight: "bold" }} onClick={(e) => !previewMode && e.preventDefault()}>Prescribing Information</a>, including Boxed WARNING.
            </p>
            <p style={{ fontWeight: "bold" }}>
              Please click <a href={component.isiHref || "#"} style={{ color: component.linkColor || "#009877", textDecoration: "underline", fontWeight: "bold" }} onClick={(e) => !previewMode && e.preventDefault()}>here</a>&nbsp;for Important Safety Information, including Boxed WARNING.
            </p>
          </div>
        );

      case "elzonris-brand-logo":
        return (
          <div className="flex flex-row sm:flex-row sm:gap-2 flex-wrap items-center justify-between w-full" style={baseStyle}>
            <div className="w-full sm:w-[45%]" style={{ minWidth: 0 }}>
              <a href={component?.logoA?.href || "#"} onClick={(e) => !previewMode && e.preventDefault()}>
                <img width="100%" src={component?.logoA?.imgSrc} alt={component?.logoA?.altTex} style={{ display: "block" }} />
              </a>
            </div>
            <div className="w-full sm:w-[35%]" style={{ minWidth: 0 }}>
              <a href={component?.logoB?.href || "#"} onClick={(e) => !previewMode && e.preventDefault()}>
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
                style={{ color: component.color || "#009877", textDecoration: "underline", fontSize: component.fontSize || "12px", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap" }}
                onClick={(e) => { if (!previewMode) { e.preventDefault(); if (!isLockedMode) onSelect(); } }}
              >
                {link.text}
              </a>
            ))}
          </div>
        );

      case "footer-with-Preferences": {
  const links = component.links || [];

  return (
    <div
      className="footer-preferences"
      style={{
        ...baseStyle,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        lineHeight: component.lineHeight || "2",
      }}
    >
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href || "#"}
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
          />
        );

      case "header-image":
        return (
          <div
            className="mt-2 z-50 flex justify-center relative"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!previewMode && !isLockedMode) setImgDragOver(true); }}
            onDragLeave={(e) => { e.stopPropagation(); setImgDragOver(false); }}
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
        case "Salutation":
        return (
          <div style={baseStyle} className="mt-2 z-50 flex justify-start">
            <div>{component.content}</div>
          </div>
        );  
        case "footer-tokens":
        return (
          <div style={baseStyle} className="z-50 flex flex-col justify-start text-[#000000]">
            <div>{component.footerTokens?.regards}</div>
            <div>{component.footerTokens?.userName}</div>
            <div dangerouslySetInnerHTML={{__html : component.footerTokens?.company}}></div>
            {/* <div>{component.footerTokens?.userPhoto}</div> */}
            <div>{component.footerTokens?.userPhone}</div>
            <div>{component.footerTokens?.userEmailAddress}</div>
          </div>
        );
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
        case "elzonris-isi":
        return (
          <div style={{ ...baseStyle, fontFamily: component.fontFamily || "Arial, sans-serif" }} dangerouslySetInnerHTML={{ __html: component.html || "" }} />
        );
            case "elzonris-divider":
        return (
          <div style={{ width: "100%", paddingBottom: "10px" }}>
            <img src={component.src || "./footer-line.png"} alt="" style={{ display: "block", width: "100%", height: "3px" }} />
            <div style={{ color: component.color || "#646464", fontSize: component.fontSize || "15px", fontWeight: component.fontWeight || "bold", padding: "10px 20px", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
              VISIT <a href={component.href || "#"} style={{ color: "#F15625", textDecoration: "none" }}>ELZONRIS.COM/HCP</a> FOR MORE INFORMATION.
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
              ImageAlimentMap[component?.textAlign ] || "center"
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
                    <a key={index} href={link.href} className="mx-2">
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
        if (!isLockedMode) onSelect();
      }}
    >
      {!previewMode && (
        <>
          {/* Drag Handle */}
          { !isColumn && !isLockedMode && 
            <div
              ref={dragHandleRef}
              className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <GripVertical
                className={`w-4 h-4 cursor-move ${
                  isColumn ? "text-green-400" : "text-gray-400"
                }`}
              />
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
            />
          )}

          {/* Edit overlay for non-text and non-section components */}
          {component.type !== "text" &&
            component.type !== "section" &&
            isSelected && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 hover:border-black  pointer-events-none" />
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


