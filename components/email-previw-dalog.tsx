"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmailComponent } from "@/types/email-builder";
import { generateEmailHTML } from "@/lib/email-generator";
import { Monitor, Smartphone, Upload, Sun, Moon } from "lucide-react";
import { useEmailBuilderStore } from "@/store/email-builder-store";
import { handlePdfAction } from "@/app/actions";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { currentTemplate, preheaderText } = useEmailBuilderStore();

  const writeHtml = (html: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // Use contentWindow.document for reliability
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
      writeHtml(buildHtml(components, preheaderText, dark));
    }, 30);
    return () => clearTimeout(timer);
  }, [open]);

  // Write on mode or component change
  useEffect(() => {
    if (!open) return;
    writeHtml(buildHtml(components, preheaderText, dark));
  }, [dark, components, preheaderText]);

  const handleClose = () => {
    onOpenChange(false);
    setScreen("600px");
    setDark(false);
  };

  const handlePDFExport = async () => {
    if (!iframeRef.current) return;
    setIsExportingPDF(true);
    try {
      const viewMode = screen === "600px" ? "desktop" : "mobile";
      const fileName = currentTemplate?.name ? `${currentTemplate.name}-${viewMode}` : `email-preview-${viewMode}`;
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (!iframeDoc) throw new Error("Iframe content inaccessible");
      const htmlString = iframeDoc.documentElement.outerHTML;
      const base64 = await handlePdfAction(htmlString, viewMode);
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
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
                  <Sun className="h-3.5 w-3.5" /> Light
                </button>
                <button
                  onClick={() => setDark(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${dark ? "bg-[#1e1e1e] shadow text-white" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <Moon className="h-3.5 w-3.5" /> Dark
                </button>
              </div>

              <Button variant="default" onClick={handlePDFExport} disabled={isExportingPDF}>
                <Upload className={`h-4 w-4 mr-1.5 ${isExportingPDF ? "animate-pulse" : ""}`} />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

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
