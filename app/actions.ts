"use server"

import { generatePdfBuffer, generatePdfFromReact, mergePdfBuffers } from '../lib/pdf-export-util2';

export async function handlePdfAction(html: string, viewMode: 'desktop' | 'mobile') {
    const buffer = await generatePdfBuffer(html, viewMode);
    // Convert Buffer to base64 to send it back to the client
    return buffer.toString('base64');
}

// export async function generateVariableCopyPdfAction(
//     data: VariableCopyProps
// ): Promise<string> {
//     const pdf = await generatePdfFromReact(<VariableCopyPage {...data} />, 'desktop');
//     return pdf.toString('base64');
// }

// export async function generateAltNamePdfAction(
//     data: AltNameProps
// ): Promise<string> {
//     const pdf = await generatePdfFromReact(<AltNamePage {...data} />, 'desktop');
//     return pdf.toString('base64');
// }

// // Final merge action — accepts already-generated base64 buffers
// export async function mergePdfsAction(base64Pdfs: string[]): Promise<string> {
//     const buffers = base64Pdfs.map(b => Buffer.from(b, 'base64'));
//     const merged  = await mergePdfBuffers(buffers);
//     return merged.toString('base64');
// }