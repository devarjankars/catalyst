"use client";

import { DEFAULT_ORSERDU_REPORT_LINK_COLOR } from "@/lib/orserdu-report-links";
import { DEFAULT_DIVIDER_COLOR } from "@/lib/email-divider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmailComponent } from "@/types/email-builder";
import { BuilderToolbarContext } from "./builder-toolbar-context";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./image-upload";
import React, { useContext, useEffect, useState, useCallback } from "react";
import { getOrserduFooterLinkColor, DEFAULT_CUSTOM_TEXT_COLOR, DEFAULT_CUSTOM_TEXT_LINE_HEIGHT, DEFAULT_CUSTOM_TEXT_FONT_SIZE, TEXT_COLOR_PRESETS } from "@/lib/email-text-style";
import { TEXT_FONT_FAMILIES } from "@/lib/email-fonts";
import { useClient } from "@/lib/use-client";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft, ArrowRight, AlignLeft, AlignCenter, AlignRight, TriangleAlert, Code, BookmarkPlus, Box, MonitorSmartphone, Move, MousePointerClick, Layers, Plus, Trash2 } from "lucide-react";
import PaddingInput from "./padding -inputs";
import { useEmailBuilderStore } from "@/store/email-builder-store";
import { HtmlEditorModal } from "./html-editor-modal";
import { RichTextEditor } from "./rich-text-editor";
import { removeTextParagraphSpacing } from "@/lib/text-paragraph-spacing";
import { verifyHtml } from "@/lib/verify-html";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { getOrserduImageTextContent } from "@/lib/orserdu-image-text";
import { getOrserduIsiOuterPadding, getOrserduIsiPadding } from "@/lib/orserdu-isi-padding";
import {
  GERON_MEDICATION_GUIDE_URL,
  GERON_PRESCRIBING_INFORMATION_URL,
} from "@/data/geron-isi-html";
import {
  GERON_FOOTER_COPYRIGHT,
  GERON_FOOTER_JOB_CODE,
  GERON_LOGO_HREF,
  GERON_RYTELO_LOGO_HREF,
} from "@/data/geron-footer-html";
import { normalizeColumnSize } from "@/lib/column-width";
import { getSectionColumns, resizeSectionColumns } from "@/lib/section-columns";
import { getEmailComponentPadding } from "@/lib/email-padding";

// ── Shared CSS-size helpers ────────────────────────────────────────────────
// Used by FontSizeInput and per-link font-size inputs throughout this file.
// Reuse these instead of duplicating validation logic.

/** Normalise a raw user input to a valid CSS size string.
 *  "10" → "10px", "1rem" → "1rem", "14px" → "14px", "" → "" */
export function normalizeCssSize(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  // If it's a plain positive number, append px
  if (/^\d+(\.\d+)?$/.test(t)) return `${t}px`;
  return t;
}

/** Returns true for valid CSS size values (px, rem, em, %, pt) with positive value. */
export function isValidCssSize(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  // Reject dangerous characters
  if (/[;{}]/.test(t)) return false;
  // Positive number-only (will be normalised to px)
  if (/^\d+(\.\d+)?$/.test(t)) {
    const n = parseFloat(t);
    return n > 0;
  }
  // px / pt / rem / em / %
  const m = t.match(/^(\d+(\.\d+)?)(px|pt|rem|em|%)$/i);
  if (!m) return false;
  return parseFloat(m[1]) > 0;
}

// ── FontSizeInput ──────────────────────────────────────────────────────────
// Pure custom text input — no dropdown.  The user types any valid CSS size.
// "10" is normalised to "10px" on blur/Enter.
// Invalid values show an inline message and are not committed.
function ColumnSizeInput({ id, label, value, width = false, onChange }: {
  id: string;
  label: string;
  value?: string;
  width?: boolean;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  return (
    <div className="min-w-0 space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={draft ?? value ?? ""} placeholder={width ? "Auto" : "px"}
        aria-invalid={invalid}
        onChange={event => { setDraft(event.target.value); setInvalid(false); }}
        onBlur={event => {
          const raw = event.currentTarget.value.trim();
          const next = normalizeColumnSize(raw, width);
          if (raw && !next && !(width && raw.toLowerCase() === "auto")) {
            setInvalid(true);
            return;
          }
          setDraft(null);
          if (next !== (value ?? "")) onChange(next);
        }}
        onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }} />
      {invalid && <p role="alert" className="text-xs text-red-600">{width ? "Enter pixels, a percentage up to 100%, or auto." : "Enter a value in pixels."}</p>}
    </div>
  );
}

function PropertyNumberInput({
  id, value, max, onCommit,
}: {
  id?: string;
  value: number;
  max?: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Input id={id} type="number" min={0} max={max} step={1}
      value={draft ?? String(value)}
      onChange={event => setDraft(event.target.value)}
      onKeyDown={event => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      onBlur={event => {
        const next = event.currentTarget.valueAsNumber;
        setDraft(null);
        if (!Number.isFinite(next)) return;
        const clamped = Math.max(0, Math.min(max ?? Infinity, next));
        if (clamped !== value) onCommit(clamped);
      }}
    />
  );
}

function FontSizeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const [error, setError] = useState("");

  // Keep local state in sync when the prop changes from outside
  useEffect(() => { setLocal(value); }, [value]);

  const commit = (raw: string) => {
    const normalised = normalizeCssSize(raw);
    if (!normalised || !isValidCssSize(normalised)) {
      setError("Enter a valid size e.g. 10px, 1rem, 120%");
      return;
    }
    setError("");
    setLocal(normalised);
    onChange(normalised);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
      if (e.key === "Enter") { e.preventDefault(); commit(local); }
      return;
    }
    e.preventDefault();
    const m = local.trim().match(/^(-?[\d.]+)(px|pt|rem|em|%)?$/i);
    if (!m) return;
    const num = parseFloat(m[1]);
    const unit = m[2] || "px";
    const step = e.shiftKey ? 10 : 1;
    const next = Math.max(0, num + (e.key === "ArrowUp" ? step : -step));
    const formatted = `${next}${unit}`;
    setLocal(formatted);
    setError("");
    onChange(formatted);
  };

  return (
    <div className="space-y-1">
      <Input
        value={local}
        className="font-mono text-xs"
        placeholder="e.g. 10px"
        onChange={(e) => { setLocal(e.target.value); setError(""); }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── CtaWidthInput ──────────────────────────────────────────────────────────
// Commit-on-blur so the CTA image doesn't glitch on every keystroke.
// Accepts px values ("470", "470px") or percentages ("100%").
function CtaWidthInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  const commit = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    // plain number → keep as-is (table width attribute doesn't need px)
    onChange(t);
  };
  return (
    <Input
      value={local}
      className="font-mono text-xs"
      placeholder="470 or 100%"
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(local); } }}
    />
  );
}

// ── DeferredInput ──────────────────────────────────────────────────────────
// Like CtaWidthInput but generic — commits only on blur or Enter.
// While the user is typing the local value doesn't propagate, so clearing
// the field mid-edit no longer causes the canvas to glitch back to the
// fallback value on every keystroke.
function DeferredInput({
  id,
  value,
  fallback,
  placeholder,
  onCommit,
}: {
  id?: string;
  value: string;
  fallback: string;
  placeholder?: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  // Keep in sync when the store value changes from outside (e.g. undo/redo)
  useEffect(() => { setLocal(value); }, [value]);
  const commit = (raw: string) => {
    const trimmed = raw.trim();
    // Commit whatever the user typed; fall back only when truly empty
    onCommit(trimmed || fallback);
  };
  return (
    <Input
      id={id}
      className="font-mono text-xs"
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}

function DeferredTextInput({
  id,
  value,
  placeholder,
  onCommit,
}: {
  id?: string;
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);

  return (
    <Input
      id={id}
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}

// ── LineHeightInput ────────────────────────────────────────────────────────
// Plain free-type input — accepts any CSS size value (e.g. "14px", "1.5", "normal").
// Replaces the old dropdown+custom combo with a single keyboard-friendly field.
function LineHeightInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value || "14px");
  const [error, setError] = useState("");

  useEffect(() => { setLocal(value || "14px"); }, [value]);

  const commit = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    // Accept plain numbers → append px; accept "normal", "initial", etc.
    const normalised = /^\d+(\.\d+)?$/.test(t) ? `${t}px` : t;
    setError("");
    setLocal(normalised);
    onChange(normalised);
  };

  return (
    <div className="space-y-1">
      <Input
        value={local}
        className="font-mono text-xs"
        placeholder="e.g. 14px"
        onChange={(e) => { setLocal(e.target.value); setError(""); }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(local); return; }
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          const m = local.trim().match(/^(-?[\d.]+)(px|pt|rem|em|%)?$/i);
          if (!m) return;
          const num = parseFloat(m[1]);
          const unit = m[2] || "px";
          const step = e.shiftKey ? 10 : 1;
          const next = Math.max(0, num + (e.key === "ArrowUp" ? step : -step));
          const formatted = `${next}${unit}`;
          setLocal(formatted);
          setError("");
          onChange(formatted);
        }}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dedicated sub-component for ORSERDU ISI Select properties.
// Uses fully LOCAL state so every keystroke is instant — the store is only
// updated when the user leaves a field (onBlur) or presses Enter.
// ─────────────────────────────────────────────────────────────────────────────
interface BulletItem {
  boldText: string;
  normalText: string;
  paddingTop?: string;
  paddingBottom?: string;
  markerColor?: string;
}

function OrserduIsiSelectPanel({
  component,
  onUpdateComponent,
}: {
  component: any;
  onUpdateComponent: (updates: any, immediate?: boolean) => void;
}) {
  // ── Local state mirrors the component props ──────────────────────────────
  const [heading,         setHeading]         = useState<string>(component.heading         ?? "SELECT IMPORTANT SAFETY INFORMATION");
  const [headingColor,    setHeadingColor]    = useState<string>(component.headingColor    ?? "#006937");
  const [headingFontSize, setHeadingFontSize] = useState<string>(component.headingFontSize ?? "16px");
  const [headingPadding,  setHeadingPadding]  = useState<string>(getOrserduIsiPadding(component.headingPadding));
  const [bulletItems,     setBulletItems]     = useState<BulletItem[]>(component.bulletItems ?? []);
  const [bulletColor,     setBulletColor]     = useState<string>(component.bulletColor     ?? "#69d6b5");
  const [textColor,       setTextColor]       = useState<string>(component.textColor       ?? "#000000");
  const [fontSize,        setFontSize]        = useState<string>(component.fontSize        ?? "14px");
  const [lineHeight,      setLineHeight]      = useState<string>(component.lineHeight      ?? "16px");
  const [spaceBetweenBullets, setSpaceBetweenBullets] = useState<string>(component.spaceBetweenBullets ?? "5");
  const [bulletTextGap, setBulletTextGap] = useState<string>(component.bulletTextGap ?? "4");
  const [backgroundColor, setBackgroundColor] = useState<string>(component.backgroundColor ?? "#ffffff");
  const [footerLine,      setFooterLine]      = useState<string>(component.footerLine      ?? "");
  const [footerPadding,   setFooterPadding]   = useState<string>(getOrserduIsiPadding(component.footerPadding));
  const [showFooter,      setShowFooter]      = useState<boolean>(!!(component.footerLine));

  // Sync if component id changes (different component selected)
  useEffect(() => {
    setHeading(component.heading         ?? "SELECT IMPORTANT SAFETY INFORMATION");
    setHeadingColor(component.headingColor    ?? "#006937");
    setHeadingFontSize(component.headingFontSize ?? "16px");
    setHeadingPadding(getOrserduIsiPadding(component.headingPadding));
    setBulletItems(component.bulletItems   ?? []);
    setBulletColor(component.bulletColor    ?? "#69d6b5");
    setTextColor(component.textColor       ?? "#000000");
    setFontSize(component.fontSize        ?? "14px");
    setLineHeight(component.lineHeight      ?? "16px");
    setSpaceBetweenBullets(component.spaceBetweenBullets ?? "5");
    setBulletTextGap(component.bulletTextGap ?? "4");
    setBackgroundColor(component.backgroundColor ?? "#ffffff");
    setFooterLine(component.footerLine      ?? "");
    setFooterPadding(getOrserduIsiPadding(component.footerPadding));
    setShowFooter(!!(component.footerLine));
  }, [component.id]);

  // ── Commit helpers — only write to store on blur/enter ───────────────────
  const commit = useCallback(
    (updates: any) => onUpdateComponent(updates, true),
    [onUpdateComponent],
  );

  const updateBullet = (index: number, field: keyof BulletItem, value: string) => {
    const updated = bulletItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setBulletItems(updated);
  };

  const commitBullets = () => commit({ bulletItems });

  const removeBullet = (index: number) => {
    const updated = bulletItems.filter((_, i) => i !== index);
    setBulletItems(updated);
    commit({ bulletItems: updated });
  };

  const addBullet = () => {
    const updated = [...bulletItems, { boldText: "", normalText: "" }];
    setBulletItems(updated);
    commit({ bulletItems: updated });
  };

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div className="border rounded-lg p-3 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Heading</p>
        <div>
          <Label>Heading Text</Label>
          <Input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            onBlur={() => commit({ heading })}
            onKeyDown={(e) => e.key === "Enter" && commit({ heading })}
          />
        </div>
        <div>
          <Label>Heading Color</Label>
          <ColorInput value={headingColor} onChange={(v) => { setHeadingColor(v); commit({ headingColor: v }); }} />
        </div>
        <div>
          <Label>Heading Font Size</Label>
          <Input
            value={headingFontSize}
            onChange={(e) => setHeadingFontSize(e.target.value)}
            onBlur={() => commit({ headingFontSize })}
            placeholder="16px"
          />
        </div>
        <div>
          <Label>Heading Padding <span className="text-gray-400 font-normal">(top right bottom left)</span></Label>
          <PaddingInput
            value={headingPadding}
            onChange={(v) => { setHeadingPadding(v); commit({ headingPadding: v }); }}
          />
          <p className="text-[10px] text-gray-400 mt-1">Bottom value = gap between heading and bullet list.</p>
        </div>
      </div>

      {/* Bullet items */}
      <div className="border rounded-lg p-3 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bullet Items</p>
        <div>
          <Label>Bullet-to-text gap (px)</Label>
          <Input
            type="number"
            min={0}
            max={40}
            value={bulletTextGap}
            onChange={(e) => setBulletTextGap(e.target.value)}
            onBlur={() => commit({ bulletTextGap })}
            onKeyDown={(e) => e.key === "Enter" && commit({ bulletTextGap })}
            placeholder="6"
          />
          <p className="text-[10px] text-gray-400 mt-1">Adjusts only the space after each bullet; default: 4px.</p>
        </div>
        <div>
          <Label>Default Bullet Color</Label>
          <ColorInput value={bulletColor} onChange={(v) => { setBulletColor(v); commit({ bulletColor: v }); }} />
        </div>
        <div>
          <Label>Text Color</Label>
          <ColorInput value={textColor} onChange={(v) => { setTextColor(v); commit({ textColor: v }); }} />
        </div>
        <div>
          <Label>Font Size</Label>
          <Input
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            onBlur={() => commit({ fontSize })}
            placeholder="14px"
          />
        </div>
        <div>
          <Label>Line Height</Label>
          <LineHeightInput
            value={lineHeight}
            onChange={(value) => {
              setLineHeight(value);
              commit({ lineHeight: value });
            }}
          />
        </div>
        <div>
          <Label>Background Color</Label>
          <ColorInput value={backgroundColor} onChange={(v) => { setBackgroundColor(v); commit({ backgroundColor: v }); }} />
        </div>
        <div>
          <Label>Space Between Bullets (px)</Label>
          <Input
            type="number"
            min={0}
            value={spaceBetweenBullets}
            onChange={(e) => setSpaceBetweenBullets(e.target.value)}
            onBlur={() => commit({ spaceBetweenBullets })}
            onKeyDown={(e) => {
              if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
              e.preventDefault();
              const cur = parseInt(spaceBetweenBullets, 10) || 0;
              const step = e.shiftKey ? 5 : 1;
              const next = Math.max(0, cur + (e.key === "ArrowUp" ? step : -step));
              setSpaceBetweenBullets(String(next));
              commit({ spaceBetweenBullets: String(next) });
            }}
            placeholder="5"
          />
          <p className="text-[10px] text-gray-400 mt-1">Gap between each bullet row. ↑↓ keys to adjust. Default: 5px.</p>
        </div>

        {/* Per-bullet editing */}
        {bulletItems.map((item, i) => (
          <div key={i} className="border rounded-md p-3 space-y-2 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-600">Bullet {i + 1}</p>
              <Button
                type="button" size="sm" variant="ghost"
                className="h-6 px-2 text-xs text-red-500 hover:bg-red-50"
                onClick={() => removeBullet(i)}
              >Remove</Button>
            </div>
            <div>
              <Label className="text-xs">Bullet Color</Label>
              <ColorInput value={item.markerColor || bulletColor} onChange={(markerColor) => {
                const updated = bulletItems.map((bullet, index) =>
                  index === i ? { ...bullet, markerColor } : bullet
                );
                setBulletItems(updated);
                commit({ bulletItems: updated });
              }} />
              {item.markerColor && (
                <Button type="button" size="sm" variant="ghost" onClick={() => {
                  const updated = bulletItems.map((bullet, index) =>
                    index === i ? { ...bullet, markerColor: "" } : bullet
                  );
                  setBulletItems(updated);
                  commit({ bulletItems: updated });
                }}>Use default bullet color</Button>
              )}
            </div>
            <div>
              <Label className="text-xs">Bold text</Label>
              <Input
                value={item.boldText ?? ""}
                onChange={(e) => updateBullet(i, "boldText", e.target.value)}
                onBlur={commitBullets}
                onKeyDown={(e) => e.key === "Enter" && commitBullets()}
                placeholder="Bold portion of text"
              />
            </div>
            <div>
              <Label className="text-xs">Normal text (supports &lt;b&gt; &lt;i&gt; &lt;sup&gt; &lt;a&gt;)</Label>
              <textarea
                className="w-full min-h-[80px] text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                value={item.normalText ?? ""}
                onChange={(e) => updateBullet(i, "normalText", e.target.value)}
                onBlur={commitBullets}
                placeholder=" rest of the bullet text"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Space above (px)</Label>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={item.paddingTop ?? "0"}
                  onChange={(e) => updateBullet(i, "paddingTop", e.target.value)}
                  onBlur={commitBullets}
                />
              </div>
              <div>
                <Label className="text-xs">Space below (px)</Label>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={item.paddingBottom ?? "0"}
                  onChange={(e) => updateBullet(i, "paddingBottom", e.target.value)}
                  onBlur={commitBullets}
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button" size="sm" variant="outline" className="w-full text-xs"
          onClick={addBullet}
        >+ Add Bullet</Button>
      </div>

      {/* Footer line — toggleable */}
      <div className="border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Footer Line</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-gray-500">{showFooter ? "Enabled" : "Disabled"}</span>
            <div
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showFooter ? "bg-green-500" : "bg-gray-300"}`}
              onClick={() => {
                const next = !showFooter;
                setShowFooter(next);
                if (!next) { setFooterLine(""); commit({ footerLine: "" }); }
              }}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${showFooter ? "translate-x-[18px]" : "translate-x-1"}`} />
            </div>
          </label>
        </div>
        {showFooter && (
          <div className="space-y-3">
            <div>
              <Label>Text (shown in bold)</Label>
              <Input
                value={footerLine}
                onChange={(e) => setFooterLine(e.target.value)}
                onBlur={() => commit({ footerLine })}
                onKeyDown={(e) => e.key === "Enter" && commit({ footerLine })}
                placeholder="Please see additional Important Safety Information below."
              />
            </div>
            <div>
              <Label>Padding (top, right, bottom, left)</Label>
              <PaddingInput
                value={footerPadding}
                onChange={(value) => {
                  setFooterPadding(value);
                  commit({ footerPadding: value });
                }}
              />
            </div>
          </div>
        )}
      </div>


    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrseduFooterPanel — fully local state so every keystroke is instant.
// The store is only updated on blur or Enter, not on every character.
// ─────────────────────────────────────────────────────────────────────────────
function OrseduFooterPanel({
  component,
  onUpdateComponent,
}: {
  component: any;
  onUpdateComponent: (updates: any) => void;
}) {
  const [imageAlt,   setImageAlt]   = useState<string>(component.imageAlt   ?? "");
  const [reg,        setReg]        = useState<string>(component.footerText?.reg     ?? "");
  const [year,       setYear]       = useState<string>(component.footerText?.year    ?? "");
  const [address,    setAddress]    = useState<string>(component.footerText?.address ?? "");
  const [rights,     setRights]     = useState<string>(component.footerText?.rights  ?? "");
  const [jobcode,    setJobcode]    = useState<string>(component.footerText?.jobcode ?? "");

  // Sync local state when a different component is selected
  const compId = component.id;
  useEffect(() => {
    setImageAlt(component.imageAlt   ?? "");
    setReg(component.footerText?.reg     ?? "");
    setYear(component.footerText?.year    ?? "");
    setAddress(component.footerText?.address ?? "");
    setRights(component.footerText?.rights  ?? "");
    setJobcode(component.footerText?.jobcode ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compId]);

  const commitFooterText = useCallback((field: string, value: string) => {
    onUpdateComponent({
      footerText: { ...component.footerText, [field]: value },
    });
  }, [component.footerText, onUpdateComponent]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Upload Image</Label>
        <ImageUpload
          currentImage={component.src}
          onImageUpload={(imageUrl) => onUpdateComponent({ src: imageUrl })}
        />
      </div>

      <div>
        <Label htmlFor="orsedu-alt">Alt Text</Label>
        <Input
          id="orsedu-alt"
          value={imageAlt}
          placeholder="Image description"
          onChange={(e) => setImageAlt(e.target.value)}
          onBlur={(e) => onUpdateComponent({ imageAlt: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onUpdateComponent({ imageAlt: imageAlt }); } }}
        />
      </div>

      <div>
        <Label>Font Size</Label>
        <FontSizeInput value={component.fontSize || "12px"} onChange={(fontSize) => onUpdateComponent({ fontSize })} />
      </div>

      <div>
        <Label>Padding</Label>
        <PaddingInput value={component.padding || "0 20px 8px 20px"} onChange={(padding) => onUpdateComponent({ padding })} />
      </div>

      <div className="border rounded-md p-3 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">Footer Text</h4>

        <div>
          <Label className="text-xs text-gray-500">Reg Line</Label>
          <Input
            value={reg}
            placeholder="ORSERDU is a registered trademark..."
            onChange={(e) => setReg(e.target.value)}
            onBlur={(e) => commitFooterText("reg", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitFooterText("reg", reg); } }}
          />
        </div>

        <div>
          <Label className="text-xs text-gray-500">Year / Copyright</Label>
          <Input
            value={year}
            placeholder="© 2026 Stemline..."
            onChange={(e) => setYear(e.target.value)}
            onBlur={(e) => commitFooterText("year", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitFooterText("year", year); } }}
          />
        </div>

        <div>
          <Label className="text-xs text-gray-500">Address</Label>
          <Input
            value={address}
            placeholder="750 Lexington Ave..."
            onChange={(e) => setAddress(e.target.value)}
            onBlur={(e) => commitFooterText("address", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitFooterText("address", address); } }}
          />
        </div>

        <div>
          <Label className="text-xs text-gray-500">Rights</Label>
          <Input
            value={rights}
            placeholder="All rights reserved."
            onChange={(e) => setRights(e.target.value)}
            onBlur={(e) => commitFooterText("rights", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitFooterText("rights", rights); } }}
          />
        </div>

        <div>
          <Label className="text-xs text-gray-500">Job Code</Label>
          <Input
            value={jobcode}
            placeholder="0X/2X MAT-US-ELA-00XXX"
            onChange={(e) => setJobcode(e.target.value)}
            onBlur={(e) => commitFooterText("jobcode", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitFooterText("jobcode", jobcode); } }}
          />
        </div>
      </div>
    </div>
  );
}

function GeronFooterPanel({
  component,
  onUpdateComponent,
}: {
  component: EmailComponent;
  onUpdateComponent: (updates: Partial<EmailComponent>) => void;
}) {
  const [copyright, setCopyright] = useState(
    component.geronFooterCopyright ?? GERON_FOOTER_COPYRIGHT,
  );
  const [jobCode, setJobCode] = useState(
    component.geronFooterJobCode ?? GERON_FOOTER_JOB_CODE,
  );

  useEffect(() => {
    setCopyright(component.geronFooterCopyright ?? GERON_FOOTER_COPYRIGHT);
    setJobCode(component.geronFooterJobCode ?? GERON_FOOTER_JOB_CODE);
  }, [component.id]);

  return (
    <div className="space-y-3">
      <div>
        <Label>Footer Copyright Text</Label>
        <textarea
          value={copyright}
          onChange={(e) => setCopyright(e.target.value)}
          onBlur={() => onUpdateComponent({ geronFooterCopyright: copyright })}
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label>Job Code</Label>
        <Input
          value={jobCode}
          onChange={(e) => setJobCode(e.target.value)}
          onBlur={() => onUpdateComponent({ geronFooterJobCode: jobCode })}
        />
      </div>
      <div>
        <Label>RYTELO Logo Link URL</Label>
        <Input
          type="url"
          value={component.geronRyteloLogoHref ?? GERON_RYTELO_LOGO_HREF}
          onChange={(e) => onUpdateComponent({ geronRyteloLogoHref: e.target.value })}
          placeholder={GERON_RYTELO_LOGO_HREF}
        />
      </div>
      <div>
        <Label>Geron Logo Link URL</Label>
        <Input
          type="url"
          value={component.geronLogoHref ?? GERON_LOGO_HREF}
          onChange={(e) => onUpdateComponent({ geronLogoHref: e.target.value })}
          placeholder={GERON_LOGO_HREF}
        />
      </div>
      <p className="text-xs text-gray-500">
        Footer text and logo links are editable above. Logos and layout are fixed to the Geron footer design.
      </p>
    </div>
  );
}

// Ensures value is always a valid 7-char hex string for <input type="color">
function toHex(value: string): string {
  const cleaned = value?.trim() ?? "";
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned;
  return "#000000";
}

function ColorInput({ value, onChange, textColor = false, showBrandSwatches = true, label }: {
  value: string;
  onChange: (v: string) => void;
  textColor?: boolean;
  showBrandSwatches?: boolean;
  label?: string;
}) {
  const { client } = useClient();
  const [text, setText] = useState(value || "#000000");

  useEffect(() => { setText(value || "#000000"); }, [value]);

  const commit = (raw: string) => {
    const hex = raw.trim().replace(/^#/, "").toLowerCase();
    if (/^[0-9a-f]{6}$/.test(hex) && `#${hex}` !== value.toLowerCase()) onChange(`#${hex}`);
  };

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div
        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200"
        style={{ backgroundColor: toHex(text) }}
        title="Pick color"
      >
        <input
          type="color"
          aria-label={label ? `Choose ${label.toLowerCase()}` : undefined}
          value={toHex(text)}
          onChange={(e) => { setText(e.target.value); onChange(e.target.value); }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:opacity-100"
        />
      </div>
      <Input
        value={text}
        aria-label={label ? `${label} hex` : textColor ? "Text color hex" : undefined}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (textColor) commit(next);
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(event.currentTarget.value);
          }
        }}
        className="font-mono uppercase"
        placeholder="#000000"
      />
      {showBrandSwatches && [client.accentColor, client.iconBg].map(color => (
        <button key={color} type="button" className="h-6 w-6 shrink-0 rounded border"
          style={{ backgroundColor: color }} aria-label={`Use brand color ${color}`} title={color}
          onClick={() => { setText(color); onChange(color); }} />
      ))}
    </div>
  );
}

function TextColorPresets({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div role="group" aria-label="Text color presets" className="space-y-1.5">
      <p className="text-xs font-medium text-slate-600">Color presets</p>
      <div className="grid grid-cols-2 gap-1">
        {TEXT_COLOR_PRESETS.map(({ name, hex }) => (
          <button key={hex} type="button" title={`${name} (${hex.toUpperCase()})`}
            aria-pressed={value.toLowerCase() === hex}
            className="flex min-w-0 items-center gap-1.5 rounded-md border border-slate-200 px-1.5 py-1 text-left text-xs text-slate-700 hover:bg-slate-50 aria-pressed:border-slate-500 aria-pressed:bg-slate-100"
            onMouseDown={event => event.preventDefault()}
            onClick={() => onChange(hex)}>
            <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded border border-black/10" style={{ backgroundColor: hex }} />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PropertiesPanelProps {
  component: EmailComponent | undefined;
  formattingRef?: React.Ref<HTMLDivElement>;
  onUpdateComponent: (updates: Partial<EmailComponent>, immediate?: boolean) => void;
  onDeleteComponent?: (id: string) => void;
  onSaveAsCustom?: (name?: string) => void;
  onSaveHtmlBlock?: (value: string, name: string) => void;
}

function ImageTextBlockProperties({
  component,
  onUpdateComponent,
}: {
  component: EmailComponent;
  onUpdateComponent: (updates: Partial<EmailComponent>, immediate?: boolean) => void;
}) {
  const { applySelectionColor, selectionColor } = useContext(BuilderToolbarContext);
  const isOrserdu = component.type === "orserdu-image-text-block";
  const textColor = isOrserdu ? component.color || "#000000" : "#000000";
  const [imageWidth, setImageWidth] = useState(String(component.imageTextImageWidth && component.imageTextImageWidth > 0 ? component.imageTextImageWidth : 167));
  const [imageGap, setImageGap] = useState(String(component.imageTextGap ?? 16));
  const [imageAlt, setImageAlt] = useState(component.imageTextImageAlt || "");

  useEffect(() => {
    setImageWidth(String(component.imageTextImageWidth && component.imageTextImageWidth > 0 ? component.imageTextImageWidth : 167));
    setImageGap(String(component.imageTextGap ?? 16));
    setImageAlt(component.imageTextImageAlt || "");
  }, [component.id, component.imageTextImageWidth, component.imageTextGap, component.imageTextImageAlt]);

  const commitImageWidth = () => {
    const width = Number.parseInt(imageWidth, 10);
    if (Number.isFinite(width) && width > 0) {
      onUpdateComponent({ imageTextImageWidth: width });
      setImageWidth(String(width));
    } else {
      setImageWidth(String(component.imageTextImageWidth && component.imageTextImageWidth > 0 ? component.imageTextImageWidth : 167));
    }
  };

  const commitImageGap = () => {
    const gap = Number.parseInt(imageGap, 10);
    if (Number.isFinite(gap) && gap >= 0) {
      onUpdateComponent({ imageTextGap: gap });
      setImageGap(String(gap));
    } else {
      setImageGap(String(component.imageTextGap ?? 16));
    }
  };

  const sliderGap = Math.min(80, Math.max(0, component.imageTextGap ?? 16));

  return (
    <div className="space-y-4">
      <div>
        <Label>Image</Label>
        <ImageUpload
          currentImage={component.imageTextImageSrc}
          onImageUpload={(imageUrl) => onUpdateComponent({ imageTextImageSrc: imageUrl })}
        />
        {component.imageTextImageSrc && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUpdateComponent({ imageTextImageSrc: "" }, true)}
          >
            Remove image
          </Button>
        )}
        <div>
          <Label htmlFor={`image-text-alt-${component.id}`}>Alt Text</Label>
          <Input
            id={`image-text-alt-${component.id}`}
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            onBlur={() => onUpdateComponent({ imageTextImageAlt: imageAlt }, true)}
            placeholder="Alt text"
          />
        </div>
        <div>
          <Label>Image Width (px)</Label>
          <Input
            type="number"
            min={1}
            value={imageWidth}
            onChange={(e) => setImageWidth(e.target.value)}
            onBlur={commitImageWidth}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="167"
          />
        </div>
      </div>
      <div>
        <Label>Image Position</Label>
        <Select
          value={component.imageTextImagePosition || "left"}
          onValueChange={(imageTextImagePosition) =>
            onUpdateComponent({ imageTextImagePosition: imageTextImagePosition as "left" | "right" })
          }
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left of text</SelectItem>
            <SelectItem value="right">Right of text</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Space Between Image and Text</Label>
          <span className="text-xs tabular-nums text-gray-500">{component.imageTextGap ?? 16}px</span>
        </div>
        <Slider
          min={0}
          max={80}
          step={1}
          value={[sliderGap]}
          onValueChange={([gap]) => onUpdateComponent({ imageTextGap: gap })}
          aria-label="Space between image and text"
        />
        <Input
          type="number"
          min={0}
          value={imageGap}
          onChange={(e) => setImageGap(e.target.value)}
          onBlur={commitImageGap}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Space between image and text in pixels"
        />
      </div>
      <div>
        <Label>Text</Label>
        <RichTextEditor
          isSelected
          useBlockColorPresets={isOrserdu}
          selectionColorComponentId={isOrserdu ? component.id : undefined}
          value={component.type === "orserdu-image-text-block"
            ? removeTextParagraphSpacing(getOrserduImageTextContent(component))
            : component.imageTextText1 || ""}
          paragraphSpacingPx={component.type === "orserdu-image-text-block"
            ? component.paragraphSpacingPx ?? 0
            : undefined}
          onChange={(html) => onUpdateComponent({
            imageTextText1: html,
            ...(component.type === "orserdu-image-text-block" ? { imageTextSections: undefined } : {}),
          })}
          className={component.type === "orserdu-image-text-block" ? "rich-text-editor-reset-block-spacing" : undefined}
          style={{ minHeight: "100px", color: textColor }}
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Select text to format it, change its color, or add a link.
        </p>
      </div>
      {isOrserdu && (
        <TextColorPresets value={selectionColor?.componentId === component.id ? selectionColor.color : textColor} onChange={color => {
          if (!applySelectionColor?.current?.(color)) onUpdateComponent({ color }, true);
        }} />
      )}
      {component.type === "orserdu-image-text-block" && (
        <div className="space-y-3">
          <div>
            <Label>Font Size</Label>
            <FontSizeInput
              value={component.fontSize || "14px"}
              onChange={(fontSize) => onUpdateComponent({ fontSize }, true)}
            />
          </div>
          <div>
            <Label>Line Height</Label>
            <LineHeightInput
              value={component.lineHeight || "20px"}
              onChange={(lineHeight) => onUpdateComponent({ lineHeight }, true)}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Applies a default line height; use the text toolbar to change selected paragraphs.
            </p>
          </div>
          <div>
            <Label htmlFor={`image-text-paragraph-spacing-${component.id}`}>Paragraph Spacing (px)</Label>
            <PropertyNumberInput
              id={`image-text-paragraph-spacing-${component.id}`}
              max={200}
              value={component.paragraphSpacingPx ?? 0}
              onCommit={paragraphSpacingPx => onUpdateComponent({ paragraphSpacingPx }, true)}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Sets the extra gap between paragraphs. No extra space is added before the first or after the last paragraph.
            </p>
          </div>
        </div>
      )}
      <div>
        <Label>Text Align</Label>
        <Select
          value={component.textAlign || "left"}
          onValueChange={(value) => onUpdateComponent({ textAlign: value as "left" | "center" | "right" })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Vertical Align</Label>
        <Select
          value={component.imageTextVerticalAlign || "top"}
          onValueChange={(value) => onUpdateComponent({ imageTextVerticalAlign: value as "top" | "middle" | "bottom" })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="middle">Center</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Padding</Label>
        <PaddingInput
          value={component.padding || "0px 20px 10px 20px"}
          onChange={(padding) => onUpdateComponent({ padding })}
        />
      </div>
    </div>
  );
}

export function PropertiesPanel({
  component,
  formattingRef,
  onUpdateComponent,
  onDeleteComponent,
  onSaveAsCustom,
  onSaveHtmlBlock,
}: PropertiesPanelProps) {
  const { applySelectionColor, selectionColor } = useContext(BuilderToolbarContext);
  const [Links, setLinks] = useState<{ href: string; text: string; color: string }[]>([]);
  const [isHtmlEditorOpen, setIsHtmlEditorOpen] = useState(false);
  const [isRawHtmlEditorOpen, setIsRawHtmlEditorOpen] = useState(false);
  const [isSaveBlockOpen, setIsSaveBlockOpen] = useState(false);
  const [blockName, setBlockName] = useState("");
  const { preheaderText, setPreheader } = useEmailBuilderStore();

  useEffect(() => {
    if (component && component.content?.includes("<a")) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(component.content, "text/html");
      const anchors = doc.querySelectorAll("a");
      const parsedLinks = Array.from(anchors).map((a) => {
        const style = a.getAttribute("style") || "";
        const colorMatch = style.match(/color:\s*([^;]+)/i);
        // Default color if not found
        const color = colorMatch ? colorMatch[1].trim() : "#0000EE"; 
        
        return {
          href: a.getAttribute("href") || "",
          text: a.textContent || "",
          color: color,
        };
      });
      setLinks(parsedLinks);
    } else {
      setLinks([]);
    }
  }, [component]);

  if (!component) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 ring-1 ring-gray-200">
          <MousePointerClick className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <div className="font-medium text-gray-700">No component selected</div>
          <div className="mt-1 text-sm text-gray-400">
            Select a component on the canvas to edit its properties
          </div>
        </div>
      </div>
    );
  }

  const isColumn = component.type === "section" && component.isColumn;
  const hasDedicatedPaddingControl = new Set<EmailComponent["type"]>([
    "isi",
    "orserdu-isi-animated",
    "orserdu-references",
    "orserdu-abbreviations",
    "geron-references",
    "geron-abbreviations",
    "orserdu-view-in-browser",
    "elzonris-view-in-browser",
    "elzonris-references",
    "elzonris-abbreviations",
    "elzonris-ref-abbr",
    "tryvio-references",
    "tryvio-abbreviations",
  ]).has(component.type);

  const handleSaveBlock = () => {
    onSaveAsCustom?.(blockName.trim() || component.name || `Saved ${component.type}`);
    setIsSaveBlockOpen(false);
    setBlockName("");
  };

  const updateLink = (index: number, newHref: string, newText: string, newColor: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(component.content!, "text/html");
    const anchors = doc.querySelectorAll("a");

    if (anchors[index]) {
      anchors[index].setAttribute("href", newHref);
      anchors[index].textContent = newText;
      
      let style = anchors[index].getAttribute("style") || "";
      // Handle color update in inline style
      if (/color:\s*[^;]+/i.test(style)) {
        style = style.replace(/color:\s*[^;]+/i, `color: ${newColor}`);
      } else {
        style = style ? `${style}; color: ${newColor}` : `color: ${newColor}`;
      }
      
      // Ensure text-decoration matches standard link style if likely intended
      if (!style.includes("text-decoration")) {
          style += "; text-decoration: underline";
      }
      
      anchors[index].setAttribute("style", style);
    }

    const updatedHtml = doc.body.innerHTML;
    onUpdateComponent({ content: updatedHtml });
  };


  const saveRawHtml = (rawHtml: string) => {
    if (verifyHtml(rawHtml)) {
      onUpdateComponent({ html: rawHtml });
      setIsRawHtmlEditorOpen(false);
    } else {
      toast.error("Invalid HTML");
    }
  };

  const saveRawHtmlBlock = (rawHtml: string, name: string) => {
    if (verifyHtml(rawHtml)) {
      onSaveHtmlBlock?.(rawHtml, name);
      setIsRawHtmlEditorOpen(false);
    } else {
      toast.error("Invalid HTML");
    }
  };

  const renderProperties = () => {
    switch (component.type) {
      case "section": {
        const columns = getSectionColumns(component);
        const updateColumns = (children: EmailComponent[]) => onUpdateComponent({ children, columns: children.length });
        const updateColumn = (id: string, updates: Partial<EmailComponent>) => {
          if (id === component.id) onUpdateComponent(updates);
          else updateColumns(columns.map(column => column.id === id ? { ...column, ...updates } : column));
        };
        const columnFields = (column: EmailComponent, index: number) => {
          const position = isColumn ? "Column" : `Column ${index + 1}`;
          return (
            <div className="space-y-2">
              <ColumnSizeInput id={`${column.id}-width`} label="Width" width value={column.columnWidth}
                onChange={columnWidth => updateColumn(column.id, { columnWidth })} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={column.columnAlignment || "left"} onValueChange={columnAlignment => updateColumn(column.id, { columnAlignment: columnAlignment as EmailComponent["columnAlignment"] })}>
                  <SelectTrigger aria-label={`${position} horizontal alignment`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={column.columnVerticalAlignment || "top"} onValueChange={columnVerticalAlignment => updateColumn(column.id, { columnVerticalAlignment: columnVerticalAlignment as EmailComponent["columnVerticalAlignment"] })}>
                  <SelectTrigger aria-label={`${position} vertical alignment`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        };
        return (
          <div className="space-y-4">
            {isColumn ? columnFields(component, 0) : (
              <section aria-label="Columns" className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Columns</h4>
                  <Button type="button" size="sm" variant="outline" disabled={columns.length >= 6}
                    onClick={() => onUpdateComponent(resizeSectionColumns(component, columns.length + 1))}>
                    <Plus className="h-4 w-4" /> Add column
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Count</Label>
                    <Select value={String(columns.length)} onValueChange={count => onUpdateComponent(resizeSectionColumns(component, Number(count)))}>
                      <SelectTrigger aria-label="Column count"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(count => <SelectItem key={count} value={String(count)}>{count}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Direction</Label>
                    <Select value={component.direction || "column"} disabled={columns.length === 1}
                      onValueChange={direction => onUpdateComponent({ direction: direction as EmailComponent["direction"] })}>
                      <SelectTrigger aria-label="Column direction"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="row">Side by side</SelectItem>
                        <SelectItem value="column">Stacked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {columns.length > 1 && (
                  <p className="text-xs text-slate-600">Reducing the count moves content to the last remaining column.</p>
                )}
                {columns.map((column, index) => (
                  <div key={column.id} role="group" aria-label={`Column ${index + 1}`} className="space-y-2 rounded-md border border-slate-200 p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700">Column {index + 1}</p>
                      {columns.length > 1 && (
                        <div className="flex gap-1">
                          {([-1, 1] as const).map(offset => {
                            const target = index + offset;
                            const Icon = offset < 0 ? ArrowLeft : ArrowRight;
                            return <Button key={offset} type="button" variant="ghost" size="icon" className="h-7 w-7"
                              aria-label={`Move column ${index + 1} ${offset < 0 ? "earlier" : "later"}`}
                              disabled={target < 0 || target >= columns.length}
                              onClick={() => {
                                const reordered = [...columns];
                                [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
                                updateColumns(reordered);
                              }}><Icon className="h-4 w-4" /></Button>;
                          })}
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600"
                            aria-label={`Remove column ${index + 1}`} onClick={() => {
                              if (column.children?.length && !window.confirm("Remove this column and its content?")) return;
                              updateColumns(columns.filter(item => item.id !== column.id));
                            }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>
                    {columnFields(column, index)}
                  </div>
                ))}
              </section>
            )}
            <div>
              <Label>Background color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={backgroundColor => onUpdateComponent({ backgroundColor })} />
            </div>
            <div>
              <Label htmlFor="borderRadius">Border radius</Label>
              <Input id="borderRadius" value={component.borderRadius || "0px"}
                onChange={event => onUpdateComponent({ borderRadius: event.target.value })} />
            </div>
            {!isColumn && (
              <>
                <ColumnSizeInput id="maxWidth" label="Max width" width value={component.maxWidth}
                  onChange={maxWidth => onUpdateComponent({ maxWidth })} />
                <div>
                  <Label htmlFor="margin">Margin</Label>
                  <Input id="margin" value={component.margin || "0"}
                    onChange={event => onUpdateComponent({ margin: event.target.value })} />
                </div>
              </>
            )}
          </div>
        );
      }

      case "Salutation":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="salutationFontSize">Font Size</Label>
              <Input
                id="salutationFontSize"
                value={component.fontSize || "16px"}
                onChange={(e) =>
                  onUpdateComponent({ fontSize: e.target.value })
                }
                placeholder="16px"
              />
            </div>
            <div>
              <Label htmlFor="salutationColor">Text Color</Label>
              <ColorInput value={component.color || "#000000"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Font weight</Label>
              <Select
                value={component.fontWeight || "normal"}
                onValueChange={(value) =>
                  onUpdateComponent({ fontWeight: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="lighter">Lighter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="salutationBackgroundColor">Background color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label htmlFor="salutationTextAlign">Text Align</Label>
              <Select
                value={component.textAlign || "left"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="salutationLineHeight">Line Height</Label>
              <LineHeightInput
                value={component.lineHeight || "18px"}
                onChange={(v) => onUpdateComponent({ lineHeight: v })}
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <section aria-label="Text" className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="text-xs font-semibold text-slate-900">Text</h3>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Font family</Label>
                <Select value={component.fontFamily || "Arial, sans-serif"} onValueChange={fontFamily => onUpdateComponent({ fontFamily })}>
                  <SelectTrigger aria-label="Font family">
                    <SelectValue>{(component.fontFamily || "Arial").split(",")[0]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TEXT_FONT_FAMILIES.map(font => (
                      <SelectItem key={font} value={font}>{font.split(",")[0]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 space-y-1">
                  <Label className="text-xs text-slate-600">Weight</Label>
                  <Select value={component.fontWeight || "normal"} onValueChange={fontWeight => onUpdateComponent({ fontWeight: fontWeight as EmailComponent["fontWeight"] })}>
                    <SelectTrigger aria-label="Font weight"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="lighter">Lighter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 space-y-1">
                  <Label className="text-xs text-slate-600">Size</Label>
                  <FontSizeInput value={component.fontSize || "12px"} onChange={fontSize => onUpdateComponent({ fontSize })} />
                </div>
                <div className="min-w-0 space-y-1">
                  <Label className="text-xs text-slate-600">Line height</Label>
                  <LineHeightInput value={component.lineHeight || "14px"} onChange={lineHeight => onUpdateComponent({ lineHeight })} />
                </div>
              </div>
              <div role="group" aria-label="Text alignment" className="grid grid-cols-3 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                {([
                  ["left", AlignLeft],
                  ["center", AlignCenter],
                  ["right", AlignRight],
                ] as const).map(([textAlign, Icon]) => {
                  const selected = (component.textAlign || "left") === textAlign;
                  return (
                    <Button key={textAlign} type="button" variant="ghost" size="sm"
                      aria-label={`Align ${textAlign}`} aria-pressed={selected} title={`Align ${textAlign}`}
                      className={selected ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500"}
                      onClick={() => onUpdateComponent({ textAlign })}>
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
              <div>
                <Label>Block color</Label>
                <ColorInput textColor showBrandSwatches={false} value={component.color || "#000000"} onChange={color => onUpdateComponent({ color })} />
              </div>
              <TextColorPresets value={selectionColor?.componentId === component.id ? selectionColor.color : component.color || "#000000"} onChange={hex => {
                if (!applySelectionColor?.current?.(hex)) onUpdateComponent({ color: hex });
              }} />
              <div ref={formattingRef} data-formatting-placement="text-section" className="border-t border-slate-200 pt-2 empty:hidden" />
            </section>
            <section aria-label="Background" className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
              <div>
                <Label>Background color</Label>
                <ColorInput showBrandSwatches={false} value={component.backgroundColor || "#ffffff"} onChange={backgroundColor => onUpdateComponent({ backgroundColor })} />
              </div>
            </section>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
                onClick={() => setIsHtmlEditorOpen(true)}
              >
                <Code className="w-4 h-4" />
                Edit as HTML
              </Button>
            </div>
            {/* New: Link editor fields if links exist */}
            {Links.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-sm">Edit Links</h4>
                {Links.map((link, index) => (
                  <div key={index} className="space-y-2">
                    <div>
                      <Label>Link Text</Label>
                      <Input
                        value={link.text}
                        onChange={(e) =>
                          updateLink(index, link.href, e.target.value, link.color)
                        }
                      />
                    </div>
                    <div>
                      <Label>Link URL</Label>
                      <Input
                        value={link.href}
                        onChange={(e) =>
                          updateLink(index, e.target.value, link.text, link.color)
                        }
                      />
                    </div>
                    <div>
                      <Label>Link Color</Label>
                      <ColorInput value={link.color} onChange={(v) => updateLink(index, link.href, link.text, v)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <ImageUpload
                currentImage={component.src}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ src: imageUrl })
                }
              />
            </div>
            <div>
              <Label htmlFor="align">Image Alignment</Label>
              <Select
                value={component.textAlign || "center"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={component.alt ?? ""}
                onChange={(e) => onUpdateComponent({ alt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            <div>
              <Label htmlFor="width">Width</Label>
              <DeferredInput
                id="width"
                value={component.width ?? ""}
                fallback="100%"
                placeholder="100% or 400px"
                onCommit={(v) => onUpdateComponent({ width: v })}
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <DeferredInput
                id="height"
                value={component.height ?? ""}
                fallback="auto"
                placeholder="auto or 200px"
                onCommit={(v) => onUpdateComponent({ height: v })}
              />
            </div>
            <div>
              <Label htmlFor="maxWidth">Max Width</Label>
              <DeferredInput
                id="maxWidth"
                value={component.maxWidth ?? ""}
                fallback="100%"
                placeholder="100%"
                onCommit={(v) => onUpdateComponent({ maxWidth: v })}
              />
            </div>
            <div>
              <Label htmlFor="imgHref">Link URL (optional)</Label>
              <Input
                id="imgHref"
                value={component.href || ""}
                onChange={(e) => onUpdateComponent({ href: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="imgLinkTitle">Link Title (tooltip)</Label>
              <DeferredTextInput
                id="imgLinkTitle"
                value={component.linkTitle || ""}
                placeholder="Optional tooltip text"
                onCommit={(value) => onUpdateComponent({ linkTitle: value })}
              />
            </div>
          </div>
        );

      case "design-shape":
        return (
          <div className="space-y-4">
            <Label>Shape</Label>
            <Select value={component.shape || "rectangle"} onValueChange={(shape) => onUpdateComponent({ shape: shape as EmailComponent["shape"], height: shape === "line" ? "2px" : "60px", width: shape === "circle" ? "60px" : "140px" })}>
              <SelectTrigger aria-label="Shape"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="shape-width">{component.shape === "circle" ? "Diameter" : "Width"}</Label>
            <Input id="shape-width" value={component.width ?? ""} onChange={event => onUpdateComponent({ width: event.target.value })} placeholder="140px" />
            {component.shape !== "circle" && (
              <>
                <Label htmlFor="shape-height">{component.shape === "line" ? "Thickness" : "Height"}</Label>
                <Input id="shape-height" value={component.height ?? ""} onChange={event => onUpdateComponent({ height: event.target.value })} placeholder="60px" />
              </>
            )}
            <Label>Fill</Label>
            <ColorInput value={component.backgroundColor || "#006937"} onChange={backgroundColor => onUpdateComponent({ backgroundColor })} />
          </div>
        );

      case "button":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Button Text</Label>
              <Input
                id="text"
                value={component.text || ""}
                onChange={(e) => onUpdateComponent({ text: e.target.value })}
                placeholder="Click Me"
              />
            </div>
            <div>
              <Label htmlFor="href">Link URL</Label>
              <Input
                id="href"
                value={component.href || ""}
                onChange={(e) => onUpdateComponent({ href: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="linkTitle">Link Title (HTML title attribute)</Label>
              <Input
                id="linkTitle"
                value={component.linkTitle || ""}
                onChange={(e) => onUpdateComponent({ linkTitle: e.target.value })}
                placeholder="Tooltip text on hover"
              />
            </div>
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <ColorInput value={component.backgroundColor || "#007bff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#ffffff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Button effects</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="button-transparent" checked={component.backgroundColor === "transparent"}
                  onCheckedChange={checked => onUpdateComponent({ backgroundColor: checked === true ? "transparent" : "#007bff", buttonGradientColor: "" })} />
                <Label htmlFor="button-transparent">Transparent fill</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="button-gradient" checked={!!component.buttonGradientColor} disabled={component.backgroundColor === "transparent"}
                  onCheckedChange={checked => onUpdateComponent({ buttonGradientColor: checked === true ? "#003b80" : "" })} />
                <Label htmlFor="button-gradient">Gradient fill</Label>
              </div>
              {component.buttonGradientColor && (
                <ColorInput value={component.buttonGradientColor} onChange={buttonGradientColor => onUpdateComponent({ buttonGradientColor })} />
              )}
              <div className="flex items-center gap-2">
                <Checkbox id="button-shadow" checked={!!component.buttonShadow}
                  onCheckedChange={checked => onUpdateComponent({ buttonShadow: checked === true })} />
                <Label htmlFor="button-shadow">Drop shadow</Label>
              </div>
              <Label>Button Outline</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="button-outline"
                  checked={!!component.buttonOutlineColor}
                  onCheckedChange={(checked) => onUpdateComponent({ buttonOutlineColor: checked === true ? component.color || "#ffffff" : "" })}
                />
                <Label htmlFor="button-outline">Show outline</Label>
              </div>
              {component.buttonOutlineColor && (
                <ColorInput value={component.buttonOutlineColor} onChange={(buttonOutlineColor) => onUpdateComponent({ buttonOutlineColor })} />
              )}
            </div>
            <div>
              <Label htmlFor="borderRadius">Border Radius</Label>
              <Input
                id="borderRadius"
                value={component.borderRadius || "4px"}
                onChange={(e) =>
                  onUpdateComponent({ borderRadius: e.target.value })
                }
                placeholder="4px"
              />
            </div>
          </div>
        );

      case "divider": {
        const vertical = component.dividerOrientation === "vertical";
        return (
          <div className="space-y-3">
            <Select value={component.dividerOrientation || "horizontal"}
              onValueChange={dividerOrientation => onUpdateComponent({
                dividerOrientation: dividerOrientation as EmailComponent["dividerOrientation"],
                ...(dividerOrientation === "vertical" && component.dividerLength?.endsWith("%") ? { dividerLength: "" } : {}),
              })}>
              <SelectTrigger aria-label="Divider orientation"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <ColumnSizeInput id="divider-stroke" label="Stroke width" value={component.dividerStroke || component.height || "1px"}
                onChange={dividerStroke => onUpdateComponent({ dividerStroke: dividerStroke || "1px" })} />
              <ColumnSizeInput key={String(vertical)} id="divider-length" label={vertical ? "Height" : "Width"}
                width={!vertical} value={component.dividerLength || (vertical ? "48px" : "100%")}
                onChange={dividerLength => onUpdateComponent({ dividerLength })} />
            </div>
            <Select value={component.textAlign || (vertical ? "center" : "left")}
              onValueChange={textAlign => onUpdateComponent({ textAlign: textAlign as EmailComponent["textAlign"] })}>
              <SelectTrigger aria-label="Divider alignment"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Label>Color</Label>
              <ColorInput value={component.backgroundColor || DEFAULT_DIVIDER_COLOR} onChange={backgroundColor => onUpdateComponent({ backgroundColor })} />
            </div>
          </div>
        );
      }

      case "cta-button":
        return (
          <div className="space-y-4">
            <div>
               <ImageUpload
                currentImage={component.imageSrc}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ imageSrc: imageUrl })
                }
              />
            </div>
            <div>
              <Label htmlFor="imageAlt">Image Alt Text</Label>
              <Input
                id="imageAlt"
                value={component.imageAlt || ""}
                onChange={(e) =>
                  onUpdateComponent({ imageAlt: e.target.value })
                }
                placeholder="Image description"
              />
            </div>
            <div>
              <Label htmlFor="href">Link URL</Label>
              <Input
                id="href"
                value={component.href || ""}
                onChange={(e) => onUpdateComponent({ href: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="linkTitle">Link Title (HTML title attribute)</Label>
              <Input
                id="linkTitle"
                value={component.linkTitle || ""}
                onChange={(e) => onUpdateComponent({ linkTitle: e.target.value })}
                placeholder="Tooltip text on hover"
              />
            </div>
            <div>
              <Label htmlFor="ctaWidth">Width (px or %)</Label>
              <CtaWidthInput
                value={component.width || "470"}
                onChange={(v) => onUpdateComponent({ width: v })}
              />
            </div>
            </div>
        );
        
      case "footer-links":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="textAlign">Text Align</Label>
              <Select
                value={component.textAlign || "left"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Font Size</Label>
              <FontSizeInput value={component.fontSize || "14px"} onChange={(v) => onUpdateComponent({ fontSize: v })} />  
            </div>
            <div>
              <Label htmlFor="color">Default Link Color</Label>
              <ColorInput value={getOrserduFooterLinkColor(component.color)} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="flex flex-col border-2 rounded-md p-2 gap-2 mb-2">
                  <Label className="text-xs text-gray-500 font-semibold">Link {index + 1}</Label>
                  <Label className="text-xs">Text</Label>
                  <Input value={link.text} onChange={(e) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, text: e.target.value } : l) })} placeholder="Link text" />
                  <Label className="text-xs">URL</Label>
                  <Input value={link.href} onChange={(e) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, href: e.target.value } : l) })} placeholder="Link URL" />
                  <Label className="text-xs">Title</Label>
                  <Input value={link.title || ""} onChange={(e) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, title: e.target.value } : l) })} placeholder='title="…" tooltip on hover' />
                  <Label className="text-xs">Color</Label>
                  <ColorInput value={getOrserduFooterLinkColor(link.color || component.color)} onChange={(v) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, color: v } : l) })} />
                  <Label className="text-xs">Font Size</Label>
                  <FontSizeInput value={(link as any).fontSize || component.fontSize || "14px"} onChange={(v) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, fontSize: v } as any : l) })} />
                </div>
              ))}
            </div>
          </div>
        );   
      case "footer-link-2":
        return (
          <div className="space-y-3">
            {(["logoA", "logoB"] as const).map((key, index) => {
              const logo = component[key] ?? { imgSrc: "", altTex: "", href: "" };
              const update = (changes: Partial<EmailComponent["logoA"]>) =>
                onUpdateComponent({ [key]: { ...logo, ...changes } });
              return (
                <section key={key} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <h4>Logo {index + 1}</h4>
                  <ImageUpload currentImage={logo.imgSrc} onImageUpload={imgSrc => update({ imgSrc })} />
                  <div>
                    <Label htmlFor={`${key}-alt`}>Alt text</Label>
                    <Input id={`${key}-alt`} value={logo.altTex} onChange={event => update({ altTex: event.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor={`${key}-href`}>Link URL</Label>
                    <Input id={`${key}-href`} type="url" value={logo.href} onChange={event => update({ href: event.target.value })} />
                  </div>
                </section>
              );
            })}
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "14px"}
                onChange={(e) =>
                  onUpdateComponent({ fontSize: e.target.value })
                }
                placeholder="14px"
              />
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#007bff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>

            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div
                  key={index}
                  className="flex  flex-col border-2 rounded-md p-1 gap-2 mb-2"
                >
                  <Label>Link text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link url</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link title</Label>
                  <DeferredTextInput
                    value={link.title || ""}
                    onCommit={(value) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: value } : l
                        ),
                      })
                    }
                    placeholder='title="…" tooltip on hover'
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "footer-links(3)":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="textAlign">Text Align</Label>
              <Select
                value={component.textAlign || "left"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Font Size</Label>
              <FontSizeInput value={component.fontSize || "14px"} onChange={(v) => onUpdateComponent({ fontSize: v })} />  
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#007bff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            
            
            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="flex  flex-col border-2 rounded-md p-1 gap-2 mb-2">
                  <Label>Link text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link url</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link title</Label>
                  <DeferredTextInput
                    value={link.title || ""}
                    onCommit={(value) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: value } : l
                        ),
                      })
                    }
                    placeholder='title="…" tooltip on hover'
                  />
                </div>
              ))}
              
            </div>  

           </div>
        );   
      case "bullet-list":
        return (
          <div className="space-y-4">

            {/* ── Typography ── */}
            <div>
              <Label htmlFor="text-color">Text Color</Label>
              <ColorInput value={component.color || "#000000"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Font Size</Label>
              <FontSizeInput value={component.fontSize || "12px"} onChange={(v) => onUpdateComponent({ fontSize: v })} />
            </div>
            <div>
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={component.fontFamily || "Arial, sans-serif"}
                onValueChange={(v) => onUpdateComponent({ fontFamily: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial, Helvetica, sans-serif">Arial</SelectItem>
                  <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  <SelectItem value="Verdana, Geneva, sans-serif">Verdana</SelectItem>
                  <SelectItem value="Trebuchet MS, sans-serif">Trebuchet MS</SelectItem>
                  <SelectItem value="'Courier New', Courier, monospace">Courier New</SelectItem>
                  <SelectItem value="Tahoma, Geneva, sans-serif">Tahoma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lineHeight">Line Height</Label>
              <LineHeightInput
                value={component.lineHeight || "18px"}
                onChange={(lineHeight) => onUpdateComponent({ lineHeight })}
              />
            </div>

            {/* ── Marker ── */}
            <div className="border-t pt-3">
              <Label>Marker Type</Label>
              <Select
                value={(component as any).markerType || "bullet"}
                onValueChange={(v) => onUpdateComponent({ markerType: v } as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullet">• Bullet</SelectItem>
                  <SelectItem value="dash">– Dash</SelectItem>
                  <SelectItem value="arrow">→ Arrow</SelectItem>
                  <SelectItem value="check">✓ Check</SelectItem>
                  <SelectItem value="square">▪ Square</SelectItem>
                  <SelectItem value="number">1. Numbers</SelectItem>
                  <SelectItem value="roman">i. Roman</SelectItem>
                  <SelectItem value="alpha">a. Alpha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bulletColor">Default Marker Color</Label>
              <ColorInput value={component.markerColor || "#000000"} onChange={(v) => onUpdateComponent({ markerColor: v })} />
            </div>
            <div>
              {(component.listItems ?? []).map((_, index) => (
                <div key={index}>
                  <Label>Marker {index + 1} Color</Label>
                  <ColorInput value={component.listMarkerColors?.[index] || component.markerColor || "#000000"}
                    onChange={(color) => onUpdateComponent({ listMarkerColors: { ...component.listMarkerColors, [index]: color } })} />
                  {component.listMarkerColors?.[index] && (
                    <Button type="button" size="sm" variant="ghost"
                      onClick={() => onUpdateComponent({ listMarkerColors: { ...component.listMarkerColors, [index]: "" } })}>
                      Use default marker color
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="discSize">Marker Size</Label>
              <FontSizeInput value={component.discSize || "16px"} onChange={(v) => onUpdateComponent({ discSize: v })} />
            </div>
            <div>
              <Label htmlFor="spaceBetweenItems">Space Between Items (px)</Label>
              <PropertyNumberInput
                id="spaceBetweenItems"
                value={Number.parseFloat(component.spaceBetweenItems ?? "5") || 0}
                onCommit={value => onUpdateComponent({ spaceBetweenItems: `${value}px` })}
              />
            </div>

            {/* ── Background ── */}
            <div className="border-t pt-3">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>

            {/* ── Padding (outer — matches email output indentation) ── */}
            <div className="border-t pt-3">
              <Label className="mb-1.5 block">Padding</Label>
              <PaddingInput
                value={(component as any).padding || "0px 20px 0px 20px"}
                onChange={(padding) => onUpdateComponent({ padding } as any)}
              />
              <p className="text-xs text-gray-400 mt-1">Outer spacing — controls left/right indent (matches email output).</p>
            </div>

            {/* ── Margin — 4-field ── */}
            <div className="border-t pt-3">
              <Label className="mb-1.5 block">Margin</Label>
              <PaddingInput
                value={(component as any).margin || "0px 0px 0px 0px"}
                onChange={(margin) => onUpdateComponent({ margin } as any)}
              />
              <p className="text-xs text-gray-400 mt-1">Space outside the bullet list (top right bottom left).</p>
            </div>

          </div>
        )
      case "header-image":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <ImageUpload
                currentImage={component.src}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ src: imageUrl })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={component.imageAlt || ""}
                onChange={(e) => onUpdateComponent({ imageAlt: e.target.value })}
                placeholder="Image alt text"
              />
            </div>
            <div>
              <Label htmlFor="headerHref">Link URL (optional)</Label>
              <Input
                id="headerHref"
                value={component.href || ""}
                onChange={(e) => onUpdateComponent({ href: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="headerLinkTitle">Link Title (tooltip)</Label>
              <Input
                id="headerLinkTitle"
                value={component.linkTitle || ""}
                onChange={(e) => onUpdateComponent({ linkTitle: e.target.value })}
                placeholder="Optional tooltip text"
              />
            </div>

            <div className="border-t pt-4">
              <Label htmlFor="preheader">Preheader Text</Label>
              <Input
                id="preheader"
                value={preheaderText || ""}
                onChange={(e) => setPreheader(e.target.value)}
                placeholder="Enter preheader text..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Visible in email clients after the subject line.
              </p>
            </div>
          </div>
        );
      case "chevron-divider":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <ImageUpload
                currentImage={component.src}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ src: imageUrl })
                }
              />
            </div>
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={component.imageAlt || ""}
                onChange={(e) => onUpdateComponent({ imageAlt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            </div>);
      case "custom-text":
        return (
          <div className="space-y-4">
            <div>
              <Label className="font-semibold text-sm">Custom Text Options</Label>
              <p className="text-xs text-gray-500 mb-2">Each option becomes one choice in the <code className="bg-gray-100 px-1 rounded">{"{{customText[…]}}"}</code> Veeva token. The rep picks one at send time.</p>
              {(component.customTextOptions || []).map((opt: string, index: number) => (
                <div key={index} className="flex gap-1 mb-2 items-start">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">Option {index + 1}</Label>
                    <textarea
                      className="w-full border rounded px-2 py-1 text-sm resize-y min-h-[56px]"
                      value={opt}
                      onChange={(e) => {
                        const updated = [...(component.customTextOptions || [])];
                        updated[index] = e.target.value;
                        onUpdateComponent({ customTextOptions: updated });
                      }}
                    />
                  </div>
                  {(component.customTextOptions?.length ?? 0) > 1 && (
                    <button
                      className="mt-5 text-red-400 hover:text-red-600 text-xs px-1"
                      onClick={() => {
                        const updated = (component.customTextOptions || []).filter((_: string, i: number) => i !== index);
                        onUpdateComponent({ customTextOptions: updated });
                      }}
                    >✕</button>
                  )}
                </div>
              ))}
              <button
                className="mt-1 w-full border border-dashed rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
                onClick={() => onUpdateComponent({ customTextOptions: [...(component.customTextOptions || []), "New option"] })}
              >
                + Add option
              </button>
            </div>
            <div>
              <Label>Font Size</Label>
              <FontSizeInput value={component.fontSize || DEFAULT_CUSTOM_TEXT_FONT_SIZE} onChange={(fontSize) => onUpdateComponent({ fontSize })} />
            </div>
            <div>
              <Label>Line Height</Label>
              <LineHeightInput value={component.lineHeight || DEFAULT_CUSTOM_TEXT_LINE_HEIGHT} onChange={(lineHeight) => onUpdateComponent({ lineHeight })} />
            </div>
            <div>
              <Label>Font Family</Label>
              <Input value={component.fontFamily || "Arial, sans-serif"} onChange={(e) => onUpdateComponent({ fontFamily: e.target.value })} placeholder="Arial, sans-serif" />
            </div>
            <div>
              <Label>Font Weight</Label>
              <Select value={component.fontWeight || "normal"} onValueChange={(v) => onUpdateComponent({ fontWeight: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="lighter">Lighter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Text Color</Label>
              <ColorInput textColor showBrandSwatches={false} value={component.color || DEFAULT_CUSTOM_TEXT_COLOR}
                onChange={color => onUpdateComponent({ color })} />
              <div className="mt-2">
                <TextColorPresets value={component.color || DEFAULT_CUSTOM_TEXT_COLOR}
                  onChange={color => onUpdateComponent({ color })} />
              </div>
            </div>
            <div>
              <Label>Background Color</Label>
              <ColorInput showBrandSwatches={false} value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label>Text Align</Label>
              <Select value={component.textAlign || "left"} onValueChange={(v) => onUpdateComponent({ textAlign: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Padding</Label>
              <PaddingInput
                value={component.padding || "0px 20px 10px 20px"}
                onChange={(padding) => onUpdateComponent({ padding })}
              />
            </div>
          </div>
        );

      case "footer-tokens":
        return (
          <div className="space-y-4">
            <div>
              <Label>Regards</Label>
              <Input
                value={component.footerTokens?.regards || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, regards: e.target.value },
                  })
                }
                placeholder="Regards,"
              />
            </div>
            <div>
              <Label>User Name</Label>
              <Input
                value={component.footerTokens?.userName || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, userName: e.target.value },
                  })
                }
                placeholder="{{userName}}"
              />
            </div>
            <div>
              <Label>User Email</Label>
              <Input
                value={component.footerTokens?.userEmailAddress || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, userEmailAddress: e.target.value },
                  })
                }
                placeholder="{{userEmailAddress}}"
              />
            </div>
            <div>
              <Label>User Phone</Label>
              <Input
                value={component.footerTokens?.userPhone || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, userPhone: e.target.value },
                  })
                }
                placeholder="{{User.Phone}}"
              />
            </div>
            <div>
              <Label>User Photo</Label>
              <Input
                value={component.footerTokens?.userPhoto || ""}
                onChange={(e) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, userPhoto: e.target.value },
                  })
                }
                placeholder="{{userPhoto}}"
              />
            </div>
            <div>
              <Label>Company</Label>
              <RichTextEditor
                value={component.footerTokens?.company || ""}
                onChange={(content) =>
                  onUpdateComponent({
                    footerTokens: { ...component.footerTokens, company: content },
                  })
                }
                style={{ minHeight: "60px" }}
              />
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Styling</h4>
              <div className="space-y-3">
                <div>
                  <Label>Font Size</Label>
                  <Input
                    value={component.fontSize || "16px"}
                    onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                    placeholder="16px"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <ColorInput
                    value={component.color || "#000000"}
                    onChange={(v) => onUpdateComponent({ color: v })}
                  />
                </div>
                <div>
                  <Label>Text Align</Label>
                  <Select
                    value={component.textAlign || "left"}
                    onValueChange={(value) => onUpdateComponent({ textAlign: value as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Weight</Label>
                  <Select
                    value={component.fontWeight || "normal"}
                    onValueChange={(value) => onUpdateComponent({ fontWeight: value as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Line Height</Label>
                  <LineHeightInput
                    value={component.lineHeight || "18px"}
                    onChange={(lineHeight) => onUpdateComponent({ lineHeight })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "orsedu-footer":
        return (
          <OrseduFooterPanel
            component={component}
            onUpdateComponent={onUpdateComponent}
          />
        );
            
      case "orserdu-highlight-box":
      case "geron-highlight-box": {
        const comp = component;
        return (
          <div className="space-y-4">
            <div>
              <Label>Box Text</Label>
              <RichTextEditor
                isSelected
                value={comp.boxText ?? ""}
                onChange={(boxText) => onUpdateComponent({ boxText }, true)}
                style={{ minHeight: "100px" }}
              />
              <p className="mt-1 text-[11px] text-gray-400">Select text to format it, change its color or size, or add a link.</p>
            </div>
            <div className="space-y-2">
              {([
                ["Background color", "boxBgColor", "#FFD500"],
                ["Text color", "boxTextColor", "#002E6D"],
              ] as const).map(([label, property, fallback]) => (
                <details key={property} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700">
                    {label}
                    <span aria-hidden="true" className="float-right h-5 w-5 rounded border border-slate-200"
                      style={{ backgroundColor: comp[property] || fallback }} />
                  </summary>
                  <ColorInput label={label} showBrandSwatches={false} value={comp[property] || fallback}
                    onChange={color => onUpdateComponent({ [property]: color })} />
                  <div className="mt-2">
                    <TextColorPresets value={comp[property] || fallback}
                      onChange={color => onUpdateComponent({ [property]: color })} />
                  </div>
                </details>
              ))}
            </div>
            <div>
              <Label>Font Size</Label>
              <FontSizeInput value={comp.boxFontSize || "14px"} onChange={(boxFontSize) => onUpdateComponent({ boxFontSize })} />
            </div>
            <div>
              <Label>Line Height</Label>
              <LineHeightInput value={comp.boxLineHeight || "18px"} onChange={(boxLineHeight) => onUpdateComponent({ boxLineHeight })} />
            </div>
            <div>
              <Label>Font Weight</Label>
              <Select value={comp.boxFontWeight || "700"} onValueChange={(boxFontWeight) => onUpdateComponent({ boxFontWeight })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Normal</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inner Padding</Label>
              <PaddingInput value={comp.boxPadding || "16px 18px"} onChange={(boxPadding) => onUpdateComponent({ boxPadding })} />
            </div>
            <div>
              <Label>Space below box (px)</Label>
              <Input type="number" min={0} value={comp.spacingAfterBox ?? "20"} onChange={(e) => onUpdateComponent({ spacingAfterBox: e.target.value })} />
            </div>
          </div>
        );
      }

      case "orserdu-view-in-browser":
      case "elzonris-view-in-browser":
        return (
          <div className="space-y-4">
            <div>
              <Label>Link URL</Label>
              <Input value={component.href || "#"} onChange={(e) => onUpdateComponent({ href: e.target.value })} placeholder="#" />
            </div>
            <div>
              <Label>Link Title</Label>
              <Input value={component.linkTitle || ""} onChange={(e) => onUpdateComponent({ linkTitle: e.target.value })} placeholder='title="…" tooltip on hover' />
            </div>
            <div>
              <Label>Link Color</Label>
              <ColorInput value={component.color || "#2360d9"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Text Align</Label>
              <Select
                value={component.textAlign || "center"}
                onValueChange={(value) => onUpdateComponent({ textAlign: value as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Font Size</Label>
              <FontSizeInput value={component.fontSize || "12px"} onChange={(fontSize) => onUpdateComponent({ fontSize })} />
            </div>
            <div>
              <Label>Line Height</Label>
              <LineHeightInput value={component.lineHeight || "16px"} onChange={(lineHeight) => onUpdateComponent({ lineHeight })} />
            </div>
            <div>
              <Label>Padding</Label>
              <PaddingInput value={component.padding || "10px 20px"} onChange={(padding) => onUpdateComponent({ padding })} />
            </div>
          </div>
        );

      case "orserdu-report-links": {
        const comp = component as any;
        const linkItems = (comp.linkItems || []) as any[];
        const updateLinkItem = (index: number, updates: any) => {
          const newItems = [...linkItems];
          newItems[index] = { ...newItems[index], ...updates };
          onUpdateComponent({ linkItems: newItems } as any);
        };
        const addLinkItem = () => {
          onUpdateComponent({
            linkItems: [...linkItems, { prefixText: "", linkText: "", linkHref: "#", linkColor: DEFAULT_ORSERDU_REPORT_LINK_COLOR, suffixText: "", bold: false }],
          } as any);
        };
        const removeLinkItem = (index: number) => {
          onUpdateComponent({ linkItems: linkItems.filter((_, i) => i !== index) } as any);
        };

        // paddingTop / paddingBottom control above+below the whole block
        const paddingTop = parseInt(comp.paddingTop ?? "15", 10);
        const paddingBottom = parseInt(comp.paddingBottom ?? "15", 10);

        return (
          <div className="space-y-4">
            <div>
              <Label>Font Size</Label>
              <FontSizeInput value={component.fontSize || "14px"} onChange={(fontSize) => onUpdateComponent({ fontSize })} />
            </div>
            <div>
              <Label>Text Color</Label>
              <ColorInput value={component.color || "#000000"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Line Height</Label>
              <LineHeightInput value={component.lineHeight || "16px"} onChange={(lineHeight) => onUpdateComponent({ lineHeight })} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Space above (px)</Label>
                <Input
                  type="number"
                  min={0}
                  value={paddingTop}
                  onChange={(e) => onUpdateComponent({ paddingTop: e.target.value } as any)}
                />
              </div>
              <div className="flex-1">
                <Label>Space below (px)</Label>
                <Input
                  type="number"
                  min={0}
                  value={paddingBottom}
                  onChange={(e) => onUpdateComponent({ paddingBottom: e.target.value } as any)}
                />
              </div>
            </div>

            <div className="border-t pt-3 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Link Items</span>
                <Button size="sm" variant="outline" onClick={addLinkItem}>+ Add Link</Button>
              </div>
              {linkItems.map((item: any, i: number) => (
                <div key={i} className="border rounded-lg p-3 space-y-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Link {i + 1}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeLinkItem(i)} className="h-6 px-2 text-xs text-red-500 hover:text-red-700">Remove</Button>
                  </div>
                  <div>
                    <Label>Text before link</Label>
                    <Input value={item.prefixText || ""} onChange={(e) => updateLinkItem(i, { prefixText: e.target.value })} placeholder="Text before the link" />
                  </div>
                  <div>
                    <Label>Link text</Label>
                    <Input value={item.linkText || ""} onChange={(e) => updateLinkItem(i, { linkText: e.target.value })} placeholder="Clickable text" />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input value={item.linkHref || ""} onChange={(e) => updateLinkItem(i, { linkHref: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <Label>Text after link</Label>
                    <Input value={item.suffixText || ""} onChange={(e) => updateLinkItem(i, { suffixText: e.target.value })} placeholder="Text after the link" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Link Color</Label>
                      <ColorInput value={item.linkColor || DEFAULT_ORSERDU_REPORT_LINK_COLOR} onChange={(v) => updateLinkItem(i, { linkColor: v })} />
                    </div>
                    <div className="flex-1">
                      <Label>Bold</Label>
                      <Select
                        value={item.bold ? "yes" : "no"}
                        onValueChange={(v) => updateLinkItem(i, { bold: v === "yes" })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Bold</SelectItem>
                          <SelectItem value="no">Normal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "elzonris-pi":
        return (
          <div className="space-y-4">
            <div>
              <Label>Font Size</Label>
              <FontSizeInput value={component.fontSize || "12px"} onChange={(fontSize) => onUpdateComponent({ fontSize })} />
            </div>
            <div>
              <Label>Text Color</Label>
              <ColorInput value={component.color || "#000000"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Link Color</Label>
              <ColorInput value={component.linkColor || "#009877"} onChange={(v) => onUpdateComponent({ linkColor: v })} />
            </div>
            <div className="border rounded-md p-3 space-y-2">
              <h4 className="font-semibold text-sm">Prescribing Information Link</h4>
              <Label className="text-xs text-gray-500">URL</Label>
              <Input value={component.piHref || ""} onChange={(e) => onUpdateComponent({ piHref: e.target.value })} placeholder="http://pi.elzonris.com/" />
              <Label className="text-xs text-gray-500">Title</Label>
              <Input value={component.piTitle || ""} onChange={(e) => onUpdateComponent({ piTitle: e.target.value })} placeholder='title="…" tooltip on hover' />
            </div>
            <div className="border rounded-md p-3 space-y-2">
              <h4 className="font-semibold text-sm">ISI Link (here)</h4>
              <Label className="text-xs text-gray-500">URL</Label>
              <Input value={component.isiHref || ""} onChange={(e) => onUpdateComponent({ isiHref: e.target.value })} placeholder="https://www.elzonris.com/hcp/#isi" />
              <Label className="text-xs text-gray-500">Title</Label>
              <Input value={component.isiTitle || ""} onChange={(e) => onUpdateComponent({ isiTitle: e.target.value })} placeholder='title="…" tooltip on hover' />
            </div>
          </div>
        );

      case "elzonris-brand-logo":
        return (
          <div className="space-y-4">
            <div className="border rounded-md p-3 space-y-3">
              <h4 className="font-semibold text-sm">Stemline Logo (Left)</h4>
              <ImageUpload
                currentImage={component.logoA?.imgSrc}
                onImageUpload={(url) => onUpdateComponent({ logoA: { ...component.logoA, imgSrc: url } })}
              />
              <div>
                <Label>Alt Text</Label>
                <Input
                  value={component.logoA?.altTex || ""}
                  onChange={(e) => onUpdateComponent({ logoA: { ...component.logoA, altTex: e.target.value } })}
                  placeholder="Alt text"
                />
              </div>
              <div>
                <Label>Link URL</Label>
                <Input
                  value={component.logoA?.href || ""}
                  onChange={(e) => onUpdateComponent({ logoA: { ...component.logoA, href: e.target.value } })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="border rounded-md p-3 space-y-3">
              <h4 className="font-semibold text-sm">Elzonris Logo (Right)</h4>
              <ImageUpload
                currentImage={component.logoB?.imgSrc}
                onImageUpload={(url) => onUpdateComponent({ logoB: { ...component.logoB, imgSrc: url } })}
              />
              <div>
                <Label>Alt Text</Label>
                <Input
                  value={component.logoB?.altTex || ""}
                  onChange={(e) => onUpdateComponent({ logoB: { ...component.logoB, altTex: e.target.value } })}
                  placeholder="Alt text"
                />
              </div>
              <div>
                <Label>Link URL</Label>
                <Input
                  value={component.logoB?.href || ""}
                  onChange={(e) => onUpdateComponent({ logoB: { ...component.logoB, href: e.target.value } })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        );

      case "footer-link-3":
        return (
          <div className="space-y-4">
            <div>
              <Label>Link Color</Label>
              <ColorInput value={component.color || "#009877"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Font Size</Label>
              <Input
                value={component.fontSize || "12px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="12px"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="border rounded-md p-2 space-y-2">
                  <Label className="text-xs text-gray-500">Link {index + 1}</Label>
                  <Input
                    value={link.text}
                    onChange={(e) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, text: e.target.value } : l) })}
                    placeholder="Link text"
                  />
                  <Input
                    value={link.href}
                    onChange={(e) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, href: e.target.value } : l) })}
                    placeholder="Link URL"
                  />
                  <Input
                    value={link.title || ""}
                    onChange={(e) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, title: e.target.value } : l) })}
                    placeholder="Link title (HTML title attribute)"
                  />
                  <Label className="text-xs">Color</Label>
                  <ColorInput
                    value={link.color || component.color || "#009877"}
                    onChange={(v) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, color: v } : l) })}
                  />
                  <Label className="text-xs">Font Size</Label>
                  <FontSizeInput
                    value={link.fontSize || component.fontSize || "12px"}
                    onChange={(v) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, fontSize: v } : l) })}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "email-footer":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "12px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="12px"
              />
            </div>
            <div>
              <Label htmlFor="color">Link Color</Label>
              <ColorInput value={getOrserduFooterLinkColor(component.color)} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <ColorInput value={component.backgroundColor || "#ffffff"} onChange={(v) => onUpdateComponent({ backgroundColor: v })} />
            </div>
            <div>
              <Label htmlFor="padding">Padding</Label>
              <Input
                id="padding"
                value={component.padding || "10px 20px"}
                onChange={(e) => onUpdateComponent({ padding: e.target.value })}
                placeholder="10px 20px"
              />
            </div>
            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="flex flex-col border-2 rounded-md p-1 gap-2 mb-2">
                  <Label>Link {index + 1} text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link {index + 1} URL</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link {index + 1} Title</Label>
                  <DeferredTextInput
                    value={link.title || ""}
                    onCommit={(value) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: value } : l
                        ),
                      })
                    }
                    placeholder="HTML title attribute (tooltip)"
                  />
                  <Label className="text-xs">Color</Label>
                  <ColorInput
                    value={getOrserduFooterLinkColor(link.color || component.color)}
                    onChange={(v) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, color: v } : l) })}
                  />
                  <Label className="text-xs">Font Size</Label>
                  <FontSizeInput
                    value={link.fontSize || component.fontSize || "12px"}
                    onChange={(v) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, fontSize: v } : l) })}
                  />
                </div>
              ))}
            </div>
          </div>
        );

          case "footer-with-Preferences" :
                 return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="textAlign">Text Align</Label>
              <Select
                value={component.textAlign || "left"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={component.fontSize || "12px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="12px"
              />  
            </div>
            <div>
              <Label htmlFor="color">Text Color</Label>
              <ColorInput value={component.color || "#007bff"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            
            
            <div className="mt-3">
              <Label className="text-md mb-2">Links</Label>
              {component.links?.map((link, index) => (
                <div key={index} className="flex  flex-col border-2 rounded-md p-1 gap-2 mb-2">
                  <Label>Link text</Label>
                  <Input
                    value={link.text}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, text: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link text"
                  />
                  <Label>Link url</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, href: e.target.value } : l
                        ),
                      })
                    }
                    placeholder="Link URL"
                  />
                  <Label>Link title</Label>
                  <DeferredTextInput
                    value={link.title || ""}
                    onCommit={(value) =>
                      onUpdateComponent({
                        links: component.links?.map((l, i) =>
                          i === index ? { ...l, title: value } : l
                        ),
                      })
                    }
                    placeholder='title="…" tooltip on hover'
                  />
                  <Label className="text-xs">Color</Label>
                  <ColorInput
                    value={link.color || component.color || "#0563C1"}
                    onChange={(v) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, color: v } : l) })}
                  />
                  <Label className="text-xs">Font Size</Label>
                  <FontSizeInput
                    value={link.fontSize || component.fontSize || "12px"}
                    onChange={(v) => onUpdateComponent({ links: component.links?.map((l, i) => i === index ? { ...l, fontSize: v } : l) })}
                  />
                </div>
              ))}
              
            </div>  

           </div>
        );   
        case "elzonris-divider" :
          return (
            <div className="space-y-4">
              <div>
                <Label>Divider Line Image</Label>
                <p className="text-xs text-gray-500 mb-1">Upload the footer-line.png image. The URL will be used in both the canvas preview and the exported HTML.</p>
                <ImageUpload
                  currentImage={component.src}
                  onImageUpload={(imageUrl) => onUpdateComponent({ src: imageUrl })}
                />
              </div>
              <div>
                <Label>font size</Label>
                <Input
                  id="fontSize"
                  value={component.fontSize || "14px"}
                  onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                  placeholder="14px"
                />
              </div>
              <div>
                <Label htmlFor="color">Text Color</Label>
                <ColorInput value={component.color || "#646464"} onChange={(v) => onUpdateComponent({ color: v })} />
              </div>
              <div>
                <Label>Link</Label>
                <Input
                  value={component.href}
                  onChange={(e) => onUpdateComponent({ href: e.target.value })}
                  placeholder="Link URL"
                />
              </div>
              <div>
                <Label>Link Title</Label>
                <Input
                  value={component.linkTitle || ""}
                  onChange={(e) => onUpdateComponent({ linkTitle: e.target.value })}
                  placeholder='title="…" tooltip on hover'
                />
              </div>
             </div>
            );

      case "image-with-link": {
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <ImageUpload
                currentImage={component.src}
                onImageUpload={(imageUrl) =>
                  onUpdateComponent({ src: imageUrl })
                }
              />
            </div>
            <div>
              <Label htmlFor="iwl-link">Link URL</Label>
              <Input
                id="iwl-link"
                value={component.href ?? ""}
                onChange={(e) => onUpdateComponent({ href: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="iwl-align">Image Alignment</Label>
              <Select
                value={component.textAlign || "center"}
                onValueChange={(value) =>
                  onUpdateComponent({ textAlign: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="iwl-alt">Alt Text</Label>
              <Input
                id="iwl-alt"
                value={component.alt ?? ""}
                onChange={(e) => onUpdateComponent({ alt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            <div>
              <Label htmlFor="iwl-width">Image Width</Label>
              <DeferredInput
                id="iwl-width"
                value={component.width ?? ""}
                fallback="100%"
                onCommit={(width) => onUpdateComponent({ width }, true)}
                placeholder="100% or 400px"
              />
            </div>
            <div>
              <Label htmlFor="iwl-height">Height</Label>
              <Input
                id="iwl-height"
                value={component.height ?? ""}
                onChange={(e) => onUpdateComponent({ height: e.target.value || "auto" })}
                placeholder="auto or 200px"
              />
            </div>
            <div>
              <Label htmlFor="iwl-maxWidth">Max Width</Label>
              <Input
                id="iwl-maxWidth"
                value={component.maxWidth ?? ""}
                onChange={(e) => onUpdateComponent({ maxWidth: e.target.value || "100%" })}
                placeholder="100%"
              />
            </div>
          </div>
        );
      }

        case "orserdu-isi-animated":
        case "isi": {
          const bulletColor = component.isiBulletColor || "#69d6b5";
          return (
            <div className="space-y-3">
              <section aria-label="Bullet markers" className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <h4>Bullet markers</h4>
                <ColorInput label="Bullet color" textColor showBrandSwatches={false} value={bulletColor}
                  onChange={isiBulletColor => onUpdateComponent({ isiBulletColor })} />
                <TextColorPresets value={bulletColor} onChange={isiBulletColor => onUpdateComponent({ isiBulletColor })} />
              </section>
              {component.type === "isi" && !component.isiHtml && (
                <section aria-label="Heading colors" className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <h4>Heading colors</h4>
                  <div>
                    <Label>ISI heading</Label>
                    <ColorInput label="ISI heading color" showBrandSwatches={false} value={component.isiHeadingColor || "#006937"}
                      onChange={isiHeadingColor => onUpdateComponent({ isiHeadingColor })} />
                  </div>
                  <div>
                    <Label>Indication heading</Label>
                    <ColorInput label="Indication heading color" showBrandSwatches={false} value={component.indicationHeadingColor || "#006937"}
                      onChange={indicationHeadingColor => onUpdateComponent({ indicationHeadingColor })} />
                  </div>
                </section>
              )}
              <section aria-label="ISI spacing" className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <h4>Spacing</h4>
                <PaddingInput value={getOrserduIsiOuterPadding(component.padding)}
                  onChange={padding => onUpdateComponent({ padding }, true)} />
              </section>
              <p className="text-xs text-slate-600">Select words on the canvas to format the copy.</p>
            </div>
          );
        }

        case "orserdu-isi-select":
          return (
            <OrserduIsiSelectPanel
              component={component}
              onUpdateComponent={onUpdateComponent}
            />
          );

          case "tryvio-isi":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Padding (left/right)</Label>
                  <Input
                    value={(component as any).padding ?? "0 20px"}
                    onChange={(e) => onUpdateComponent({ padding: e.target.value } as any)}
                    placeholder="0 20px"
                  />
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline" size="sm" className="w-full flex items-center gap-2"
                    onClick={() => {
                      const modal = document.createElement('div');
                      modal.innerHTML = `<div style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
                        <div style="background:#fff;border-radius:12px;padding:24px;width:90%;max-width:700px;max-height:80vh;display:flex;flex-direction:column;gap:12px;">
                          <p style="font-weight:600;font-size:14px;">Edit TRYVIO ISI HTML</p>
                          <textarea id="isi-html-editor" style="flex:1;min-height:300px;font-family:monospace;font-size:12px;border:1px solid #ddd;border-radius:6px;padding:8px;resize:vertical;">${((component as any).html || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
                          <div style="display:flex;gap:8px;justify-content:flex-end;">
                            <button id="isi-cancel" style="padding:6px 16px;border:1px solid #ddd;border-radius:6px;cursor:pointer;">Cancel</button>
                            <button id="isi-save" style="padding:6px 16px;background:#BC2030;color:#fff;border:none;border-radius:6px;cursor:pointer;">Save</button>
                          </div>
                        </div>
                      </div>`;
                      document.body.appendChild(modal);
                      const ta = modal.querySelector('#isi-html-editor') as HTMLTextAreaElement;
                      ta.value = (component as any).html || '';
                      modal.querySelector('#isi-cancel')?.addEventListener('click', () => document.body.removeChild(modal));
                      modal.querySelector('#isi-save')?.addEventListener('click', () => {
                        onUpdateComponent({ html: ta.value } as any);
                        document.body.removeChild(modal);
                      });
                    }}
                  >
                    <Code className="w-4 h-4" /> Edit ISI HTML
                  </Button>
                </div>
                <p className="text-[11px] text-gray-400">The ISI content is pre-filled with TRYVIO ISI. Use the editor above to customise it.</p>
              </div>
            );

          case "tryvio-abbrev-ref":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Abbreviations</Label>
                  <textarea
                    className="w-full min-h-[80px] text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                    value={(component as any).abbreviations ?? ""}
                    onChange={(e) => onUpdateComponent({ abbreviations: e.target.value } as any)}
                    placeholder="ALT, alanine aminotransferase; ..."
                  />
                </div>
                <div>
                  <Label>References</Label>
                  <textarea
                    className="w-full min-h-[80px] text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                    value={(component as any).references ?? ""}
                    onChange={(e) => onUpdateComponent({ references: e.target.value } as any)}
                    placeholder="1. Author et al. Journal. 2024;..."
                  />
                </div>
                <div>
                  <Label>Font Size</Label>
                  <Input
                    value={(component as any).fontSize ?? "12px"}
                    onChange={(e) => onUpdateComponent({ fontSize: e.target.value } as any)}
                    placeholder="12px"
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <ColorInput value={(component as any).color ?? "#646464"} onChange={(v) => onUpdateComponent({ color: v } as any)} />
                </div>
                <div>
                  <Label>Padding</Label>
                  <Input
                    value={(component as any).padding ?? "0 30px 10px 30px"}
                    onChange={(e) => onUpdateComponent({ padding: e.target.value } as any)}
                    placeholder="0 30px 10px 30px"
                  />
                </div>
              </div>
            );

          case "tryvio-footer":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Footer Logo</Label>
                  <ImageUpload
                    currentImage={component.tryvioFooterLogoSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ tryvioFooterLogoSrc: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.tryvioFooterLogoAlt || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterLogoAlt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={component.tryvioFooterLogoHref || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterLogoHref: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>LinkedIn Icon</Label>
                  <ImageUpload
                    currentImage={component.tryvioFooterLinkedinSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ tryvioFooterLinkedinSrc: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.tryvioFooterLinkedinAlt || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterLinkedinAlt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={component.tryvioFooterLinkedinHref || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterLinkedinHref: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Idorsia Logo</Label>
                  <ImageUpload
                    currentImage={component.tryvioFooterIdorsiaLogoSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ tryvioFooterIdorsiaLogoSrc: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.tryvioFooterIdorsiaLogoAlt || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterIdorsiaLogoAlt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={component.tryvioFooterIdorsiaLogoHref || ""}
                      onChange={(e) => onUpdateComponent({ tryvioFooterIdorsiaLogoHref: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Job Code</Label>
                  <Input
                    value={component.tryvioFooterJobCode || ""}
                    onChange={(e) => onUpdateComponent({ tryvioFooterJobCode: e.target.value })}
                    placeholder="US-AP-00162 04/26"
                  />
                </div>
              </div>
            );
          case "orserdu-footer":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Footer Logo</Label>
                  <ImageUpload
                    currentImage={component.src}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ src: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.alt || ""}
                      onChange={(e) => onUpdateComponent({ alt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Font Size</Label>
                    <Input
                      value={component.fontSize || "12px"}
                      onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                      placeholder="12px"
                    />
                  </div>
                </div>
                <div>
                  <Label>Footer Text - Reg</Label>
                  <Input
                    value={component.footerText?.reg || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, reg: e.target.value } })}
                    placeholder="ORSERDU is a registered trademark..."
                  />
                </div>
                <div>
                  <Label>Footer Text - Year</Label>
                  <Input
                    value={component.footerText?.year || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, year: e.target.value } })}
                    placeholder="© 2026 Stemline..."
                  />
                </div>
                <div>
                  <Label>Footer Text - Address</Label>
                  <Input
                    value={component.footerText?.address || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, address: e.target.value } })}
                    placeholder="750 Lexington Avenue..."
                  />
                </div>
                <div>
                  <Label>Footer Text - Rights</Label>
                  <Input
                    value={component.footerText?.rights || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, rights: e.target.value } })}
                    placeholder="All rights reserved."
                  />
                </div>
                <div>
                  <Label>Job Code</Label>
                  <Input
                    value={component.footerText?.jobcode || ""}
                    onChange={(e) => onUpdateComponent({ footerText: { ...component.footerText, jobcode: e.target.value } })}
                    placeholder="0X/2X MAT-US-ELA-00XXX"
                  />
                </div>
              </div>
            );
          case "orserdu-emerald-stats":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Emerald Icon</Label>
                  <ImageUpload
                    currentImage={component.emeraldLeftIconSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ emeraldLeftIconSrc: imageUrl })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.emeraldLeftIconAlt || ""}
                      onChange={(e) => onUpdateComponent({ emeraldLeftIconAlt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                </div>
                <div>
                  <Label>Left Heading</Label>
                  <Input
                    value={component.emeraldLeftHeading || ""}
                    onChange={(e) => onUpdateComponent({ emeraldLeftHeading: e.target.value })}
                    placeholder="Primary endpoint in EMERALD"
                  />
                </div>
                <div>
                  <Label>Left Stat</Label>
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={3}
                    value={component.emeraldLeftStat || ""}
                    onChange={(e) => onUpdateComponent({ emeraldLeftStat: e.target.value })}
                    placeholder="Left stat content (HTML supported)"
                  />
                </div>
                <div>
                  <Label>Left HR</Label>
                  <Input
                    value={component.emeraldLeftHR || ""}
                    onChange={(e) => onUpdateComponent({ emeraldLeftHR: e.target.value })}
                    placeholder="HR=0.55..."
                  />
                </div>
                <div>
                  <Label>Right Stat Number</Label>
                  <Input
                    value={component.emeraldRightStatNumber || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightStatNumber: e.target.value })}
                    placeholder="8.6"
                  />
                </div>
                <div>
                  <Label>Right Stat Label (use \n for line breaks)</Label>
                  <Input
                    value={component.emeraldRightStatLabel || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightStatLabel: e.target.value })}
                    placeholder="months\nmPFS"
                  />
                </div>
                <div>
                  <Label>Right Description</Label>
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={3}
                    value={component.emeraldRightDesc || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightDesc: e.target.value })}
                    placeholder="Right description"
                  />
                </div>
                <div>
                  <Label>Right Stat</Label>
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={2}
                    value={component.emeraldRightStat || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightStat: e.target.value })}
                    placeholder="Right stat text"
                  />
                </div>
                <div>
                  <Label>Right HR</Label>
                  <Input
                    value={component.emeraldRightHR || ""}
                    onChange={(e) => onUpdateComponent({ emeraldRightHR: e.target.value })}
                    placeholder="HR=0.41..."
                  />
                </div>
              </div>
            );
          case "orserdu-image-text-block":
            return <ImageTextBlockProperties component={component} onUpdateComponent={onUpdateComponent} />;
          case "elzonris-image-text-block":
            return <ImageTextBlockProperties component={component} onUpdateComponent={onUpdateComponent} />;
          case "ferring-footer":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Footer Logo</Label>
                  <ImageUpload
                    currentImage={component.logo?.logoSrc}
                    onImageUpload={(imageUrl) =>
                      onUpdateComponent({ logo: { ...component.logo, logoSrc: imageUrl } })
                    }
                  />
                  <div>
                    <Label>Alt Text</Label>
                    <Input
                      value={component.logo?.altText || ""}
                      onChange={(e) => onUpdateComponent({ logo: { ...component.logo, altText: e.target.value } })}
                      placeholder="Alt text"
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={component.logo?.href || ""}
                      onChange={(e) => onUpdateComponent({ logo: { ...component.logo, href: e.target.value } })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Social Media Links</Label>
                  <div className="flex flex-col gap-3 mt-2 border p-3 rounded-md">
                    {component.socialMediaLinks?.map((link, index) => (
                      <div key={index} className="flex flex-col items-center gap-2">
                        <ImageUpload
                          currentImage={link.iconSrc}
                          onImageUpload={(imageUrl) =>
                            onUpdateComponent({ socialMediaLinks: component.socialMediaLinks?.map((l, i) =>
                              i === index ? { ...l, iconSrc: imageUrl } : l
                            )})
                          }
                        />
                        <Input
                          value={link.href}
                          onChange={(e) =>
                            onUpdateComponent({ socialMediaLinks: component.socialMediaLinks?.map((l, i) =>
                              i === index ? { ...l, href: e.target.value } : l
                            )})
                          }
                          placeholder="Social media URL"
                        />
                        <Input
                          value={link.altText}
                          onChange={(e) =>
                            onUpdateComponent({ socialMediaLinks: component.socialMediaLinks?.map((l, i) =>
                              i === index ? { ...l, altText: e.target.value } : l
                            )})
                          }
                          placeholder="Alt text"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Footer Links</Label>
                  <div className="flex flex-col gap-3 mt-2 border p-3 rounded-md">
                    {component.links?.map((link, index) => (
                      <div key={index} className="flex flex-col items-center gap-2">
<Input
                          value={link.text}
                          onChange={(e) => onUpdateComponent({
                            links: component.links?.map((l, i) => i === index ? { ...l, text: e.target.value } : l)
                          })}
                        />
                        <Input
                          value={link.href}
                          onChange={(e) =>
                            onUpdateComponent({ links: component.links?.map((l, i) =>
                              i === index ? { ...l, href: e.target.value } : l
                            )})
                          }
                          placeholder="Footer link URL"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Job Code</Label>
                  <Input
                    value={component.jobCode || ""}
                    onChange={(e) => onUpdateComponent({ jobCode: e.target.value })}
                    placeholder="02/26 GL-RMMH-2600016"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={component.address || ""}
                    onChange={(e) => onUpdateComponent({ address: e.target.value })}
                    placeholder="[countries to add appropriate address]"
                  />
                </div>
              </div>
            );
          case "raw-html":
            return (
              <div className="space-y-4">
                <Label>Background color</Label>
                <ColorInput value={component.backgroundColor || "#ffffff"} onChange={backgroundColor => onUpdateComponent({ backgroundColor })} />
                <Button className="w-full" variant={"outline"} onClick={() => setIsRawHtmlEditorOpen(true)}><Code/>Add or Edit HTML</Button>
              </div>
            )
          case "geron-isi":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Outer Padding (top, right, bottom, left)</Label>
                  <PaddingInput
                    value={component.padding || "0 0 10px 0"}
                    onChange={(padding) => onUpdateComponent({ padding }, true)}
                  />
                </div>
                <div>
                  <Label>Prescribing Information URL</Label>
                  <Input
                    type="url"
                    value={component.geronPrescribingInformationUrl ?? GERON_PRESCRIBING_INFORMATION_URL}
                    onChange={(e) => onUpdateComponent({ geronPrescribingInformationUrl: e.target.value })}
                    placeholder={GERON_PRESCRIBING_INFORMATION_URL}
                  />
                </div>
                <div>
                  <Label>Medication Guide URL</Label>
                  <Input
                    type="url"
                    value={component.geronMedicationGuideUrl ?? GERON_MEDICATION_GUIDE_URL}
                    onChange={(e) => onUpdateComponent({ geronMedicationGuideUrl: e.target.value })}
                    placeholder={GERON_MEDICATION_GUIDE_URL}
                  />
                </div>
                <Button className="w-full" variant="outline" onClick={() => setIsRawHtmlEditorOpen(true)}>
                  <Code className="mr-2 h-4 w-4" /> Edit Geron ISI HTML
                </Button>
                <p className="text-xs text-gray-500">
                  This ISI is pre-filled with the supplied RYTELO safety information.
                </p>
              </div>
            )
          case "geron-footer":
            return (
              <GeronFooterPanel
                component={component}
                onUpdateComponent={onUpdateComponent}
              />
            )
          case "elzonris-isi":
            return (
              <div className="space-y-4">
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={component.fontFamily || "Arial, sans-serif"}
                    onValueChange={(value) => onUpdateComponent({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                      <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                      <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                      <SelectItem value="'Courier New', Courier, monospace">Courier New</SelectItem>
                      <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                      <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-center">
                  <Button className="w-full" variant={"outline"} onClick={() => setIsRawHtmlEditorOpen(true)}><Code/>Edit Elzonris ISI</Button>
                </div>
              </div>
            )
      case "sisi":
      case "orserdu-references":
      case "orserdu-abbreviations":
      case "geron-references":
      case "geron-abbreviations": {
        const textProperty = component.type === "sisi"
          ? "html"
          : component.type === "orserdu-references" || component.type === "geron-references"
            ? "references"
            : "abbreviations";
        const textValue = component[textProperty] || "";

        return (
          <div className="space-y-3">
            {component.type === "sisi" ? (
              <Button className="w-full" variant="outline" onClick={() => setIsRawHtmlEditorOpen(true)}>
                <Code /> Edit SISI HTML
              </Button>
            ) : component.type === "orserdu-references" || component.type === "geron-references" ? (
              <div>
                <Label>References</Label>
                <textarea
                  value={textValue}
                  onChange={(e) => onUpdateComponent({ [textProperty]: e.target.value })}
                  className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            ) : component.type === "geron-abbreviations" ? (
              <div>
                <Label>Abbreviations</Label>
                <textarea
                  value={textValue}
                  onChange={(e) => onUpdateComponent({ [textProperty]: e.target.value })}
                  className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Add Geron-specific abbreviations"
                />
              </div>
            ) : null}

            {component.type === "sisi" && (
              <div className="border rounded-md p-3 space-y-2">
                <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wide">PDF Link URLs</h4>
                <p className="text-xs text-gray-400">These URLs are used to make the "here" / "HERE" links clickable in exported PDFs.</p>
                <div>
                  <Label className="text-xs">Prescribing Information URL ("here")</Label>
                  <Input
                    value={component.piHref || ""}
                    onChange={(e) => onUpdateComponent({ piHref: e.target.value })}
                    placeholder="https://rxmenarinistemline.com/ORSERDU_..."
                  />
                </div>
                <div>
                  <Label className="text-xs">State Pricing URL ("HERE")</Label>
                  <Input
                    value={component.statePricingHref || ""}
                    onChange={(e) => onUpdateComponent({ statePricingHref: e.target.value })}
                    placeholder="https://www.orserdu.com/state-pricing"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Font Size</Label>
              <FontSizeInput
                value={component.fontSize || "12px"}
                onChange={(fontSize) => onUpdateComponent({ fontSize })}
              />
            </div>
            <div>
              <Label>Line Height</Label>
              <LineHeightInput
                value={component.lineHeight || "14px"}
                onChange={(lineHeight) => onUpdateComponent({ lineHeight })}
              />
            </div>
            <div>
              <Label>Color</Label>
              <ColorInput value={component.color || "#646464"} onChange={(v) => onUpdateComponent({ color: v })} />
            </div>
            <div>
              <Label>Padding</Label>
              <PaddingInput
                value={component.padding || (
                  component.type === "geron-abbreviations" || component.type === "geron-references"
                    ? "0 0 10px 0"
                    : "0px 20px 10px 20px"
                )}
                onChange={(padding) => onUpdateComponent({ padding }, true)}
              />
            </div>
          </div>
        );
      }
      case "elzonris-references":
      case "elzonris-abbreviations":
      case "elzonris-ref-abbr":
      case "tryvio-references":
      case "tryvio-abbreviations":
        return (
          <div className="space-y-3">
            <div>
              <Label>Font Size</Label>
              <Input
                value={component.fontSize || "10px"}
                onChange={(e) => onUpdateComponent({ fontSize: e.target.value })}
                placeholder="10px"
              />
            </div>
            <div>
              <Label>Line Height</Label>
              <LineHeightInput
                value={component.lineHeight || "14px"}
                onChange={(lineHeight) => onUpdateComponent({ lineHeight })}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={component.color?.startsWith("#") ? component.color : "#000000"}
                  onChange={(e) => onUpdateComponent({ color: e.target.value })}
                  className="w-10 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={component.color || "#000000"}
                  onChange={(e) => onUpdateComponent({ color: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div>
              <Label>Font Weight</Label>
              <Select
                value={component.fontWeight || "normal"}
                onValueChange={(v) => onUpdateComponent({ fontWeight: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="lighter">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Padding</Label>
              <PaddingInput
                value={component.padding || "0 20px 10px 20px"}
                onChange={(padding) => onUpdateComponent({ padding }, true)}
              />
            </div>
          </div>
        );

      default:
        return <div>No properties available</div>;
    }
  };

  return (
    <div className="eb-props space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
            isColumn
              ? "bg-green-50 text-green-600 ring-green-100"
              : "bg-blue-50 text-blue-600 ring-blue-100",
          )}
        >
          {isColumn ? <Layers className="h-4 w-4" /> : <Box className="h-4 w-4" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {isColumn
              ? "Column"
              : (component.type?.charAt(0).toUpperCase() ?? "") +
                component.type?.slice(1)}
          </h3>
        </div>
        {onDeleteComponent && (
          <Button type="button" variant="ghost" size="icon"
            aria-label="Remove component" title="Remove component"
            className="ml-auto h-8 w-8 shrink-0 text-slate-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => onDeleteComponent(component.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {component.type === "section" && (
        <div
          className={cn(
            "rounded-xl border p-3",
            isColumn ? "border-green-100 bg-green-50/70" : "border-blue-100 bg-blue-50/70",
          )}
        >
          <div
            className={cn(
              "mb-1 text-sm font-medium",
              isColumn ? "text-green-800" : "text-blue-800",
            )}
          >
            {isColumn ? (
              <>Column Container</>
            ) : (
              <>
                {component.columns
                  ? `${component.columns} Column Section`
                  : "Section Container"}
                {component.isHero && " (Hero Template)"}
              </>
            )}
          </div>
          <div
            className={cn(
              "eb-info-chip",
              isColumn ? "text-green-600" : "text-blue-600",
            )}
          >
            {isColumn ? (
              <>
                Individual column with {component.children?.length || 0}{" "}
                component(s). Customize alignment, background, and layout.
              </>
            ) : (
              <>
                Contains {component.children?.length || 0} component(s).
                {component.columns &&
                  component.columns > 1 &&
                  " Each column can hold multiple components."}
                {component.isHero &&
                  " Pre-configured hero section with text and button."}
              </>
            )}
          </div>
        </div>
      )}

      {renderProperties()}

      {/* Common Properties */}
      {!hasDedicatedPaddingControl && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Move className="h-3.5 w-3.5" aria-hidden="true" />
            Spacing
          </h4>
          <div>
            <Label htmlFor="padding">Padding</Label>
            <PaddingInput
              value={component.padding || (
                component.type === "image"
                  ? "0 20px 0 20px"
                  : component.type === "text" || component.type === "Salutation"
                    ? getEmailComponentPadding(component.padding, "15px 20px 15px 20px", false)
                    : component.type === "isi" || component.type === "orserdu-isi-animated"
                      ? "0 10px 10px 10px"
                      : "0 20px 10px 20px"
              )}
              onChange={(value) => onUpdateComponent({ padding: value }, true)}
            />
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <MonitorSmartphone className="h-3.5 w-3.5" aria-hidden="true" />
          Responsive
        </h4>
        <div>
          <Label htmlFor="displayType">Display on</Label>
          <Select
            value={component.displayType || "all"}
            onValueChange={(value) =>
              onUpdateComponent({ displayType: value as "all" | "mobile-only" | "desktop-only" })
            }
          >
            <SelectTrigger id="displayType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="desktop-only">Desktop Only</SelectItem>
              <SelectItem value="mobile-only">Mobile Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="flex items-start gap-1.5 text-xs text-amber-600">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Responsiveness is only visible in Preview
        </p>
      </div>

      {/* Save to Saved Blocks */}
      {onSaveAsCustom && (
        <div className="pt-1">
          <Button
            variant="outline"
            onClick={() => {
              setBlockName(component.name || "");
              setIsSaveBlockOpen(true);
            }}
            size="sm"
            className="bg-white hover:bg-gray-50"
          >
            <BookmarkPlus className="h-4 w-4 text-blue-600" />
            Save to Saved Blocks
          </Button>
        </div>
      )}
      {/* text html editor modal */}
      <HtmlEditorModal
        isOpen={isHtmlEditorOpen}
        onClose={() => setIsHtmlEditorOpen(false)}
        initialValue={component.content || ""}
        onSave={(newHtml) => onUpdateComponent({ content: newHtml })}
      />
      {/* raw  */}
      <HtmlEditorModal
        isOpen={isRawHtmlEditorOpen}
        onClose={() => setIsRawHtmlEditorOpen(false)}
        initialValue={component.html || ""}
        onSave={saveRawHtml}
        onSaveBlock={saveRawHtmlBlock}
      />

      {/* Save to Saved Blocks dialog */}
      <Dialog open={isSaveBlockOpen} onOpenChange={setIsSaveBlockOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Saved Blocks</DialogTitle>
            <DialogDescription>
              Name this block so you can recognize it in the left menu.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="blockName">Block Name</Label>
            <Input
              id="blockName"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              placeholder="e.g. Hero section with button"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveBlockOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBlock} disabled={!blockName.trim()}>
              Save Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
