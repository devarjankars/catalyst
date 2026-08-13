"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookmarkPlus } from "lucide-react";

interface HtmlEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (value: string) => void;
  onSaveBlock?: (value: string, name: string) => void;
}

export function HtmlEditorModal({
  isOpen,
  onClose,
  initialValue,
  onSave,
  onSaveBlock,
}: HtmlEditorModalProps) {
  const [html, setHtml] = useState(initialValue);
  const [blockName, setBlockName] = useState("");

  useEffect(() => {
    setHtml(initialValue);
  }, [initialValue, isOpen]);

  useEffect(() => {
    if (isOpen) setBlockName("");
  }, [isOpen]);

  const handleSave = () => {
    onSave(html);
    onClose();
  };

  const handleSaveBlock = () => {
    if (onSaveBlock) {
      onSaveBlock(html, blockName.trim());
    }
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
        {onSaveBlock && (
          <div className="flex flex-col gap-2 border-t pt-3 mt-2">
            <p className="text-xs text-gray-500">
              Save this HTML as a reusable block so it appears in the Saved
              Blocks section of the left menu.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="Block name (e.g. My banner block)"
              />
              <Button
                variant="outline"
                onClick={handleSaveBlock}
                disabled={!html.trim() || !blockName.trim()}
                className="flex items-center gap-2 shrink-0"
              >
                <BookmarkPlus className="w-4 h-4" />
                Save as Block
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
