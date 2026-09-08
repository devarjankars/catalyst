export interface VsbPdfColumn {
  html: string;
  width: number;
}

export interface VsbPdfPageSpec {
  html?: string;
  width?: number;
  columns?: VsbPdfColumn[];
  pageWidth?: number;
  gap?: number;
  mode?: 'text' | 'image';
  pageHeight?: number;
}

export async function generateVsbPdfBlob(pages: VsbPdfPageSpec[]): Promise<Blob> {
  if (!pages.length) {
    throw new Error('No pages provided for PDF generation');
  }

  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(errorBody?.error || `PDF generation failed (${response.status})`);
  }

  return response.blob();
}

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

export function buildVariableCopyHtml(data: any, emailName: string, headingColor?: string): string {
  const accent = headingColor || '#FF66CC';
  const renderNormalSection = (section: any) => {
    const listLabel = section.listText ?? 'Option';
    const options = Array.isArray(section.options) ? section.options : [];
    return `
      <div style="box-sizing:border-box;width:100%;padding:0;margin:0 0 16px;">
        ${section.structure !== 'third-party-placeholder' ? `<div style="font-size:11px;font-weight:bold;margin-bottom:4px;color:${accent};">${section.heading}</div>` : ''}
        ${options.map((opt: any, i: number) => {
          const value = typeof opt === 'string' ? opt : JSON.stringify(opt, null, 2);
          return `
            <div style="font-size:10px;color:#111827;line-height:1.4;margin-bottom:3px;box-sizing:border-box;">
              <span style="font-weight:bold;margin-right:6px;">${listLabel} ${i + 1}:</span>
              <span>${value}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  const renderTableSection = (section: any) => `
    <div style="width:100%;box-sizing:border-box;margin:0 0 16px;">
      <div style="font-size:11px;font-weight:bold;margin:0 0 12px;color:${accent};">${section.heading}</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;box-sizing:border-box;">
        <thead>
          <tr>
            <th style="background:#f9fafb;border:1px solid #d1d5db;padding:6px;font-weight:bold;color:#FF66CC;text-align:left;width:60%;">Friendly From Name</th>
            <th style="background:#f9fafb;border:1px solid #d1d5db;padding:6px;font-weight:bold;color:#FF66CC;text-align:left;width:40%;">From Email Address</th>
          </tr>
        </thead>
        <tbody>
          ${(section.options || []).map((row: any) => `
            <tr>
              <td style="border:1px solid #d1d5db;padding:6px;vertical-align:top;">
                ${(row.friendlyNames || []).map((name: string, j: number) => `
                  <div style="margin-bottom:3px;">
                    <span style="font-weight:bold;margin-right:4px;">${j + 1}.</span>${name}
                  </div>
                `).join('')}
              </td>
              <td style="border:1px solid #d1d5db;padding:6px;vertical-align:top;">${row.fromEmail}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const renderThirdPartySection = (section: any) => {
    if (!Array.isArray(section.options) || !section.options.length) return '';
    return `
      <div style="width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
        ${section.options.map((option: string) => `
          <div style="display:flex;align-items:center;gap:8px;color:#FF66CC;font-weight:bold;">
            <span>[</span>
            <span>${option}</span>
            <span>]</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  return `
    <div style="box-sizing:border-box;width:100%;max-width:100%;padding:32px;margin:0 auto;background:#fff;font-family:Arial, Helvetica, sans-serif;">
      <div style="font-size:13px;color:#006937;font-weight:bold;margin:0 0 8px;">${emailName}</div>
      <div style="font-size:11px;font-weight:bold;margin:0 0 12px;color:${accent};">Variable copy</div>
      ${(data || []).map((section: any) => {
        if (section.structure === 'table') return renderTableSection(section);
        if (section.structure === 'third-party-placeholder') return renderThirdPartySection(section);
        return renderNormalSection(section);
      }).join('')}
    </div>
  `;
}

export function buildAltNameHtml(data: any, emailName?: string): string {
  const images = Array.isArray(data) ? data : (data && Array.isArray(data.images) ? data.images : []);
  const headingColor = (!Array.isArray(data) && data?.headingColor) ? data.headingColor : '#006836';

  return `
    <div style="box-sizing:border-box;width:100%;max-width:100%;padding:32px;margin:0 auto;background:#fff;font-family:Arial, Helvetica, sans-serif;">
      <div style="font-size:18px;font-weight:bold;text-align:center;color:${headingColor};margin:0 0 12px;">ALT-Text for HTML version</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;box-sizing:border-box;">
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
                  <div style="font-size:13px;color:#111827;line-height:1.4;min-height:60px;display:flex;align-items:center;">
                    ${img.value || '<span style="color:#d1d5db;font-style:italic;">No description provided</span>'}
                  </div>
                </td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
