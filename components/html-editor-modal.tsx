"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface HtmlEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (value: string) => void;
}

export function HtmlEditorModal({
  isOpen,
  onClose,
  initialValue,
  onSave,
}: HtmlEditorModalProps) {
  const [html, setHtml] = useState(initialValue);

  useEffect(() => {
    setHtml(initialValue);
  }, [initialValue, isOpen]);

  const handleSave = () => {
    onSave(html);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit HTML Content</DialogTitle>
        </DialogHeader>
        <div className="flex-1 py-4 overflow-hidden">
          <Textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="w-full h-[50vh] font-mono text-sm resize-none text-white bg-black"
            placeholder="Enter HTML code here..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
