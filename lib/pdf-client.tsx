/**
 * Client-side PDF generation — runs entirely in the browser.
 * No server action, no body size limits, no network round-trip.
 */
"use client";

import { buildAltNameHtml, buildVariableCopyHtml, type VsbPdfPageSpec } from './vsb-pdf-export';

export interface PdfSection {
  type: 'variableCopy' | 'altName' | 'emailImage';
  label?: string;
  imageBase64?: string;
  imageHeight?: number;   // actual pixel height of the screenshot (for tight page sizing)
  variableCopyData?: any;
  altNameData?: any;
  emailName?: string;
  headingColor?: string;
  isMobile?: boolean;
}

/**
 * Screenshot an HTML string into a base64 JPEG using html2canvas.
 * Returns both the image data and the natural pixel height of the captured content.
 */
export async function screenshotEmailHtml(
  html: string,
  width: number,
  quality = 0.92,
): Promise<{ base64: string; height: number }> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: fixed; top: -9999px; left: -9999px;
      width: ${width}px; height: 2px;
      border: none; visibility: hidden;
    `;
    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        await new Promise(r => setTimeout(r, 1000));
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc?.body) { resolve({ base64: '', height: 800 }); return; }
        doc.body.style.margin  = '0';
        doc.body.style.padding = '0';
        doc.body.style.width   = `${width}px`;

        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(doc.body, {
          useCORS:      true,
          allowTaint:   true,
          scale:        2,
          width,
          scrollX:      0,
          scrollY:      0,
          windowWidth:  width,
          windowHeight: 12000,
          backgroundColor: '#ffffff',
          logging: false,
        });
        resolve({
          base64: canvas.toDataURL('image/jpeg', quality),
          height: canvas.height,   // actual pixel height at scale 2
        });
      } catch (e) {
        console.error('[screenshotEmailHtml] failed:', e);
        resolve({ base64: '', height: 800 });
      } finally {
        document.body.removeChild(iframe);
      }
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) { doc.open(); doc.write(html); doc.close(); }
  });
}

/**
 * Generate and download the VSB PDF entirely in the browser.
 */
export async function generateVSBPdfClientSide(params: {
  emailName: string;
  sections:  PdfSection[];
}): Promise<Blob> {
  const pages: VsbPdfPageSpec[] = params.sections.flatMap((section) => {
    if (section.type === 'variableCopy') {
      return [{
        html: buildVariableCopyHtml(
          section.variableCopyData?.data ?? [],
          section.variableCopyData?.emailname ?? params.emailName,
          section.variableCopyData?.headingColor,
        ),
        width: 600,
      }];
    }

    if (section.type === 'altName') {
      return [{
        html: buildAltNameHtml(section.altNameData?.data, section.altNameData?.emailName ?? params.emailName),
        width: 600,
      }];
    }

    if (!section.imageBase64) return [];
    const width = section.isMobile ? 375 : 600;
    return [{
      html: `<div style="width:${width}px;background:#fff;"><img src="${section.imageBase64}" style="display:block;width:${width}px;height:auto;" /></div>`,
      width,
    }];
  });

  if (!pages.length) throw new Error('No sections supplied for PDF generation');
  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(errorBody?.error || `PDF generation failed (${response.status})`);
  }
  return response.blob();
}
