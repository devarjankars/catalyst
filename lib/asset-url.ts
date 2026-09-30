/**
 * Shared default for the Orserdu footer logo.
 * Used by both the canvas renderer and the HTML generator so they always
 * show the same image.
 */
export const DEFAULT_ORSERDU_FOOTER_LOGO = "/menarini-stemline-logos.png"

/**
 * resolveEmailAssetUrl
 *
 * Converts any image src to a fully-qualified URL suitable for use in
 * generated email HTML, PDF rendering, and Preview iframes.
 *
 * Rules:
 *   - Absolute https?:// / http:// / data: / cid: / blob: → returned unchanged
 *   - /public/foo, public/foo, ./foo → normalised to /foo first
 *   - /foo (root-relative) + baseUrl → https://baseUrl/foo  (absolute)
 *   - /foo without baseUrl → /foo  (canvas / same-origin preview — fine)
 *
 * The baseUrl should be:
 *   - process.env.NEXT_PUBLIC_EMAIL_ASSET_BASE_URL  (production deploy)
 *   - window.location.origin                        (local preview fallback)
 *   - request.nextUrl.origin                        (server-side PDF route)
 */
export function resolveEmailAssetUrl(src: string | undefined | null, baseUrl?: string): string {
  if (!src) return ""

  const s = src.trim()

  // Already an absolute URL — keep as-is
  if (/^(https?:|http:|data:|cid:|blob:)/i.test(s)) return s

  // Strip /public prefix (Next.js serves public/ at root)
  const stripped = s
    .replace(/^\.\//, "/")        // ./foo  → /foo
    .replace(/^public\//, "/")    // public/foo → /foo
    .replace(/^\/public\//, "/")  // /public/foo → /foo

  // Ensure leading slash
  const rooted = stripped.startsWith("/") ? stripped : `/${stripped}`

  // Resolve against configured asset base URL (env var takes priority)
  const base =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_EMAIL_ASSET_BASE_URL) ||
    baseUrl ||
    ""

  if (base) {
    return `${base.replace(/\/$/, "")}${rooted}`
  }

  return rooted
}

// Keep the old name as an alias so existing callers don't break
export const normalizeEmailAssetUrl = resolveEmailAssetUrl

/**
 * normalizeHtmlImageSrcs
 *
 * Applies resolveEmailAssetUrl to every src="..." attribute in an HTML string.
 * Used to fix generated HTML before it is sent to Chromium for PDF rendering.
 */
export function normalizeHtmlImageSrcs(html: string, baseUrl: string): string {
  return html.replace(/(<img[^>]+\bsrc\s*=\s*)(["'])([^"']*)\2/gi, (_match, prefix, quote, src) => {
    return `${prefix}${quote}${resolveEmailAssetUrl(src, baseUrl)}${quote}`
  })
}
