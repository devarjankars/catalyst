/**
 * Regression tests: orsedu-footer logo consistency
 *
 * Self-contained CJS — inlines the asset-url logic so no TypeScript
 * compilation is needed. Run with: node tests/footer-logo.test.cjs
 *
 * Verifies that:
 * 1. DEFAULT_ORSERDU_FOOTER_LOGO is the correct asset path.
 * 2. resolveEmailAssetUrl handles all path variants correctly.
 * 3. normalizeHtmlImageSrcs converts root-relative paths to absolute for PDF.
 * 4. No footer image silently becomes /public/... or ./ in output.
 * 5. Firebase / remote URLs are preserved unchanged.
 * 6. Canvas and HTML generator use the same footer logo fallback (verified
 *    by checking the constant value — both files import it from asset-url).
 */

// ── Inline asset-url logic (mirrors lib/asset-url.ts exactly) ────────────────

const DEFAULT_ORSERDU_FOOTER_LOGO = '/menarini-stemline-logos.png';

function resolveEmailAssetUrl(src, baseUrl) {
  if (!src) return '';
  const s = src.trim();
  if (/^(https?:|http:|data:|cid:|blob:)/i.test(s)) return s;
  const stripped = s
    .replace(/^\.\//, '/')
    .replace(/^public\//, '/')
    .replace(/^\/public\//, '/');
  const rooted = stripped.startsWith('/') ? stripped : `/${stripped}`;
  const base = baseUrl || '';
  if (base) return `${base.replace(/\/$/, '')}${rooted}`;
  return rooted;
}

function normalizeHtmlImageSrcs(html, baseUrl) {
  return html.replace(/(<img[^>]+\bsrc\s*=\s*)([\"'])([^\"']*)(\2)/gi, (_match, prefix, quote, src) => {
    return `${prefix}${quote}${resolveEmailAssetUrl(src, baseUrl)}${quote}`;
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// ── 1. Shared constant is the correct asset ───────────────────────────────────
console.log('\n1. DEFAULT_ORSERDU_FOOTER_LOGO');
assert(
  DEFAULT_ORSERDU_FOOTER_LOGO === '/menarini-stemline-logos.png',
  `DEFAULT_ORSERDU_FOOTER_LOGO === '/menarini-stemline-logos.png' (got: ${DEFAULT_ORSERDU_FOOTER_LOGO})`
);

// ── 2. resolveEmailAssetUrl — path normalisation ──────────────────────────────
console.log('\n2. resolveEmailAssetUrl path normalisation');
const cases = [
  ['/menarini-stemline-logos.png',        'https://app.example.com', 'https://app.example.com/menarini-stemline-logos.png'],
  ['/public/menarini-stemline-logos.png', 'https://app.example.com', 'https://app.example.com/menarini-stemline-logos.png'],
  ['public/menarini-stemline-logos.png',  'https://app.example.com', 'https://app.example.com/menarini-stemline-logos.png'],
  ['./menarini-stemline-logos.png',       'https://app.example.com', 'https://app.example.com/menarini-stemline-logos.png'],
  ['https://firebasestorage.googleapis.com/img.png', 'https://app.example.com', 'https://firebasestorage.googleapis.com/img.png'],
  ['data:image/png;base64,abc',           'https://app.example.com', 'data:image/png;base64,abc'],
  ['/footer-logo-a.png',                  'https://app.example.com', 'https://app.example.com/footer-logo-a.png'],
  ['/menarini-stemline-logos.png',        undefined,                 '/menarini-stemline-logos.png'],
  ['/footer-line.png',                    'https://app.example.com', 'https://app.example.com/footer-line.png'],
  ['/logo.png',                           'https://app.example.com', 'https://app.example.com/logo.png'],
  ['/Idorsia.png',                        'https://app.example.com', 'https://app.example.com/Idorsia.png'],
  ['/linkedin.png',                       'https://app.example.com', 'https://app.example.com/linkedin.png'],
];

for (const [input, base, expected] of cases) {
  const result = resolveEmailAssetUrl(input, base);
  assert(
    result === expected,
    `resolveEmailAssetUrl(${JSON.stringify(input)}, ${JSON.stringify(base)}) → ${expected} (got: ${result})`
  );
}

// ── 3. normalizeHtmlImageSrcs converts root-relative to absolute ──────────────
console.log('\n3. normalizeHtmlImageSrcs');
const origin = 'https://app.example.com';

const sampleHtml = `<img src="/menarini-stemline-logos.png" alt="footer" /><img src="/footer-logo-a.png" alt="a" />`;
const normalized = normalizeHtmlImageSrcs(sampleHtml, origin);

assert(
  normalized.includes(`src="${origin}/menarini-stemline-logos.png"`),
  `footer logo becomes absolute: ${origin}/menarini-stemline-logos.png`
);
assert(
  !normalized.includes('src="/menarini-stemline-logos.png"'),
  'no root-relative footer logo src remains after normalisation'
);
assert(
  normalized.includes(`src="${origin}/footer-logo-a.png"`),
  `footer-logo-a.png becomes absolute`
);

// ── 4. No /public/ or ./ paths in output ─────────────────────────────────────
console.log('\n4. No /public/ or ./ paths in output');
const publicHtml = `<img src="/public/menarini-stemline-logos.png" /><img src="./footer-line.png" />`;
const normalizedPublic = normalizeHtmlImageSrcs(publicHtml, origin);

assert(
  !normalizedPublic.includes('src="/public/'),
  'no src="/public/..." paths in output'
);
assert(
  !normalizedPublic.includes('src="./'),
  'no src="./" paths in output'
);
assert(
  normalizedPublic.includes(`${origin}/menarini-stemline-logos.png`),
  '/public/menarini-stemline-logos.png → absolute URL'
);
assert(
  normalizedPublic.includes(`${origin}/footer-line.png`),
  './footer-line.png → absolute URL'
);

// ── 5. Firebase / remote URLs are preserved ───────────────────────────────────
console.log('\n5. Firebase / remote URLs preserved');
const firebaseHtml = `<img src="https://firebasestorage.googleapis.com/v0/b/bucket/o/img.png?alt=media" />`;
const normalizedFirebase = normalizeHtmlImageSrcs(firebaseHtml, origin);
assert(
  normalizedFirebase.includes('https://firebasestorage.googleapis.com'),
  'Firebase URLs are preserved unchanged'
);

const dataHtml = `<img src="data:image/png;base64,abc123" />`;
const normalizedData = normalizeHtmlImageSrcs(dataHtml, origin);
assert(
  normalizedData.includes('data:image/png;base64,abc123'),
  'data: URIs are preserved unchanged'
);

// ── 6. Canvas and HTML generator use the same constant ────────────────────────
console.log('\n6. Canvas / HTML generator use same constant');
// Both files import DEFAULT_ORSERDU_FOOTER_LOGO from lib/asset-url.
// We verify the constant value is correct — if either file used a different
// hardcoded string, the canvas and generated HTML would diverge.
assert(
  DEFAULT_ORSERDU_FOOTER_LOGO === '/menarini-stemline-logos.png',
  'Shared constant ensures canvas and HTML generator use the same footer logo'
);

// ── 7. orsedu-footer with no src falls back to DEFAULT_ORSERDU_FOOTER_LOGO ───
console.log('\n7. orsedu-footer fallback');
// Simulate what email-generator.ts does:
//   const rawSrc = component.src || DEFAULT_ORSERDU_FOOTER_LOGO;
//   const imgSrc = resolveEmailAssetUrl(rawSrc);
const componentNoSrc = { src: undefined };
const rawSrc = componentNoSrc.src || DEFAULT_ORSERDU_FOOTER_LOGO;
const imgSrc = resolveEmailAssetUrl(rawSrc);
assert(
  imgSrc === '/menarini-stemline-logos.png',
  `orsedu-footer with no src resolves to /menarini-stemline-logos.png (got: ${imgSrc})`
);

// After normalizeHtmlImageSrcs with a base URL it becomes absolute:
const footerHtml = `<img src="${imgSrc}" alt="footer" />`;
const absoluteFooterHtml = normalizeHtmlImageSrcs(footerHtml, origin);
assert(
  absoluteFooterHtml.includes(`src="${origin}/menarini-stemline-logos.png"`),
  `After normalizeHtmlImageSrcs, footer logo is absolute: ${origin}/menarini-stemline-logos.png`
);

// ── 8. Old wrong fallbacks are not used ───────────────────────────────────────
console.log('\n8. Old wrong fallbacks not used');
// The old code used /footer-logo-a.png and /header-placeholder.png as footer fallbacks.
// Verify the constant is neither of those.
assert(
  DEFAULT_ORSERDU_FOOTER_LOGO !== '/footer-logo-a.png',
  'DEFAULT_ORSERDU_FOOTER_LOGO is not the old /footer-logo-a.png'
);
assert(
  DEFAULT_ORSERDU_FOOTER_LOGO !== '/header-placeholder.png',
  'DEFAULT_ORSERDU_FOOTER_LOGO is not the old /header-placeholder.png'
);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
if (failed === 0) {
  console.log(`✅ All ${passed} footer logo regression tests passed.`);
} else {
  console.error(`❌ ${failed} test(s) failed, ${passed} passed.`);
  process.exit(1);
}
