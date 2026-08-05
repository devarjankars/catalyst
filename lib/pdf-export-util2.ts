import { chromium } from 'playwright';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import https from 'https';
import http from 'http';

// ── Fetch a URL and return it as a base64 data URI ────────────────────────────
async function urlToDataUri(url: string): Promise<string | null> {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { timeout: 8000 }, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                const mime = res.headers['content-type'] || 'image/png';
                resolve(`data:${mime};base64,${buf.toString('base64')}`);
            });
            res.on('error', () => resolve(null));
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
}

// ── Replace all <img src="..."> with inline base64 data URIs ─────────────────
// Also resolves relative /path.png against the app base URL
async function inlineImages(html: string, appBaseUrl: string): Promise<string> {
    const srcPattern = /(<img[^>]+src=["'])([^"']+)(["'])/gi;
    const matches: Array<{ full: string; prefix: string; src: string; suffix: string }> = [];

    let m: RegExpExecArray | null;
    while ((m = srcPattern.exec(html)) !== null) {
        matches.push({ full: m[0], prefix: m[1], src: m[2], suffix: m[3] });
    }

    for (const match of matches) {
        let { src } = match;

        // Skip already-inlined images
        if (src.startsWith('data:')) continue;

        // Resolve relative paths to absolute
        if (src.startsWith('/')) {
            src = `${appBaseUrl}${src}`;
        } else if (!src.startsWith('http')) {
            src = `${appBaseUrl}/${src}`;
        }

        const dataUri = await urlToDataUri(src);
        if (dataUri) {
            html = html.replace(match.full, `${match.prefix}${dataUri}${match.suffix}`);
        }
    }

    return html;
}

// ── Detect the running Next.js port ──────────────────────────────────────────
function getAppBaseUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
}

export async function generatePdfBuffer(
    html: string,
    viewMode: 'desktop' | 'mobile',
    customWidth?: string,
): Promise<Buffer> {
    const isMobile = viewMode === 'mobile';

    // Inline all images as base64 so Playwright doesn't need to fetch them
    const appBase = getAppBaseUrl();
    const inlinedHtml = await inlineImages(html, appBase);

    const browser = await chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
        const numericWidth = customWidth
            ? parseInt(customWidth, 10)
            : isMobile ? 375 : 600;

        const context = await browser.newContext({
            viewport: { width: numericWidth, height: 900 },
            ignoreHTTPSErrors: true,
            userAgent: isMobile && numericWidth <= 375
                ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                : undefined,
        });

        const page = await context.newPage();
        await page.emulateMedia({ media: 'screen' });

        // Use setContent — all images are already base64 so no network fetches needed
        await page.setContent(inlinedHtml, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for any remaining dynamic images (e.g. CSS backgrounds loaded via JS)
        await page.evaluate(() => {
            return new Promise<void>((resolve) => {
                const imgs = Array.from(document.querySelectorAll('img'));
                if (imgs.length === 0) { resolve(); return; }
                let pending = imgs.length;
                const done = () => { if (--pending === 0) resolve(); };
                imgs.forEach(img => {
                    if (img.complete) { done(); }
                    else {
                        img.addEventListener('load', done);
                        img.addEventListener('error', done);
                    }
                });
                setTimeout(resolve, 3000);
            });
        });

        await page.waitForTimeout(200);

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
    emailHtmlsMobile,
    variableCopyHtml,
    altNameHtml,
    emailName,
    desktopWidthOverride,
    mobileWidthOverride,
}: {
    emailHtmlDesktop?: string;
    emailHtmlMobile?: string;
    emailHtmlsMobile?: string[];
    variableCopyHtml?: string;
    altNameHtml?: string;
    emailName: string;
    desktopWidthOverride?: string;
    mobileWidthOverride?: string;
}): Promise<Buffer> {
    const pdfBuffers: Buffer[] = [];

    // 1. Variable Copy
    if (variableCopyHtml) {
        console.log('[PDF] Generating variable copy...');
        try {
            pdfBuffers.push(await generatePdfBuffer(variableCopyHtml, 'desktop'));
            console.log('[PDF] Variable copy done.');
        } catch (e) { throw new Error(`Variable copy page failed: ${(e as Error).message}`); }
    }

    // 2. Desktop View
    if (emailHtmlDesktop) {
        console.log('[PDF] Generating desktop view...');
        try {
            pdfBuffers.push(await generatePdfBuffer(emailHtmlDesktop, 'desktop', desktopWidthOverride));
            console.log('[PDF] Desktop view done.');
        } catch (e) { throw new Error(`Desktop view page failed: ${(e as Error).message}`); }
    }

    // 3. Mobile View
    if (emailHtmlsMobile && emailHtmlsMobile.length > 1) {
        console.log('[PDF] Generating mobile multi-option view...');
        try {
            pdfBuffers.push(await generateMobileMultiOptionPdf(emailHtmlsMobile));
            console.log('[PDF] Mobile multi-option done.');
        } catch (e) { throw new Error(`Mobile multi-option view failed: ${(e as Error).message}`); }
    } else if (emailHtmlMobile) {
        console.log('[PDF] Generating mobile view...');
        try {
            pdfBuffers.push(await generatePdfBuffer(emailHtmlMobile, 'mobile'));
            console.log('[PDF] Mobile view done.');
        } catch (e) { throw new Error(`Mobile view page failed: ${(e as Error).message}`); }
    }

    // 4. Alt Name Page
    if (altNameHtml) {
        console.log('[PDF] Generating alt name page...');
        try {
            pdfBuffers.push(await generatePdfBuffer(altNameHtml, 'desktop'));
            console.log('[PDF] Alt name page done.');
        } catch (e) { throw new Error(`Alt name page failed: ${(e as Error).message}`); }
    }

    console.log(`[PDF] Merging ${pdfBuffers.length} pages...`);
    return mergePdfBuffers(pdfBuffers);
}