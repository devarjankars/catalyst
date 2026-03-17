"use server"

import React from 'react';
import { generatePdfBuffer, generatePdfFromReact, mergePdfBuffers, generateCombinedPdf } from '../lib/pdf-export-util2';
import ALtnamePdfview from '@/components/vsb-sections/ALtnamePdfview';

export async function handlePdfAction(html: string, viewMode: 'desktop' | 'mobile') {
    const buffer = await generatePdfBuffer(html, viewMode);
    return buffer.toString('base64');
}

export async function generateVariableCopyPdfAction(
    html: string
): Promise<string> {
    const pdf = await generatePdfBuffer(html, 'desktop');
    return pdf.toString('base64');
}

export async function generateAltNamePdfAction(
    html: string
): Promise<string> {
    const pdf = await generatePdfBuffer(html, 'desktop');
    return pdf.toString('base64');
}

export async function mergePdfsAction(base64Pdfs: string[]): Promise<string> {
    const buffers = base64Pdfs.map(b => Buffer.from(b, 'base64'));
    const merged = await mergePdfBuffers(buffers);
    return merged.toString('base64');
}

export async function generateCombinedPdfAction(params: {
    emailHtmlDesktop?: string;
    emailHtmlMobile?: string;
    variableCopyHtml?: string;
    altNameHtml?: string;
    emailName: string;
}) {
    const buffer = await generateCombinedPdf(params);
    return buffer.toString('base64');
}