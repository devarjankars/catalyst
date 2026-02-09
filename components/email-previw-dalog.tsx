"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EmailComponent } from "@/types/email-builder";
import { generateEmailHTML } from "@/lib/email-generator";
import { Monitor, Smartphone, Download, Upload } from "lucide-react";
import EmailPreview from "./email-preview-frame";
import { exportToPDF } from "@/lib/pdf-export-utils";
import { useEmailBuilderStore } from "@/store/email-builder-store";

type EmailPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: EmailComponent[];
};

export default function EmailPreviewModal({
  open,
  onOpenChange,
  components,
}: EmailPreviewModalProps) {
  
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [screen, setScreen] = useState<"600px" | "375px">("600px");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { currentTemplate, preheaderText } = useEmailBuilderStore();

  useEffect(() => {
    // Generate HTML content based on the current components and their properties
    const emailHtml = generateEmailHTML(components, preheaderText);
    setHtmlContent(emailHtml);
  }, [components, preheaderText]);
  
  const handlePDFExport = async () => {
    if (!iframeRef.current) {
      console.error("Iframe reference not available");
      return;
    }

    setIsExportingPDF(true);
    try {
      const viewMode = screen === "600px" ? "desktop" : "mobile";
      const fileName = currentTemplate?.name 
        ? `${currentTemplate.name}-${viewMode}` 
        : `email-preview-${viewMode}`;
      
      await exportToPDF(iframeRef.current, fileName, viewMode);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={()=>{
        onOpenChange(false)
        setScreen("600px");
        
        }}>
      <DialogContent className="flex flex-col  p-0 min-w-[90%]">
        <DialogHeader className="p-4 ">
          <div className="flex justify-between w-[90%]">
            <DialogTitle className="text-lg">Email Preview</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                
                size="icon"
                className={`${screen === "600px"? "bg-black text-white": ""}`}
                onClick={() => setScreen("600px")}
              >
                <Monitor />
              </Button>
              <Button
                variant="outline"
                className={`${screen === "375px"? "bg-black text-white": ""}`}
                size="icon"
                
                onClick={() => setScreen("375px")}
              >
                <Smartphone />
              </Button>
              <Button
                variant="default"
                
                onClick={handlePDFExport}
                disabled={isExportingPDF}
                title="Export current view as PDF"
              >
                <Upload className={isExportingPDF ? "animate-pulse" : ""} /> Export as PDF
              </Button> 
            </div>
          </div>
        </DialogHeader>

        <div className="w-full h-full flex-1 flex items-center justify-center border-t">
          <EmailPreview ref={iframeRef} html={htmlContent} width={screen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
