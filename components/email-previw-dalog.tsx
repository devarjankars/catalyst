"use client";

import React, { useState, useMemo, use } from "react";
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
import { Monitor, Smartphone } from "lucide-react";
import EmailPreview from "./email-preview-frame";

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

  useMemo(() => {
    // Generate HTML content based on the current components and their properties
    const emailHtml = generateEmailHTML(components);
    setHtmlContent(emailHtml);
  }, [components]);

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
                autoFocus={screen === "600px"}
                size="icon"
                className="focus:bg-black focus:text-white"
                onClick={() => setScreen("600px")}
              >
                <Monitor />
              </Button>
              <Button
                variant="outline"
                autoFocus={screen === "375px"}
                size="icon"
                className="focus:bg-black focus:text-white"
                onClick={() => setScreen("375px")}
              >
                <Smartphone />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="w-full h-full flex-1 flex items-center justify-center border-t">
          <EmailPreview html={htmlContent} width={screen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
