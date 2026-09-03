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

const MobileViewSection: React.FC<Props> = ({ data, onChange, isPreview = false }) => {
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
      <div style="background-color: #fff;padding-top:10px;padding-bottom:20px;">
        <div style="margin-left : 20px; width:fit-content; border:1px solid #000; padding:5px;margin-bottom:10px;font-size:13px;background-color: #fff;color:black; font-weight: bold;">
          Mobile View 
        </div>
        <div style="border-top:1px solid #000;">
          <div style="margin-left: 20px; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; padding-top: 20px;">
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

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const fileName = `${currentTemplate?.name || 'Template'}-Mobile-VSB.pdf`;
      if (isThreeMode && htmls.length > 1) {
        // Render each option inside its own 375px viewport so the mobile media
        // queries fire per column, then compose the three columns side-by-side.

        await exportVsbPdf([
          {
            columns: htmls.map(html => ({ html, width: 375 })),
            gap: 20,
          },
        ], fileName);
      } else {
        await exportVsbPdf([{ html: htmls[0], width: 375 }], fileName);
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
          <div key={idx} className='w-full max-w-[375px] border border-gray-200 shadow-lg overflow-hidden bg-white flex-none'>
            {/* Using iframe with srcdoc to force mobile media queries to trigger */}
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
