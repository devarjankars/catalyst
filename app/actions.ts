"use server"

import { generateCombinedPdfReactPdf, mergePdfBuffers } from '../lib/pdf-export-react-pdf';
import type { VariableSection } from '@/types/variableSectionTemplate';

export async function handlePdfAction(html: string, viewMode: 'desktop' | 'mobile', customWidth?: string) {
  return Buffer.from(html).toString('base64');
}

export async function generateVariableCopyPdfAction(html: string): Promise<string> {
  return Buffer.from(html).toString('base64');
}

export async function generateAltNamePdfAction(html: string): Promise<string> {
  return Buffer.from(html).toString('base64');
}

export async function mergePdfsAction(base64Pdfs: string[]): Promise<string> {
  const buffers = base64Pdfs.map(b => Buffer.from(b, 'base64'));
  const merged = await mergePdfBuffers(buffers);
  return merged.toString('base64');
}

export async function generateCombinedPdfAction(params: {
  // Screenshot-based (new) — base64 PNG images captured client-side
  desktopImageBase64?:  string;
  desktopImagesBase64?: string[];
  mobileImageBase64?:   string;
  mobileImagesBase64?:  string[];
  // Legacy HTML-based params kept for backward compat (ignored)
  emailHtmlDesktop?:    string;
  emailHtmlMobile?:     string;
  emailHtmlsMobile?:    string[];
  // Always used
  variableCopyData?:    { data: VariableSection[]; emailname: string; headingColor?: string };
  altNameData?:         { data: { images: Array<{ name: string; value: string }>; headingColor?: string } | Array<{ name: string; value: string }>; emailName?: string };
  emailName:            string;
  desktopWidthOverride?: string;
  mobileWidthOverride?:  string;
}) {
  try {
    const buffer = await generateCombinedPdfReactPdf({
      desktopImageBase64:  params.desktopImageBase64,
      desktopImagesBase64: params.desktopImagesBase64,
      mobileImageBase64:   params.mobileImageBase64,
      mobileImagesBase64:  params.mobileImagesBase64,
      variableCopyData: params.variableCopyData ? {
        data: params.variableCopyData.data,
        emailname: params.variableCopyData.emailname,
        headingColor: params.variableCopyData.headingColor,
      } : undefined,
      altNameData: params.altNameData ? {
        data: params.altNameData.data,
        emailName: params.altNameData.emailName,
      } : undefined,
      emailName: params.emailName,
    });
    return buffer.toString('base64');
  } catch (error) {
    console.error('[generateCombinedPdfAction] Error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
