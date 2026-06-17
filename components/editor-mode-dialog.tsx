"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList, Grid, Column } from "lucide-react";

type EditorModeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMode: (mode: "single" | "three") => void;
};

export function EditorModeDialog({ open, onOpenChange, onSelectMode }: EditorModeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[min(96vw,720px)]">
        <DialogHeader>
          <DialogTitle>Choose how to build your email</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 mt-6">
          <button
            type="button"
            onClick={() => onSelectMode("single")}
            className="group rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <LayoutList className="w-5 h-5 text-slate-700" />
                Standard Emailer
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Build one email template with the normal canvas experience.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectMode("three")}
            className="group rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <LayoutGrid className="w-5 h-5 text-slate-700" />
                Three Canvas Editor
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Open three synchronized canvases side-by-side for a multi-view editing experience.
            </p>
          </button>
        </div>

        <DialogFooter className="mt-6 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continue without selecting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
