"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type NumberUnit = "px" | "%" | "rem" | "em" | "" ;   // "" = unitless

interface PropertyNumberInputProps {
  value: string;                       // e.g. "14px", "1.5", "120%"
  onChange: (value: string) => void;   // committed value with unit
  min?: number;
  max?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function parseValue(raw: string): { num: number; unit: NumberUnit } {
  const s = (raw || "").trim();
  const m = s.match(/^(-?[\d.]+)(px|%|rem|em)?$/i);
  if (!m) return { num: 0, unit: "px" };
  const num = parseFloat(m[1]);
  const unit = ((m[2] || "").toLowerCase() as NumberUnit) || "";
  return { num, unit };
}

function formatValue(num: number, unit: NumberUnit): string {
  const rounded = Math.round(num * 1000) / 1000; // avoid float noise
  return unit ? `${rounded}${unit}` : `${rounded}`;
}

function getSteps(unit: NumberUnit): { small: number; large: number } {
  if (unit === "%") return { small: 1, large: 10 };
  if (unit === "")   return { small: 0.1, large: 1 };   // unitless (line-height, opacity)
  return { small: 1, large: 10 };                        // px, rem, em
}

// ── Component ─────────────────────────────────────────────────────────────

export function PropertyNumberInput({
  value,
  onChange,
  min,
  max,
  label,
  className,
  disabled = false,
}: PropertyNumberInputProps) {
  const { num, unit } = parseValue(value);
  const [local, setLocal] = useState(formatValue(num, unit));
  const isDirtyRef = useRef(false);

  // Sync when value changes from outside (undo/redo, version restore)
  useEffect(() => {
    if (!isDirtyRef.current) {
      const { num: n, unit: u } = parseValue(value);
      setLocal(formatValue(n, u));
    }
  }, [value]);

  const commit = (raw: string) => {
    isDirtyRef.current = false;
    const { num: n, unit: u } = parseValue(raw);
    const clamped = clamp(n, min, max);
    const committed = formatValue(clamped, u || unit);
    setLocal(committed);
    onChange(committed);
  };

  const clamp = (n: number, lo?: number, hi?: number) => {
    let v = n;
    if (lo !== undefined) v = Math.max(lo, v);
    if (hi !== undefined) v = Math.min(hi, v);
    return v;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault(); // prevent cursor movement / browser scroll

    const { num: current, unit: u } = parseValue(local);
    const { small, large } = getSteps(u || unit);
    const step = e.shiftKey ? large : small;
    const delta = e.key === "ArrowUp" ? step : -step;
    const next = clamp(current + delta, min, max);
    const formatted = formatValue(next, u || unit);
    setLocal(formatted);
    isDirtyRef.current = false;
    onChange(formatted);
  };

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 select-none">
          {label}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={local}
        disabled={disabled}
        onChange={(e) => {
          isDirtyRef.current = true;
          setLocal(e.target.value);
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(e) => e.currentTarget.select()}
        className={cn(
          "h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-center font-mono text-xs",
          "focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors"
        )}
      />
    </div>
  );
}

export default PropertyNumberInput;
