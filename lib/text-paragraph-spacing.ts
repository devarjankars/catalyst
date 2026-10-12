const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
  "meta", "param", "source", "track", "wbr",
]);
const BLOCK_ELEMENTS = new Set([
  "blockquote", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "p", "pre",
]);
const SPACING_MARKER = "data-text-spacing-original-style";
const STYLE_PRESENT_MARKER = "data-text-spacing-had-style";

function getBlockOpenings(html: string): { start: number; end: number; hasNestedBlock: boolean }[] {
  const candidates: { start: number; end: number; hasNestedBlock: boolean }[] = [];
  const stack: { tagName: string; candidateIndex?: number }[] = [];
  const tokenPattern = /<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi;
  let token: RegExpExecArray | null;

  while ((token = tokenPattern.exec(html)) !== null) {
    const markup = token[0];
    if (markup.startsWith("<!--")) continue;

    const closing = /^<\//.test(markup);
    const tagName = markup.match(/^<\/?\s*([a-z][\w:-]*)/i)?.[1]?.toLowerCase();
    if (!tagName) continue;

    if (closing) {
      const openIndex = stack.map((entry) => entry.tagName).lastIndexOf(tagName);
      if (openIndex !== -1) stack.splice(openIndex);
      continue;
    }

    let candidateIndex: number | undefined;
    if (BLOCK_ELEMENTS.has(tagName)) {
      for (const entry of stack) {
        if (entry.candidateIndex !== undefined) {
          candidates[entry.candidateIndex].hasNestedBlock = true;
        }
      }
      candidateIndex = candidates.push({
        start: token.index,
        end: tokenPattern.lastIndex,
        hasNestedBlock: false,
      }) - 1;
    }

    if (!VOID_ELEMENTS.has(tagName) && !/\/\s*>$/.test(markup)) {
      stack.push({ tagName, candidateIndex });
    }
  }

  return candidates
    .filter((candidate) => !candidate.hasNestedBlock);
}

function removeMargins(style: string): string {
  return style
    .replace(/(?:^|;)\s*margin-(?:top|bottom)\s*:[^;]*/gi, "")
    .replace(/^\s*;+|;{2,}/g, "")
    .trim()
    .replace(/;$/, "");
}

function updateBlockStyle(markup: string, spacingPx: number, trackOriginalStyle: boolean): string {
  const styleMatch = markup.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i);
  const originalStyle = styleMatch?.[2] || "";
  const baseStyle = removeMargins(originalStyle);
  const style = `${baseStyle}${baseStyle ? ";" : ""}margin-top:0!important;margin-bottom:${spacingPx}px!important;`;
  let updated = styleMatch
    ? markup.replace(styleMatch[0], ` style="${style}"`)
    : markup.replace(/\/?>$/, (end) => ` style="${style}"${end}`);

  if (trackOriginalStyle) {
    const markers = ` ${SPACING_MARKER}="${encodeURIComponent(originalStyle)}" ${STYLE_PRESENT_MARKER}="${styleMatch ? "true" : "false"}"`;
    updated = updated.replace(/\/?>$/, (end) => `${markers}${end}`);
  }

  return updated;
}

export function removeTextParagraphSpacing(html: string): string {
  const tokenPattern = /<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi;
  let result = "";
  let lastIndex = 0;
  let token: RegExpExecArray | null;

  while ((token = tokenPattern.exec(html)) !== null) {
    result += html.slice(lastIndex, token.index);
    let markup = token[0];
    lastIndex = tokenPattern.lastIndex;

    if (!markup.startsWith("<!--") && markup.includes(SPACING_MARKER)) {
      const originalStyle = markup.match(new RegExp(`${SPACING_MARKER}=(["'])(.*?)\\1`, "i"))?.[2];
      const hadStyle = markup.match(new RegExp(`${STYLE_PRESENT_MARKER}=(["'])(.*?)\\1`, "i"))?.[2] === "true";

      if (hadStyle && originalStyle !== undefined) {
        markup = markup.replace(/\sstyle\s*=\s*(["'])[\s\S]*?\1/i, ` style="${decodeURIComponent(originalStyle)}"`);
      } else {
        markup = markup.replace(/\sstyle\s*=\s*(["'])[\s\S]*?\1/i, "");
      }

      markup = markup
        .replace(new RegExp(`\\s${SPACING_MARKER}=(["']).*?\\1`, "i"), "")
        .replace(new RegExp(`\\s${STYLE_PRESENT_MARKER}=(["']).*?\\1`, "i"), "");
    }

    if (!markup.startsWith("<!--")) {
      const styleMatch = markup.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i);
      if (
        styleMatch
        && /margin-top\s*:\s*0(?:px)?\s*!important/i.test(styleMatch[2])
        && /margin-bottom\s*:\s*\d+(?:\.\d+)?px\s*!important/i.test(styleMatch[2])
      ) {
        const remainingStyle = removeMargins(styleMatch[2]);
        markup = remainingStyle
          ? markup.replace(styleMatch[0], ` style="${remainingStyle}"`)
          : markup.replace(styleMatch[0], "");
      }
    }

    result += markup;
  }

  return result + html.slice(lastIndex);
}

export function applyTextParagraphSpacing(
  html: string,
  spacingPx: number,
  trackOriginalStyle = true,
): string {
  const spacing = Math.max(0, Math.min(200, Number.isFinite(spacingPx) ? spacingPx : 0));
  const source = removeTextParagraphSpacing(html);
  const openings = getBlockOpenings(source);
  if (openings.length === 0) return source;

  html = source;
  for (let index = openings.length - 1; index >= 0; index--) {
    const { start, end } = openings[index];
    const markup = html.slice(start, end);
    const marginBottom = index === openings.length - 1 ? 0 : spacing;
    const replacement = updateBlockStyle(markup, marginBottom, trackOriginalStyle);
    html = `${html.slice(0, start)}${replacement}${html.slice(end)}`;
  }

  return html;
}
