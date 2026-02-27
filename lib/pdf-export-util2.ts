import { chromium } from 'playwright';
import { renderToStaticMarkup } from 'react-dom/server';
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
            width: isMobile ? '375px' : '1280px',
            height: `${bodyHeight}px`,
            printBackground: true,
            preferCSSPageSize: false
        });
    } finally {
        await browser.close();
    }
}



function reactToHtml(element: React.ReactElement): string {
    const bodyHtml = renderToStaticMarkup(element);
    
    // Wrap with full HTML doc so styles/fonts load correctly
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <!-- Add your global CSS / Tailwind CDN / font links here -->
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: sans-serif; }
            </style>
        </head>
        <body>
            ${bodyHtml}
        </body>
        </html>
    `;
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
    variableCopyData,
    altNameData,
}: {
    emailHtmlDesktop: string;
    emailHtmlMobile: string;
    variableCopyData: VariableCopyProps;   // your component's props type
    altNameData: AltNameProps;
}): Promise<Buffer> {

    const emailDesktopPdf = await generatePdfBuffer(emailHtmlDesktop, 'desktop');
    const emailMobilePdf  = await generatePdfBuffer(emailHtmlMobile, 'mobile');

    // React elements → PDF directly
    const variableCopyPdf = await generatePdfFromReact(
        <VariableCopyPage {...variableCopyData} />,
        'desktop'
    );
    const altNamePdf = await generatePdfFromReact(
        <AltNamePage {...altNameData} />,
        'desktop'
    );

    return mergePdfBuffers([
        emailDesktopPdf,
        emailMobilePdf,
        variableCopyPdf,
        altNamePdf,
    ]);
}