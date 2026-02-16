import { chromium } from 'playwright';

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