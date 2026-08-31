"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export type Brand = "orserdu" | "ferring" | "idorsia" | "elzonris";

export interface BrandConfig {
  id: Brand;
  label: string;
  tagline: string;
  /** Tailwind/CSS accent colour for the card */
  accentColor: string;
  /** Background for the icon pill */
  iconBg: string;
  /** Text colour for the icon */
  iconText: string;
  /** Emoji or short symbol used as icon */
  symbol: string;
}

export const BRANDS: BrandConfig[] = [
  {
    id: "orserdu",
    label: "Orserdu",
    tagline: "",
    accentColor: "#006937",
    iconBg: "#e8f5ee",
    iconText: "#006937",
    symbol: "OR",
  },
  {
    id: "elzonris",
    label: "Elzonris",
    tagline: "",
    accentColor: "#009877",
    iconBg: "#e0f4ef",
    iconText: "#009877",
    symbol: "EL",
  },
  {
    id: "ferring",
    label: "Ferring",
    tagline: "",
    accentColor: "#0057a8",
    iconBg: "#e5effa",
    iconText: "#0057a8",
    symbol: "FE",
  },
  {
    id: "idorsia",
    label: "Idorsia",
    tagline: "",
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
}

export function BrandSelectionModal({ open, onSelect, onOpenChange }: BrandSelectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Prevent closing by clicking outside or pressing Escape — user must pick a brand */}
      <DialogContent
        className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Hide the default ✕ close button
        style={{ gap: 0 }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
              Select a Client
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Brand grid */}
        <div className="px-8 pb-8 bg-white">
          <div className="grid grid-cols-2 gap-3 mt-2">
            {BRANDS.map((brand, i) => (
              <motion.button
                key={brand.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => onSelect(brand.id)}
                className="group relative flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 text-left transition-all duration-200 hover:border-transparent hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ["--accent" as any]: brand.accentColor }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = brand.accentColor;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px ${brand.accentColor}22`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
                }}
              >
                {/* Icon pill */}
                <div
                  className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold tracking-wider"
                  style={{ background: brand.iconBg, color: brand.iconText }}
                >
                  {brand.symbol}
                </div>

                {/* Label only — no tagline */}
                <p className="text-sm font-semibold text-gray-900 transition-colors duration-200 group-hover:text-[var(--accent)]">
                  {brand.label}
                </p>

                {/* Arrow */}
                <svg
                  className="ml-auto h-4 w-4 shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
