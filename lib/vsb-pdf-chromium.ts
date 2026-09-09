// Use chromium-min so the binary is NOT bundled into the Lambda package.
// On Vercel it is downloaded at cold-start from the CDN URL below; locally
// Playwright manages its own browser and the import is never invoked.
import serverlessChromium from '@sparticuz/chromium-min';
import { chromium as playwrightChromium } from 'playwright-core';
import { PDFDocument } from 'pdf-lib';
import type { VsbPdfColumn, VsbPdfPageSpec } from './vsb-pdf-export';

// ── Chromium remote package URL ───────────────────────────────────────────────
// Must match the exact version of @sparticuz/chromium-min installed.
// Update this URL whenever you bump the chromium-min version.
const CHROMIUM_REMOTE_EXEC_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar';

const DEFAULT_WIDTH = 600;
const MAX_PAGE_HEIGHT = 20000;

function extractDocumentParts(source: string): { styles: string; body: string } {
  const head = source.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? source;
  return { styles: head, body };
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function buildPageHtml(spec: VsbPdfPageSpec, baseUrl?: string): string {
  const baseTag = baseUrl ? `<base href="${escapeHtmlAttribute(baseUrl)}">` : '';

  if (spec.columns?.length) {
    const columns = spec.columns.map((column: VsbPdfColumn) => {
      const parts = extractDocumentParts(column.html);
      return `<div class="pdf-column" style="width:${column.width}px;flex:0 0 ${column.width}px;">${parts.styles}${parts.body}</div>`;
    }).join('');
    return `<!doctype html><html><head><meta charset="utf-8">${baseTag}<style>${printStyles(spec.pageWidth ?? 0)}</style></head><body><main class="pdf-columns" style="gap:${spec.gap ?? 24}px;">${columns}</main></body></html>`;
  }

  const source = spec.html ?? '<div></div>';
  const parts = extractDocumentParts(source);
  return `<!doctype html><html><head><meta charset="utf-8">${baseTag}${parts.styles}<style>${printStyles(spec.width ?? DEFAULT_WIDTH)}</style></head><body>${parts.body}</body></html>`;
}

function printStyles(width: number): string {
  const mobileEmailStyles = width === 375 ? `
    .email-container { width: 100% !important; max-width: 100% !important; }
    .email-container img { max-width: 100% !important; height: auto !important; }
  ` : '';

  return `
    @page { margin: 0; size: auto; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0 !important; padding: 0 !important; width: ${width > 0 ? `${width}px` : '100%'} !important; min-width: 0 !important; background: #fff; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    img { max-width: 100%; }
    .pdf-email-meta, .pdf-mobile-email-meta { text-align: center !important; }
    .pdf-email-meta > div:first-child, .pdf-mobile-email-meta > div:first-child { display: inline-block !important; margin-left: auto !important; margin-right: auto !important; text-align: center !important; }
    .pdf-email-meta__details { display: table !important; width: auto !important; margin-left: 20px !important; margin-right: 0 !important; text-align: left !important; }
    .pdf-mobile-email-meta__details { display: table !important; width: auto !important; margin-left: 20px !important; margin-right: 0 !important; text-align: left !important; }
    .pdf-email-meta__row, .pdf-mobile-email-meta__row { text-align: left !important; white-space: normal !important; }
    .pdf-email-meta__row > span:first-child, .pdf-mobile-email-meta__row > span:first-child { font-weight: 700 !important; }
    ${mobileEmailStyles}
    .pdf-columns { display: flex; align-items: flex-start; width: max-content; margin: 0; padding: 0; }
    .pdf-column { flex-shrink: 0; overflow: hidden; }
  `;
}

async function waitForAssets(page: import('playwright-core').Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((image) => {
      if (image.complete) return image.decode?.().catch(() => undefined);
      return new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 10000);
        const finish = () => {
          window.clearTimeout(timeout);
          resolve();
        };
        image.addEventListener('load', finish, { once: true });
        image.addEventListener('error', finish, { once: true });
      });
    }));
  });
}

type OverflowEntry = {
  tag: string;
  className: string;
  width: number;
  left: number;
  right: number;
  overRight: number;
  overLeft: number;
};

async function assertMobileContentFits(page: import('playwright-core').Page): Promise<void> {
  const result = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('.email-container');
    if (!root) return { error: 'Mobile root .email-container not found', rootWidth: 0, overflowing: [] as OverflowEntry[] };

    const rootRect = root.getBoundingClientRect();
    const overflowing = Array.from(root.querySelectorAll<HTMLElement>('*'))
      .map((element): OverflowEntry => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          className: typeof element.className === 'string' ? element.className : '',
          width: rect.width,
          left: rect.left,
          right: rect.right,
          overRight: rect.right - rootRect.right,
          overLeft: rootRect.left - rect.left,
        };
      })
      .filter((item) => item.overRight > 0.5 || item.overLeft > 0.5);

    return { rootWidth: rootRect.width, rootLeft: rootRect.left, rootRight: rootRect.right, overflowing };
  });

  if ('error' in result && result.error) throw new Error(result.error);
  if (result.overflowing.length > 0) {
    console.error('[generateVsbPdfBuffer] Mobile overflow report:', result);
    throw new Error(`Mobile PDF content overflows .email-container (${result.overflowing.length} elements)`);
  }
}

async function measureContentHeight(page: import('playwright-core').Page): Promise<number> {
  return page.evaluate(() => {
    const bodyRect = document.body.getBoundingClientRect();
    const bottom = Array.from(document.body.querySelectorAll<HTMLElement>('*')).reduce(
      (max, element) => Math.max(max, element.getBoundingClientRect().bottom),
      bodyRect.top,
    );
    return Math.ceil(Math.max(1, bottom - bodyRect.top));
  });
}

export async function generateVsbPdfBuffer(pages: VsbPdfPageSpec[], baseUrl?: string): Promise<Buffer> {
  if (!pages.length) throw new Error('No pages provided for PDF generation');

  const isVercel = process.env.VERCEL === '1';
  // Render sets RENDER=true in its environment
  const isRender = process.env.RENDER === 'true';

  // ── Resolve executable path ────────────────────────────────────────────────
  // Vercel  → chromium-min downloads the binary from CDN into /tmp at cold-start
  // Render  → Playwright installed the browser during build; let it auto-locate
  //           via PLAYWRIGHT_BROWSERS_PATH or the default cache location.
  //           We pass executablePath=undefined so Playwright resolves it itself.
  // Local   → same as Render (Playwright manages its own browser)
  const executablePath = isVercel
    ? await serverlessChromium.executablePath(CHROMIUM_REMOTE_EXEC_URL)
    : undefined;

  console.log('[PDF] environment:', isVercel ? 'vercel' : isRender ? 'render' : 'local');
  console.log('[PDF] Chromium executable:', executablePath || 'Playwright-managed (auto-locate)');

  // On Render the browser cache lives at /opt/render/.cache/ms-playwright.
  // Setting PLAYWRIGHT_BROWSERS_PATH tells Playwright exactly where to look
  // so it doesn't fall back to a path that doesn't exist.
  if (isRender && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = '/opt/render/.cache/ms-playwright';
  }

  let browser: Awaited<ReturnType<typeof playwrightChromium.launch>> | undefined;
  try {
    browser = await playwrightChromium.launch({
      headless: true,
      // On Render/local: no extra args needed — Playwright handles everything.
      // On Vercel: must pass sparticuz args + explicit executablePath.
      ...(isVercel
        ? {
            args: serverlessChromium.args,
            executablePath,
          }
        : {
            // Render needs --no-sandbox because it runs in a container without
            // kernel-level sandboxing support.
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          }),
    });
    console.log('[PDF] browser launched');
    console.log('[PDF] connected:', browser.isConnected());
    browser.on('disconnected', () => console.error('[PDF] BROWSER DISCONNECTED'));

    if (isVercel) {
      console.log('[PDF] before newPage', { connected: browser.isConnected() });
      const diagnosticPage = await browser.newPage();
      console.log('[PDF] page created');
      await diagnosticPage.setContent('<html><body>Hello</body></html>');
      const testPdf = await diagnosticPage.pdf({ printBackground: true });
      console.log('[PDF] minimal PDF success', testPdf.length);
      await diagnosticPage.close();
    }

    const merged = await PDFDocument.create();

    for (const spec of pages) {
      const width = Math.max(spec.pageWidth ?? spec.width ?? DEFAULT_WIDTH, 1);
      console.log('[PDF] before newPage', { connected: browser.isConnected(), width });
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      console.log('[PDF] page created');
      try {
        await page.setContent(buildPageHtml(spec, baseUrl), { waitUntil: 'load' });
        await waitForAssets(page);
        await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        if (spec.width === 375 && !spec.columns?.length) {
          await assertMobileContentFits(page);
        }
        const contentHeight = spec.pageHeight ?? await measureContentHeight(page);
        const height = Math.min(Math.max(contentHeight, 1), MAX_PAGE_HEIGHT);
        const pdfBuffer = await page.pdf({
          width: `${width}px`,
          height: `${height}px`,
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          printBackground: true,
          preferCSSPageSize: false,
          displayHeaderFooter: false,
        });
        const rendered = await PDFDocument.load(pdfBuffer);
        const copiedPages = await merged.copyPages(rendered, rendered.getPageIndices());
        copiedPages.forEach((copiedPage) => merged.addPage(copiedPage));
      } finally {
        await page.close();
      }
    }

    return Buffer.from(await merged.save());
  } finally {
    if (browser?.isConnected()) {
      await browser.close().catch(() => undefined);
    }
  }
}