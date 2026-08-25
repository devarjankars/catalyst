"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmailComponent } from "@/types/email-builder";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./image-upload";
import { useEffect, useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { TriangleAlert, Code, BookmarkPlus, Box, MousePointerClick, Layers } from "lucide-react";
import PaddingInput from "./padding -inputs";
import { useEmailBuilderStore } from "@/store/email-builder-store";
import { HtmlEditorModal } from "./html-editor-modal";
import { RichTextEditor } from "./rich-text-editor";
import { verifyHtml } from "@/lib/verify-html";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

// Ensures value is always a valid 7-char hex string for <input type="color">
function toHex(value: string): string {
  const cleaned = value?.trim() ?? "";
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned;
  return "#000000";
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value || "#000000");

  useEffect(() => { setText(value || "#000000"); }, [value]);

  const commit = (raw: string) => {
    const val = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val);
  };

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div
        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow"
        title="Pick color"
      >
        <input
          type="color"
          value={toHex(text)}
          onChange={(e) => { setText(e.target.value); onChange(e.target.value); }}
          className="absolute inset-0 h-[140%] w-[140%] -translate-x-[14%] -translate-y-[14%] cursor-pointer border-0 p-0"
        />
      </div>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit(text)}
        className="font-mono uppercase"
        placeholder="#000000"
        maxLength={7}
      />
    </div>
  );
}

interface PropertiesPanelProps {
  component: EmailComponent | undefined;
  onUpdateComponent: (updates: Partial<EmailComponent>) => void;
  onSaveAsCustom?: (name?: string) => void;
  onSaveHtmlBlock?: (value: string, name: string) => void;
}

export function PropertiesPanel({
  component,
  onUpdateComponent,
  onSaveAsCustom,
  onSaveHtmlBlock,
}: PropertiesPanelProps) {
  const [Links, setLinks] = useState<{ href: string; text: string; color: string }[]>([]);
  const [isHtmlEditorOpen, setIsHtmlEditorOpen] = useState(false);
  const [isRawHtmlEditorOpen, setIsRawHtmlEditorOpen] = useState(false);
  const [isSaveBlockOpen, setIsSaveBlockOpen] = useState(false);
  const [blockName, setBlockName] = useState("");
  const { preheaderText, setPreheader } = useEmailBuilderStore();

  useEffect(() => {
    if (component && component.content?.includes("<a")) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(component.content, "text/html");
      const anchors = doc.querySelectorAll("a");
      const parsedLinks = Array.from(anchors).map((a) => {
        const style = a.getAttribute("style") || "";
        const colorMatch = style.match(/color:\s*([^;]+)/i);
        // Default color if not found
        const color = colorMatch ? colorMatch[1].trim() : "#0000EE"; 
        
        return {
          href: a.getAttribute("href") || "",
          text: a.textContent || "",
          color: color,
        };
      });
      setLinks(parsedLinks);
    } else {
      setLinks([]);
    }
  }, [component]);

  if (!component) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 ring-1 ring-gray-200">
          <MousePointerClick className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <div className="font-medium text-gray-700">No component selected</div>
          <div className="mt-1 text-sm text-gray-400">
            Select a component on the canvas to edit its properties
          </div>
        </div>
      </div>
    );
  }

  const isColumn = component.type === "section" && component.isColumn;

  const handleSaveBlock = () => {
    onSaveAsCustom?.(blockName.trim() || component.name || `Saved ${component.type}`);
    setIsSaveBlockOpen(false);
    setBlockName("");
  };

  const updateLink = (index: number, newHref: string, newText: string, newColor: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(component.content!, "text/html");
    const anchors = doc.querySelectorAll("a");

    if (anchors[index]) {
      anchors[index].setAttribute("href", newHref);
      anchors[index].textContent = newText;
      
      let style = anchors[index].getAttribute("style") || "";
      // Handle color update in inline style
      if (/color:\s*[^;]+/i.test(style)) {
        style = style.replace(/color:\s*[^;]+/i, `color: ${newColor}`);
      } else {
        style = style ? `${style}; color: ${newColor}` : `color: ${newColor}`;
      }
      
      // Ensure text-decoration matches standard link style if likely intended
      if (!style.includes("text-decoration")) {
          style += "; text-decoration: underline";
      }
      
      anchors[index].setAttribute("style", style);
    }

    const updatedHtml = doc.body.innerHTML;
    onUpdateComponent({ content: updatedHtml });
  };


  const saveRawHtml = (rawHtml: string) => {
    if (verifyHtml(rawHtml)) {
      onUpdateComponent({ html: rawHtml });
      setIsRawHtmlEditorOpen(false);
    } else {
      toast.error("Invalid HTML");
    }
  };

  const saveRawHtmlBlock = (rawHtml: string, name: string) => {
    if (verifyHtml(rawHtml)) {
      onSaveHtmlBlock?.(rawHtml, name);
      setIsRawHtmlEditorOpen(false);
    } else {
      toast.error("Invalid HTML");
    }
  };

  const renderProperties = () => {
    switch (component.type) {
      case "section":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label htmlFor="borderRadius">Border Radius</Label>
              <Input
                id="borderRadius"
                value={component.borderRadius || "0px"}
                onChange={(e) =>
                  onUpdateComponent({ borderRadius: e.target.value })
                }
                placeholder="0px"
              />
            </div>

            {/* Column-specific properties */}
            {isColumn && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">
                    Column Layout
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="columnAlignment">
                        Horizontal Alignment
                      </Label>
                      <Select
                        value={component.columnAlignment || "left"}
                        onValueChange={(value) =>
                          onUpdateComponent({
                            columnAlignment: value as
                              | "left"
                              | "center"
                              | "right",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="columnVerticalAlignment">
                        Vertical Alignment
                      </Label>
                      <Select
                        value={component.columnVerticalAlignment || "top"}
                        onValueChange={(value) =>
                          onUpdateComponent({
                            columnVerticalAlignment: value as
                              | "top"
                              | "middle"
                              | "bottom",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="middle">Middle</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="columnMinHeight">Minimum Height</Label>
                      <Input
                        id="columnMinHeight"
                        value={component.columnMinHeight || "120px"}
                        onChange={(e) =>
                          onUpdateComponent({ columnMinHeight: e.target.value })
                        }
                        placeholder="120px"
                      />
                    </div>

                    <div>
                      <Label htmlFor="columnWidth">Column Width</Label>
                      <Input
                        id="columnWidth"
                        value={component.columnWidth || "auto"}
                        onChange={(e) =>
                          onUpdateComponent({ columnWidth: e.target.value })
                        }
                        placeholder="auto, 50%, 200px"
                      />
                    </div>
                    
                  </div>
                </div>
              </>
            )}

            {/* Regular section properties */}
            {!isColumn && (
              <>
                <div>
                  <Label htmlFor="direction">Layout Direction</Label>
                  <Select
                    value={component.direction || "column"}
                    onValueChange={(value) =>
                      onUpdateComponent({
                        direction: value as "row" | "column",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="column">Vertical (Column)</SelectItem>
                      <SelectItem value="row">Horizontal (Row)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxWidth">Max Width</Label>
                  <Input
                    id="maxWidth"
                    value={component.maxWidth || "100%"}
                    onChange={(e) =>
                      onUpdateComponent({ maxWidth: e.target.value })
                    }
                    placeholder="100%"
                  />
                </div>
                <div>
                  <Label htmlFor="margin">Margin</Label>
                  <Input
                    id="margin"
                    value={component.margin || "0"}
                    onChange={(e) =>
                      onUpdateComponent({ margin: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {/* Column Width Controls for Parent Multi-Column Sections */}
            {!isColumn && component.children && component.children.length > 1 && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-3">
                    Column Widths
                  </h4>

                  {/* Preset Buttons */}
                  <div className="mb-4">
                    <Label className="text-sm mb-2 block">Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      {component.children.length === 2 && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedChildren = component.children!.map((child, idx) => ({
                                ...child,
                                columnWidth: "50%"
                              }));
                              onUpdateComponent({ children: updatedChildren });
                            }}
                          >
                            50/50
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedChildren = component.children!.map((child, idx) => ({
                                ...child,
                                columnWidth: idx === 0 ? "30%" : "70%"
                              }));
                              onUpdateComponent({ children: updatedChildren });
                            }}
                          >
                            30/70
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedChildren = component.children!.map((child, idx) => ({
                                ...child,
                                columnWidth: idx === 0 ? "70%" : "30%"
                              }));
                              onUpdateComponent({ children: updatedChildren });
                            }}
                          >
                            70/30
                          </Button>
                        </>
                      )}
                      {component.children.length === 3 && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedChildren = component.children!.map((child) => ({
                                ...child,
                                columnWidth: "33.33%"
                              }));
                              onUpdateComponent({ children: updatedChildren });
                            }}
                          >
                            33/33/33
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedChildren = component.children!.map((child, idx) => ({
                                ...child,
                                columnWidth: idx === 1 ? "50%" : "25%"
                              }));
                              onUpdateComponent({ children: updatedChildren });
                            }}
                          >
                            25/50/25
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedChildren = component.children!.map((child, idx) => ({
                                ...child,
                                columnWidth: idx === 0 ? "50%" : "25%"
                              }));
                              onUpdateComponent({ children: updatedChildren });
                            }}
                          >
                            50/25/25
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Individual Column Width Inputs */}
                  <div className="space-y-3">
                    {component.children.map((child, idx) => (
                      <div key={child.id}>
                        <Label htmlFor={`column-width-${idx}`}>
                          Column {idx + 1} Width
                        </Label>
                        <Input
                          id={`column-width-${idx}`}
                          value={child.columnWidth || (component.children!.length === 2 ? "50%" : "33.33%")}
                          onChange={(e) => {
                            const updatedChildren = component.children!.map((c, i) =>
                              i === idx ? { ...c, columnWidth: e.target.value } : c
                            );
                            onUpdateComponent({ children: updatedChildren });
                          }}
                          placeholder="50%, 200px, auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "Salutation":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="salutationFontSize">Font Size</Label>
              <Input
                id="salutationFontSize"
                value={component.fontSize || "16px"}
                onChange={(e) =>
                  onUpdateComponent({ fontSize: e.target.value })
                }
                placeholder="16px"
              />
            </div>
            <div>
              <Label htmlFor="salutationColor">Text Color</Label>
              <ColorInput value={component.color || "#000000"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Font weight</Label>
              <Select
                value={component.fontWeight || "normal"}
                onValueChange={(value) =>
                  onUpdateComponent({ fontWeight: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="lighter">Lighter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="salutationBackgroundColor">Background color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label htmlFor="salutationTextAlign">Text Align</Label>
              <Select
                value={component.textAlign || "left"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="salutationLineHeight">Line Height</Label>
              <Input
                id="salutationLineHeight"
                type="text"
                value={component.lineHeight || "18px"}
                onChange={(e) =>
                  onUpdateComponent({ lineHeight: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "16px"}
                onChange={(e) =>
                  onUpdateComponent({ fontSize: e.target.value })
                }
                placeholder="16px"
              />
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#000000"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Font weight</Label>
              <Select
                value={component.fontWeight || "normal"}
                onValueChange={(value) =>
                  onUpdateComponent({ fontWeight: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="lighter">Lighter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="backgroundColor">Background color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label htmlFor="textAlign">Text Align</Label>
              <Select
                value={component.textAlign || "left"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lineHeight">Line Height</Label>
              <Input
                id="lineHeight"
                type="text"
                value={component.lineHeight || "18px"}
                onChange={(e) =>
                  onUpdateComponent({ lineHeight: e.target.value })
                }
              />
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
                onClick={() => setIsHtmlEditorOpen(true)}
              >
                <Code className="w-4 h-4" />
                Edit as HTML
              </Button>
            </div>
            {/* New: Link editor fields if links exist */}
            {Links.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-sm">Edit Links</h4>
                {Links.map((link, index) => (
                  <div key={index} className="space-y-2">
                    <div>
                      <Label>Link Text</Label>
                      <Input
                        value={link.text}
                        onChange={(e) =>
                          updateLink(index, link.href, e.target.value, link.color)
                        }
                      />
                    </div>
                    <div>
                      <Label>Link URL</Label>
                      <Input
                        value={link.href}
                        onChange={(e) =>
                          updateLink(index, e.target.value, link.text, link.color)
                        }
                      />
                    </div>
                    <div>
                      <Label>Link Color</Label>
                      <ColorInput value={link.color} onChange={(v) => updateLink(index, link.href, link.text, v)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <ImageUpload
                currentImage={component.src}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ src: imageUrl })
                }
              />
            </div>
            <div>
              <Label htmlFor="align">Image Alignment</Label>
              <Select
                value={component.textAlign || "center"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={component.alt || ""}
                onChange={(e) => onUpdateComponent({ alt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                value={component.width || "100%"}
                onChange={(e) => onUpdateComponent({ width: e.target.value })}
                placeholder="100% or 400px"
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={component.height || "100px"}
                onChange={(e) => onUpdateComponent({ height: e.target.value })}
                placeholder="100% or 400px"
              />
            </div>
            <div>
              <Label htmlFor="maxWidth">Max Width</Label>
              <Input
                id="maxWidth"
                value={component.maxWidth || "100%"}
                onChange={(e) => onUpdateComponent({ maxWidth: e.target.value })}
                placeholder="100%"
              />
            </div>
          </div>
        );

      case "button":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Button Text</Label>
              <Input
                id="text"
                value={component.text || ""}
                onChange={(e) => onUpdateComponent({ text: e.target.value })}
                placeholder="Click Me"
              />
            </div>
            <div>
              <Label htmlFor="href">Link URL</Label>
              <Input
                id="href"
                value={component.href || ""}
                onChange={(e) => onUpdateComponent({ href: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="linkTitle">Link Title (HTML title attribute)</Label>
              <Input
                id="linkTitle"
                value={component.linkTitle || ""}
                onChange={(e) => onUpdateComponent({ linkTitle: e.target.value })}
                placeholder="Tooltip text on hover"
              />
            </div>
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <ColorInput value={component.backgroundColor || "#007bff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#ffffff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label htmlFor="borderRadius">Border Radius</Label>
              <Input
                id="borderRadius"
                value={component.borderRadius || "4px"}
                onChange={(e) =>
                  onUpdateComponent({ borderRadius: e.target.value })
                }
                placeholder="4px"
              />
            </div>
          </div>
        );

      case "divider":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={component.height || "1px"}
                onChange={(e) => onUpdateComponent({ height: e.target.value })}
                placeholder="1px"
              />
            </div>
            <div>
              <Label htmlFor="backgroundColor">Color</Label>
              <ColorInput value={component.backgroundColor || "#e0e0e0"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
          </div>
        );

      case "cta-button":
        return (
          <div className="space-y-4">
            <div>
               <ImageUpload
                currentImage={component.imageSrc}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ imageSrc: imageUrl })
                }
              />
            </div>
            <div>
              <Label htmlFor="imageAlt">Image Alt Text</Label>
              <Input
                id="imageAlt"
                value={component.imageAlt || ""}
                onChange={(e) =>
                  onUpdateComponent({ imageAlt: e.target.value })
                }
                placeholder="Image description"
              />
            </div>
            <div>
              <Label htmlFor="href">Link URL</Label>
              <Input
                id="href"
                value={component.href || ""}
                onChange={(e) => onUpdateComponent({ href: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="linkTitle">Link Title (HTML title attribute)</Label>
              <Input
                id="linkTitle"
                value={component.linkTitle || ""}
                onChange={(e) => onUpdateComponent({ linkTitle: e.target.value })}
                placeholder="Tooltip text on hover"
              />
            </div>
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                value={component.width || "100%"}
                onChange={(e) => onUpdateComponent({ width: e.target.value })}
                placeholder="100% or 400px"
              />
            </div>
            </div>
        );
        
      case "footer-links":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="textAlign">Text Align</Label>
              <Select
                value={component.textAlign || "left"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "14px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="14px"
              />  
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#007bff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            
            
            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="flex  flex-col border-2 rounded-md p-1 gap-2 mb-2">
                  <Label>Link text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link url</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link title</Label>
                  <Input
                    value={link.title || ""}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: e.target.value } : l
                        ),
                      })
                    }
                    placeholder='title="…" tooltip on hover'
                  />
                </div>
              ))}
              
            </div>  

           </div>
        );   
        case "footer-link-2":  
        return (
          <div className="space-y-2">
            <h1 className="font-bold">Logo 1 </h1>
            <div>
              <h1 className="font-semibold">image </h1>
              <ImageUpload
                currentImage={component.logoA.imgSrc}
                onImageUpload={(imageUrl) => {
                  component.logoA.imgSrc = imageUrl;
                  onUpdateComponent(component.logoA);
                }}
              />
            </div>
            <div>
                <Label >alt text</Label>
            <Input
              value={component.logoA.altTex}
              onChange={(e) => {
                component.logoA.altTex = e.target.value;
                onUpdateComponent(component.logoA);
              }}
              placeholder="alt-text"
            />
            </div>
            <div>
               <Label>Link</Label>
            <Input
              value={component.logoA.altTex}
              onChange={(e) => {
                component.logoA.altTex = e.target.value;
                onUpdateComponent(component.logoA);
              }}
              placeholder="Link URL"
            />
            </div>
           

            <h1 className="font-bold">Logo 2 </h1>
            <div>
              <ImageUpload
                currentImage={component.logoB.imgSrc}
                onImageUpload={(imageUrl) => {
                  component.logoB.imgSrc = imageUrl;
                  onUpdateComponent(component.logoB);
                }}
              />
            </div>
             <div>
                <Label >alt text</Label>
            <Input
              value={component.logoB.altTex}
              onChange={(e) => {
                component.logoB.altTex = e.target.value;
                onUpdateComponent(component.logoB);
              }}
              placeholder="alt-text"
            />
            </div>
            <div>
               <Label>Link</Label>
            <Input
              value={component.logoB.altTex}
              onChange={(e) => {
                component.logoB.altTex = e.target.value;
                onUpdateComponent(component.logoB);
              }}
              placeholder="Link URL"
            />
            </div>
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "14px"}
                onChange={(e) =>
                  onUpdateComponent({ fontSize: e.target.value })
                }
                placeholder="14px"
              />
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#007bff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>

            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div
                  key={index}
                  className="flex  flex-col border-2 rounded-md p-1 gap-2 mb-2"
                >
                  <Label>Link text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link url</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link title</Label>
                  <Input
                    value={link.title || ""}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: e.target.value } : l
                        ),
                      })
                    }
                    placeholder='title="…" tooltip on hover'
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "footer-links(3)":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="textAlign">Text Align</Label>
              <Select
                value={component.textAlign || "left"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "14px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="14px"
              />  
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#007bff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            
            
            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="flex  flex-col border-2 rounded-md p-1 gap-2 mb-2">
                  <Label>Link text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link url</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link title</Label>
                  <Input
                    value={link.title || ""}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: e.target.value } : l
                        ),
                      })
                    }
                    placeholder='title="…" tooltip on hover'
                  />
                </div>
              ))}
              
            </div>  

           </div>
        );   
      case "footer-link-2":  
        return (
          <div className="space-y-2">
            <h1 className="font-bold">Logo 1 </h1>
            <div>
              <h1 className="font-semibold">image </h1>
              <ImageUpload
                currentImage={component.logoA.imgSrc}
                onImageUpload={(imageUrl) => {
                  component.logoA.imgSrc = imageUrl;
                  onUpdateComponent(component.logoA);
                }}
              />
            </div>
            <div>
                <Label >alt text</Label>
            <Input
              value={component.logoA.altTex}
              onChange={(e) => {
                component.logoA.altTex = e.target.value;
                onUpdateComponent(component.logoA);
              }}
              placeholder="alt-text"
            />
            </div>
            <div>
               <Label>Link</Label>
            <Input
              value={component.logoA.altTex}
              onChange={(e) => {
                component.logoA.altTex = e.target.value;
                onUpdateComponent(component.logoA);
              }}
              placeholder="Link URL"
            />
            </div>
           

            <h1 className="font-bold">Logo 2 </h1>
            <div>
              <ImageUpload
                currentImage={component.logoB.imgSrc}
                onImageUpload={(imageUrl) => {
                  component.logoB.imgSrc = imageUrl;
                  onUpdateComponent(component.logoB);
                }}
              />
            </div>
             <div>
                <Label >alt text</Label>
            <Input
              value={component.logoB.altTex}
              onChange={(e) => {
                component.logoB.altTex = e.target.value;
                onUpdateComponent(component.logoB);
              }}
              placeholder="alt-text"
            />
            </div>
            <div>
               <Label>Link</Label>
            <Input
              value={component.logoB.altTex}
              onChange={(e) => {
                component.logoB.altTex = e.target.value;
                onUpdateComponent(component.logoB);
              }}
              placeholder="Link URL"
            />
            </div>
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "14px"}
                onChange={(e) =>
                  onUpdateComponent({ fontSize: e.target.value })
                }
                placeholder="14px"
              />
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#007bff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>

            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div
                  key={index}
                  className="flex  flex-col border-2 rounded-md p-1 gap-2 mb-2"
                >
                  <Label>Link text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link url</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link title</Label>
                  <Input
                    value={link.title || ""}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: e.target.value } : l
                        ),
                      })
                    }
                    placeholder='title="…" tooltip on hover'
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "bullet-list":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulletColor">Disc Color</Label>
              <ColorInput value={component.markerColor || "#000000"} onChange={(v) => onUpdateComponent({ markerColor: v })} />
            </div>
            <div>
              <Label htmlFor="discSize">Disc Size</Label>
              <Input
                id="discSize"
                value={component.discSize || "16px"}
                onChange={(e) =>
                  onUpdateComponent({ discSize: e.target.value })
                }
                placeholder="16px"
              />
            </div>
            <div>
              <Label htmlFor="spaceBetweenItems">Space Between Items</Label>
              <Input
                id="spaceBetweenItems"
                value={component.spaceBetweenItems || "8px"}
                onChange={(e) =>
                  onUpdateComponent({ spaceBetweenItems: e.target.value })
                }
                placeholder="8px"
              />
            </div>
            <div>
              <Label htmlFor="text-color">Text Color</Label>
              <ColorInput value={component.color || "#000000"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "16px"}
                onChange={(e) =>
                  onUpdateComponent({ fontSize: e.target.value })
                }
                placeholder="16px"
              />
            </div>
            <div>
              <Label htmlFor="backgroundColor">Background color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label htmlFor="lineHeight">Line Height</Label>
              <Input
                id="lineHeight"
                type="text"
                value={component.lineHeight || "18px"}
                onChange={(e) =>
                  onUpdateComponent({ lineHeight: e.target.value })
                }
              />
            </div>
          </div>
        )
      case "header-image":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <ImageUpload
                currentImage={component.src}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ src: imageUrl })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={component.imageAlt || ""}
                onChange={(e) => onUpdateComponent({ imageAlt: e.target.value })}
                placeholder="Image alt text"
              />
            </div>

            <div className="border-t pt-4">
              <Label htmlFor="preheader">Preheader Text</Label>
              <Input
                id="preheader"
                value={preheaderText || ""}
                onChange={(e) => setPreheader(e.target.value)}
                placeholder="Enter preheader text..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Visible in email clients after the subject line.
              </p>
            </div>
          </div>
        );
      case "chevron-divider":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <ImageUpload
                currentImage={component.src}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ src: imageUrl })
                }
              />
            </div>
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={component.imageAlt || ""}
                onChange={(e) => onUpdateComponent({ imageAlt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            </div>);
      case "custom-text":
        return (
          <div className="space-y-4">
            <div>
              <Label className="font-semibold text-sm">Custom Text Options</Label>
              <p className="text-xs text-gray-500 mb-2">Each option becomes one choice in the <code className="bg-gray-100 px-1 rounded">{"{{customText[…]}}"}</code> Veeva token. The rep picks one at send time.</p>
              {(component.customTextOptions || []).map((opt: string, index: number) => (
                <div key={index} className="flex gap-1 mb-2 items-start">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">Option {index + 1}</Label>
                    <textarea
                      className="w-full border rounded px-2 py-1 text-sm resize-y min-h-[56px]"
                      value={opt}
                      onChange={(e) => {
                        const updated = [...(component.customTextOptions || [])];
                        updated[index] = e.target.value;
                        onUpdateComponent({ customTextOptions: updated });
                      }}
                    />
                  </div>
                  {(component.customTextOptions?.length ?? 0) > 1 && (
                    <button
                      className="mt-5 text-red-400 hover:text-red-600 text-xs px-1"
                      onClick={() => {
                        const updated = (component.customTextOptions || []).filter((_: string, i: number) => i !== index);
                        onUpdateComponent({ customTextOptions: updated });
                      }}
                    >✕</button>
                  )}
                </div>
              ))}
              <button
                className="mt-1 w-full border border-dashed rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
                onClick={() => onUpdateComponent({ customTextOptions: [...(component.customTextOptions || []), "New option"] })}
              >
                + Add option
              </button>
            </div>
            <div>
              <Label>Font Size</Label>
              <Input value={component.fontSize || "12px"} onChange={(e) => onUpdateComponent({ fontSize: e.target.value })} placeholder="12px" />
            </div>
            <div>
              <Label>Line Height</Label>
              <Input value={component.lineHeight || "14px"} onChange={(e) => onUpdateComponent({ lineHeight: e.target.value })} placeholder="14px" />
            </div>
            <div>
              <Label>Font Family</Label>
              <Input value={component.fontFamily || "Arial, sans-serif"} onChange={(e) => onUpdateComponent({ fontFamily: e.target.value })} placeholder="Arial, sans-serif" />
            </div>
            <div>
              <Label>Font Weight</Label>
              <Select value={component.fontWeight || "normal"} onValueChange={(v) => onUpdateComponent({ fontWeight: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="lighter">Lighter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Text Color</Label>
              <ColorInput value={component.color || "#5D5D5D"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Background Color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label>Text Align</Label>
              <Select value={component.textAlign || "left"} onValueChange={(v) => onUpdateComponent({ textAlign: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Padding</Label>
              <Input value={component.padding || "0 20px 10px 20px"} onChange={(e) => onUpdateComponent({ padding: e.target.value })} placeholder="0 20px 10px 20px" />
            </div>
          </div>
        );

      case "footer-tokens":
        return (
          <div className="space-y-4">
            <div>
              <Label>Regards</Label>
              <Input
                value={component.footerTokens?.regards || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, regards: e.target.value },
                  })
                }
                placeholder="Regards,"
              />
            </div>
            <div>
              <Label>User Name</Label>
              <Input
                value={component.footerTokens?.userName || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, userName: e.target.value },
                  })
                }
                placeholder="{{userName}}"
              />
            </div>
            <div>
              <Label>User Email</Label>
              <Input
                value={component.footerTokens?.userEmailAddress || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, userEmailAddress: e.target.value },
                  })
                }
                placeholder="{{userEmailAddress}}"
              />
            </div>
            <div>
              <Label>User Phone</Label>
              <Input
                value={component.footerTokens?.userPhone || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, userPhone: e.target.value },
                  })
                }
                placeholder="{{User.Phone}}"
              />
            </div>
            <div>
              <Label>User Photo</Label>
              <Input
                value={component.footerTokens?.userPhoto || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, userPhoto: e.target.value },
                  })
                }
                placeholder="{{userPhoto}}"
              />
            </div>
            <div>
              <Label>Company</Label>
              <RichTextEditor
                value={component.footerTokens?.company || ""}
                onChange={(content) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, company: content },
                  })
                }
                style={{ minHeight: "60px" }}
              />
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Styling</h4>
              <div className="space-y-3">
                <div>
                  <Label>Font Size</Label>
                  <Input
                    value={component.fontSize || "16px"}
                    onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                    placeholder="16px"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <ColorInput
                    value={component.color || "#000000"}
                    onChange={(v) => onUpdateComponent({ color: v })}
                  />
                </div>
                <div>
                  <Label>Text Align</Label>
                  <Select
                    value={component.textAlign || "left"}
                    onValueChange={(value) => onUpdateComponent({ textAlign: value as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Weight</Label>
                  <Select
                    value={component.fontWeight || "normal"}
                    onValueChange={(value) => onUpdateComponent({ fontWeight: value as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Line Height</Label>
                  <Input
                    value={component.lineHeight || "18px"}
                    onChange={(e) => onUpdateComponent({ lineHeight: e.target.value })}
                    placeholder="18px"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "orsedu-footer":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <ImageUpload
                currentImage={component.src}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ src: imageUrl })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={component.imageAlt || ""}
                onChange={(e) => onUpdateComponent({ imageAlt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            </div>);
            
      case "elzonris-view-in-browser":
        return (
          <div className="space-y-4">
            <div>
              <Label>Link URL</Label>
              <Input value={component.href || "#"} onChange={(e) => onUpdateComponent({ href: e.target.value })} placeholder="#" />
            </div>
            <div>
              <Label>Link Title</Label>
              <Input value={component.linkTitle || ""} onChange={(e) => onUpdateComponent({ linkTitle: e.target.value })} placeholder='title="…" tooltip on hover' />
            </div>
            <div>
              <Label>Link Color</Label>
              <ColorInput value={component.color || "#2360d9"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Text Align</Label>
              <Select
                value={component.textAlign || "center"}
                onValueChange={(value) => onUpdateComponent({ textAlign: value as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Font Size</Label>
              <Input value={component.fontSize || "12px"} onChange={(e) => onUpdateComponent({ fontSize: e.target.value })} placeholder="12px" />
            </div>
            <div>
              <Label>Line Height</Label>
              <Input value={component.lineHeight || "16px"} onChange={(e) => onUpdateComponent({ lineHeight: e.target.value })} placeholder="16px" />
            </div>
            <div>
              <Label>Padding (top/bottom sides)</Label>
              <Input value={component.padding || "10px 20px"} onChange={(e) => onUpdateComponent({ padding: e.target.value })} placeholder="10px 20px" />
            </div>
          </div>
        );

      case "elzonris-pi":
        return (
          <div className="space-y-4">
            <div>
              <Label>Font Size</Label>
              <Input value={component.fontSize || "12px"} onChange={(e) => onUpdateComponent({ fontSize: e.target.value })} placeholder="12px" />
            </div>
            <div>
              <Label>Text Color</Label>
              <ColorInput value={component.color || "#000000"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Link Color</Label>
              <ColorInput value={component.linkColor || "#009877"} onChange={(v) => onUpdateComponent({ linkColor: v })} />
            </div>
            <div className="border rounded-md p-3 space-y-2">
              <h4 className="font-semibold text-sm">Prescribing Information Link</h4>
              <Label className="text-xs text-gray-500">URL</Label>
              <Input value={component.piHref || ""} onChange={(e) => onUpdateComponent({ piHref: e.target.value })} placeholder="http://pi.elzonris.com/" />
              <Label className="text-xs text-gray-500">Title</Label>
              <Input value={component.piTitle || ""} onChange={(e) => onUpdateComponent({ piTitle: e.target.value })} placeholder='title="…" tooltip on hover' />
            </div>
            <div className="border rounded-md p-3 space-y-2">
              <h4 className="font-semibold text-sm">ISI Link (here)</h4>
              <Label className="text-xs text-gray-500">URL</Label>
              <Input value={component.isiHref || ""} onChange={(e) => onUpdateComponent({ isiHref: e.target.value })} placeholder="https://www.elzonris.com/hcp/#isi" />
              <Label className="text-xs text-gray-500">Title</Label>
              <Input value={component.isiTitle || ""} onChange={(e) => onUpdateComponent({ isiTitle: e.target.value })} placeholder='title="…" tooltip on hover' />
            </div>
          </div>
        );

      case "elzonris-brand-logo":
        return (
          <div className="space-y-4">
            <div className="border rounded-md p-3 space-y-3">
              <h4 className="font-semibold text-sm">Stemline Logo (Left)</h4>
              <ImageUpload
                currentImage={component.logoA?.imgSrc}
                onImageUpload={(url) => onUpdateComponent({ logoA: { ...component.logoA, imgSrc: url } })}
              />
              <div>
                <Label>Alt Text</Label>
                <Input
                  value={component.logoA?.altTex || ""}
                  onChange={(e) => onUpdateComponent({ logoA: { ...component.logoA, altTex: e.target.value } })}
                  placeholder="Alt text"
                />
              </div>
              <div>
                <Label>Link URL</Label>
                <Input
                  value={component.logoA?.href || ""}
                  onChange={(e) => onUpdateComponent({ logoA: { ...component.logoA, href: e.target.value } })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="border rounded-md p-3 space-y-3">
              <h4 className="font-semibold text-sm">Elzonris Logo (Right)</h4>
              <ImageUpload
                currentImage={component.logoB?.imgSrc}
                onImageUpload={(url) => onUpdateComponent({ logoB: { ...component.logoB, imgSrc: url } })}
              />
              <div>
                <Label>Alt Text</Label>
                <Input
                  value={component.logoB?.altTex || ""}
                  onChange={(e) => onUpdateComponent({ logoB: { ...component.logoB, altTex: e.target.value } })}
                  placeholder="Alt text"
                />
              </div>
              <div>
                <Label>Link URL</Label>
                <Input
                  value={component.logoB?.href || ""}
                  onChange={(e) => onUpdateComponent({ logoB: { ...component.logoB, href: e.target.value } })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        );

      case "footer-link-3":
        return (
          <div className="space-y-4">
            <div>
              <Label>Link Color</Label>
              <ColorInput value={component.color || "#009877"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Font Size</Label>
              <Input
                value={component.fontSize || "12px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="12px"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="border rounded-md p-2 space-y-2">
                  <Label className="text-xs text-gray-500">Link {index + 1}</Label>
                  <Input
                    value={link.text}
                    onChange={(e) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, text: e.target.value } : l) })}
                    placeholder="Link text"
                  />
                  <Input
                    value={link.href}
                    onChange={(e) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, href: e.target.value } : l) })}
                    placeholder="Link URL"
                  />
                  <Input
                    value={link.title || ""}
                    onChange={(e) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, title: e.target.value } : l) })}
                    placeholder="Link title (HTML title attribute)"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "email-footer":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "12px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="12px"
              />
            </div>
            <div>
              <Label htmlFor="color">Link Color</Label>
              <ColorInput value={component.color || "#0563C1"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label htmlFor="padding">Padding</Label>
              <Input
                id="padding"
                value={component.padding || "10px 20px"}
                onChange={(e) => onUpdateComponent({ padding: e.target.value })}
                placeholder="10px 20px"
              />
            </div>
            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="flex flex-col border-2 rounded-md p-1 gap-2 mb-2">
                  <Label>Link {index + 1} text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link {index + 1} URL</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link {index + 1} Title</Label>
                  <Input
                    value={link.title || ""}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="HTML title attribute (tooltip)"
                  />
                </div>
              ))}
            </div>
          </div>
        );

          case "footer-with-Preferences" :
                 return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="textAlign">Text Align</Label>
              <Select
                value={component.textAlign || "left"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "12px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="12px"
              />  
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#007bff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            
            
            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="flex  flex-col border-2 rounded-md p-1 gap-2 mb-2">
                  <Label>Link text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link url</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link title</Label>
                  <Input
                    value={link.title || ""}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: e.target.value } : l
                        ),
                      })
                    }
                    placeholder='title="…" tooltip on hover'
                  />
                </div>
              ))}
              
            </div>  

           </div>
        );   
        case "elzonris-divider" :
          return (
            <div className="space-y-4">
              <div>
                <Label>Divider Line Image</Label>
                <p className="text-xs text-gray-500 mb-1">Upload the footer-line.png image. The URL will be used in both the canvas preview and the exported HTML.</p>
                <ImageUpload
                  currentImage={component.src}
                  onImageUpload={(imageUrl) => onUpdateComponent({ src: imageUrl })}
                />
              </div>
              <div>
                <Label>font size</Label>
                <Input
                  id="fontSize"
                  value={component.fontSize || "14px"}
                  onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                  placeholder="14px"
                />
              </div>
              <div>
                <Label htmlFor="color">Text Color</Label>
                <ColorInput value={component.color || "#646464"} onChange={(v) => onUpdateComponent({ color: v })} />
              </div>
              <div>
                <Label>Link</Label>
                <Input
                  value={component.href}
                  onChange={(e) => onUpdateComponent({ href: e.target.value })}
                  placeholder="Link URL"
                />
              </div>
              <div>
                <Label>Link Title</Label>
                <Input
                  value={component.linkTitle || ""}
                  onChange={(e) => onUpdateComponent({ linkTitle: e.target.value })}
                  placeholder='title="…" tooltip on hover'
                />
              </div>
             </div>
            );

      case "image-with-link":
             return (
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <ImageUpload
                currentImage={component.src}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ src: imageUrl })
                }
              />
            </div>
            <div>
              <Label htmlFor="align">Image Alignment</Label>
              <Select
                value={component.textAlign || "center"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={component.alt || ""}
                onChange={(e) => onUpdateComponent({ alt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                value={component.width || "100%"}
                onChange={(e) => onUpdateComponent({ width: e.target.value })}
                placeholder="100% or 400px"
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={component.height || "100px"}
                onChange={(e) => onUpdateComponent({ height: e.target.value })}
                placeholder="100% or 400px"
              />
            </div>
            <div>
              <Label htmlFor="maxWidth">Max Width</Label>
              <Input
                id="maxWidth"
                value={component.maxWidth || "100%"}
                onChange={(e) => onUpdateComponent({ maxWidth: e.target.value })}
                placeholder="100%"
              />
            </div>
             <div>
              <Label >Link</Label>
              <Input
                
                value={component.href }
                onChange={(e) => onUpdateComponent({ href: e.target.value })}
                placeholder="add link url here"
              />
            </div>
          </div>
        );
        case "ferring-footer":
          return (
            <div className="space-y-4">
              <div>
                <Label>Social Media Links</Label>
                <div className="flex flex-col gap-3 mt-2 border p-3 rounded-md">
                  {component.socialMediaLinks?.map((link, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                       <Input
                      value={link.altText}
                      />
                      <Input
                        value={link.href}
                        onChange={(e) =>
                          onUpdateComponent({ socialMediaLinks: component.socialMediaLinks?.map((l, i) =>
                            i === index ? { ...l, href: e.target.value } : l
                          )})
                        }
                        placeholder="Social media URL"
                      />
                      </div>
                     ))}
                </div>
              </div>
              <div>
                <Label >Footer links</Label>
                <div className="flex flex-col gap-3 mt-2 border p-3 rounded-md">
                  {component.links?.map((link, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                       <Input
                      value={link.text}
                      onChange={(e)=> onUpdateComponent({
                        links: component.links?.map((l, i) => i === index ? { ...l, text: e.target.value } : l
                        ),
                      })}
                      />
                      <Input
                        value={link.href}
                        onChange={(e) =>
                          onUpdateComponent({ links: component.links?.map((l, i) =>
                            i === index ? { ...l, href: e.target.value } : l
                          )})
                        }
                        placeholder="Footer link URL"
                      />
                      </div>
                     ))}
                </div>
              </div>
            </div>
          )
          case "tryvio-footer":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Footer Logo</Label>
                  <ImageUpload
                    currentImage={component.tryvioFooterLogoSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ tryvioFooterLogoSrc: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.tryvioFooterLogoAlt || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterLogoAlt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={component.tryvioFooterLogoHref || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterLogoHref: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>LinkedIn Icon</Label>
                  <ImageUpload
                    currentImage={component.tryvioFooterLinkedinSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ tryvioFooterLinkedinSrc: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.tryvioFooterLinkedinAlt || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterLinkedinAlt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={component.tryvioFooterLinkedinHref || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterLinkedinHref: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Idorsia Logo</Label>
                  <ImageUpload
                    currentImage={component.tryvioFooterIdorsiaLogoSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ tryvioFooterIdorsiaLogoSrc: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.tryvioFooterIdorsiaLogoAlt || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterIdorsiaLogoAlt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={component.tryvioFooterIdorsiaLogoHref || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterIdorsiaLogoHref: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Job Code</Label>
                  <Input
                    value={component.tryvioFooterJobCode || ""}
                    onChange={(e) => onUpdateComponent({ tryvioFooterJobCode: e.target.value })}
                    placeholder="US-AP-00162 04/26"
                  />
                </div>
              </div>
            );
          case "orserdu-footer":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Footer Logo</Label>
                  <ImageUpload
                    currentImage={component.src}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ src: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.alt || ""}
                      onChange={(e) => onUpdateComponent({ alt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Font Size</Label>
                    <Input
                      value={component.fontSize || "12px"}
                      onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                      placeholder="12px"
                    />
                  </div>
                </div>
                <div>
                  <Label>Footer Text - Reg</Label>
                  <Input
                    value={component.footerText?.reg || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, reg: e.target.value } })}
                    placeholder="ORSERDU is a registered trademark..."
                  />
                </div>
                <div>
                  <Label>Footer Text - Year</Label>
                  <Input
                    value={component.footerText?.year || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, year: e.target.value } })}
                    placeholder="© 2026 Stemline..."
                  />
                </div>
                <div>
                  <Label>Footer Text - Address</Label>
                  <Input
                    value={component.footerText?.address || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, address: e.target.value } })}
                    placeholder="750 Lexington Avenue..."
                  />
                </div>
                <div>
                  <Label>Footer Text - Rights</Label>
                  <Input
                    value={component.footerText?.rights || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, rights: e.target.value } })}
                    placeholder="All rights reserved."
                  />
                </div>
                <div>
                  <Label>Job Code</Label>
                  <Input
                    value={component.footerText?.jobcode || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, jobcode: e.target.value } })}
                    placeholder="0X/2X MAT-US-ELA-00XXX"
                  />
                </div>
              </div>
            );
          case "orserdu-emerald-stats":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Emerald Icon</Label>
                  <ImageUpload
                    currentImage={component.emeraldLeftIconSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ emeraldLeftIconSrc: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.emeraldLeftIconAlt || ""}
                      onChange={(e) => onUpdateComponent({ emeraldLeftIconAlt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                </div>
                <div>
                  <Label>Left Heading</Label>
                  <Input
                    value={component.emeraldLeftHeading || ""}
                    onChange={(e) => onUpdateComponent({ emeraldLeftHeading: e.target.value })}
                    placeholder="Primary endpoint in EMERALD"
                  />
                </div>
                <div>
                  <Label>Left Stat</Label>
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={3}
                    value={component.emeraldLeftStat || ""}
                    onChange={(e) => onUpdateComponent({ emeraldLeftStat: e.target.value })}
                    placeholder="Left stat content (HTML supported)"
                  />
                </div>
                <div>
                  <Label>Left HR</Label>
                  <Input
                    value={component.emeraldLeftHR || ""}
                    onChange={(e) => onUpdateComponent({ emeraldLeftHR: e.target.value })}
                    placeholder="HR=0.55..."
                  />
                </div>
                <div>
                  <Label>Right Stat Number</Label>
                  <Input
                    value={component.emeraldRightStatNumber || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightStatNumber: e.target.value })}
                    placeholder="8.6"
                  />
                </div>
                <div>
                  <Label>Right Stat Label (use \n for line breaks)</Label>
                  <Input
                    value={component.emeraldRightStatLabel || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightStatLabel: e.target.value })}
                    placeholder="months\nmPFS"
                  />
                </div>
                <div>
                  <Label>Right Description</Label>
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={3}
                    value={component.emeraldRightDesc || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightDesc: e.target.value })}
                    placeholder="Right description"
                  />
                </div>
                <div>
                  <Label>Right Stat</Label>
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={2}
                    value={component.emeraldRightStat || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightStat: e.target.value })}
                    placeholder="Right stat text"
                  />
                </div>
                <div>
                  <Label>Right HR</Label>
                  <Input
                    value={component.emeraldRightHR || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightHR: e.target.value })}
                    placeholder="HR=0.41..."
                  />
                </div>
              </div>
            );
          case "ferring-footer":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Footer Logo</Label>
                  <ImageUpload
                    currentImage={component.logo?.logoSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ logo: { ...component.logo, logoSrc: imageUrl } })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.logo?.altText || ""}
                      onChange={(e) => onUpdateComponent({ logo: { ...component.logo, altText: e.target.value } })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={component.logo?.href || ""}
                      onChange={(e) => onUpdateComponent({ logo: { ...component.logo, href: e.target.value } })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Social Media Links</Label>
                  <div className="flex flex-col gap-3 mt-2 border p-3 rounded-md">
                    {component.socialMediaLinks?.map((link, index) => (
                      <div key={index} className="flex flex-col items-center gap-2">
                        <ImageUpload
                          currentImage={link.iconSrc}
                          onImageUpload={(imageUrl) =>
                            onUpdateComponent({ socialMediaLinks: component.socialMediaLinks?.map((l, i) =>
                              i === index ? { ...l, iconSrc: imageUrl } : l
                            )})
                          }
                        />
                        <Input
                          value={link.href}
                          onChange={(e) =>
                            onUpdateComponent({ socialMediaLinks: component.socialMediaLinks?.map((l, i) =>
                              i === index ? { ...l, href: e.target.value } : l
                            )})
                          }
                          placeholder="Social media URL"
                        />
                        <Input
                          value={link.altText}
                          onChange={(e) =>
                            onUpdateComponent({ socialMediaLinks: component.socialMediaLinks?.map((l, i) =>
                              i === index ? { ...l, altText: e.target.value } : l
                            )})
                          }
                          placeholder="Alt text"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Footer Links</Label>
                  <div className="flex flex-col gap-3 mt-2 border p-3 rounded-md">
                    {component.links?.map((link, index) => (
                      <div key={index} className="flex flex-col items-center gap-2">
<Input
                          value={link.text}
                          onChange={(e) => onUpdateComponent({
                            links: component.links?.map((l, i) => i === index ? { ...l, text: e.target.value } : l)
                          })}
                        />
                        <Input
                          value={link.href}
                          onChange={(e) =>
                            onUpdateComponent({ links: component.links?.map((l, i) =>
                              i === index ? { ...l, href: e.target.value } : l
                            )})
                          }
                          placeholder="Footer link URL"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Job Code</Label>
                  <Input
                    value={component.jobCode || ""}
                    onChange={(e) => onUpdateComponent({ jobCode: e.target.value })}
                    placeholder="02/26 GL-RMMH-2600016"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={component.address || ""}
                    onChange={(e) => onUpdateComponent({ address: e.target.value })}
                    placeholder="[countries to add appropriate address]"
                  />
                </div>
              </div>
            );
          case "raw-html":
            return (
              <div className="flex items-center justify-center">
                <Button className="w-full" variant={"outline"} onClick={() => setIsRawHtmlEditorOpen(true)}><Code/>Add or Edit HTML</Button>
              </div>
            )
          case "elzonris-isi":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={component.fontFamily || "Arial, sans-serif"}
                    onValueChange={(value) => onUpdateComponent({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                      <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                      <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                      <SelectItem value="'Courier New', Courier, monospace">Courier New</SelectItem>
                      <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                      <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-center">
                  <Button className="w-full" variant={"outline"} onClick={() => setIsRawHtmlEditorOpen(true)}><Code/>Edit Elzonris ISI</Button>
                </div>
              </div>
            )
      case "elzonris-references":
      case "elzonris-abbreviations":
      case "elzonris-ref-abbr":
        return (
          <div className="space-y-3">
            <div>
              <Label>Font Size</Label>
              <Input
                value={component.fontSize || "12px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="12px"
              />
            </div>
            <div>
              <Label>Line Height</Label>
              <Input
                value={component.lineHeight || "14px"}
                onChange={(e) => onUpdateComponent({ lineHeight: e.target.value })}
                placeholder="14px"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={component.color?.startsWith("#") ? component.color : "#646464"}
                  onChange={(e) => onUpdateComponent({ color: e.target.value })}
                  className="w-10 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={component.color || "#646464"}
                  onChange={(e) => onUpdateComponent({ color: e.target.value })}
                  placeholder="#646464"
                />
              </div>
            </div>
            <div>
              <Label>Font Weight</Label>
              <Select
                value={component.fontWeight || "normal"}
                onValueChange={(v) => onUpdateComponent({ fontWeight: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="lighter">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Padding</Label>
              <Input
                value={component.padding || "0 20px 10px 20px"}
                onChange={(e) => onUpdateComponent({ padding: e.target.value })}
                placeholder="0 20px 10px 20px"
              />
            </div>
          </div>
        );

      default:
        return <div>No properties available</div>;
    }
  };

  return (
    <div className="eb-props space-y-5">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg ring-1",
            isColumn
              ? "bg-green-50 text-green-600 ring-green-100"
              : "bg-blue-50 text-blue-600 ring-blue-100",
          )}
        >
          {isColumn ? <Layers className="h-4 w-4" /> : <Box className="h-4 w-4" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {isColumn
              ? "Column"
              : (component.type?.charAt(0).toUpperCase() ?? "") +
                component.type?.slice(1)}
          </h3>
          <p className="text-xs text-gray-400">Properties</p>
        </div>
      </div>

      {component.type === "section" && (
        <div
          className={cn(
            "rounded-xl border p-3",
            isColumn ? "border-green-100 bg-green-50/70" : "border-blue-100 bg-blue-50/70",
          )}
        >
          <div
            className={cn(
              "mb-1 text-sm font-medium",
              isColumn ? "text-green-800" : "text-blue-800",
            )}
          >
            {isColumn ? (
              <>Column Container</>
            ) : (
              <>
                {component.columns
                  ? `${component.columns} Column Section`
                  : "Section Container"}
                {component.isHero && " (Hero Template)"}
              </>
            )}
          </div>
          <div
            className={cn(
              "eb-info-chip",
              isColumn ? "text-green-600" : "text-blue-600",
            )}
          >
            {isColumn ? (
              <>
                Individual column with {component.children?.length || 0}{" "}
                component(s). Customize alignment, background, and layout.
              </>
            ) : (
              <>
                Contains {component.children?.length || 0} component(s).
                {component.columns &&
                  component.columns > 1 &&
                  " Each column can hold multiple components."}
                {component.isHero &&
                  " Pre-configured hero section with text and button."}
              </>
            )}
          </div>
        </div>
      )}

      {renderProperties()}

      {/* Common Properties */}
      <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Spacing
        </h4>
        <div>
          <Label htmlFor="padding">Padding</Label>
          <PaddingInput
            value={component.padding || "0 20px 10px 20px"}
            onChange={(value) => onUpdateComponent({ padding: value })}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Responsive
        </h4>
        <div>
          <Label htmlFor="diplayType">Display on</Label>
          <Select
            value={component.displayType || "all"}
            onValueChange={(value) =>
              onUpdateComponent({ displayType: value as "all" | "mobile-only" | "desktop-only" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="desktop-only">Desktop Only</SelectItem>
              <SelectItem value="mobile-only">Mobile Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="flex items-start gap-1.5 text-xs text-amber-600">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Responsiveness is only visible in Preview
        </p>
      </div>

      {/* Save to Saved Blocks */}
      {onSaveAsCustom && (
        <div className="pt-1">
          <Button
            variant="outline"
            onClick={() => {
              setBlockName(component.name || "");
              setIsSaveBlockOpen(true);
            }}
            className="w-full bg-white hover:bg-gray-50"
          >
            <BookmarkPlus className="h-4 w-4 text-blue-600" />
            Save to Saved Blocks
          </Button>
        </div>
      )}
      {/* text html editor modal */}
      <HtmlEditorModal
        isOpen={isHtmlEditorOpen}
        onClose={() => setIsHtmlEditorOpen(false)}
        initialValue={component.content || ""}
        onSave={(newHtml) => onUpdateComponent({ content: newHtml })}
      />
      {/* raw  */}
      <HtmlEditorModal
        isOpen={isRawHtmlEditorOpen}
        onClose={() => setIsRawHtmlEditorOpen(false)}
        initialValue={component.html || ""}
        onSave={saveRawHtml}
        onSaveBlock={saveRawHtmlBlock}
      />

      {/* Save to Saved Blocks dialog */}
      <Dialog open={isSaveBlockOpen} onOpenChange={setIsSaveBlockOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Saved Blocks</DialogTitle>
            <DialogDescription>
              Name this block so you can recognize it in the left menu.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="blockName">Block Name</Label>
            <Input
              id="blockName"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              placeholder="e.g. Hero section with button"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveBlockOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBlock} disabled={!blockName.trim()}>
              Save Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
