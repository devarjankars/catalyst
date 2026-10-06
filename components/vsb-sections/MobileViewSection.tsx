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
  /** When provided, the Download PDF button calls this instead of local logic */
  onExportPdf?: () => Promise<void>;
}

const MobileViewSection: React.FC<Props> = ({ data, onChange, isPreview = false, onExportPdf }) => {
  const { currentTemplate } = useEmailBuilderStore();
  const { currentVsb } = useVSBStore();
  const [pdfLoading, setPdfLoading] = useState(false);

  const headerDetails = currentVsb?.headerDetails || [];
  const isThreeMode = currentTemplate?.optionMode === 'three';
  const isTwoMode   = currentTemplate?.optionMode === 'two';
  const isMultiMode = isThreeMode || isTwoMode;
  const preheader = currentTemplate?.preheaderText || '';

  // Live store components (may differ from currentTemplate after ensureThreeOptions)
  const storeState = useEmailBuilderStore.getState();
  const opt1 = currentTemplate?.components || [];
  const opt2 = storeState.option2Components.length > 0
    ? storeState.option2Components
    : (currentTemplate?.option2Components || []);
  const opt3 = storeState.option3Components.length > 0
    ? storeState.option3Components
    : (currentTemplate?.option3Components || []);

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

  // Mobile override styles — force mobile media queries unconditionally for preview
  const mobileOverride = `<style>
    .mbl-show-table{display:table!important}
    .mbl-show-tr{display:table-row!important}
    .mbl-show-cell{display:table-cell!important}
    .desk-show-table{display:none!important}
    .desk-show-tr{display:none!important}
    .desk-show-cell{display:none!important}
    .mobile{display:inline-block!important}
    .desktop{display:none!important}
    .deskDisp{display:none!important}
    .mbDisp{display:table!important}
  </style>`;

  // Generate preview HTMLs (mobile mode)
  const htmls = options.map(opt => {
    const rawHtml = generateEmailHTML(opt.components, preheader, 'mobile');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const normalizedHtml = origin ? normalizeHtmlImageSrcs(rawHtml, origin) : rawHtml;
    const withMobile = normalizedHtml.replace(/<\/head>/i, `${mobileOverride}</head>`);

    const headerHtml = `
      <div style="background-color:#fff;padding-top:10px;padding-bottom:20px;">
        <div style="margin-left:20px;width:fit-content;border:1px solid #000;padding:5px;margin-bottom:10px;font-size:13px;background-color:#fff;color:black;font-weight:bold;">
          Mobile View${isMultiMode ? ` — ${opt.title}` : ''}
        </div>
        <div style="border-top:1px solid #000;">
          <div style="margin-left:20px;font-family:Arial,sans-serif;font-size:11px;line-height:1.5;padding-top:20px;">
            ${headerDetails.map(detail => {
              const fv = detail.value.replace(/(\[[^\]]*\])/g, '<b>$1</b>');
              return `<div style="margin-bottom:2px;"><span style="font-weight:bold;color:black;">${detail.name}: </span><span style="color:${detail.value.includes('[') || detail.value.includes(']') ? '#FF66CC' : 'black'};">${fv}</span></div>`;
            }).join('')}
          </div>
        </div>
      </div>`;

    const firstDivEnd = withMobile.indexOf('</div>');
    return firstDivEnd !== -1
      ? withMobile.slice(0, firstDivEnd + 6) + headerHtml + withMobile.slice(firstDivEnd + 6)
      : withMobile;
  });

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      if (onExportPdf) {
        // Delegate to parent — produces the full combined VSB PDF (desktop + mobile)
        await onExportPdf();
      }
    } catch (error) {
      console.error('PDF Generation failed:', error);
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
          <div key={idx} className='w-full max-w-[375px] border border-gray-200 shadow-lg overflow-hidden bg-white flex-none'>
            <iframe
              srcDoc={html}
              title={`Mobile Preview ${idx}`}
              className="w-full h-full border-none min-h-[600px]"
              style={{ width: '375px', height: '100%' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileViewSection;
