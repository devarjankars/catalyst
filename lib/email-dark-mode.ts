export const EMAIL_DARK_MODE_STYLE_MARKER = "data-email-dark-mode-styles-v2";

const ORSERDU_COLOR_STYLES = "data-orserdu-color-styles";

export function orserduColorClass(color: string): string {
  return `orserdu-ink-${color.slice(1).toLowerCase()}`;
}

export function orserduInkStyle(color: string): string {
  return `color:${color} !important;-webkit-text-fill-color:${color} !important;mso-style-textfill-type:solid;mso-style-textfill-fill-color:${color};`;
}

function ensureOrserduColorStyles(html: string): string {
  if (html.includes(ORSERDU_COLOR_STYLES)) return html;
  const colors = new Set(html.match(/\borserdu-ink-[a-f0-9]{6}\b/g));
  const rules = [...colors].map(className => {
    const color = `#${className.slice("orserdu-ink-".length)}`;
    return `[data-ogsc] .${className}, [data-ogsc].${className}, [data-ogsb] .${className}, [data-ogsb].${className} { ${orserduInkStyle(color)} }`;
  });
  if (html.includes("orserdu-highlight-dark-white")) {
    const white = orserduInkStyle("#ffffff");
    const selector = ".orserdu-highlight-dark-white .orserdu-highlight-ink";
    rules.push(
      `@media (prefers-color-scheme: dark) { ${selector} { ${white} } }`,
      `[data-ogsc] ${selector}, [data-ogsb] ${selector}, .orserdu-highlight-dark-white[data-ogsc] .orserdu-highlight-ink, .orserdu-highlight-dark-white[data-ogsb] .orserdu-highlight-ink { ${white} }`,
    );
  }
  if (html.includes("orserdu-gmail-screen")) {
    // Gmail can invert the two black layers while the box gradient retains its color.
    rules.push(
      "u + .orserdu-email-body .orserdu-gmail-screen { background:#000 !important;mix-blend-mode:screen; }",
      "u + .orserdu-email-body .orserdu-gmail-difference { background:#000 !important;mix-blend-mode:difference; }",
      "u + .orserdu-email-body .orserdu-gmail-difference, u + .orserdu-email-body .orserdu-gmail-difference * { -webkit-text-fill-color:currentColor !important; }",
    );
  }
  if (!rules.length) return html;
  const style = `<style ${ORSERDU_COLOR_STYLES}>${rules.join("\n")}</style>`;
  return /<\/head\s*>/i.test(html) ? html.replace(/<\/head\s*>/i, `${style}</head>`) : style + html;
}

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
  let preparedHtml = ensureOrserduColorStyles(ensureEmailDarkModeStyles(html));
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
