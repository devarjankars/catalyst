"use server"

import { generatePdfBuffer } from '../lib/pdf-export-util2';

export async function handlePdfAction(html: string, viewMode: 'desktop' | 'mobile') {
    const buffer = await generatePdfBuffer(html, viewMode);
    // Convert Buffer to base64 to send it back to the client
    return buffer.toString('base64');
}