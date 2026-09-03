"use server"

import { generateCombinedPdfReactPdf, mergePdfBuffers } from '../lib/pdf-export-react-pdf';
import type { VariableSection } from '@/types/variableSectionTemplate';

export async function handlePdfAction(html: string, viewMode: 'desktop' | 'mobile', customWidth?: string, emailName?: string) {
  const pdfName = emailName || 'Template';

  const pdfParams: {
    emailHtmlDesktop?: string;
    emailHtmlMobile?: string;
    emailHtmlsMobile?: string[];
    variableCopyData?: { data: any; emailname: string; headingColor?: string };
    altNameData?: any;
    emailName: string;
    desktopWidthOverride?: string;
    mobileWidthOverride?: string;
  } = {
    emailHtmlDesktop: undefined,
    emailHtmlMobile: undefined,
    emailHtmlsMobile: undefined,
    variableCopyData: undefined,
    altNameData: undefined,
    emailName: pdfName,
    desktopWidthOverride: customWidth,
    mobileWidthOverride: customWidth,
  };

  if (viewMode === 'desktop') {
    pdfParams.emailHtmlDesktop = html;
    pdfParams.desktopWidthOverride = customWidth;
  } else {
    pdfParams.emailHtmlMobile = html;
    pdfParams.mobileWidthOverride = customWidth;
  }

  try {
    const buffer = await generateCombinedPdfReactPdf(pdfParams);
    return buffer.toString('base64');
  } catch (error) {
    console.error('[handlePdfAction] Error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
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
  emailHtmlDesktop?:   string;
  emailHtmlMobile?:    string;
  emailHtmlsMobile?:   string[];
  variableCopyData?:   { data: VariableSection[]; emailname: string; headingColor?: string };
  altNameData?:        { data: { images: Array<{ name: string; value: string }>; headingColor?: string } | Array<{ name: string; value: string }>; emailName?: string };
  variableCopyHtml?:   string;
  altNameHtml?:        string;
  emailName:           string;
  desktopWidthOverride?: string;
  mobileWidthOverride?:  string;
}) {
  try {
    const buffer = await generateCombinedPdfReactPdf({
      ...params,
      variableCopyData: params.variableCopyData ? {
        data: params.variableCopyData.data,
        emailname: params.variableCopyData.emailname,
        headingColor: params.variableCopyData.headingColor,
      } : undefined,
      altNameData: params.altNameData ? {
        data: params.altNameData.data,
        emailName: params.altNameData.emailName,
      } : undefined,
    });
    return buffer.toString('base64');
  } catch (error) {
    console.error('[generateCombinedPdfAction] Error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}