"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList, Layers, Image as ImageIcon, ArrowLeft } from "lucide-react";

type EditorModeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMode: (mode: "single" | "two" | "three", subMode?: "header-only" | "completely-different") => void;
};

export function EditorModeDialog({ open, onOpenChange, onSelectMode }: EditorModeDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // track whether we're configuring 2-option or 3-option in step 2
  const [pendingOptions, setPendingOptions] = useState<"two" | "three">("three");

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) { setStep(1); }
    onOpenChange(isOpen);
  };

  const handleSelectSingle = () => {
    onSelectMode("single");
    setStep(1);
  };

  const handleSelectSubMode = (subMode: "header-only" | "completely-different") => {
    onSelectMode(pendingOptions, subMode);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[min(96vw,720px)]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {step === 1
                ? "Choose how to build your email"
                : `Choose ${pendingOptions === "two" ? "2" : "3"}-Option Configuration`}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-3 mt-6">
            {/* Single */}
            <button
              type="button"
              onClick={handleSelectSingle}
              className="group rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-semibold">
                <LayoutList className="w-5 h-5 text-slate-700" />
                Single
              </div>
              <p className="text-sm text-slate-600">
                One email template with the standard canvas experience.
              </p>
            </button>

            {/* 2-Option */}
            <button
              type="button"
              onClick={() => { setPendingOptions("two"); setStep(2); }}
              className="group rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-semibold">
                <LayoutGrid className="w-5 h-5 text-slate-700" />
                2-Option
              </div>
              <p className="text-sm text-slate-600">
                Create 2 variations. Great for A/B testing or presenting two alternatives.
              </p>
            </button>

            {/* 3-Option */}
            <button
              type="button"
              onClick={() => { setPendingOptions("three"); setStep(2); }}
              className="group rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-semibold">
                <Layers className="w-5 h-5 text-slate-700" />
                3-Option
              </div>
              <p className="text-sm text-slate-600">
                Create 3 variations for A/B/C testing or presenting multiple options.
              </p>
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 mt-6">
            <button
              type="button"
              onClick={() => handleSelectSubMode("header-only")}
              className="group rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-semibold">
                <ImageIcon className="w-5 h-5 text-slate-700" />
                Header Only Different
              </div>
              <p className="text-sm text-slate-600">
                All options share the same email body. Only the header image differs per option.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSubMode("completely-different")}
              className="group rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-semibold">
                <Layers className="w-5 h-5 text-slate-700" />
                Completely Different
              </div>
              <p className="text-sm text-slate-600">
                Each option has its own independent email structure. Edit each freely.
              </p>
            </button>
          </div>
        )}

        {step === 1 && (
          <DialogFooter className="mt-6 justify-end">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

