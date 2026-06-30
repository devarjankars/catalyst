"use client"

import React, { useRef, useState } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { PlusCircle, Upload, X, Link, Image as ImageIcon, Check, MousePointer2 } from 'lucide-react';
import SenderTable from './friendlyFromTable';
import { useEmailBuilderStore } from '@/store/email-builder-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NormalSection {
  heading: string;
  options: string[];
  structure: 'normal';
  listText?: string | null;
}

interface TableSection {
  heading: string;
  options: Array<{
    fromEmail: string;
    friendlyNames: string[];
  }>;
  structure: 'table';
  listText?: null;
}

interface ThirdPartySection {
  heading: string;
  options: string[];
  structure: 'third-party-placeholder';
  listText?: null;
}

type Section = NormalSection | TableSection | ThirdPartySection;

interface Props {
  data: Section[];
  color?: string;
  onColorChange?: (color: string) => void;
  onChange: (data: Section[]) => void;
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────────

/** "normal" structure — plain text options (with optional image gallery) */
const NormalSectionRenderer: React.FC<{
  section: NormalSection;
  idx: number;
  onUpdate: (updated: NormalSection) => void;
  onRemove: () => void;
}> = ({ section, idx, onUpdate, onRemove }) => {
  const templateImages = useEmailBuilderStore(state => state.templateImages);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryOptionIdx, setGalleryOptionIdx] = useState<number | null>(null);
  const isImageSection = section.heading.toLowerCase().includes('image');

  const updateHeading = (value: string) =>
    onUpdate({ ...section, heading: value });

  const addOption = () =>
    onUpdate({ ...section, options: [...section.options, ''] });

  const removeOption = (optIdx: number) =>
    onUpdate({ ...section, options: section.options.filter((_, j) => j !== optIdx) });

  const updateOption = (optIdx: number, value: string) =>
    onUpdate({
      ...section,
      options: section.options.map((o, j) => (j === optIdx ? value : o)),
    });

  const openGallery = (optIdx: number) => {
    setGalleryOptionIdx(optIdx);
    setGalleryOpen(true);
  };

  const selectImageFromGallery = (url: string) => {
    if (galleryOptionIdx !== null) {
      updateOption(galleryOptionIdx, url);
    }
    setGalleryOpen(false);
    setGalleryOptionIdx(null);
  };

  const listLabel = section.listText ?? 'Option';

  return (
    <div className="border rounded-lg p-4 relative bg-gray-50">
      {/* Heading row */}
      <div className="flex items-center mb-4 gap-2">
        <label className="text-sm font-semibold text-gray-600 w-20 shrink-0">Heading</label>
        <Input
          value={section.heading}
          onChange={(e) => updateHeading(e.target.value)}
          className="flex-1 bg-white"
          placeholder="Section heading"
        />
        <Button variant="ghost" size="icon" onClick={onRemove} title="Remove section">
          <X size={16} />
        </Button>
      </div>

      {/* Options */}
      <div className="space-y-3 ml-4">
        {section.options.map((opt, optIdx) => {
          const hasPreview =
            isImageSection && (opt.startsWith('data:image') || opt.startsWith('http'));

          return (
            <div key={optIdx} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-20 shrink-0 uppercase tracking-wide">
                  {listLabel} {optIdx + 1}
                </label>
                <Input
                  value={opt}
                  onChange={(e) => updateOption(optIdx, e.target.value)}
                  className="flex-1 bg-white"
                  placeholder={
                    isImageSection ? 'Image URL or select from gallery' : `${listLabel} ${optIdx + 1}`
                  }
                />

                {isImageSection && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-9 w-9 bg-white"
                      onClick={() => openGallery(optIdx)}
                      title="Select from gallery"
                    >
                      <ImageIcon size={14} />
                    </Button>
                  </>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(optIdx)}
                  title="Remove option"
                  className="shrink-0"
                >
                  <X size={14} />
                </Button>
              </div>

              {hasPreview && (
                <div className="ml-24 mb-1">
                  <img
                    src={opt}
                    alt="Preview"
                    className="h-16 w-auto rounded border border-gray-200"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          );
        })}

        <Button variant="ghost" size="sm" onClick={addOption} className="mt-1 ml-20 text-gray-500">
          <PlusCircle className="mr-1" size={15} /> Add option
        </Button>
      </div>

      {/* Image Gallery Dialog */}
      {galleryOpen && templateImages.length > 0 && (
        <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" /> Template Images Gallery
                </span>
                <Button variant="ghost" size="icon" onClick={() => setGalleryOpen(false)}>
                  <X size={20} />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-gray-500 mb-4">Click an image to select it for {listLabel} {galleryOptionIdx !== null ? galleryOptionIdx + 1 : ''}</p>
              <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3'>
                {templateImages.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 active:scale-95 border-transparent hover:border-gray-300"
                    onClick={() => selectImageFromGallery(url)}
                  >
                    <img
                      src={url}
                      alt='gallery-img'
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center opacity-0 hover:opacity-100">
                      <MousePointer2 className="text-blue-600 h-6 w-6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {galleryOpen && templateImages.length === 0 && (
        <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
          <DialogContent className="max-w-md p-6 text-center">
            <DialogHeader>
              <DialogTitle>No Template Images</DialogTitle>
            </DialogHeader>
            <p className="text-gray-500 mb-4">No images found in this template. Please upload images to the template first.</p>
            <Button variant="outline" onClick={() => setGalleryOpen(false)}>Close</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

/** "table" structure — friendly-from table via SenderTable */
const TableSectionRenderer: React.FC<{
  section: TableSection;
  idx: number;
  onUpdate: (updated: TableSection) => void;
  onRemove: () => void;
}> = ({ section, idx, onUpdate, onRemove }) => {
  const updateHeading = (value: string) =>
    onUpdate({ ...section, heading: value });

  return (
    <div className="border rounded-lg p-4 relative bg-gray-50">
      {/* Heading row */}
      <div className="flex items-center mb-4 gap-2">
        <label className="text-sm font-semibold text-gray-600 w-20 shrink-0">Heading</label>
        <Input
          value={section.heading}
          onChange={(e) => updateHeading(e.target.value)}
          className="flex-1 bg-white"
          placeholder="Section heading"
        />
        <Button variant="ghost" size="icon" onClick={onRemove} title="Remove section">
          <X size={16} />
        </Button>
      </div>

      {/* Delegate to SenderTable for editing */}
      <div className="ml-4">
        <SenderTable
          data={section.options}
          onChange={(updated) => onUpdate({ ...section, options: updated })}
        />
      </div>
    </div>
  );
};

/** "third-party-placeholder" structure — a single external URL / embed field */
const ThirdPartyPlaceholderRenderer: React.FC<{
  section: ThirdPartySection;
  idx: number;
  onUpdate: (updated: ThirdPartySection) => void;
  onRemove: () => void;
}> = ({ section, onUpdate, onRemove }) => {
  const updateHeading = (value: string) =>
    onUpdate({ ...section, heading: value });

  const updatePlaceholder = (value: string) =>
    onUpdate({ ...section, options: [value] });

  return (
    <div className="border rounded-lg p-4 relative bg-amber-50 border-amber-200">
      {/* Heading row */}
      <div className="flex items-center mb-4 gap-2">
        <label className="text-sm font-semibold text-amber-700 w-20 shrink-0">Heading</label>
        <Input
          value={section.heading}
          onChange={(e) => updateHeading(e.target.value)}
          className="flex-1 bg-white"
          placeholder="Placeholder label"
        />
        <Button variant="ghost" size="icon" onClick={onRemove} title="Remove section">
          <X size={16} />
        </Button>
      </div>

      {/* Badge */}
      <div className="flex items-center gap-2 mb-3 ml-4">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          <Link size={11} /> Third-party placeholder
        </span>
      </div>

      {/* Single placeholder value */}
      <div className="flex items-center gap-2 ml-4">
        <label className="text-xs text-amber-500 w-20 shrink-0 uppercase tracking-wide">
          Value
        </label>
        <Input
          value={section.options[0] ?? ''}
          onChange={(e) => updatePlaceholder(e.target.value)}
          className="flex-1 bg-white"
          placeholder="External placeholder value or URL"
        />
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const VariableCopySection: React.FC<Props> = ({ data, color, onColorChange, onChange }) => {
  const variableCopy: Section[] = Array.isArray(data) ? data : [];

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addSection = () => {
    const updated: Section[] = [
      ...variableCopy,
      { heading: '', options: [''], structure: 'normal', listText: 'Option' },
    ];
    onChange(updated);
  };

  const removeSection = (idx: number) =>
    onChange(variableCopy.filter((_, i) => i !== idx));

  const updateSection = (idx: number, updated: Section) =>
    onChange(variableCopy.map((s, i) => (i === idx ? updated : s)));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Variable Copy</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 font-medium">Theme Color:</label>
          <input
            type="color"
            value={color || '#FF66CC'}
            onChange={(e) => onColorChange?.(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
            title="Change theme color"
          />
        </div>
      </div>

      {/* Sections */}
      {variableCopy.length === 0 ? (
        <p className="text-gray-400 mb-4 text-sm">No variable copy added yet.</p>
      ) : (
        <div className="space-y-4">
          {variableCopy.map((section, idx) => {
            console.log(section)
            switch (section.structure) {
              case 'table':
                return (
                  <SenderTable
  data={section.options}
  onChange={(updated) => updateSection(idx, { ...section, options: updated })}
/>

                );

              case 'third-party-placeholder':
                return (
                  <ThirdPartyPlaceholderRenderer
                    key={idx}
                    section={section as ThirdPartySection}
                    idx={idx}
                    onUpdate={(updated) => updateSection(idx, updated)}
                    onRemove={() => removeSection(idx)}
                  />
                );

              case 'normal':
              default:
                return (
                  <NormalSectionRenderer
                    key={idx}
                    section={section as NormalSection}
                    idx={idx}
                    onUpdate={(updated) => updateSection(idx, updated)}
                    onRemove={() => removeSection(idx)}
                  />
                );
            }
          })}
        </div>
      )}

      {/* Add section */}
      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={addSection}>
          <PlusCircle className="mr-1" size={18} /> Add section
        </Button>
      </div>
    </div>
  );
};

export default VariableCopySection;
