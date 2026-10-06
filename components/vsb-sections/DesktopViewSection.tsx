"use client"

import { generateEmailHTML } from '@/lib/email-generator';
import { normalizeHtmlImageSrcs } from '@/lib/asset-url';
import { useEmailBuilderStore } from '@/store/email-builder-store';
import { useVSBStore } from '@/store/vsb-store';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Download, Loader2 } from 'lucide-react';

interface Props {
  data: any;
  onChange: (data: any) => void;
  isPreview?: boolean;
  onExportPdf?: () => Promise<void>;
}

/** Extract header image URLs from VSB variableCopy in order (opt1, opt2, opt3) */
function getVsbHeaderImages(variableCopy: any[]): string[] {
  if (!Array.isArray(variableCopy)) return [];
  const section = variableCopy.find(
    (s: any) => s.structure === 'normal' &&
    typeof s.heading === 'string' &&
    s.heading.toLowerCase().includes('header image')
  );
  if (!section || !Array.isArray(section.options)) return [];
  return section.options.filter((o: any) => typeof o === 'string' && o.trim() !== '');
}

/** Replace the header-image src in a components array with the given URL */
function applyHeaderImage(components: any[], src: string): any[] {
  if (!src) return components;
  return components.map(c =>
    c.type === 'header-image' ? { ...c, src } : c
  );
}

const DesktopViewSection: React.FC<Props> = ({ data, onChange, isPreview = false, onExportPdf }) => {
  const { currentTemplate } = useEmailBuilderStore();
  const { currentVsb } = useVSBStore();
  const [pdfLoading, setPdfLoading] = useState(false);

  const headerDetails = currentVsb?.headerDetails || [];
  const isThreeMode = currentTemplate?.optionMode === 'three';
  const isTwoMode   = currentTemplate?.optionMode === 'two';
  const isMultiMode = isThreeMode || isTwoMode;
  const preheader = currentTemplate?.preheaderText || '';

  const storeState = useEmailBuilderStore.getState();
  const rawOpt1 = currentTemplate?.components || [];
  const rawOpt2 = storeState.option2Components.length > 0
    ? storeState.option2Components
    : (currentTemplate?.option2Components || []);
  const rawOpt3 = storeState.option3Components.length > 0
    ? storeState.option3Components
    : (currentTemplate?.option3Components || []);

  // Apply VSB header images to each option
  const vsbHeaders = getVsbHeaderImages(currentVsb?.variableCopy || []);
  const opt1 = vsbHeaders[0] ? applyHeaderImage(rawOpt1, vsbHeaders[0]) : rawOpt1;
  const opt2 = vsbHeaders[1] ? applyHeaderImage(rawOpt2, vsbHeaders[1]) : rawOpt2;
  const opt3 = vsbHeaders[2] ? applyHeaderImage(rawOpt3, vsbHeaders[2]) : rawOpt3;

  const options = isThreeMode
    ? [
        { title: 'Option 1', components: opt1 },
        { title: 'Option 2', components: opt2 },
        { title: 'Option 3', components: opt3 },
      ]
    : isTwoMode
    ? [
        { title: 'Option 1', components: opt1 },
        { title: 'Option 2', components: opt2 },
      ]
    : [{ title: 'Standard View', components: opt1 }];

  const htmls = options.map(opt => {
    const rawHtml = generateEmailHTML(opt.components, preheader, 'desktop');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const normalizedHtml = origin ? normalizeHtmlImageSrcs(rawHtml, origin) : rawHtml;

    const headerHtml = `
      <div>
        <div style="margin-left:20px;width:fit-content;border:1px solid #000;padding:5px;margin-bottom:10px;margin-top:10px;font-size:13px;font-weight:bold;">
          Desktop View${isMultiMode ? ` — ${opt.title}` : ''}
        </div>
        <div style="border-top:1px solid #000;">
          <div style="margin-bottom:20px;margin-left:20px;font-family:Arial,sans-serif;font-size:11px;line-height:1.5;padding-top:20px;">
            ${headerDetails.map(detail => {
              const fv = detail.value.replace(/(\[[^\]]*\])/g, '<b>$1</b>');
              return `<div style="margin-bottom:2px;"><span style="font-weight:bold;color:black;">${detail.name}: </span><span style="color:${detail.value.includes('[') || detail.value.includes(']') ? '#FF66CC' : 'black'};">${fv}</span></div>`;
            }).join('')}
          </div>
        </div>
      </div>`;

    const firstDivEnd = normalizedHtml.indexOf('</div>');
    return firstDivEnd !== -1
      ? normalizedHtml.slice(0, firstDivEnd + 6) + headerHtml + normalizedHtml.slice(firstDivEnd + 6)
      : normalizedHtml;
  });

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      if (onExportPdf) await onExportPdf();
    } catch (error) {
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className={`${isPreview ? '' : 'bg-gray-100 p-4'} w-full flex items-center flex-col`}>
      {!isPreview && (
        <div className='flex justify-end items-center mb-4'>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={pdfLoading || !onExportPdf}
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 h-8"
          >
            {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {pdfLoading ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      )}

      <div className={`w-full flex ${isMultiMode ? 'flex-row gap-6 overflow-x-auto pb-4 justify-start' : 'justify-center'} min-h-[600px]`}>
        {htmls.map((html, idx) => (
          <div key={idx} className="bg-white shadow-sm flex-none w-[600px] border border-gray-200 rounded-sm overflow-hidden">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DesktopViewSection;
