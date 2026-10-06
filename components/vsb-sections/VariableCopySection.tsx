"use client"

import React, { useRef, useState } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { PlusCircle, X, Link, Image as ImageIcon, MousePointer2 } from 'lucide-react';
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
  options: Array<{ fromEmail: string; friendlyNames: string[] }>;
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

// ── Mandatory field detection ─────────────────────────────────────────────────
// These headings are required — marked with * and cannot be removed
const MANDATORY_PATTERN = /subject line|preheader|header image|friendly from/i

const isMandatorySection = (heading: string) => MANDATORY_PATTERN.test(heading)

// ── Shared heading row ────────────────────────────────────────────────────────
const HeadingRow: React.FC<{
  heading: string;
  mandatory: boolean;
  color?: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}> = ({ heading, mandatory, color, onChange, onRemove }) => (
  <div className="flex items-center mb-4 gap-2">
    <label className={`text-sm font-semibold w-24 shrink-0 flex items-center gap-0.5 ${color ?? 'text-gray-600'}`}>
      Heading
      {mandatory && <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>}
    </label>
    <Input
      value={heading}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 bg-white"
      placeholder="Section heading"
    />
    <Button
      variant="ghost"
      size="icon"
      onClick={onRemove}
      title={mandatory ? 'Mandatory field — cannot be removed' : 'Remove section'}
      disabled={mandatory}
      className={mandatory ? 'opacity-30 cursor-not-allowed' : ''}
    >
      <X size={16} />
    </Button>
  </div>
)

// ─── Normal section ───────────────────────────────────────────────────────────
const NormalSectionRenderer: React.FC<{
  section: NormalSection;
  idx: number;
  onUpdate: (updated: NormalSection) => void;
  onRemove: () => void;
}> = ({ section, idx, onUpdate, onRemove }) => {
  const templateImages = useEmailBuilderStore(state => state.templateImages);
  const namedTemplateImages = useEmailBuilderStore(state => state.namedTemplateImages);
  const addTemplateImage = useEmailBuilderStore(state => state.addTemplateImage);
  const { currentTemplate } = useEmailBuilderStore();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryOptionIdx, setGalleryOptionIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<number | null>(null);

  const isImageSection = section.heading.toLowerCase().includes('image');
  const mandatory = isMandatorySection(section.heading);
  const listLabel = section.listText ?? 'Option';

  const updateOption = (optIdx: number, value: string) =>
    onUpdate({ ...section, options: section.options.map((o, j) => j === optIdx ? value : o) });

  const openGallery = (optIdx: number) => { setGalleryOptionIdx(optIdx); setGalleryOpen(true); };

  const selectImageFromGallery = (url: string) => {
    if (galleryOptionIdx !== null) updateOption(galleryOptionIdx, url);
    setGalleryOpen(false);
    setGalleryOptionIdx(null);
  };

  const handleUploadClick = (optIdx: number) => {
    uploadTargetRef.current = optIdx;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadTargetRef.current === null) return;
    const optIdx = uploadTargetRef.current;
    setUploading(optIdx);
    try {
      const { firebaseService } = await import('@/services/firebase-service');
      const url = await firebaseService.uploadImage(file, currentTemplate?.id);
      if (url && url !== 'PATH_NOT_FOUND') {
        updateOption(optIdx, url);
        addTemplateImage(url);
      } else {
        alert('Please save the email first, then upload images.');
      }
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      uploadTargetRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`border rounded-lg p-4 relative ${mandatory ? 'bg-red-50/30 border-red-200' : 'bg-gray-50'}`}>
      {mandatory && (
        <span className="absolute top-2 right-10 text-[10px] font-semibold text-red-400 uppercase tracking-wide">
          Required
        </span>
      )}

      {/* Hidden file input for image upload */}
      {isImageSection && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      <HeadingRow
        heading={section.heading}
        mandatory={mandatory}
        onChange={(v) => onUpdate({ ...section, heading: v })}
        onRemove={onRemove}
      />

      <div className="space-y-3 ml-4">
        {section.options.map((opt, optIdx) => {
          const hasPreview = isImageSection && (opt.startsWith('data:image') || opt.startsWith('http') || opt.startsWith('/'));
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
                  placeholder={isImageSection ? 'Image URL or upload/select' : `${listLabel} ${optIdx + 1}`}
                />
                {isImageSection && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-9 w-9 bg-white"
                      onClick={() => handleUploadClick(optIdx)}
                      title="Upload image"
                      disabled={uploading === optIdx}
                    >
                      {uploading === optIdx
                        ? <span className="animate-spin text-xs">↻</span>
                        : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      }
                    </Button>
                    <Button variant="outline" size="icon" className="shrink-0 h-9 w-9 bg-white" onClick={() => openGallery(optIdx)} title="Select from gallery">
                      <ImageIcon size={14} />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={() => onUpdate({ ...section, options: section.options.filter((_, j) => j !== optIdx) })} className="shrink-0">
                  <X size={14} />
                </Button>
              </div>
              {hasPreview && (
                <div className="ml-24 mb-1">
                  <img src={opt} alt="Preview" className="h-16 w-auto rounded border border-gray-200" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
          );
        })}
        <Button variant="ghost" size="sm" onClick={() => onUpdate({ ...section, options: [...section.options, ''] })} className="mt-1 ml-20 text-gray-500">
          <PlusCircle className="mr-1" size={15} /> Add option
        </Button>
      </div>

      {/* Image Gallery Dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" /> Template Images Gallery
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {templateImages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No images found in this template.</p>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Click an image to select it for {listLabel} {galleryOptionIdx !== null ? galleryOptionIdx + 1 : ''}</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {templateImages.map((url, i) => {
                    const label = namedTemplateImages[url];
                    return (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 border-transparent hover:border-blue-300" onClick={() => selectImageFromGallery(url)}>
                        <img src={url} alt={label || 'gallery-img'} className="w-full h-full object-contain" />
                        {label && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-semibold text-center py-0.5 truncate px-0.5">
                            {label}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center opacity-0 hover:opacity-100">
                          <MousePointer2 className="text-blue-600 h-6 w-6" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Table section ─────────────────────────────────────────────────────────────
const TableSectionRenderer: React.FC<{
  section: TableSection;
  idx: number;
  onUpdate: (updated: TableSection) => void;
  onRemove: () => void;
}> = ({ section, idx, onUpdate, onRemove }) => {
  const mandatory = isMandatorySection(section.heading);
  return (
    <div className={`border rounded-lg p-4 relative ${mandatory ? 'bg-red-50/30 border-red-200' : 'bg-gray-50'}`}>
      {mandatory && (
        <span className="absolute top-2 right-10 text-[10px] font-semibold text-red-400 uppercase tracking-wide">
          Required
        </span>
      )}
      <HeadingRow
        heading={section.heading}
        mandatory={mandatory}
        onChange={(v) => onUpdate({ ...section, heading: v })}
        onRemove={onRemove}
      />
      <div className="ml-4">
        <SenderTable
          data={section.options}
          onChange={(updated) => onUpdate({ ...section, options: updated })}
        />
      </div>
    </div>
  );
};

// ─── Third-party placeholder section ──────────────────────────────────────────
const ThirdPartyPlaceholderRenderer: React.FC<{
  section: ThirdPartySection;
  idx: number;
  onUpdate: (updated: ThirdPartySection) => void;
  onRemove: () => void;
}> = ({ section, onUpdate, onRemove }) => {
  const mandatory = isMandatorySection(section.heading);
  return (
    <div className={`border rounded-lg p-4 relative ${mandatory ? 'bg-red-50/30 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      {mandatory && (
        <span className="absolute top-2 right-10 text-[10px] font-semibold text-red-400 uppercase tracking-wide">
          Required
        </span>
      )}
      <HeadingRow
        heading={section.heading}
        mandatory={mandatory}
        color="text-amber-700"
        onChange={(v) => onUpdate({ ...section, heading: v })}
        onRemove={onRemove}
      />
      <div className="flex items-center gap-2 mb-3 ml-4">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          <Link size={11} /> Third-party placeholder
        </span>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <label className="text-xs text-amber-500 w-20 shrink-0 uppercase tracking-wide">Value</label>
        <Input
          value={section.options[0] ?? ''}
          onChange={(e) => onUpdate({ ...section, options: [e.target.value] })}
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

  const addSection = () =>
    onChange([...variableCopy, { heading: '', options: [''], structure: 'normal', listText: 'Option' }]);

  const removeSection = (idx: number) =>
    onChange(variableCopy.filter((_, i) => i !== idx));

  const updateSection = (idx: number, updated: Section) =>
    onChange(variableCopy.map((s, i) => (i === idx ? updated : s)));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Variable Copy</h2>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span className="text-red-500 font-bold">*</span> = Required field
          </span>
        </div>
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
            switch (section.structure) {
              case 'table':
                return (
                  <TableSectionRenderer
                    key={idx}
                    section={section as TableSection}
                    idx={idx}
                    onUpdate={(updated) => updateSection(idx, updated)}
                    onRemove={() => removeSection(idx)}
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
