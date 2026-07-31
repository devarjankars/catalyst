"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmailComponent } from "@/types/email-builder";
import { generateEmailHTML } from "@/lib/email-generator";
import { Monitor, Smartphone, Upload, Sun, Moon } from "lucide-react";
import { useEmailBuilderStore } from "@/store/email-builder-store";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EmailPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: EmailComponent[];
};

const DARK_CSS = `
  body { background-color: #1e1e1e !important; }
  table, td, div, p, span { background-color: #2c2c2c !important; color: #e8e8e8 !important; }
  [bgcolor="#ffffff"],[bgcolor="#FFFFFF"],[bgcolor="#eeeeee"],[bgcolor="#EEEEEE"],[bgcolor="#f4f4f4"],[bgcolor="#F4F4F4"],[bgcolor="#f1f1f1"] { background-color: #2c2c2c !important; }
  a { color: #8ab4f8 !important; }
  img { filter: brightness(0.85); }
`;

function buildHtml(components: EmailComponent[], preheaderText: string | undefined, dark: boolean): string {
  const base = generateEmailHTML(components, preheaderText);
  if (!dark) return base;
  return base.replace("</head>", `<style>${DARK_CSS}</style></head>`);
}

export default function EmailPreviewModal({ open, onOpenChange, components }: EmailPreviewModalProps) {
  const [screen, setScreen] = useState<"600px" | "375px">("600px");
  const [dark, setDark] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<"1" | "2" | "3">("1");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { currentTemplate, preheaderText, optionMode, option2Components, option3Components } = useEmailBuilderStore();
  const isThreeMode = optionMode === "three";

  const getActiveComponents = () => {
    if (!isThreeMode) return components;
    if (activeTab === "2") return option2Components;
    if (activeTab === "3") return option3Components;
    return components;
  };

  const writeHtml = (html: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  };

  // Write on open
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      writeHtml(buildHtml(getActiveComponents(), preheaderText, dark));
    }, 30);
    return () => clearTimeout(timer);
  }, [open, activeTab]);

  // Write on mode or component change
  useEffect(() => {
    if (!open) return;
    writeHtml(buildHtml(getActiveComponents(), preheaderText, dark));
  }, [dark, components, option2Components, option3Components, preheaderText, activeTab]);

  const handleClose = () => {
    onOpenChange(false);
    setScreen("600px");
    setDark(false);
  };

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    try {
      const viewMode = screen === "600px" ? "desktop" : "mobile";
      const width = screen === "600px" ? 600 : 375;
      const fileName = currentTemplate?.name
        ? `${currentTemplate.name}-${viewMode}`
        : `email-preview-${viewMode}`;

      const fullHtml = buildHtml(getActiveComponents(), preheaderText, dark);

      // Use a hidden iframe at 0,0 — NOT left:-9999px
      // html2canvas coordinates are relative to the iframe document origin,
      // so the iframe must be at a predictable on-screen position
      const printFrame = document.createElement("iframe");
      printFrame.style.cssText = [
        `position:fixed`,
        `top:0`,
        `left:0`,
        `width:${width}px`,
        `height:1px`,           // minimal height — grows with content
        `border:0`,
        `opacity:0`,            // invisible but not visibility:hidden (avoids layout issues)
        `pointer-events:none`,
        `z-index:-1`,
      ].join(";");
      document.body.appendChild(printFrame);

      const printDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (!printDoc) throw new Error("Print frame not accessible");

      printDoc.open();
      printDoc.write(fullHtml);
      printDoc.close();

      // Constrain the root element and body to exact width — prevents overflow
      printDoc.documentElement.style.cssText = `width:${width}px !important; max-width:${width}px !important; overflow:hidden !important;`;
      printDoc.body.style.cssText = `width:${width}px !important; max-width:${width}px !important; overflow:hidden !important; margin:0 !important; padding:0 !important;`;

      // Wait for images
      await new Promise<void>((resolve) => {
        const images = Array.from(printDoc.images);
        if (images.length === 0) { resolve(); return; }
        let loaded = 0;
        const done = () => { loaded++; if (loaded >= images.length) resolve(); };
        images.forEach((img) => { if (img.complete) done(); else { img.onload = done; img.onerror = done; } });
        setTimeout(resolve, 4000);
      });

      // Let the browser finish any reflow after style changes
      await new Promise(r => setTimeout(r, 100));

      const html2pdf = (await import("html2pdf.js")).default;
      const bodyHeight = Math.max(printDoc.body.scrollHeight, printDoc.documentElement.scrollHeight);

      await html2pdf()
        .set({
          margin: 0,
          filename: `${fileName}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            width,
            windowWidth: width,
            height: bodyHeight,
            windowHeight: bodyHeight,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            // Override the source element's bounding rect to prevent clipping
            onclone: (clonedDoc: Document) => {
              clonedDoc.documentElement.style.cssText = `width:${width}px !important; max-width:${width}px !important; overflow:hidden !important;`;
              clonedDoc.body.style.cssText = `width:${width}px !important; max-width:${width}px !important; overflow:hidden !important; margin:0 !important; padding:0 !important;`;
            },
          },
          jsPDF: {
            unit: "px",
            format: [width, bodyHeight],
            orientation: "portrait",
            hotfixes: ["px_scaling"],
          },
        })
        .from(printDoc.body)
        .save();

      document.body.removeChild(printFrame);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col p-0 min-w-[90%]">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between w-full pr-8">
            <DialogTitle className="text-lg">Email Preview</DialogTitle>
            <div className="flex items-center gap-3">

              {/* Device toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setScreen("600px")}
                  title="Desktop"
                  className={`p-1.5 rounded-md transition-all ${screen === "600px" ? "bg-white shadow text-gray-900" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setScreen("375px")}
                  title="Mobile"
                  className={`p-1.5 rounded-md transition-all ${screen === "375px" ? "bg-white shadow text-gray-900" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>

              {/* Light / Dark toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setDark(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!dark ? "bg-white shadow text-gray-900" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <Sun className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDark(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${dark ? "bg-[#1e1e1e] shadow text-white" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
              </div>

              <Button variant="default" onClick={handlePDFExport} disabled={isExportingPDF}>
                <Upload className={`h-4 w-4 mr-1.5 ${isExportingPDF ? "animate-pulse" : ""}`} />
                {isExportingPDF ? "Exporting..." : "Export PDF"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isThreeMode && (
          <div className="w-full flex justify-center border-b bg-gray-50 p-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="1">Option 1</TabsTrigger>
                <TabsTrigger value="2">Option 2</TabsTrigger>
                <TabsTrigger value="3">Option 3</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className={`w-full flex-1 flex items-start justify-center overflow-auto p-6 ${dark ? "bg-[#1e1e1e]" : "bg-gray-100"}`}>
          <iframe
            ref={iframeRef}
            title="Email Preview"
            style={{
              width: screen,
              minHeight: "600px",
              border: dark ? "1px solid #444" : "1px solid #e5e7eb",
              borderRadius: "4px",
              display: "block",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}