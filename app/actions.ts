"use server"

import { generatePdfBuffer, mergePdfBuffers, generateCombinedPdf } from '../lib/pdf-export-util2';

// ─── HTML string generators (no react-dom/server needed) ──────────────────────

function wrapPage(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:Arial,Helvetica,sans-serif;padding:15px;width:100%;color:#000;}
  </style>
</head>
<body>${body}</body>
</html>`;
}

function variableCopyToHtml(params: {
  data: any[];
  emailname: string;
  headingColor?: string;
}): string {
  const accent = params.headingColor || '#FF66CC';

  const renderSection = (section: any): string => {
    const isTable = section.structure === 'table';
    const isThirdParty = section.structure === 'third-party-placeholder';
    const listLabel = section.listText ?? 'Option';

    const heading = isThirdParty ? '' : `<h2 style="font-size:11px;font-weight:700;margin-bottom:4px;color:${accent};">${section.heading}</h2>`;

    let content = '';
    if (isTable) {
      const rows = (section.options || []).map((row: any) => {
        const names = (row.friendlyNames || []).map((n: string, j: number) =>
          `<div style="margin-bottom:3px;"><span style="font-weight:700;margin-right:4px;">${j + 1}.</span>${n}</div>`
        ).join('');
        return `<tr>
          <td style="border:1px solid #ddd;padding:6px 8px;vertical-align:top;">${names}</td>
          <td style="border:1px solid #ddd;padding:6px 8px;vertical-align:middle;">${row.fromEmail}</td>
        </tr>`;
      }).join('');
      content = `<table style="width:100%;border-collapse:collapse;font-size:9px;">
        <thead><tr style="background:#f9f9f9;">
          <th style="border:1px solid #ddd;padding:6px 8px;font-weight:700;text-align:center;color:#FF66CC;">Friendly From Name</th>
          <th style="border:1px solid #ddd;padding:6px 8px;font-weight:700;text-align:center;color:#FF66CC;">From Email Address</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    } else if (isThirdParty) {
      content = (section.options || []).map((op: string) =>
        `<div style="display:grid;grid-template-columns:25px 1fr 25px;gap:2px;align-items:center;margin-bottom:3px;">
          <img src="/sqr_bracket_left.png" style="width:100%;"/>
          <p style="text-align:center;color:#FF66CC;">${op}</p>
          <img src="/sqr_bracket_right.png" style="width:100%;"/>
        </div>`
      ).join('');
    } else {
      content = (section.options || []).map((opt: any, i: number) => {
        const isStr = typeof opt === 'string';
        const isImage = isStr && (opt.startsWith('data:image') || opt.startsWith('http'));
        let val = '';
        if (isStr && isImage) {
          val = `<img src="${opt}" alt="${listLabel} ${i+1}" style="margin-top:2px;border:1px solid #f3f4f6;max-height:150px;max-width:400px;display:inline-block;"/>`;
        } else if (isStr) {
          val = `<span>${opt}</span>`;
        } else {
          val = `<pre style="font-size:9px;color:#6b7280;background:#f9fafb;padding:4px;margin-top:2px;">${JSON.stringify(opt, null, 2)}</pre>`;
        }
        return `<div style="font-size:10px;margin-bottom:2px;width:100%;"><span style="font-weight:700;margin-right:6px;">${listLabel} ${i+1}:</span>${val}</div>`;
      }).join('');
    }

    return `<div style="margin-bottom:16px;">${heading}${content}</div>`;
  };

  const sections = (params.data || []).map(renderSection).join('');

  const body = `<div style="width:100%;max-width:600px;background:#fff;padding:16px;">
    <h1 style="font-size:13px;color:#006937;font-weight:700;margin-bottom:8px;">${params.emailname}</h1>
    <h3 style="font-size:11px;font-weight:700;margin-bottom:12px;color:${accent};">Variable copy</h3>
    ${sections}
  </div>`;

  return wrapPage(body);
}

function altNameToHtml(params: {
  data: any;
  emailName?: string;
}): string {
  const rawData = params.data;
  const images: Array<{ name: string; value: string }> =
    Array.isArray(rawData) ? rawData : (rawData?.images ?? []);
  const headingColor = (!Array.isArray(rawData) && rawData?.headingColor) ? rawData.headingColor : '#006836';

  const rows = images.length === 0
    ? `<tr><td colspan="2" style="border:1px solid #d1d5db;padding:32px;text-align:center;color:#9ca3af;font-style:italic;font-size:12px;">No images selected for alt text.</td></tr>`
    : images.map((img) => {
        const imgCell = img.name
          ? `<img src="${img.name}" alt="preview" style="max-height:120px;object-fit:contain;display:block;margin:0 auto;"/>`
          : `<div style="width:80px;height:80px;background:#f9fafb;border:1px dashed #d1d5db;display:flex;align-items:center;justify-content:center;font-size:10px;color:#d1d5db;margin:0 auto;">No Image</div>`;
        const valueCell = img.value
          ? `<span style="font-size:13px;color:#000;">${img.value}</span>`
          : `<span style="color:#d1d5db;font-style:italic;">No description provided</span>`;
        return `<tr>
          <td style="border:1px solid #d1d5db;padding:12px;width:50%;vertical-align:middle;">${imgCell}</td>
          <td style="border:1px solid #d1d5db;padding:16px;width:50%;vertical-align:middle;">${valueCell}</td>
        </tr>`;
      }).join('');

  const body = `<div style="width:100%;background:#fff;padding:24px;">
    <div style="margin-bottom:12px;padding-bottom:16px;">
      <h2 style="font-size:18px;text-align:center;font-weight:700;color:${headingColor};">ALT-Text for HTML version</h2>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;">
      <tbody>${rows}</tbody>
    </table>
  </div>`;

  return wrapPage(body);
}

// ─── Server Actions ────────────────────────────────────────────────────────────

export async function handlePdfAction(html: string, viewMode: 'desktop' | 'mobile', customWidth?: string) {
  const buffer = await generatePdfBuffer(html, viewMode, customWidth);
  return buffer.toString('base64');
}

export async function generateVariableCopyPdfAction(html: string): Promise<string> {
  const pdf = await generatePdfBuffer(html, 'desktop');
  return pdf.toString('base64');
}

export async function generateAltNamePdfAction(html: string): Promise<string> {
  const pdf = await generatePdfBuffer(html, 'desktop');
  return pdf.toString('base64');
}

export async function mergePdfsAction(base64Pdfs: string[]): Promise<string> {
  const buffers = base64Pdfs.map(b => Buffer.from(b, 'base64'));
  const merged  = await mergePdfBuffers(buffers);
  return merged.toString('base64');
}

export async function generateCombinedPdfAction(params: {
  emailHtmlDesktop?:   string;
  emailHtmlMobile?:    string;
  emailHtmlsMobile?:   string[];
  variableCopyData?:   { data: any; emailname: string; headingColor?: string };
  altNameData?:        { data: any; emailName?: string };
  // legacy plain-HTML fallback
  variableCopyHtml?:   string;
  altNameHtml?:        string;
  emailName:           string;
  desktopWidthOverride?: string;
  mobileWidthOverride?:  string;
}) {
  try {
    const variableCopyHtml = params.variableCopyData
      ? variableCopyToHtml(params.variableCopyData)
      : params.variableCopyHtml;

    const altNameHtml = params.altNameData
      ? altNameToHtml(params.altNameData)
      : params.altNameHtml;

    const buffer = await generateCombinedPdf({
      ...params,
      variableCopyHtml,
      altNameHtml,
    });
    return buffer.toString('base64');
  } catch (error) {
    console.error('[generateCombinedPdfAction] Error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
