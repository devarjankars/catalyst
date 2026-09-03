"use client"

import { generateEmailHTML } from '@/lib/email-generator';
import { useEmailBuilderStore } from '@/store/email-builder-store';
import { useVSBStore } from '@/store/vsb-store';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Download, Loader2 } from 'lucide-react';
import { exportVsbPdf } from '@/lib/vsb-pdf-export';

interface Props {
  data: any;
  onChange: (data: any) => void;
  isPreview?: boolean;
}

const DesktopViewSection: React.FC<Props> = ({ data, onChange, isPreview = false }) => {
  const { currentTemplate } = useEmailBuilderStore();
  const { currentVsb } = useVSBStore();
  const [pdfLoading, setPdfLoading] = useState(false);

  const headerDetails = currentVsb?.headerDetails || [];
  const emailName = currentTemplate?.name || 'Template';
  
  const isThreeMode = currentTemplate?.optionMode === 'three';
  const preheader = currentTemplate?.preheaderText || '';

  const options = isThreeMode ? [
    { title: 'Option 1', components: currentTemplate?.components || [] },
    { title: 'Option 2', components: currentTemplate?.option2Components || [] },
    { title: 'Option 3', components: currentTemplate?.option3Components || [] },
  ] : [
    { title: 'Standard View', components: currentTemplate?.components || [] }
  ];

  // Generate HTML and insert header for each option
  const htmls = options.map(opt => {
    const rawHtml = generateEmailHTML(opt.components, preheader);
    
    const headerHtml = `
      <div>
        <div style="margin-left : 20px; width:fit-content; border:1px solid #000; padding:5px;margin-bottom:10px;margin-top:10px;font-size:13px; font-weight: bold;">
          Desktop View 
        </div>
        <div style="border-top:1px solid #000;">
          <div style="margin-bottom: 20px; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; padding-top: 20px;">
              ${headerDetails.map(detail => `
                  <div style="margin-bottom: 2px;">
                      <span style="font-weight: bold; color: black;">${detail.name}: </span>
                      <span style="color: ${detail.value.includes('[') || detail.value.includes(']') ? '#FF66CC' : 'black'};">
                        ${detail.value}
                      </span>
                  </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;

    let finalHtml = rawHtml;
    const firstDivEnd = rawHtml.indexOf('</div>');
    if (firstDivEnd !== -1) {
      finalHtml = rawHtml.slice(0, firstDivEnd + 6) + headerHtml + rawHtml.slice(firstDivEnd + 6);
    }
    return finalHtml;
  });

  // Combine into one large wrapper for the PDF if in three mode
  const combinedPdfHtml = isThreeMode 
    ? `<div style="display: flex; gap: 20px; align-items: flex-start; justify-content: center; width: 100%; min-width: 1900px; background-color: #f3f4f6; padding: 20px;">
        ${htmls.map((html, i) => `<div style="flex: 1; min-width: 600px; max-width: 600px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">${html}</div>`).join('')}
       </div>`
    : htmls[0];

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const fileName = `${currentTemplate?.name || 'Template'}-Desktop-VSB.pdf`;
      if (isThreeMode && htmls.length > 1) {
        // Render each 600px desktop option in its own viewport so the three
        // emails are composed side-by-side (mirrors the combined preview).
        await exportVsbPdf([
          {
            columns: htmls.map(html => ({ html, width: 600 })),
            gap: 20,
          },
        ], fileName);
      } else {
        await exportVsbPdf([{ html: combinedPdfHtml, width: 600 }], fileName);
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
            disabled={pdfLoading}
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 h-8"
          >
            {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      )}

      <div className={`w-full flex ${isThreeMode ? 'flex-row gap-6 overflow-x-auto pb-4 justify-start ' : 'justify-center'} min-h-[600px]`}>
        {htmls.map((html, idx) => (
          <div key={idx} className="bg-white shadow-sm flex-none w-[600px] border border-gray-200 rounded-sm overflow-hidden">
            <div dangerouslySetInnerHTML={{ __html: html }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DesktopViewSection;