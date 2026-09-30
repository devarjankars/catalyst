"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ChevronRight } from "lucide-react";

export type Brand = "orserdu" | "ferring" | "idorsia" | "elzonris";

export interface BrandConfig {
  id: Brand;
  label: string;
  tagline: string;
  accentColor: string;
  iconBg: string;
  iconText: string;
  symbol: string;
}

export const BRANDS: BrandConfig[] = [
  {
    id: "orserdu",
    label: "Orserdu",
    tagline: "Elacestrant · ER+/HER2− mBC",
    accentColor: "#006937",
    iconBg: "#e8f5ee",
    iconText: "#006937",
    symbol: "OR",
  },
  {
    id: "elzonris",
    label: "Elzonris",
    tagline: "Tagraxofusp · BPDCN",
    accentColor: "#009877",
    iconBg: "#e0f4ef",
    iconText: "#009877",
    symbol: "EL",
  },
  {
    id: "ferring",
    label: "Ferring",
    tagline: "Rekovelle · Firmagon",
    accentColor: "#0057a8",
    iconBg: "#e5effa",
    iconText: "#0057a8",
    symbol: "FE",
  },
  {
    id: "idorsia",
    label: "Idorsia",
    tagline: "Tryvio · Aprocitentan",
    accentColor: "#5c2d91",
    iconBg: "#f0eaf8",
    iconText: "#5c2d91",
    symbol: "ID",
  },
];

interface BrandSelectionModalProps {
  open: boolean;
  onSelect: (brand: Brand) => void;
  onOpenChange: (open: boolean) => void;
  /** Currently active client — shows checkmark + "Current client" label */
  currentBrand?: Brand;
}

export function BrandSelectionModal({
  open,
  onSelect,
  onOpenChange,
  currentBrand,
}: BrandSelectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Header */}
        <div className="px-7 pt-7 pb-3 bg-white border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 tracking-tight">
              Switch Client
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              Select a client to filter your email workspace.
            </p>
          </DialogHeader>
        </div>

        {/* Client list */}
        <div className="px-4 py-4 bg-white space-y-1.5">
          {BRANDS.map((brand) => {
            const isCurrent = brand.id === currentBrand;
            return (
              <button
                key={brand.id}
                onClick={() => onSelect(brand.id)}
                className="group w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  borderColor: isCurrent ? brand.accentColor : "#e5e7eb",
                  backgroundColor: isCurrent ? brand.iconBg : "#ffffff",
                  // @ts-ignore
                  "--ring-color": brand.accentColor,
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    (e.currentTarget as HTMLElement).style.borderColor = brand.accentColor;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${brand.accentColor}22`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                  }
                }}
                aria-pressed={isCurrent}
                aria-label={`Select ${brand.label}${isCurrent ? " (current)" : ""}`}
              >
                {/* Icon */}
                <div
                  className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold tracking-wider"
                  style={{ background: brand.iconBg, color: brand.iconText }}
                >
                  {brand.symbol}
                </div>

                {/* Label + tagline */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: isCurrent ? brand.accentColor : "#111827" }}
                  >
                    {brand.label}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{brand.tagline}</p>
                </div>

                {/* Current indicator OR arrow */}
                {isCurrent ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-medium" style={{ color: brand.accentColor }}>
                      Current
                    </span>
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: brand.accentColor }}
                    >
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  </div>
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform duration-150 group-hover:translate-x-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <div className="px-7 pb-5 pt-1 bg-white">
          <p className="text-xs text-gray-400 text-center">
            Your selection is saved in the URL and persists across refreshes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
