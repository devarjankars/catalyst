"use client"

import { generateEmailHTML } from '@/lib/email-generator';
import { useEmailBuilderStore } from '@/store/email-builder-store';
import { useVSBStore } from '@/store/vsb-store';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Download, Loader2 } from 'lucide-react';
import { handlePdfAction } from '@/app/actions';

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
  const htmlContent = generateEmailHTML(currentTemplate?.components || [], currentTemplate?.preheaderText || '')

  // Construct the header HTML string (styled for PDF/Preview)
  const headerHtml = `
  <div >
    <div style="margin-left : 20px; width:fit-content; border:1px solid #000; padding:5px;margin-bottom:10px;margin-top:10px;font-size:13px;">
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

  // Insert headerHtml after the first </div> (usually the preheader)
  let finalHtml = htmlContent;
  const firstDivEnd = htmlContent.indexOf('</div>');
  if (firstDivEnd !== -1) {
    finalHtml = htmlContent.slice(0, firstDivEnd + 6) + headerHtml + htmlContent.slice(firstDivEnd + 6);
  }

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const base64 = await handlePdfAction(finalHtml, 'desktop');
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = `${currentTemplate?.name || 'Template'}-Desktop-VSB.pdf`;
      link.click();
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className={`${isPreview ? '' : 'bg-white p-4'} w-full flex item-cemter flex-col`}>
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

      <div className=' bg-white min-h-[600px]'>
        <div className='w-full'>
          {/* Email Content with Header Details Inserted */}
          <div dangerouslySetInnerHTML={{ __html: finalHtml }}></div>
        </div>
      </div>
    </div>
  );
};

export default DesktopViewSection;
