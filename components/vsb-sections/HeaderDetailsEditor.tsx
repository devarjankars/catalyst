"use client"

import React, { useState } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import { HeaderDetail } from '@/store/vsb-store';

interface Props {
  data: HeaderDetail[];
  onChange: (data: HeaderDetail[]) => void;
}

// ── Small inline color swatch + hex input ─────────────────────────────────────
function RowColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded border border-gray-200">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-[150%] w-[150%] -translate-x-[17%] -translate-y-[17%] cursor-pointer border-0 p-0"
          title={`${label} color`}
        />
      </div>
      <Input
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-[76px] h-6 font-mono text-[10px] px-1.5 py-0 uppercase"
        maxLength={7}
        placeholder="#000000"
      />
    </div>
  );
}

// ── Row item ──────────────────────────────────────────────────────────────────
function DetailRow({
  detail,
  idx,
  onUpdate,
  onRemove,
}: {
  detail: HeaderDetail;
  idx: number;
  onUpdate: (field: keyof HeaderDetail, value: string) => void;
  onRemove: () => void;
}) {
  const [showColors, setShowColors] = useState(false);

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2 group">
        {/* Label */}
        <div className="w-[28%] shrink-0">
          <Input
            value={detail.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="Label (e.g. To)"
            className="font-medium text-sm h-8"
            style={{ color: detail.nameColor || '#000000' }}
          />
        </div>
        {/* Value */}
        <div className="flex-1">
          <Input
            value={detail.value}
            onChange={(e) => onUpdate('value', e.target.value)}
            placeholder="Value"
            className="text-sm h-8"
            style={{ color: detail.valueColor || '#000000' }}
          />
        </div>
        {/* Color toggle */}
        <button
          onClick={() => setShowColors((v) => !v)}
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
          title="Row colors"
        >
          <Palette size={14} />
        </button>
        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="shrink-0 h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Expandable color row */}
      {showColors && (
        <div className="flex items-center gap-4 px-3 py-2 bg-white border-t border-gray-100">
          <RowColorPicker
            label="Label"
            value={detail.nameColor || '#000000'}
            onChange={(v) => onUpdate('nameColor', v)}
          />
          <RowColorPicker
            label="Value"
            value={detail.valueColor || '#000000'}
            onChange={(v) => onUpdate('valueColor', v)}
          />
          <button
            onClick={() => setShowColors(false)}
            className="ml-auto text-[10px] text-gray-400 hover:text-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const HeaderDetailsEditor: React.FC<Props> = ({ data, onChange }) => {
  const details = Array.isArray(data) ? data : [];

  const addDetail = () => {
    onChange([...details, { name: '', value: '', nameColor: '#000000', valueColor: '#000000' }]);
  };

  const removeDetail = (idx: number) => {
    onChange(details.filter((_, i) => i !== idx));
  };

  const updateDetail = (idx: number, field: keyof HeaderDetail, value: string) => {
    onChange(details.map((detail, i) =>
      i === idx ? { ...detail, [field]: value } : detail
    ));
  };

  return (
    <div className="mb-8 bg-white p-5 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h3 className="text-base font-semibold">Header Details</h3>
        <p className="text-xs text-gray-400">(Shared between Desktop &amp; Mobile)</p>
      </div>

      <div className="space-y-2">
        {details.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No header rows yet.</p>
        )}
        {details.map((detail, idx) => (
          <DetailRow
            key={idx}
            detail={detail}
            idx={idx}
            onUpdate={(field, value) => updateDetail(idx, field, value)}
            onRemove={() => removeDetail(idx)}
          />
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addDetail} className="mt-3">
        <PlusCircle className="mr-1.5" size={14} /> Add Row
      </Button>
    </div>
  );
};

export default HeaderDetailsEditor;
