import { chromium } from 'playwright';
import { reactToHtml } from './react-to-html';
import { PDFDocument } from 'pdf-lib';
import React from 'react';

export async function generatePdfBuffer(html: string, viewMode: 'desktop' | 'mobile') {
    const isMobile = viewMode === 'mobile';
    const browser = await chromium.launch({ args: ['--no-sandbox'] });

    try {
        const context = await browser.newContext({
            viewport: isMobile ? { width: 375, height: 800 } : { width: 1280, height: 800 },
            userAgent: isMobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)...' : undefined
        });

        const page = await context.newPage();
        await page.emulateMedia({ media: 'screen' });
        await page.setContent(html, { waitUntil: 'networkidle' });

        const bodyHeight = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight) + 5);


        return await page.pdf({
            width: isMobile ? '375px' : '600px',
            height: `${bodyHeight}px`,
            printBackground: true,
            preferCSSPageSize: false,
            landscape: false
        });
    } finally {
        await browser.close();
    }
}


export async function generatePdfFromReact(
    element: React.ReactElement,
    viewMode: 'desktop' | 'mobile' = 'desktop'
): Promise<Buffer> {
    const html = reactToHtml(element);
    return generatePdfBuffer(html, viewMode);
}

export async function mergePdfBuffers(pdfBuffers: Buffer[]): Promise<Buffer> {
    const mergedPdf = await PDFDocument.create();

    for (const buffer of pdfBuffers) {
        const pdf = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    return Buffer.from(mergedBytes);
}

export async function generateCombinedPdf({
    emailHtmlDesktop,
    emailHtmlMobile,
    variableCopyHtml,
    altNameHtml,
    emailName
}: {
    emailHtmlDesktop?: string;
    emailHtmlMobile?: string;
    variableCopyHtml?: string;
    altNameHtml?: string;
    emailName: string;
}): Promise<Buffer> {
    const pdfBuffers: Buffer[] = [];

    // 1. Variable Copy
    if (variableCopyHtml) {
        const variableCopyPdf = await generatePdfBuffer(variableCopyHtml, 'desktop');
        pdfBuffers.push(variableCopyPdf);
    }

    // 2. Desktop View
    if (emailHtmlDesktop) {
        const emailDesktopPdf = await generatePdfBuffer(emailHtmlDesktop, 'desktop');
        pdfBuffers.push(emailDesktopPdf);
    }

    // 3. Mobile View
    if (emailHtmlMobile) {
        const emailMobilePdf = await generatePdfBuffer(emailHtmlMobile, 'mobile');
        pdfBuffers.push(emailMobilePdf);
    }

    // 4. Alt Name Page
    if (altNameHtml) {
        const altNamePdf = await generatePdfBuffer(altNameHtml, 'desktop');
        pdfBuffers.push(altNamePdf);
    }

    return mergePdfBuffers(pdfBuffers);
}
