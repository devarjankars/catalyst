"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmailComponent } from "@/types/email-builder";
import { generateEmailHTML } from "@/lib/email-generator";
import { Monitor, Smartphone, Upload, Sun, Moon, Loader2 } from "lucide-react";
import { useEmailBuilderStore } from "@/store/email-builder-store";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EmailPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: EmailComponent[];
  sourceHtmlByOption?: Partial<Record<1 | 2 | 3, string>>;
};

const DARK_CSS = `
  body { background-color: #1e1e1e !important; }
  table, td, div, p, span { background-color: #2c2c2c !important; color: #e8e8e8 !important; }
  [bgcolor="#ffffff"],[bgcolor="#FFFFFF"],[bgcolor="#eeeeee"],[bgcolor="#EEEEEE"],[bgcolor="#f4f4f4"],[bgcolor="#F4F4F4"],[bgcolor="#f1f1f1"] { background-color: #2c2c2c !important; }
  a { color: #8ab4f8 !important; }
  img { filter: brightness(0.85); }
`;

const MOBILE_CSS = `
  .deskDisp { display: none !important; }
  .mbDisp   { display: table !important; }
  .desk-show-table { display: none !important; }
  .desk-show-cell  { display: none !important; }
  .desk-show-tr    { display: none !important; }
  .mbl-show-table  { display: table !important; }
  .mbl-show-cell   { display: table-cell !important; }
  .mbl-show-tr     { display: table-row !important; }
  .stack-column    { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; border-right: none !important; }
`;

function buildHtml(
  components: EmailComponent[],
  preheaderText: string | undefined,
  dark: boolean,
  mobile = false,
  sourceHtml?: string,
): string {
  const base = sourceHtml || generateEmailHTML(components, preheaderText);
  // Inject a <base href> so relative /public-folder image paths resolve
  // correctly inside the sandboxed preview iframe.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseTag = origin ? `<base href="${origin}/">` : '';
  let result = base.replace('<head>', `<head>${baseTag}`);
  if (mobile) result = result.replace("</head>", `<style>${MOBILE_CSS}</style></head>`);
  if (dark)   result = result.replace("</head>", `<style>${DARK_CSS}</style></head>`);
  return result;
}

export default function EmailPreviewModal({ open, onOpenChange, components, sourceHtmlByOption }: EmailPreviewModalProps) {
  const [screen, setScreen] = useState<"600px" | "375px">("600px");
  const [dark, setDark] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<"1" | "2" | "3">("1");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { currentTemplate, preheaderText, optionMode, option2Components, option3Components, activeOption } = useEmailBuilderStore();
  const isMultiMode = optionMode === "two" || optionMode === "three";
  const optionCount = optionMode === "three" ? 3 : optionMode === "two" ? 2 : 1;

  // When the dialog opens, snap the preview tab to whichever option
  // the editor is currently on. Manual tab changes while the dialog
  // is open are preserved — they only reset on the next open.
  const prevOpen = useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpen.current;
    prevOpen.current = open;
    if (justOpened && isMultiMode) {
      setActiveTab(String(activeOption) as "1" | "2" | "3");
    }
  }, [open, isMultiMode, activeOption]);

  const getActiveComponents = () => {
    if (activeTab === "2") return option2Components;
    if (activeTab === "3") return option3Components;
    return components;
  };

  const getActiveSourceHtml = () => {
    const option = Number(activeTab) as 1 | 2 | 3;
    return sourceHtmlByOption?.[option];
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
      writeHtml(buildHtml(getActiveComponents(), preheaderText, dark, screen === "375px", getActiveSourceHtml()));
    }, 30);
    return () => clearTimeout(timer);
  }, [open, activeTab, sourceHtmlByOption]);

  // Write on mode, screen, or component change
  useEffect(() => {
    if (!open) return;
    writeHtml(buildHtml(getActiveComponents(), preheaderText, dark, screen === "375px", getActiveSourceHtml()));
  }, [dark, screen, components, option2Components, option3Components, preheaderText, activeTab, sourceHtmlByOption]);

  const handleClose = () => {
    onOpenChange(false);
    setScreen("600px");
    setDark(false);
  };

  const handlePDFExport = async () => {
    if (!iframeRef.current) {
      alert("Preview not loaded");
      return;
    }

    setIsExportingPDF(true);
    try {
      const viewMode = screen === "600px" ? "desktop" : "mobile";
      const fileName = currentTemplate?.name || "email-preview";
      
      const { exportToPDF } = await import("@/lib/pdf-export-utils");
      await exportToPDF(iframeRef.current, fileName, viewMode);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`);
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

              {!dark && (
                <Button variant="default" onClick={handlePDFExport} disabled={isExportingPDF}>
                  {isExportingPDF
                    ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    : <Upload className="h-4 w-4 mr-1.5" />}
                  {isExportingPDF ? "Exporting..." : "Export PDF"}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {isMultiMode && (
          <div className="w-full flex justify-center border-b bg-gray-50 p-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-[400px]">
              <TabsList className={`grid w-full ${optionCount === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {Array.from({ length: optionCount }, (_, index) => (
                  <TabsTrigger key={index + 1} value={String(index + 1)}>
                    Option {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className={`relative w-full flex-1 flex items-start justify-center overflow-auto p-6 ${dark ? "bg-[#1e1e1e]" : "bg-gray-100"}`}>
          {isExportingPDF && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-gray-700 mb-3" />
              <p className="text-sm font-medium text-gray-700">Generating PDF…</p>
              <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
            </div>
          )}
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