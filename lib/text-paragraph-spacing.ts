const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
  "meta", "param", "source", "track", "wbr",
]);

export function applyTextParagraphSpacing(html: string, spacingPx: number): string {
  const spacing = Math.max(0, Math.min(200, Number.isFinite(spacingPx) ? spacingPx : 0));
  const blocks: { start: number; end: number; tagName: string }[] = [];
  const stack: string[] = [];
  const tokenPattern = /<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi;
  let token: RegExpExecArray | null;

  while ((token = tokenPattern.exec(html)) !== null) {
    const markup = token[0];
    if (markup.startsWith("<!--")) continue;

    const closing = /^<\//.test(markup);
    const tagName = markup.match(/^<\/?\s*([a-z][\w:-]*)/i)?.[1]?.toLowerCase();
    if (!tagName) continue;

    if (closing) {
      const openIndex = stack.lastIndexOf(tagName);
      if (openIndex !== -1) stack.splice(openIndex);
      continue;
    }

    if (stack.length === 0 && (tagName === "p" || tagName === "div")) {
      blocks.push({ start: token.index, end: tokenPattern.lastIndex, tagName });
    }

    if (!VOID_ELEMENTS.has(tagName) && !/\/\s*>$/.test(markup)) stack.push(tagName);
  }

  if (blocks.length === 0) return html;

  for (let index = blocks.length - 1; index >= 0; index--) {
    const block = blocks[index];
    const tag = html.slice(block.start, block.end);
    const marginBottom = index === blocks.length - 1 ? 0 : spacing;
    const spacingStyle = `margin-top:0!important;margin-bottom:${marginBottom}px!important;`;
    const styleMatch = tag.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i);
    let replacement: string;

    if (styleMatch) {
      const quote = styleMatch[1];
      const style = styleMatch[2]
        .replace(/(?:^|;)\s*margin-top\s*:[^;]*/gi, "")
        .replace(/(?:^|;)\s*margin-bottom\s*:[^;]*/gi, "");
      replacement = tag.replace(
        styleMatch[0],
        ` style=${quote}${style}${style && !style.trimEnd().endsWith(";") ? ";" : ""}${spacingStyle}${quote}`,
      );
    } else {
      replacement = tag.replace(/>$/, ` style="${spacingStyle}">`);
    }

    html = `${html.slice(0, block.start)}${replacement}${html.slice(block.end)}`;
  }

  return html;
}
