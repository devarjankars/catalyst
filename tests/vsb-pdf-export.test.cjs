const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { createRequire } = require('node:module');
const { PDFDocument } = require('pdf-lib');

function loadTypeScript(filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const exports = {};
  const requireFromModule = createRequire(filename);
  function load(name) {
    // Next.js resolves the server-only marker when compiling the server bundle.
    if (name === 'server-only') return {};
    if (name.startsWith('.')) return loadTypeScript(path.resolve(path.dirname(filename), name + '.ts'));
    return requireFromModule(name);
  }
  new Function('exports', 'require', outputText)(exports, load);
  return exports;
}

const loadLib = name => loadTypeScript(path.join(__dirname, '../lib', name + '.ts'));

test('Variable Copy PDF layout puts the project name above its section heading', () => {
  const exports = loadLib('vsb-pdf-export');
  const html = exports.buildVariableCopyHtml([], 'Test');

  assert.match(html, /font-size:13px;color:#006937;font-weight:bold;margin:0 0 16px;">Test<\/div>/);
  assert.match(html, /font-size:12px;font-weight:bold;margin:0 0 18px;color:#FF66CC;">Variable Copy<\/div>/);
  assert.doesNotMatch(html, /1\. Variable Copy|VSB Component Section|border-bottom:2px solid #006937/);
});

test('Chromium PDF export measures a tall email and merges desktop options and copy pages', async () => {
  const { buildVariableCopyHtml, buildAltNameHtml } = loadLib('vsb-pdf-export');
  const { generateVsbPdfBuffer } = loadLib('vsb-pdf-chromium');
  const panel = (label, height) => `<div style="height:${height}px;background:#ff0000">${label}</div>`;
  const buffer = await generateVsbPdfBuffer([
    { html: panel('Tall email body', 2400), width: 600 },
    { columns: ['Option one', 'Option two', 'Option three'].map(label => ({ html: panel(label, 400), width: 600 })), gap: 20, pageWidth: 1900 },
    { html: buildVariableCopyHtml([], 'Test'), width: 600, mode: 'text' },
    { html: buildAltNameHtml([], 'Test'), width: 600, mode: 'text' },
  ]);
  const pdf = await PDFDocument.load(buffer);
  const pages = pdf.getPages();
  assert.equal(pages.length, 4);
  assert.ok(pages[0].getHeight() >= 2400 * 0.75);
  assert.ok(pages[1].getHeight() >= 400 * 0.75);
  for (const [index, expected] of [600, 1900, 600, 600].entries()) {
    assert.ok(Math.abs(pages[index].getWidth() - expected * 0.75) <= 1, `page ${index + 1} width`);
  }
});
