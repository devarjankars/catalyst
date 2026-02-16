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
import { TriangleAlert } from "lucide-react";
import PaddingInput from "./padding -inputs";
import { useEmailBuilderStore } from "@/store/email-builder-store";

interface PropertiesPanelProps {
  component: EmailComponent | undefined;
  onUpdateComponent: (updates: Partial<EmailComponent>) => void;
  onSaveAsCustom?: () => void;
}

export function PropertiesPanel({
  component,
  onUpdateComponent,
  onSaveAsCustom,
}: PropertiesPanelProps) {
  const [Links, setLinks] = useState<{ href: string; text: string; color: string }[]>([]);
  const { preheaderText, setPreheader } = useEmailBuilderStore();
  if (!component) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-lg font-medium mb-2">No component selected</div>
        <div className="text-sm">Select a component to edit its properties</div>
      </div>
    );
  }

  const isColumn = component.type === "section" && component.isColumn;

  
  

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

  const renderProperties = () => {
    switch (component.type) {
      case "section":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={component.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  onUpdateComponent({ backgroundColor: e.target.value })
                }
              />
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
              <Input
                id="color"
                type="color"
                value={component.color || "#000000"}
                onChange={(e) => onUpdateComponent({ color: e.target.value })}
              />
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
              <Input
                id="backgroundColor"
                type="color"
                value={component.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  onUpdateComponent({ backgroundColor: e.target.value })
                }
              />
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
                      <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={link.color}
                            onChange={(e) =>
                              updateLink(index, link.href, link.text, e.target.value)
                            }
                            className="w-12 h-8 p-1 cursor-pointer"
                          />
                          <span className="text-xs text-gray-500">{link.color}</span>
                      </div>
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
              <Label htmlFor="backgroundColor">Background Color</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={component.backgroundColor || "#007bff"}
                onChange={(e) =>
                  onUpdateComponent({ backgroundColor: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <Input
                id="color"
                type="color"
                value={component.color || "#ffffff"}
                onChange={(e) => onUpdateComponent({ color: e.target.value })}
              />
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
              <Input
                id="backgroundColor"
                type="color"
                value={component.backgroundColor || "#e0e0e0"}
                onChange={(e) =>
                  onUpdateComponent({ backgroundColor: e.target.value })
                }
              />
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
              <Input
                id="color"
                type="color"
                value={component.color || "#007bff"}
                onChange={(e) => onUpdateComponent({ color: e.target.value })}
              />  
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
              <Input
                id="color"
                type="color"
                value={component.color || "#007bff"}
                onChange={(e) => onUpdateComponent({ color: e.target.value })}
              />
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
              <Input
                id="color"
                type="color"
                value={component.color || "#007bff"}
                onChange={(e) => onUpdateComponent({ color: e.target.value })}
              />  
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
              <Input
                id="color"
                type="color"
                value={component.color || "#007bff"}
                onChange={(e) => onUpdateComponent({ color: e.target.value })}
              />
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
              <Input
                id="bulletColor"
                type="color"
                value={component.markerColor || "#000000"}
                onChange={(e) =>
                  onUpdateComponent({ markerColor: e.target.value })
                }
              />
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
              <Input
                id="text-color"
                type="color"
                value={component.color || "#000000"}
                onChange={(e) => onUpdateComponent({ color: e.target.value })}
              />
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
              <Input
                id="backgroundColor"
                type="color"
                value={component.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  onUpdateComponent({ backgroundColor: e.target.value })
                }
              />
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
              <Input
                id="color"
                type="color"
                value={component.color || "#007bff"}
                onChange={(e) => onUpdateComponent({ color: e.target.value })}
              />  
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
                </div>
              ))}
              
            </div>  

           </div>
        );   
        case "elzonris-divider" :
          return (
            <div className="space-y-4">
              <div>
                <Label >Line image</Label>
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
                <Input
                  id="color"
                  type="color"
                  value={component.color || "#646464"}
                  onChange={(e) => onUpdateComponent({ color: e.target.value })}
                />
              </div>
              <div>
                <Label>Link</Label>
                <Input
                  value={component.href}
                  onChange={(e) => onUpdateComponent({ href: e.target.value })}
                  placeholder="Link URL"
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
      default:
        return <div>No properties available</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {isColumn
            ? "Column"
            : component.type.charAt(0).toUpperCase() +
              component.type.slice(1)}{" "}
          Properties
        </h3>
        
      </div>

      {component.type === "section" && (
        <div
          className={`${
            isColumn ? "bg-green-50" : "bg-blue-50"
          } p-3 rounded-lg`}
        >
          <div
            className={`text-sm ${
              isColumn ? "text-green-800" : "text-blue-800"
            } font-medium mb-1`}
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
            className={`text-xs ${
              isColumn ? "text-green-600" : "text-blue-600"
            }`}
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
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-700 mb-3">Spacing</h4>
        <div>
          <Label htmlFor="padding">Padding</Label>
          <PaddingInput
          value={component.padding || "0 20px 10px 20px"}
          onChange={(value) => onUpdateComponent({ padding: value })}
          />
        </div>
      </div>
      <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-3">Responsive</h4>
            <Label htmlFor="diplayType">Select Display type of component</Label>
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
            <p className="text-sm text-muted-foreground text-orange-500 mt-2 flex"><TriangleAlert className="w-5 h-5 mr-2"/>Responssiveness is seen only in priview</p>
      </div>
    </div>
  );
}
