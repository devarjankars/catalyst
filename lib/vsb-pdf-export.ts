"use client"

/**
 * Client-side VSB PDF export.
 *
 * The email preview dialog exports PDFs successfully using html2canvas-pro + jsPDF
 * to rasterize the real rendered DOM. The old VSB flow instead sent the raw HTML to a
 * server action that rendered it as plain text in the PDF (and could fail on remote font /
 * image fetching). This module brings the same working browser-based approach to the VSB
 * flow: each page is rendered inside a hidden iframe sized to the target viewport width
 * (so email @media queries fire correctly) and then captured into a proper PDF image page.
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
  if (/^data:/i.test(src) || /^https?:\/\//i.test(src)) return src;
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
      reader.readAsDataURL(blob;
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
  const jobs: Array<{ full: string; prefix: string; url: string }> = [];
  while ((m = imgRe.exec(html)) !== null) jobs.push({ full: m[0], prefix: m[1] + m[2] + m[3], url: m[4] });
  for ( (const job of jobs) {
    const abs = resolveUrl(job.url;
    const uri = await toDataUri(abs;
    if (uri) out = out.replace(job.full, job.prefix + uri + m[3];
  }

  // Inline CSS url(...) references inside style attributes
  const cssRe = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cssRe.exec(html)) !== null) {
    const rawUrl = cm[2];
    if (/^data:/i.test(rawUrl)) continue;
    const abs = resolveUrl(rawUrl;
    const uri = await toDataUri(abs;
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

  document.body.appendChild(frame);

  const iframeDoc = await new Promise<Document>((resolve) => {
    const timer = window.setTimeout(() => {
      const d = frame.contentDocument || frame.contentWindow?.document;
      if (d) resolve(d);
    }, 4000);
    frame.addEventListener('load', () => {
      const d = frame.contentDocument || frame.contentWindow?.document;
      if (d) { window.clearTimeout(timer); resolve(d); }
    }, { once: true });
  });

  await waitForImages(iframeDoc);
// Make sure webfonts (if any) are fully loaded before rasterizing.

  const fontReady = (iframeDoc as any).fonts?.ready;
  if (fontReady) await fontReady.catch(() => undefined);
  // Let layout settle at the target width before rasterizing.
  await new Promise(r => setTimeout(r, 120));

  const body = iframeDoc.body as HTMLElement;
  body.style.width = `${width}px`;
  body.style.minWidth = `${width}px`;
  body.style.margin = '0';
  body.style.padding = '0';
  body.style.overflow = 'visible';

  const canvas = await html2canvas(body, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: width,
    windowWidth: width,
    scrollX: 0,
    scrollY: 0,
    backgroundColor: '#ffffff',
  });

  const height = Math.max(body.scrollHeight, Math.ceil(canvas.height / 2)) + 16;
  frame.remove();
  return { dataUrl: canvas.toDataURL('image/png'), width, height };
}
async function composeColumns(columns: CapturedPage[], gap: number, pageWidth?: number): Promise<CapturedPage> {
  const contentWidth = columns.reduce((sum, col) => sum + col.width, 0) + gap * (columns.length - 1);
  const width = pageWidth && pageWidth > contentWidth ? pageWidth : contentWidth;
  const height = Math.max(...columns.map(col => col.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * 2);
  canvas.height = Math.ceil(height * 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) return columns[0];

  // Match the background used by the combined desktop / mobile preview wrappers.
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x = Math.max(0, (width - contentWidth) / 2);
  for (const col of columns) {
    const img = new Image();
    img.src = col.dataUrl;
    await img.decode().catch(() => undefined);
    ctx.drawImage(img, x * 2, 0, col.width * 2, col.height * 2);
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
 * Generate a PDF Blob from the given page specs (browser-side).
 */
export async function generateVsbPdfBlob(pages: VsbPdfPageSpec[]): Promise<Blob> {
  if (typeof window === 'undefined') throw new Error('PDF generation is only available in the browser');
  if (!pages.length) throw new Error('No pages provided for PDF generation');

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  let pdf: any = null;
  for (const spec of pages) {
    const page = await capturePage(spec, html2canvas);
    if (!pdf) {
      pdf = new jsPDF({
        unit: 'px',
        format: [page.width, page.height],
        orientation: 'portrait',
        hotfixes: ['px_scaling'],
        compress: true,
      });
      pdf.addImage(page.dataUrl, 'JPEG', 0, 0, page.width, page.height, undefined, 'FAST');
    } else {
      pdf.addPage([page.width, page.height], 'portrait');
      pdf.addImage(page.dataUrl, 'JPEG', 0, 0, page.width, page.height, undefined, 'FAST');
    }
  }

  return pdf.output('blob') as Blob;
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
    <table style="width:100%;border-collapse:collapse;font-size:9px;font-family:'Arial','Helvetica Neue',Helvetica,Arial,sans-serif;">
      <thead>
        <tr>
          <th style="border:1px solid #ddd;padding:6px 8px;font-weight:bold;text-align:center;color:#FF66CC;background:#f9f9f9;">Friendly From Name</th>
          <th style="border:1px solid #ddd;padding:6px 8px;font-weight:bold;text-align:center;color:#FF66CC;background:#f9f9f9;">From Email Address</th>
        </tr>
      </thead>
      <tbody>
        ${(section.options || []).map((row: any) => `
          <tr>
            <td style="border:1px solid #ddd;padding:6px 8px;vertical-align:top;">
              ${(row.friendlyNames || []).map((name: string, j: number) => `
                <div style="margin-bottom:3px;"><span style="font-weight:bold;margin-right:4px;">${j + 1}.</span>${name}</div>`).join('')}
            </td>
            <td style="border:1px solid #ddd;padding:6px 8px;vertical-align:middle;text-align:center;">${row.fromEmail}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;

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
    <div style="width:100%;background:#fff;padding:16px;font-family:'Arial','Helvetica Neue',Helvetica,Arial,sans-serif;">
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
    <div style="width:100%;background:#fff;padding:24px;font-family:Arial,sans-serif;color:#000;">
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
                      ? `<img src="${img.name}" style="max-height:120px;max-width:100%;object-fit:contain;" />`
                      : '<div style="width:80px;height:80px;background:#f9fafb;border:1px dashed #d1d5db;display:flex;align-items:center;justify-content:center;color:#d1d5db;font-size:10px;">No Image</div>'}
                  </div>
                </td>
                <td style="border:1px solid #d1d5db;padding:16px;width:50%;vertical-align:middle;">
                  <div style="font-size:13px;color:#000;display:flex;align-items:center;line-height:1.4;min-height:60px;">
                    ${img.value || '<span style="color:#d1d5db;font-style:italic;">No description provided</span>'}
                  </div>
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}
