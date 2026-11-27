const legacyHeights = [15, 5, 15, 5, 10, 5, 5, 5, 15, 5, 15, 5, 5, 15, 1, 15, 15, 10];
const approvedHeights = [10, 10, 20, 10, 10, 10, 10, 6, 15, 10, 15, 10, 6, 15, 10, 10, 10, 10];

export function applyElzonrisIsiSpacing(html: string): string {
  // Existing emailers store a copy of the original markup. Update only the
  // original spacer pattern so custom layouts keep their own spacing.
  const spacer = /(<td\b[^>]*\bheight\s*=\s*["'])(\d+)(["'][^>]*\bline-height\s*:\s*)(\d+)(px\b[^>]*>\s*(?:&nbsp;|\u00a0)\s*<\/td>)/gi;
  const cells = [...html.matchAll(spacer)];
  if (cells.length !== legacyHeights.length ||
      !cells.every((cell, index) => Number(cell[2]) === legacyHeights[index] && Number(cell[4]) === legacyHeights[index])) {
    return html;
  }

  let index = 0;
  return html.replace(spacer, (_cell, before, _height, between, _lineHeight, after) => {
    const height = approvedHeights[index++];
    return `${before}${height}${between}${height}${after}`;
  });
}

const previousIsiLinks = new Map([
  ["https://rxmenarinistemline.com/ELZONRIS_US_Full_Prescribing_Information.pdf", "http://pi.elzonris.com/"],
  ["https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program", "https://www.fda.gov/medwatch"],
]);

export function renderElzonrisIsi(html: string): string {
  return applyElzonrisIsiSpacing(html).replace(/<a\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, anchor =>
    anchor.replace(/(\shref\s*=\s*)(["'])(.*?)\2/i, (attribute, prefix, quote, href) => {
      const current = previousIsiLinks.get(href);
      return current ? `${prefix}${quote}${current}${quote}` : attribute;
    }),
  );
}
