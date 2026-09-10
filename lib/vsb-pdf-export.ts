export interface VsbPdfColumn {
  html: string;
  width: number;
  /** Rendering variant — controls whether mobile responsive CSS is scoped to this column. */
  variant?: 'desktop' | 'mobile';
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

  // Returns true only for values that are real image URLs/data-URIs.
  // Scoped to http(s) URLs and data:image/ URIs — never matches plain text.
  const isImageValue = (v: unknown): v is string => {
    if (typeof v !== 'string') return false;
    const t = v.trim();
    return t.startsWith('data:image/') || /^https?:\/\/.+/i.test(t);
  };

  // Escape a string for safe use inside an HTML attribute value.
  const escAttr = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const renderNormalSection = (section: any) => {
    const listLabel = section.listText ?? 'Option';
    const options   = Array.isArray(section.options) ? section.options : [];
    // Only "[Variable Header Image]" sections render images.
    // All other normal sections print values as plain text — unchanged.
    const isImageSection = typeof section.heading === 'string' &&
      section.heading.trim() === '[Variable Header Image]';

    // ── Image section: vertical stack, one row per option ───────────────────
    // Each row: label on the left (fixed 55px), image immediately to its right.
    // Rows are stacked vertically with 12px gap between them.
    if (isImageSection) {
      const items = options.map((opt: any, i: number) => {
        const safeSrc = typeof opt === 'string' && isImageValue(opt)
          ? escAttr(opt.trim())
          : null;
        const safeAlt = escAttr(`Variable Header Image Option ${i + 1}`);
        const imgOrFallback = safeSrc
          ? `<img class="pdf-variable-header-image" src="${safeSrc}" alt="${safeAlt}" style="display:block;width:auto;max-width:calc(100% - 65px);max-height:150px;height:auto;object-fit:contain;" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span style=&quot;font-size:9px;color:#9ca3af;font-style:italic;&quot;>Image unavailable</span>');"/>`
          : `<span style="font-size:12px;color:#9ca3af;font-style:italic;line-height:1.4 ">No image</span>`;
        return `<div class="pdf-variable-header-image-option" style="display:flex;flex-direction:row;align-items:center;width:100%;gap:10px;box-sizing:border-box;"><span class="pdf-variable-header-image-label" style="flex:0 0 55px;width:55px;font-size:10px;font-weight:bold;color:#111827;white-space:nowrap;text-align:left;">${listLabel} ${i + 1}:</span>${imgOrFallback}</div>`;
      }).join('');

      return `
      <div style="box-sizing:border-box;width:100%;padding:0;margin:0 0 16px;">
        <div style="font-size:12px;font-weight:bold;margin-bottom:8px;color:${accent};">${section.heading}</div>
        <div class="pdf-variable-header-images" style="display:flex;flex-direction:column;width:100%;gap:12px;box-sizing:border-box;">${items}</div>
      </div>`;
    }

    // ── Normal text section ───────────────────────────────────────────────────
    return `
      <div style="box-sizing:border-box;width:100%;padding:0;margin:0 0 16px;">
        ${section.structure !== 'third-party-placeholder'
          ? `<div style="font-size:12px;font-weight:bold;margin-bottom:4px;color:${accent};">${section.heading}</div>`
          : ''}
        ${options.map((opt: any, i: number) => {
          const rawValue = typeof opt === 'string' ? opt : JSON.stringify(opt, null, 2);
          return `<div style="font-size:12px;color:#111827;line-height:1.4;margin-bottom:3px;box-sizing:border-box;"><span style="font-weight:bold;margin-right:6px;">${listLabel} ${i + 1}:</span><span>${rawValue}</span></div>`;
        }).join('')}
      </div>`;
  };

  const renderTableSection = (section: any) => `
    <div style="width:100%;box-sizing:border-box;margin:0 0 16px;">
      <div style="font-size:12px;font-weight:bold;margin:0 0 12px;color:${accent};">${section.heading}</div>
      <table class="pdf-friendly-from-table" style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;box-sizing:border-box;">
        <thead>
          <tr>
            <th style="background:#f9fafb;border:1px solid #d1d5db;padding:6px;font-size:12.5px;line-height:1.4;font-weight:bold;color:#FF66CC;text-align:center;vertical-align:middle;width:60%;">Friendly From Name</th>
            <th style="background:#f9fafb;border:1px solid #d1d5db;padding:6px;font-size:12.5px;line-height:1.4;font-weight:bold;color:#FF66CC;text-align:center;vertical-align:middle;width:40%;">From Email Address</th>
          </tr>
        </thead>
        <tbody>
          ${(section.options || []).map((row: any) => `
            <tr>
              <td class="pdf-friendly-from-table__names" style="border:1px solid #d1d5db;padding:6px;vertical-align:top;font-size:12px;text-align:left;">
                ${(row.friendlyNames || []).map((name: string, j: number) => `
                  <div style="margin-bottom:3px;">
                    <span style="font-weight:bold;margin-right:4px;">${j + 1}.</span>${name}
                  </div>
                `).join('')}
              </td>
              <td class="pdf-friendly-from-table__email" style="border:1px solid #d1d5db;padding:6px;font-size:12px;text-align:center;vertical-align:middle;">${row.fromEmail}</td>
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
      <div style="font-size:12px;font-weight:bold;margin:0 0 12px;color:${accent};">Variable copy</div>
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
