"use client";

import React, { useEffect, useState } from "react";
import { Link2, Unlink2 } from "lucide-react";
import { PropertyNumberInput } from "./property-number-input";
import { cn } from "@/lib/utils";

interface SpacingInputProps {
  value?: string;           // CSS shorthand e.g. "10px 20px 10px 20px"
  onChange: (v: string) => void;
  label?: string;
  className?: string;
}

type Sides = { top: string; right: string; bottom: string; left: string };

function parse(value: string): Sides {
  const parts = (value || "0px 0px 0px 0px").trim().split(/\s+/).filter(Boolean);
  const v = parts.length === 1 ? [parts[0], parts[0], parts[0], parts[0]]
    : parts.length === 2 ? [parts[0], parts[1], parts[0], parts[1]]
    : parts.length === 3 ? [parts[0], parts[1], parts[2], parts[1]]
    : parts.slice(0, 4);
  return { top: v[0] || "0px", right: v[1] || "0px", bottom: v[2] || "0px", left: v[3] || "0px" };
}

function serialize(s: Sides): string {
  return `${s.top} ${s.right} ${s.bottom} ${s.left}`;
}

export function SpacingInput({ value = "0px 0px 0px 0px", onChange, label, className }: SpacingInputProps) {
  const [sides, setSides] = useState<Sides>(() => parse(value));
  const [linked, setLinked] = useState(false);

  // Sync from outside
  useEffect(() => {
    setSides(parse(value));
  }, [value]);

  const update = (side: keyof Sides, v: string) => {
    const next = linked
      ? { top: v, right: v, bottom: v, left: v }
      : { ...sides, [side]: v };
    setSides(next);
    onChange(serialize(next));
  };

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          <button
            type="button"
            onClick={() => setLinked((l) => !l)}
            title={linked ? "Unlink sides" : "Link all sides"}
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
              linked
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {linked ? <Link2 className="w-3 h-3" /> : <Unlink2 className="w-3 h-3" />}
            {linked ? "Linked" : "Unlinked"}
          </button>
        </div>
      )}

      {/* Figma-style T/R/B/L grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <PropertyNumberInput
            key={side}
            value={sides[side]}
            label={side.charAt(0).toUpperCase()}
            onChange={(v) => update(side, v)}
            min={0}
          />
        ))}
      </div>
    </div>
  );
}

export default SpacingInput;
