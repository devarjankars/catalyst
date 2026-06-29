import { chromium } from 'playwright';
import { reactToHtml } from './react-to-html';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import React from 'react';

export async function generatePdfBuffer(
    html: string,
    viewMode: 'desktop' | 'mobile',
    customWidth?: string,
): Promise<Buffer> {
    const isMobile = viewMode === 'mobile';
    const browser = await chromium.launch({ args: ['--no-sandbox'] });

    try {
        const numericWidth = customWidth
            ? parseInt(customWidth, 10)
            : isMobile ? 375 : 1280;

        const context = await browser.newContext({
            viewport: { width: numericWidth, height: 900 },
            userAgent: isMobile && numericWidth <= 375
                ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                : undefined,
        });

        const page = await context.newPage();
        await page.emulateMedia({ media: 'screen' });
        await page.setContent(html, { waitUntil: 'networkidle' });

        const bodyHeight = await page.evaluate(() => {
            const docHeight     = document.documentElement.scrollHeight;
            const bodyScroll    = document.body.scrollHeight;
            const bodyOffset    = document.body.offsetHeight;
            const childBottoms  = Array.from(document.body.children).map(
                el => el.getBoundingClientRect().bottom
            );
            const maxChild = childBottoms.length ? Math.max(...childBottoms) : 0;
            return Math.ceil(Math.max(docHeight, bodyScroll, bodyOffset, maxChild)) + 40;
        });

        const pdfWidth = customWidth ?? (isMobile ? '375px' : '600px');

        return await page.pdf({
            width: pdfWidth,
            height: `${bodyHeight}px`,
            printBackground: true,
            preferCSSPageSize: false,
            landscape: false,
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
        copiedPages.forEach(p => mergedPdf.addPage(p));
    }
    return Buffer.from(await mergedPdf.save());
}

/**
 * Renders each HTML string as a separate 375px-viewport PDF, then stitches
 * all of them side-by-side onto a single wide PDF page.
 * This is the only reliable way to get true mobile rendering for each column —
 * putting them in a flex container shares a single viewport, so media queries
 * fire based on the total (1200px) width, not each column's 375px width.
 */
export async function generateMobileMultiOptionPdf(
    mobileHtmls: string[],
    gap = 20,
    padding = 20,
): Promise<Buffer> {
    // 1. Render each option individually at true 375px mobile viewport
    const columnBuffers = await Promise.all(
        mobileHtmls.map(html => generatePdfBuffer(html, 'mobile'))
    );

    // 2. Load all column PDFs
    const columnDocs = await Promise.all(
        columnBuffers.map(buf => PDFDocument.load(buf))
    );

    // 3. Find the tallest column so we can size the canvas
    const columnHeights = columnDocs.map(doc => doc.getPage(0).getHeight());
    const columnWidths  = columnDocs.map(doc => doc.getPage(0).getWidth());
    const maxHeight     = Math.max(...columnHeights);
    const totalWidth    = columnWidths.reduce((sum, w) => sum + w, 0)
                        + gap * (mobileHtmls.length - 1)
                        + padding * 2;
    const canvasHeight  = maxHeight + padding * 2;

    // 4. Create a single wide page and embed each column into it
    const merged = await PDFDocument.create();
    const canvas  = merged.addPage([totalWidth, canvasHeight]);

    // Draw grey background matching the desktop container (#f3f4f6 = rgb 243,244,246)
    canvas.drawRectangle({
        x: 0,
        y: 0,
        width: totalWidth,
        height: canvasHeight,
        color: rgb(243 / 255, 244 / 255, 246 / 255),
    });

    let x = padding;
    for (const doc of columnDocs) {
        const [embeddedPage] = await merged.embedPages([doc.getPage(0)]);
        const colW = doc.getPage(0).getWidth();
        const colH = doc.getPage(0).getHeight();
        canvas.drawPage(embeddedPage, {
            x,
            // Align tops: PDF origin is bottom-left, so offset from bottom
            y: canvasHeight - padding - colH,
            width: colW,
            height: colH,
        });
        x += colW + gap;
    }

    return Buffer.from(await merged.save());
}

export async function generateCombinedPdf({
    emailHtmlDesktop,
    emailHtmlMobile,
    emailHtmlsMobile,   // NEW: array of individual mobile HTMLs for multi-option
    variableCopyHtml,
    altNameHtml,
    emailName,
    desktopWidthOverride,
    mobileWidthOverride,
}: {
    emailHtmlDesktop?: string;
    emailHtmlMobile?: string;
    emailHtmlsMobile?: string[];  // NEW
    variableCopyHtml?: string;
    altNameHtml?: string;
    emailName: string;
    desktopWidthOverride?: string;
    mobileWidthOverride?: string;
}): Promise<Buffer> {
    const pdfBuffers: Buffer[] = [];

    // 1. Variable Copy
    if (variableCopyHtml) {
        pdfBuffers.push(await generatePdfBuffer(variableCopyHtml, 'desktop'));
    }

    // 2. Desktop View
    if (emailHtmlDesktop) {
        pdfBuffers.push(await generatePdfBuffer(emailHtmlDesktop, 'desktop', desktopWidthOverride));
    }

    // 3. Mobile View
    if (emailHtmlsMobile && emailHtmlsMobile.length > 1) {
        // Multi-option: render each at true 375px then stitch side-by-side at PDF level
        pdfBuffers.push(await generateMobileMultiOptionPdf(emailHtmlsMobile));
    } else if (emailHtmlMobile) {
        // Single option: straightforward 375px render
        pdfBuffers.push(await generatePdfBuffer(emailHtmlMobile, 'mobile'));
    }

    // 4. Alt Name Page
    if (altNameHtml) {
        pdfBuffers.push(await generatePdfBuffer(altNameHtml, 'desktop'));
    }

    return mergePdfBuffers(pdfBuffers);
}