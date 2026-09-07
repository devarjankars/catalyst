"use client"

/**
 * Client-side VSB PDF export.
 *
 * The email preview dialog exports PDFs successfully using html2canvas-pro + jsPDF
 * to rasterize the real rendered DOM. The old VSB flow instead sent the raw HTML to a
 * server action that rendered it as plain text in the PDF (and could fail on remote font /
 * image fetching). This module brings the same working browser-based approach to the VSB
 * flow — with two important improvements for output quality and editability:
 *
 * 1. Structured text pages (variable copy, alt-text table) are rendered as REAL PDF text
 *    using pdfmake + html-to-pdfmake. The text is crisp vector text (not a raster image),
 *    it is selectable / searchable / editable after download in any PDF editor (Acrobat,
 *    etc.), and any <a href="..."> links in the source HTML are embedded as clickable
 *    PDF links — so reviewers can edit copy and add links to the final PDF.
 * 2. Email pages (complex HTML with @media queries) are still rasterized because they are
 *    pixel‑perfect email designs, but they are captured at a higher resolution (scale 3)
 *    and embedded losslessly (PNG) instead of being re-encoded to JPEG.
 *
 * Each page spec is emitted as its own single-page PDF (pdfmake for text pages, jsPDF for
 * image pages so each page keeps its own custom size) and merged with pdf-lib.
 */

export interface VsbPdfColumn {
  html: string;
  width: number;
}

export interface VsbPdfPageSpec {
  /** Single-page HTML fragment / full email document. */
  html?: string;
  /** Viewport width (px) to render a single page at. */
  width?: number;
  /** Render several HTML fragments side-by-side on one PDF page (e.g. three 375px mobile options). */
  columns?: VsbPdfColumn[];
  /** Custom total page width for a composed columns page (defaults to sum of columns + gaps). */
  pageWidth?: number;
  /** Gap between composed columns (default 20). */
  gap?: number;
  /**
   * Page rendering mode:
   *  - 'text'  → render the HTML as real selectable/editable vector PDF text (pdfmake).
   *             Use this for structured content pages (variable copy, alt-text table).
   *  - 'image' → rasterize the DOM to a high-resolution lossless image page (default).
   *             Use this for pixel-perfect email previews.
   * Defaults to 'image' for backwards compatibility.
   */
  mode?: 'text' | 'image';
}

interface CapturedPage {
  dataUrl: string;
  width: number;
  height: number;
}

function waitForImages(doc: Document): Promise<void> {
  return new Promise<void>((resolve) => {
    const imgs = Array.from(doc.images);
    if (imgs.length === 0) { resolve(); return }
    let done = 0;
    let settled = false;
    const tick = () => {
      if (settled) return;
      done += 1;
      if (done >= imgs.length) { settled = true; resolve() }
    };
    const timer = window.setTimeout(() => { if (!settled) { settled = true; resolve() } }, 6000);
    imgs.forEach(img => {
      if (img.complete) tick();
      else {
        img.addEventListener('load', tick, { once: true });
        img.addEventListener('error', tick, { once: true });
      }
    });
  });
}
function resolveUrl(src: string): string {
  if (/^data:/i.test(src) || /^https?:\/\//i.test(src) || /^blob:/i.test(src)) return src;
  if (src.startsWith('//')) return window.location.protocol + src;
  if (src.startsWith('/')) return window.location.origin + src;
  return window.location.origin + '/' + src;
}

async function toDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function inlineImagesInHtml(html: string): Promise<string> {
  let out = html;

  // Inline <img src="...">
  const imgRe = /(<img\b[^>]*?)(\bsrc=)(["'])(.*?)\3/gi;
  let m: RegExpExecArray | null;
  const jobs: Array<{ full: string; prefix: string; url: string; quote: string }> = [];
  while ((m = imgRe.exec(html)) !== null) jobs.push({ full: m[0], prefix: m[1] + m[2] + m[3], url: m[4], quote: m[3] });
  for (const job of jobs) {
    const abs = resolveUrl(job.url);
    const uri = await toDataUri(abs);
    if (uri) out = out.replace(job.full, job.prefix + uri + job.quote);
  }

  // Inline CSS url(...) references inside style attributes
  const cssRe = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cssRe.exec(html)) !== null) {
    const rawUrl = cm[2];
    if (/^data:/i.test(rawUrl)) continue;
    const abs = resolveUrl(rawUrl);
    const uri = await toDataUri(abs);
    if (uri) out = out.replace(cm[0], 'url("' + uri + '")');
  }

  return out;
}

async function captureHtml(html: string, width: number, html2canvas: any): Promise<CapturedPage> {
  const frame = document.createElement('iframe');
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${width}px`,
    border: 'none',
    background: '#ffffff',
  });

  const trimmed = html.trim();
  const isFullDoc = /^<!doctype\s/i.test(trimmed) || /^<html[\s>]/i.test(trimmed);
  frame.srcdoc = isFullDoc
    ? html
    : `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
        html,body {
          margin: 0; padding: 0; background: #fff;
          font-family: 'Arial', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        body { width: ${width}px; overflow: visible; }
      </style></head><body>${html}</body></html>`;

  try {
    const iframeDoc = await new Promise<Document>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('PDF preview did not load')), 10000);
      frame.addEventListener('load', () => {
        window.clearTimeout(timer);
        const doc = frame.contentDocument;
        if (doc?.body) resolve(doc);
        else reject(new Error('PDF preview is unavailable'));
      }, { once: true });
      document.body.appendChild(frame);
    });

    const body = iframeDoc.body;
    Object.assign(body.style, {
      width: width + 'px', minWidth: width + 'px', margin: '0', padding: '0', overflow: 'visible',
    });
    await waitForImages(iframeDoc);
    await iframeDoc.fonts?.ready;
    await new Promise(r => setTimeout(r, 120));

    // Keep the viewport at the requested desktop/mobile width, but capture all
    // overflow (including padded tables) and the complete rendered height.
    const captureWidth = Math.ceil(Math.max(width, body.scrollWidth, iframeDoc.documentElement.scrollWidth));
    const captureHeight = Math.ceil(Math.max(body.scrollHeight, body.getBoundingClientRect().height, iframeDoc.documentElement.scrollHeight));
    const scale = captureScale(captureWidth, captureHeight);
    const canvas = await html2canvas(body, {
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: captureWidth,
      height: captureHeight,
      windowWidth: width,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: '#ffffff',
    });
    return { dataUrl: canvas.toDataURL('image/png'), width: captureWidth, height: captureHeight };
  } finally {
    frame.remove();
  }
}

// Bound raster dimensions and area for long emails and multi-option layouts.
function captureScale(width: number, height: number): number {
  return Math.min(3, 16384 / width, 16384 / height, Math.sqrt(16777216 / (width * height)));
}

async function composeColumns(columns: CapturedPage[], gap: number, pageWidth?: number): Promise<CapturedPage> {
  const contentWidth = columns.reduce((sum, col) => sum + col.width, 0) + gap * (columns.length - 1);
  const width = pageWidth && pageWidth > contentWidth ? pageWidth : contentWidth;
  const height = Math.max(...columns.map(col => col.height));
  const canvas = document.createElement('canvas');
  const scale = captureScale(width, height);
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not compose PDF options');

  // Match the background used by the combined desktop / mobile preview wrappers.
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x = Math.max(0, (width - contentWidth) / 2);
  for (const col of columns) {
    const img = new Image();
    img.src = col.dataUrl;
    await img.decode();
    ctx.drawImage(img, x * scale, 0, col.width * scale, col.height * scale);
    x += col.width + gap;
  }

  return { dataUrl: canvas.toDataURL('image/png'), width, height };
}

async function capturePage(spec: VsbPdfPageSpec, html2canvas: any): Promise<CapturedPage> {
  if (spec.columns && spec.columns.length > 0) {
    const columns = await Promise.all(spec.columns.map(col => captureHtml(col.html, col.width, html2canvas)));
    return composeColumns(columns, spec.gap ?? 20, spec.pageWidth);
  }
  if (!spec.html || !spec.width) throw new Error('Invalid PDF page spec');
  return captureHtml(spec.html, spec.width, html2canvas);
}

/**
 * Prepare a structured (text-mode) HTML fragment for pdfmake:
 * - Inline all <img>/CSS url() references as data URIs so pdfmake can render them.
 * - Drop any <img> that could not be inlined (pdfmake would fail to resolve them).
 */
async function prepareTextHtml(html: string): Promise<string> {
  const inlined = await inlineImagesInHtml(html);
  // Keep only <img> tags whose src is already a data:image URI.
  return inlined.replace(/<img\b(?![^>]*\bsrc\s*=\s*["']?data:image\/)[^>]*>/gi, '');
}

/**
 * Render a structured (text-mode) page as a real, editable-text PDF using pdfmake.
 * Returns the raw bytes of the generated PDF.
 */
async function generateTextPageBytes(html: string, widthPx?: number): Promise<Uint8Array> {
  const [pdfMakeMod, pdfFontsMod, htmlToPdfmakeMod] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
    import('html-to-pdfmake'),
  ]);

  const pdfMake: any = (pdfMakeMod as any).default ?? pdfMakeMod;
  const pdfFonts: any = (pdfFontsMod as any).default ?? pdfFontsMod;
  const htmlToPdfmake: any = (htmlToPdfmakeMod as any).default ?? htmlToPdfmakeMod;

  // Register the bundled Roboto virtual fonts once.
  if (!pdfMake._vsbRegistered) {
    if (typeof pdfMake.addVirtualFileSystem === 'function') {
      pdfMake.addVirtualFileSystem(pdfFonts);
    } else {
      pdfMake.vfs = pdfFonts;
    }
    // The VSB HTML uses Arial/Helvetica; map them to the bundled Roboto so
    // pdfmake does not throw "Font ... not defined in the font section".
    pdfMake.addFonts?.({
      Arial:             { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' },
      Helvetica:         { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' },
      'Helvetica Neue':  { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' },
      sansserif:         { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' },
      Georgia:           { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' },
      'Times New Roman': { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' },
      Verdana:           { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' },
    });
    pdfMake._vsbRegistered = true;
  }

  // The HTML content stays at the same visual width as the on-screen preview
  // (600px desktop → 450pt). Auto-height keeps one page per section, like before.
  const pageWidthPt = Math.max(320, Math.round((widthPx ?? 600) * 0.75));

  const content: any = htmlToPdfmake(await prepareTextHtml(html), {
    removeExtraBlanks: true,
  });

  // Post-process the html-to-pdfmake output so tables/images render reliably
  // in pdfmake (which otherwise uses auto-layout that can clip cells, especially
  // cells containing images, in the browser):
  //   - give every table an explicit `widths` (equal columns) so columns are
  //     sized deterministically instead of by content;
  //   - cap image dimensions so a large uploaded image can't blow a cell wide.
  function fixLayout(node: any): any {
    if (node == null) return node;
    if (Array.isArray(node)) return node.map(fixLayout);
    if (node.table) {
      const rows = node.table.body || [];
      const ncols = rows.reduce((m: number, r: any) => Math.max(m, Array.isArray(r) ? r.length : 0), 0);
      // Keep widths parsed from HTML (for example, the compact alt-text
      // table) and only provide equal widths when the source has none.
      if (ncols > 0 && !node.table.widths) node.table.widths = Array(ncols).fill('*');
    }
    if (node.image && typeof node.image === 'string') {
      if (node.maxWidth == null && node.width == null) node.maxWidth = '100%';
      if (node.maxHeight == null && node.height == null) node.maxHeight = 90;
    }
    for (const key of ['stack', 'body', 'columns', 'ul', 'ol', 'table']) {
      if (node[key] && Array.isArray(node[key])) node[key] = node[key].map(fixLayout);
    }
    if (node.table && node.table.body) node.table.body = node.table.body.map(fixLayout);
    return node;
  }
  const fixedContent = Array.isArray(content) ? content.map(fixLayout) : [fixLayout(content)];

  const docDefinition: any = {
    pageSize: { width: pageWidthPt, height: Infinity },
    pageMargins: 24,
    content: fixedContent,
    defaultStyle: { font: 'Roboto', fontSize: 10 },
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  const blob: Blob = await pdfDoc.getBlob();
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Embed a captured page as a lossless image into its own single-page PDF (jsPDF).
 * Returns the raw bytes of the generated PDF.
 */
async function generateImagePageBytes(page: CapturedPage): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf');
  // Scale page and image together below jsPDF's 14,400 pt page limit.
  const pageScale = Math.min(1, 19200 / Math.max(page.width, page.height));
  const pdfWidth = page.width * pageScale;
  const pdfHeight = page.height * pageScale;
  const pdf = new jsPDF({
    unit: 'px',
    format: [pdfWidth, pdfHeight],
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    hotfixes: ['px_scaling'],
    compress: true,
  });
  // PNG is embedded losslessly so text in the email screenshots stays crisp.
  // 'FAST' zlib-compresses the raw pixels — quality is identical to 'NONE'
  // (PNG/PNG pixels are always lossless here) but keeps the file size sane.
  pdf.addImage(page.dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  // Use arraybuffer (not blob) so the byte extraction is reliable in the browser.
  const buf = pdf.output('arraybuffer');
  return new Uint8Array(buf);
}

/**
 * Merge single-page PDFs (each with its own custom page size) into one document.
 */
async function mergePdfBytes(pdfBytes: Uint8Array[]): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();
  for (const bytes of pdfBytes) {
    const src = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });
    const copied = await merged.copyPages(src, src.getPageIndices());
    copied.forEach(p => merged.addPage(p));
  }
  const saved = await merged.save({ useObjectStreams: false });
  return new Blob([saved], { type: 'application/pdf' });
}

/**
 * Generate a PDF Blob from the given page specs (browser-side).
 *
 * Text-mode pages produce real, editable, linkable vector text (pdfmake).
 * Image-mode pages produce high-resolution lossless screenshots (html2canvas + jsPDF).
 * All pages are merged into a single PDF, preserving each page's own size.
 */
export async function generateVsbPdfBlob(pages: VsbPdfPageSpec[]): Promise<Blob> {
  if (typeof window === 'undefined') throw new Error('PDF generation is only available in the browser');
  if (!pages.length) throw new Error('No pages provided for PDF generation');

  const { default: html2canvas } = await import('html2canvas-pro');

  const pdfBytes: Uint8Array[] = [];
  for (const spec of pages) {
    if (spec.mode === 'text') {
      if (!spec.html) throw new Error('Text-mode PDF page requires html');
      pdfBytes.push(await generateTextPageBytes(spec.html, spec.width));
    } else {
      const page = await capturePage(spec, html2canvas);
      pdfBytes.push(await generateImagePageBytes(page));
    }
  }

  return mergePdfBytes(pdfBytes);
}

/**
 * Generate and trigger download of a VSB PDF from page specs (browser-side).
 */
export async function exportVsbPdf(pages: VsbPdfPageSpec[], fileName: string): Promise<void> {
  const blob = await generateVsbPdfBlob(pages);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HTML builders for structured VSB pages (variable copy / alt-name table)
// These mirror the on-screen preview components (VariablePagePdfView / ALtnamePdfview)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function buildVariableCopyHtml(data: any, emailName: string, headingColor?: string): string {
  const accent = headingColor || '#FF66CC';

  const renderNormalSection = (section: any) => {
    const listLabel = section.listText ?? 'Option';
    const options = Array.isArray(section.options) ? section.options : [];
    return `
      <div style="margin-bottom:16px;">
        ${section.structure !== 'third-party-placeholder' ? `<h2 style="font-size:11px;font-weight:bold;margin-bottom:4px;color:${accent};">${section.heading}</h2>` : ''}
        ${options.map((opt: any, i: number) => {
          const isString = typeof opt === 'string';
          const isImage = isString && (opt.startsWith('data:image') || opt.startsWith('http'));
          return `
            <div style="font-size:10px;color:#000;margin-bottom:2px;">
              <span style="font-weight:bold;margin-right:6px;">${listLabel} ${i + 1}:</span>
              ${isString
                ? (isImage
                    ? `<img src="${opt}" style="margin-top:8px;width:80%;max-height:150px;display:inline-block;border:1px solid #f3f4f6;" />`
                    : `<span>${opt}</span>`)
                : `<pre style="margin-top:4px;font-size:9px;color:#6b7280;background:#f9fafb;padding:8px;border-radius:4px;overflow:auto;">${JSON.stringify(opt, null, 2)}</pre>`}
            </div>`;
        }).join('')}
      </div>`;
  };

  const renderTableSection = (section: any) => `
    <div style="margin:0 0 16px;padding:0;line-height:1;">
      <div style="font-size:11px;font-weight:bold;line-height:11px;margin:0 0 -5px;padding:0;color:${accent};">${section.heading}</div>
      <table style="width:100%;margin:0;padding:0;border-collapse:collapse;font-size:9px;font-family:'Arial','Helvetica Neue',Helvetica,Arial,sans-serif;">
      <thead>
        <tr>
          <th bgcolor="#f9f9f9" style="border:1px solid #ddd;padding:6px 8px;font-weight:bold;text-align:center;color:#FF66CC;background-color:#f9f9f9;width:65%;">Friendly From Name</th>
          <th bgcolor="#f9f9f9" style="border:1px solid #ddd;padding:6px 8px;font-weight:bold;text-align:center;color:#FF66CC;background-color:#f9f9f9;width:35%;">From Email Address</th>
        </tr>
      </thead>
      <tbody>
        ${(section.options || []).map((row: any) => `
          <tr>
            <td width="65%" style="border:1px solid #ddd;padding:6px 8px;vertical-align:top;width:65%;">
              ${(row.friendlyNames || []).map((name: string, j: number) => `
                <div style="margin-bottom:3px;"><span style="font-weight:bold;margin-right:4px;">${j + 1}.</span>${name}</div>`).join('')}
            </td>
            <td width="35%" style="border:1px solid #ddd;padding:6px 8px;vertical-align:middle;text-align:center;width:35%;">${row.fromEmail}</td>
          </tr>`).join('')}
      </tbody>
      </table>
    </div>`;

  const renderThirdPartySection = (section: any) => (section.options || []).length > 0
    ? `
      <div style="display:flex;flex-direction:column;gap:3px;">
        ${(section.options || []).map((op: string) => `
          <div style="display:grid;grid-template-columns:25px 1fr 25px;gap:2px;align-items:center;">
            <img src="/sqr_bracket_left.png" style="width:100%;" />
            <p style="flex:1;text-align:center;color:#FF66CC;margin:0;">${op}</p>
            <img src="/sqr_bracket_right.png" style="width:100%;" />
          </div>`).join('')}
      </div>`
    : '';
return `
    <div style="box-sizing:border-box;width:100%;background:#fff;padding:16px;font-family:'Arial','Helvetica Neue',Helvetica,Arial,sans-serif;">
      <h1 style="font-size:13px;color:#006937;font-weight:bold;margin-bottom:8px;">${emailName}</h1>
      <h3 style="font-size:11px;font-weight:bold;margin-bottom:12px;color:${accent};">Variable copy</h3>
      ${(data || []).map((section: any) => {
        if (section.structure === 'table') return renderTableSection(section);
        if (section.structure === 'third-party-placeholder') {
          const thirdPartyHtml = renderThirdPartySection(section);
          return thirdPartyHtml ? `<div style="margin-bottom:16px;">${thirdPartyHtml}</div>` : '';
        }
        return renderNormalSection(section);
      }).join('')}
    </div>`;
}

export function buildAltNameHtml(data: any, emailName?: string): string {
  const images = Array.isArray(data) ? data : (data && Array.isArray(data.images) ? data.images : []);
  const headingColor = (!Array.isArray(data) && data?.headingColor) ? data.headingColor : '#006836';

  return `
    <div style="box-sizing:border-box;width:100%;background:#fff;padding:24px;font-family:Arial,sans-serif;color:#000;min-height:500px;">
      <div style="margin-bottom:12px;padding-bottom:16px;">
        <h2 style="font-size:18px;text-align:center;font-weight:bold;margin:0;color:${headingColor};">ALT-Text for HTML version</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;font-family:'Arial','Helvetica Neue',Helvetica,Arial,sans-serif;">
        <tbody>
          ${images.length === 0
            ? '<tr><td colspan="2" style="border:1px solid #d1d5db;padding:32px;text-align:center;color:#9ca3af;font-style:italic;font-size:12px;">No images selected for alt text.</td></tr>'
            : images.map((img: any) => `
              <tr>
                <td style="border:1px solid #d1d5db;padding:12px;width:50%;vertical-align:middle;">
                  <div style="display:flex;justify-content:center;align-items:center;">
                    ${img.name
                      ? `<img src="${img.name}" style="max-height:120px;max-width:100%;object-fit:contain;display:block;" />`
                      : '<div style="width:80px;height:80px;background:#f9fafb;border:1px dashed #d1d5db;display:flex;align-items:center;justify-content:center;color:#d1d5db;font-size:10px;">No Image</div>'}
                  </div>
                </td>
                <td style="border:1px solid #d1d5db;padding:16px;width:50%;vertical-align:middle;">
                  <div style="font-size:13px;color:#000;line-height:1.4;min-height:60px;display:flex;align-items:center;">
                    ${img.value || '<span style="color:#d1d5db;font-style:italic;">No description provided</span>'}
                  </div>
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}
