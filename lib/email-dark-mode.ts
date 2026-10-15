export const EMAIL_DARK_MODE_STYLE_MARKER = "data-email-dark-mode-styles-v2";

export const EMAIL_DARK_MODE_CSS = `
@media (prefers-color-scheme: dark) {
  .dark-img {
    display: block !important;
    width: auto !important;
    overflow: visible !important;
    float: none !important;
    max-height: inherit !important;
    max-width: inherit !important;
    line-height: auto !important;
    margin-top: 0 !important;
    visibility: inherit !important;
  }

  .light-img {
    display: none !important;
  }

  .darkmode {
    background-color: #1c1c1e !important;
    background-image: linear-gradient(#1c1c1e, #1c1c1e) !important;
  }

  body,
  body table,
  body td,
  body div,
  body p,
  body span,
  body li,
  body strong,
  body b {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
  }

  [bgcolor="#ffffff"],
  [bgcolor="#FFFFFF"],
  [bgcolor="#eeeeee"],
  [bgcolor="#EEEEEE"],
  [bgcolor="#f4f4f4"],
  [bgcolor="#F4F4F4"],
  [bgcolor="#f1f1f1"],
  [bgcolor="#F1F1F1"],
  [style*="background-color:#ffffff"],
  [style*="background-color: #ffffff"],
  [style*="background-color:#FFFFFF"],
  [style*="background-color: #FFFFFF"],
  [style*="background-color:#eeeeee"],
  [style*="background-color: #eeeeee"],
  [style*="background-color:#EEEEEE"],
  [style*="background-color: #EEEEEE"],
  [style*="background-color:#f4f4f4"],
  [style*="background-color: #f4f4f4"],
  [style*="background-color:#F4F4F4"],
  [style*="background-color: #F4F4F4"],
  [style*="background-color:#f1f1f1"],
  [style*="background-color: #f1f1f1"],
  [style*="background-color:#F1F1F1"],
  [style*="background-color: #F1F1F1"] {
    background-color: #1c1c1e !important;
    background-image: linear-gradient(#1c1c1e, #1c1c1e) !important;
  }

  .dm_text {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
  }

  .linkLightBlue {
    color: #00acdf !important;
  }

  #initial-table {
    background-color: #2c2c2e !important;
  }

  .dark_td {
    background-color: #3a3a3c !important;
  }

  .darkmode,
  .darkmode td,
  .darkmode table {
    background-color: #1c1c1e !important;
    background-image: linear-gradient(#1c1c1e, #1c1c1e) !important;
  }

  .dm-text {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
  }

  .dm-green {
    color: #6ed6a8 !important;
    -webkit-text-fill-color: #6ed6a8 !important;
  }

  .dm-navy {
    color: #a8c7fa !important;
    -webkit-text-fill-color: #a8c7fa !important;
  }

  .dm-link,
  .dm-link a {
    color: #8ab4f8 !important;
    -webkit-text-fill-color: #8ab4f8 !important;
  }

  .dm-footer {
    background-color: #242426 !important;
  }

  .elzonris-cta-bg {
    background-color: #f55a1f !important;
  }

  .elzonris-cta-text {
    color: #ffffff !important;
  }
}
`;

export function ensureEmailDarkModeStyles(html: string): string {
  if (html.includes(EMAIL_DARK_MODE_STYLE_MARKER)) return html;

  const style = `<style ${EMAIL_DARK_MODE_STYLE_MARKER}>${EMAIL_DARK_MODE_CSS}</style>`;
  if (/<\/head\s*>/i.test(html)) {
    return html.replace(/<\/head\s*>/i, `${style}</head>`);
  }

  const htmlTag = /<html\b[^>]*>/i.exec(html);
  if (htmlTag) {
    const insertionPoint = htmlTag.index + htmlTag[0].length;
    return `${html.slice(0, insertionPoint)}<head>${style}</head>${html.slice(insertionPoint)}`;
  }

  return `${style}${html}`;
}

export function removeEmailDarkModeStyles(html: string): string {
  const markerPattern = EMAIL_DARK_MODE_STYLE_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(
    new RegExp(`<style\\b(?=[^>]*\\b${markerPattern}\\b)[^>]*>[\\s\\S]*?<\\/style\\s*>`, "gi"),
    "",
  );
}

export function prepareEmailHtml(html: string): string {
  let preparedHtml = ensureEmailDarkModeStyles(html);
  const formatDetectionMeta =
    '<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">';
  const existingFormatDetectionMeta =
    /<meta\b(?=[^>]*\bname\s*=\s*(["'])format-detection\1)[^>]*>/i.exec(preparedHtml);

  if (existingFormatDetectionMeta) {
    preparedHtml = preparedHtml.replace(existingFormatDetectionMeta[0], formatDetectionMeta);
  } else if (/<\/head\s*>/i.test(preparedHtml)) {
    preparedHtml = preparedHtml.replace(/<\/head\s*>/i, `${formatDetectionMeta}</head>`);
  }

  return preparedHtml.replace(/>([^<]+)</g, (_match, text: string) =>
    `>${text.replace(/(\d)-(?=\d)/g, "$1&#8288;-&#8288;")}<`,
  );
}
