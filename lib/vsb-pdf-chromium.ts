// This file runs ONLY on the server (Node.js). Never import it from client components.
import 'server-only';

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

/**
 * Remove target="_blank" from all anchor tags in the HTML string.
 *
 * WHY: Chromium's headless PDF print pipeline suppresses link annotations
 * for anchors that have target="_blank". The renderer treats those as
 * "open in new tab" navigation events — which have no equivalent in a PDF —
 * so it silently drops the annotation rectangle. Removing (or replacing with
 * target="_self") restores the annotation so the link is clickable in the PDF.
 *
 * The visible text, colour, underline and href are all preserved — only the
 * target attribute is stripped.
 */
function stripTargetBlank(html: string): string {
  // Match target="_blank", target='_blank', or target=_blank (no quotes)
  // case-insensitively, with optional whitespace around the = sign.
  return html.replace(/\s+target\s*=\s*["']?_blank["']?/gi, '');
}

/**
 * Remove any <base href="..."> tags from the HTML.
 *
 * WHY: A <base href="http://localhost:3000"> tag silently rewrites every
 * relative/token href in the document to a localhost URL when Chromium
 * resolves anchor.href for PDF link annotations. All email links are
 * already absolute; the base tag is only harmful here.
 */
function stripBaseTags(html: string): string {
  return html.replace(/<base[^>]*>/gi, '');
}

function buildPageHtml(spec: VsbPdfPageSpec, baseUrl?: string): string {
  // ── No <base href> ────────────────────────────────────────────────────────
  // A <base href="http://localhost:3000"> would silently rewrite every relative
  // href (SFMC tokens, "#", path-only URLs) to a localhost dead-link in the PDF.
  // All email links are absolute — we don't need a base tag.
  // baseUrl is kept as a parameter for future image-loading use only.

  if (spec.columns?.length) {
    const columns = spec.columns.map((column: VsbPdfColumn) => {
      const variantClass = column.variant === 'mobile'
        ? 'pdf-column pdf-column--mobile'
        : 'pdf-column pdf-column--desktop';
      const parts = extractDocumentParts(stripBaseTags(stripTargetBlank(column.html)));
      return `<div class="${variantClass}" style="width:${column.width}px;flex:0 0 ${column.width}px;overflow:visible;">${parts.styles}${parts.body}</div>`;
    }).join('');
    const pageHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${printStyles(0)}</style></head><body><main class="pdf-columns" style="gap:${spec.gap ?? 0}px;">${columns}</main></body></html>`;
    // Write debug HTML to disk (server-side only)
    try {
      const { writeFileSync } = require('fs');
      const debugPath = process.platform === 'win32' 
        ? 'C:\\Users\\Public\\vsb-page-debug.html'
        : '/tmp/vsb-page-debug.html';
      writeFileSync(debugPath, pageHtml);
      console.log('[PDF DEBUG] wrote debug HTML to', debugPath);
    } catch(e) { console.log('[PDF DEBUG] could not write debug file:', e); }
    return pageHtml;
  }

  // Single-page render — wrap in .pdf-column.pdf-column--single so the same
  // border and padding rules apply as for multi-column options.
  const source = stripTargetBlank(spec.html ?? '<div></div>');
  const parts  = extractDocumentParts(source);
  const isMobile = (spec.width ?? DEFAULT_WIDTH) === 375;
  const singleVariant = isMobile ? 'pdf-column--mobile' : 'pdf-column--desktop';
  return `<!doctype html><html><head><meta charset="utf-8">${parts.styles}<style>${printStyles(spec.width ?? DEFAULT_WIDTH)}</style></head><body><div class="pdf-column pdf-column--single ${singleVariant}" style="width:${spec.width ?? DEFAULT_WIDTH}px;">${parts.body}</div></body></html>`;
}

function printStyles(width: number): string {
  const isSingleMobilePage = width === 375;

  return `
    @page { margin: 0; size: auto; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${width > 0 ? `${width}px` : '100%'} !important;
      min-width: 0 !important;
      background: #fff;
    }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    img { max-width: 100%; }

    /* ── Single-page mobile resets ───────────────────────────────────────── */
    ${isSingleMobilePage ? `
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-container img { max-width: 100% !important; height: auto !important; }
    ` : ''}

    /* ── Header meta block — title and metadata both LEFT at 20px ───────────
       Title box: display:table (shrinks to content), margin-left:20px.
       No margin:auto, no text-align:center on either title or details.
       Inline styles in the HTML are primary; these reinforce them.
    ── */
    .pdf-email-meta,
    .pdf-mobile-email-meta {
      width: 100% !important;
      box-sizing: border-box !important;
      text-align: left !important;
    }

    /* Title — left-aligned at 20px (desktop and mobile share the same rule) */
    .pdf-email-meta__title,
    .pdf-mobile-email-meta__title {
      display: table !important;
      width: fit-content !important;
      margin-top: 18px !important;
      margin-right: 0 !important;
      margin-bottom: 18px !important;
      margin-left: 20px !important;
      font-family: Arial, Helvetica, sans-serif !important;
      text-align: left !important;
    }

    /* Details + rows — left-aligned for both desktop and mobile */
    .pdf-email-meta__details,
    .pdf-mobile-email-meta__details {
      display: table !important;
      width: auto !important;
      margin: 0 0 0 20px !important;
      padding-top: 20px !important;
      text-align: left !important;
    }
    .pdf-email-meta__row,
    .pdf-mobile-email-meta__row {
      text-align: left !important;
      white-space: normal !important;
    }
    .pdf-email-meta__row > span:first-child,
    .pdf-mobile-email-meta__row > span:first-child {
      font-weight: 700 !important;
    }

    /* ── Multi-column page layout ────────────────────────────────────────── */
    .pdf-columns {
      display: flex;
      align-items: stretch;
      padding: 0 24px;
      box-sizing: border-box;
    }

    /* ── .pdf-column — the complete option wrapper with visible border ───────
       IMPORTANT: overflow must NOT be hidden here. Chromium's PDF renderer
       clips link annotation rectangles to the nearest overflow:hidden ancestor,
       causing all <a href> links (CTA buttons, "view in browser", etc.) to
       lose their clickable annotations in the exported PDF.
       Instead we use clip-path for visual containment — clip-path clips the
       painted pixels but does NOT affect PDF annotation rectangles, so links
       remain fully clickable in the PDF.
       No fixed height — height is determined by the complete email content.
    ── */
    .pdf-column {
      position: relative;
      flex-shrink: 0;
      overflow: visible;
      background: #ffffff;
      outline: 1px solid #e5e7eb;
      outline-offset: -1px;
    }

    /* Single-page wrapper: body padding so border is visible on all sides.
       height:auto + min-height:0 ensures the wrapper shrinks to its content
       and is not inflated by any inherited height rule from the email HTML. */
    .pdf-column--single {
      box-sizing: border-box;
      height: auto !important;
      min-height: 0 !important;
    }

    /* ── Mobile column — responsive reflow ──────────────────────────────────
       Scoped to .pdf-column--mobile so desktop columns are never affected.
       Forces the outer 600px wrapper table to fit the 375px column.
       Inner tables (buttons, icons, cards) are NOT globally forced to 100%.
       overflow: visible — see .pdf-column comment above; hidden clips PDF links.
    ── */
    .pdf-column--mobile {
      width: 375px !important;
      max-width: 375px !important;
      flex: 0 0 375px !important;
      min-width: 0;
      overflow: visible;
    }
    .pdf-column--mobile .email-container {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }
    .pdf-column--mobile .email-container > table,
    .pdf-column--mobile .email-container > div > table {
      width: 100% !important;
      max-width: 375px !important;
    }
    .pdf-column--mobile img {
      max-width: 100% !important;
      height: auto !important;
    }
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
    // ── Step 1: collapse CSS height/min-height on the outer wrappers.
    // Percentage heights resolve against the viewport (800px), not content.
    const collapseHeights = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty('height',     'auto', 'important');
      el.style.setProperty('min-height', '0',    'important');
    };
    collapseHeights(document.documentElement);
    collapseHeights(document.body);
    const singleRoot = document.querySelector<HTMLElement>('.pdf-column--single');
    collapseHeights(singleRoot);

    // ── Step 2: remove HTML height= attributes from tables inside the email
    // body. These are set as presentational attributes (e.g. height="800") and
    // cannot be overridden by CSS alone — they cause tables to reserve pixel
    // heights far beyond their content, inflating the page.
    // Only remove from elements inside .pdf-column--single (the email body),
    // never from elements outside it.
    if (singleRoot) {
      singleRoot.querySelectorAll<HTMLElement>('[height]').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        // Only strip height attributes from table-related elements.
        // Preserve height on <img> elements — those are intentional dimensions.
        if (tag === 'table' || tag === 'td' || tag === 'tr' || tag === 'tbody') {
          el.removeAttribute('height');
        }
      });
    }

    // ── Step 3: measure the single-page wrapper.
    if (singleRoot) {
      const rect = singleRoot.getBoundingClientRect();
      // 60px safety margin so the outer border and last content row are fully visible.
      return Math.ceil(Math.max(1, rect.height + 60));
    }

    // ── Step 4: multi-column pages — measure each column individually ─────
    // align-items:stretch means the container grows to the tallest column,
    // but getBoundingClientRect().bottom on the body may still under-report
    // if content overflows. Measure each .pdf-column separately and use max.
    const columns = Array.from(document.querySelectorAll<HTMLElement>('.pdf-column'));
    if (columns.length > 0) {
      const colBottoms = columns.map((col) =>
        Array.from(col.querySelectorAll<HTMLElement>('*')).reduce(
          (colMax, el) => Math.max(colMax, el.getBoundingClientRect().bottom),
          col.getBoundingClientRect().bottom
        )
      );
      // Store per-column data for server-side logging
      (window as any).__pdfColBottoms = colBottoms;
      const maxBottom = Math.max(...colBottoms);
      const bodyTop = document.body.getBoundingClientRect().top;
      // Add 80px safety margin — Chromium clips at the exact @page height,
      // rounding errors and font metrics can push content slightly below
      // the measured bottom.
      return Math.ceil(Math.max(1, maxBottom - bodyTop + 80));
    }

    // fallback: full body scan
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

  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV != null;
  const isRender = process.env.RENDER === 'true';

  // On any serverless/lambda environment (Vercel, Render, etc.) we need the
  // sparticuz Chromium — Playwright's bundled binary lacks required system libs
  // (libnss3.so etc.) that aren't present in the Lambda execution environment.
  const isServerless = isVercel || isRender;

  const executablePath = isServerless
    ? await serverlessChromium.executablePath(CHROMIUM_REMOTE_EXEC_URL)
    : undefined;

  console.log('[PDF] environment:', isVercel ? 'vercel' : isRender ? 'render' : 'local');
  console.log('[PDF] isServerless:', isServerless);
  console.log('[PDF] Chromium executable:', executablePath || 'Playwright-managed (auto-locate)');

  let browser: Awaited<ReturnType<typeof playwrightChromium.launch>> | undefined;
  try {
    browser = await playwrightChromium.launch({
      headless: true,
      ...(isServerless
        ? { args: serverlessChromium.args, executablePath }
        : { args: ['--no-sandbox', '--disable-setuid-sandbox'] }),
    });
    console.log('[PDF] browser launched');
    browser.on('disconnected', () => console.error('[PDF] BROWSER DISCONNECTED'));

    if (isServerless) {
      const diagnosticPage = await browser.newPage();
      await diagnosticPage.setContent('<html><body>Hello</body></html>');
      const testPdf = await diagnosticPage.pdf({ printBackground: true });
      console.log('[PDF] minimal PDF success', testPdf.length);
      await diagnosticPage.close();
    }

    // ── Strategy: render all pages in ONE browser tab ──────────────────────
    // Each spec becomes a <section> with its own @page size rule.
    // CSS page-break-after ensures each section starts on a new PDF page.
    // Because there is no pdf-lib merging, link annotations survive intact.
    //
    // For each page we measure content height first (in a temporary tab),
    // then embed the correct @page size in the combined document.
    // ────────────────────────────────────────────────────────────────────────

    // Step 1: measure each page's natural content height
    const pageMeasurements: Array<{ width: number; height: number }> = [];

    for (const spec of pages) {
      const width = Math.max(spec.pageWidth ?? spec.width ?? DEFAULT_WIDTH, 1);
      // Use a very tall viewport so ALL content is within bounds during measurement.
      // getBoundingClientRect() returns incorrect bottom values for elements
      // that are below the viewport fold — using 20000px ensures everything renders.
      const measureTab = await browser.newPage({ viewport: { width, height: MAX_PAGE_HEIGHT } });
      try {
        await measureTab.setContent(buildPageHtml(spec, baseUrl), { waitUntil: 'load' });
        await waitForAssets(measureTab);
        await measureTab.evaluate(() => new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        ));
        if (spec.width === 375 && !spec.columns?.length) {
          await assertMobileContentFits(measureTab);
        }
        const contentHeight = spec.pageHeight ?? await measureContentHeight(measureTab);
        const height = Math.min(Math.max(contentHeight, 1), MAX_PAGE_HEIGHT);
        // Log per-column heights if available
        const colBottoms = await measureTab.evaluate(() => (window as any).__pdfColBottoms as number[] | undefined);
        console.log(`[PDF] page ${pageMeasurements.length + 1}: ${width}×${height}px (${spec.columns?.length ?? 1} col(s)) colBottoms=${JSON.stringify(colBottoms)}`);
        pageMeasurements.push({ width, height });
      } finally {
        await measureTab.close();
      }
    }

    // Step 2: render each section at its own measured page size, then merge.
    // ── How link annotations work in Playwright PDFs ──────────────────────
    // Playwright's page.pdf() generates a PDF via Chromium's print pipeline.
    // Chromium DOES embed link annotations for <a href> elements — but only
    // when the links are reachable (not clipped by overflow:hidden, not
    // behind a pointer-events:none layer, and not stripped by CSS).
    //
    // A single Chromium print operation forces every page to use one page size.
    // Printing each section separately avoids blank space on shorter pages.
    //
    // VSB PDF pages are typically:
    //   Page 1: Variable Copy  (600px wide)
    //   Page 2: Desktop View   (1896px wide for 3-option, 600px for single)
    //   Page 3: Mobile View    (1205px wide for 3-option, 375px for single)
    //   Page 4: Alt-text       (600px wide)
    //
    // Each section gets a PDF page whose dimensions match its own content.

    const pageSections = pages.map((spec, i) => {
      const { width, height } = pageMeasurements[i];
      const html = buildPageHtml(spec, baseUrl);

      const bodyContent = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html);

      // ── Hoist per-page <style> blocks out of the body div ──────────────────
      // In the combined document, <style> tags injected inside <div> elements
      // are invalid HTML. Chromium may process them, but the display:none rules
      // they contain (for .desk-show-table, .mbl-show-table etc.) bleed across
      // pages in unpredictable ways — hiding elements that contain links and
      // thus preventing Chromium from generating PDF link annotations for them.
      //
      // Instead we extract the <style> blocks from the bodyContent and collect
      // them separately to be hoisted into the combined <head>.
      const rawHead = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
      // Strip @page rules (we have a single combined @page rule in the outer head)
      const cleanedPageStyles = rawHead.replace(/@page[^{]*\{[^}]*\}/gi, '');

      return { cleanedPageStyles, width, height, bodyContent };
    });

    const mergedPdf = await PDFDocument.create();

    for (const section of pageSections) {
      const { width, height, bodyContent, cleanedPageStyles } = section;
      const styleTexts: string[] = [];
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let match: RegExpExecArray | null;
      while ((match = styleRegex.exec(cleanedPageStyles)) !== null) {
        styleTexts.push(match[1]);
      }
      const pageHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 0; size: ${width}px ${height}px; }
    html, body {
      margin: 0;
      padding: 0;
      width: ${width}px;
      background: #fff;
    }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /*
     * LINK ANNOTATION RULES
     * ─────────────────────────────────────────────────────────────────────────
     * 1. overflow must NOT be hidden on any ancestor — Chromium clips link
     *    annotation rectangles to the nearest overflow:hidden ancestor.
     * 2. target="_blank" is stripped from all <a> tags by stripTargetBlank()
     *    because Chromium's headless PDF pipeline suppresses annotations on
     *    target="_blank" anchors (treats them as "new tab" with no PDF analog).
     * 3. Ensure links are always on top via z-index so no sibling element
     *    can paint over the annotation rectangle.
     */
    a {
      cursor: pointer !important;
      pointer-events: auto !important;
    }
    a[href] {
      position: relative;
      z-index: 10;
    }
    /* Image-only anchor overlay — injected by the DOM pass below.
       Must be absolute within a relative anchor, cover the full image,
       and use a font-size that fills the bounding box so Chromium generates
       a correctly-sized annotation rectangle. */
    .pdf-link-overlay {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      background: transparent !important;
      color: transparent !important;
      pointer-events: none !important;
      z-index: 11 !important;
    }
    /*
     * DISPLAY RESET FOR PDF
     * ─────────────────────────────────────────────────────────────────────────
     * The email CSS contains @media rules that toggle .desk-show-table /
     * .mbl-show-table / .deskDisp / .mbDisp etc. When the combined document
     * is wider than the media query breakpoint these rules don't fire, but
     * the base display:none rules DO fire, hiding whole sections (and their
     * links). Force desk-show-* classes visible (desktop PDF), keep mbl-show-*
     * hidden so mobile-only rows don't duplicate on desktop.
     * Mobile columns inject their own override via mobileOverrideStyle in the
     * VSB page builder which is already in each column's <head>.
     */
    .desk-show-table { display: table       !important; }
    .desk-show-tr    { display: table-row   !important; }
    .desk-show-cell  { display: table-cell  !important; }
    .mbl-show-table  { display: none        !important; }
    .mbl-show-tr     { display: none        !important; }
    .mbl-show-cell   { display: none        !important; }
    .deskDisp        { display: table       !important; }
    .mbDisp          { display: none        !important; }
    .desktop         { display: inline-block !important; }
    .mobile          { display: none        !important; }
  </style>
  ${styleTexts.length ? `<style>${styleTexts.join('\n')}</style>` : ''}
</head>
<body>
${bodyContent}
</body>
</html>`;

      const page = await browser.newPage({ viewport: { width, height: MAX_PAGE_HEIGHT } });
      let pagePdf!: Buffer;

    try {
      await page.setContent(pageHtml, { waitUntil: 'load' });
      await waitForAssets(page);
      await page.evaluate(() => new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      ));

      // ── Final DOM pass: make every <a href> visible and annotation-ready ──
      // Chromium's headless PDF renderer generates link annotations based on
      // the text runs inside an <a>. An <a> that wraps ONLY an <img> (no text)
      // gets NO annotation rectangle because there is no text to annotate.
      //
      // Fix for image-only anchors (CTA images, header logos, image-with-link):
      //   1. Inject a zero-width space as a text node so Chromium has a text
      //      run to attach the annotation to.
      //   2. Overlay an absolutely-positioned transparent <span> that covers
      //      the full anchor bounding box — this gives Chromium a large enough
      //      text run to generate a correctly-sized annotation rectangle.
      //   3. Set anchor display:block + match width/height of the image.
      //
      // For text anchors (view-in-browser, ISI links): ensure visibility and
      // remove any stray target="_blank".
      await page.evaluate(() => {
        // ── Determine which responsive variant each column uses ──────────────
        // For single-page exports the wrapper is .pdf-column--single plus
        // either .pdf-column--mobile or .pdf-column--desktop.
        // For multi-column VSB pages every column has one of those two classes.
        // We use this to decide which show/hide class to treat as "intentionally
        // hidden" — the inactive variant must never be un-hidden by the link pass.
        //
        // hiddenClassSets maps each column element → the set of class substrings
        // that are intentionally hidden IN THAT COLUMN.
        const columns = Array.from(document.querySelectorAll<HTMLElement>('.pdf-column'));
        const hiddenClassMap = new Map<HTMLElement, string[]>();
        columns.forEach((col) => {
          const isMobileCol = col.classList.contains('pdf-column--mobile');
          // In a mobile column the desktop rows are intentionally hidden;
          // in a desktop column the mobile rows are intentionally hidden.
          hiddenClassMap.set(col, isMobileCol
            ? ['desk-show-tr', 'desk-show-table', 'desk-show-cell', 'deskDisp']
            : ['mbl-show-tr',  'mbl-show-table',  'mbl-show-cell',  'mbDisp']);
        });

        // Returns the column ancestor of el, or null if not inside a .pdf-column.
        function getColumn(el: HTMLElement): HTMLElement | null {
          let cur: HTMLElement | null = el;
          while (cur && cur !== document.body) {
            if (cur.classList.contains('pdf-column')) return cur;
            cur = cur.parentElement;
          }
          return null;
        }

        const allAnchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));
        allAnchors.forEach((anchor) => {
          // ── 1. Remove target="_blank" at DOM level (safety net) ───────────
          if (anchor.getAttribute('target') === '_blank') {
            anchor.removeAttribute('target');
          }

          // ── 1b. Normalize href ────────────────────────────────────────────
          // Chromium uses the DOM-resolved href (anchor.href) for annotations,
          // not the raw attribute. Without a <base> tag, relative URLs become
          // "about:blank" references. We normalise in-place on the attribute so
          // Chromium picks up the correct destination.
          const rawHref = anchor.getAttribute('href') || '';
          const normalizedHref = (() => {
            // SFMC merge tags (%%...%%) — keep verbatim, Chromium will preserve
            // them as opaque strings in the annotation URI.
            if (rawHref.includes('%%') || rawHref.includes('{{')) return rawHref;
            // Already a recognised absolute protocol — keep as-is
            if (/^(https?|mailto|tel|ftp):\/\//i.test(rawHref)) return rawHref;
            // Placeholder — skip annotation (no useful destination)
            if (rawHref === '#' || rawHref === '' || rawHref === 'javascript:void(0)') return null;
            // Protocol-relative (//example.com) → https
            if (rawHref.startsWith('//')) return 'https:' + rawHref;
            // www. without protocol → https://
            if (/^www\./i.test(rawHref)) return 'https://' + rawHref;
            // Absolute path (/page) — leave as-is; without a base tag Chromium
            // will treat it as relative to about:blank. Flag with a comment but
            // don't guess the host.
            return rawHref;
          })();
          if (normalizedHref === null) {
            // Remove the href so Chromium doesn't create a dead annotation
            anchor.removeAttribute('href');
            return; // skip further processing for this anchor
          }
          if (normalizedHref !== rawHref) {
            anchor.setAttribute('href', normalizedHref);
          }

          // ── 2. Un-hide entire ancestor chain ─────────────────────────────
          // Skip elements that are intentionally hidden for this render mode
          // (the inactive responsive variant must stay hidden).
          const col = getColumn(anchor);
          const hiddenClasses = col ? (hiddenClassMap.get(col) ?? []) : [];

          let el: HTMLElement | null = anchor.parentElement;
          while (el && el !== document.body) {
            const cs = window.getComputedStyle(el);
            const cls = typeof el.className === 'string' ? el.className : '';
            // Skip if this element belongs to the inactive responsive variant
            const isInactiveVariant = hiddenClasses.some((c) => cls.includes(c));
            if (!isInactiveVariant && (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.01)) {
              el.style.setProperty('display',    'block',   'important');
              el.style.setProperty('visibility', 'visible', 'important');
              el.style.setProperty('opacity',    '1',       'important');
            }
            el = el.parentElement;
          }

          // ── 3. Detect image-only anchors ──────────────────────────────────
          // An anchor is "image-only" if it has no direct text node content
          // (only whitespace) and contains at least one <img>.
          const hasDirectText = Array.from(anchor.childNodes).some(
            (node) => node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim().length > 0
          );
          const containsImg = anchor.querySelector('img') !== null;
          const isImageOnlyAnchor = !hasDirectText && containsImg;

          if (isImageOnlyAnchor) {
            // Get the image's rendered dimensions for the overlay
            const img = anchor.querySelector<HTMLImageElement>('img');
            const rect = anchor.getBoundingClientRect();
            const w = rect.width  || (img ? img.offsetWidth  : 0);
            const h = rect.height || (img ? img.offsetHeight : 0);

            // Make anchor block-level covering the image
            anchor.style.setProperty('display',        'block',   'important');
            anchor.style.setProperty('position',       'relative','important');
            anchor.style.setProperty('width',          w ? `${w}px` : '100%', 'important');
            anchor.style.setProperty('height',         h ? `${h}px` : 'auto', 'important');
            anchor.style.setProperty('visibility',     'visible', 'important');
            anchor.style.setProperty('opacity',        '1',       'important');
            anchor.style.setProperty('pointer-events', 'auto',    'important');
            anchor.style.setProperty('z-index',        '10',      'important');

            // Inject a transparent overlay span that covers the full anchor
            // area. Chromium uses text-run bounding boxes to size annotations,
            // so this span gives it a large enough bounding box.
            if (!anchor.querySelector('.pdf-link-overlay')) {
              const overlay = document.createElement('span');
              overlay.className = 'pdf-link-overlay';
              overlay.setAttribute('aria-hidden', 'true');
              overlay.style.cssText = [
                'position:absolute',
                'top:0',
                'left:0',
                `width:${w ? w + 'px' : '100%'}`,
                `height:${h ? h + 'px' : '100%'}`,
                'display:block',
                'background:transparent',
                // A single space character — invisible but gives Chromium a
                // text run with the correct bounding box for the annotation
                'font-size:' + (h ? Math.max(h, 1) + 'px' : '1px'),
                'line-height:' + (h ? Math.max(h, 1) + 'px' : '1px'),
                'color:transparent',
                'overflow:hidden',
                'pointer-events:none',
                'z-index:11',
              ].join(';');
              overlay.textContent = '\u00A0'; // non-breaking space
              anchor.appendChild(overlay);
            }
          } else {
            // Text anchor — just ensure visibility
            anchor.style.setProperty('display',        'inline',  'important');
            anchor.style.setProperty('visibility',     'visible', 'important');
            anchor.style.setProperty('opacity',        '1',       'important');
            anchor.style.setProperty('pointer-events', 'auto',    'important');
            anchor.style.setProperty('position',       'relative','important');
            anchor.style.setProperty('z-index',        '10',      'important');
          }
        });

        // Extra wait for layout recalc after DOM mutations
        return new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
      });

      // Use preferCSSPageSize: true so Playwright honours the named @page
      // size rules we defined per section.
      // tagged: true tells Chromium to include link annotations in the output.
      pagePdf = Buffer.from(await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        tagged: true,
      }));
    } finally {
      await page.close();
    }

      // pdf-lib's page copier carries each page's link annotation dictionaries
      // into the final document along with the page contents.
      const sourcePdf = await PDFDocument.load(pagePdf);
      const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [0]);
      mergedPdf.addPage(copiedPage);
    }

    return Buffer.from(await mergedPdf.save());
  } finally {
    if (browser?.isConnected()) {
      await browser.close().catch(() => undefined);
    }
  }
}
