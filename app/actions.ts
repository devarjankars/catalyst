"use server"

import { generatePdfBuffer, mergePdfBuffers, generateCombinedPdf } from '../lib/pdf-export-util2';

export async function handlePdfAction(html: string, viewMode: 'desktop' | 'mobile', customWidth?: string) {
    const buffer = await generatePdfBuffer(html, viewMode, customWidth);
    return buffer.toString('base64');
}

export async function generateVariableCopyPdfAction(html: string): Promise<string> {
    const pdf = await generatePdfBuffer(html, 'desktop');
    return pdf.toString('base64');
}

export async function generateAltNamePdfAction(html: string): Promise<string> {
    const pdf = await generatePdfBuffer(html, 'desktop');
    return pdf.toString('base64');
}

export async function mergePdfsAction(base64Pdfs: string[]): Promise<string> {
    const buffers = base64Pdfs.map(b => Buffer.from(b, 'base64'));
    const merged  = await mergePdfBuffers(buffers);
    return merged.toString('base64');
}

export async function generateCombinedPdfAction(params: {
    emailHtmlDesktop?:  string;
    emailHtmlMobile?:   string;
    emailHtmlsMobile?:  string[];   // array of individual mobile HTMLs for multi-option
    variableCopyHtml?:  string;
    altNameHtml?:       string;
    emailName:          string;
    desktopWidthOverride?: string;
    mobileWidthOverride?:  string;
}) {
    const buffer = await generateCombinedPdf(params);
    return buffer.toString('base64');
}