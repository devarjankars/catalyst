const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { chromium } = require('playwright');
const { PDFDocument } = require('pdf-lib');

test('PDF export includes overflowing edges, long content, and all three options', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<html><body></body></html>');
    await page.addScriptTag({ path: path.join(path.dirname(require.resolve('html2canvas-pro')), 'html2canvas-pro.js') });
    await page.addScriptTag({ path: require.resolve('jspdf/dist/jspdf.umd.min.js') });
    await page.addScriptTag({ path: require.resolve('pdf-lib/dist/pdf-lib.min.js') });
    await page.addScriptTag({ path: require.resolve('pdfmake/build/pdfmake.js') });
    await page.addScriptTag({ path: require.resolve('pdfmake/build/vfs_fonts.js') });
    await page.addScriptTag({ path: require.resolve('html-to-pdfmake/browser.js') });
    const source = fs.readFileSync(path.join(__dirname, '../lib/vsb-pdf-export.ts'), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    await page.evaluate((code) => {
      window.captures = [];
      const capture = async (element, options) => {
        const canvas = await window.html2canvas(element, options);
        const context = canvas.getContext('2d');
        window.captures.push({
          width: options.width,
          height: options.height,
          bottomRight: Array.from(context.getImageData(canvas.width - 2, canvas.height - 2, 1, 1).data),
        });
        return canvas;
      };
      const exports = {};
      new Function('require', 'exports', code)((name) => {
        if (name === 'html2canvas-pro') return { default: capture };
        if (name === 'jspdf') return window.jspdf;
        if (name === 'pdf-lib') return window.PDFLib;
        if (name === 'pdfmake/build/pdfmake') return window.pdfMake;
        if (name === 'pdfmake/build/vfs_fonts') return {};
        if (name === 'html-to-pdfmake') return window.htmlToPdfmake;
        throw new Error('Unexpected dependency: ' + name);
      }, exports);
      window.vsbExport = exports;
    }, outputText);

    const result = await page.evaluate(async () => {
      const red = (width, height) => `<div style="width:${width}px;height:${height}px;background:#ff0000"></div>`;
      const blob = await window.vsbExport.generateVsbPdfBlob([
        { html: red(648, 800), width: 600 },
        { columns: [0, 1, 2].map(() => ({ html: red(600, 400), width: 600 })), gap: 20, pageWidth: 1900 },
        { html: red(375, 20000), width: 375 },
      ]);
      return {
        bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
        captures: window.captures,
        remainingFrames: document.querySelectorAll('iframe').length,
      };
    });
    const pdf = await PDFDocument.load(Uint8Array.from(result.bytes));
    const pages = pdf.getPages();
    assert.equal(pages.length, 3);
    // The PDF media boxes must include the entire image, without portrait swaps.
    assert.equal(pages[0].getWidth(), 648 * 0.75);
    assert.equal(pages[0].getHeight(), 800 * 0.75);
    assert.equal(pages[1].getWidth(), 1900 * 0.75);
    assert.equal(pages[1].getHeight(), 400 * 0.75);
    assert.equal(pages[2].getHeight(), 14400);
    assert.equal(pages[2].getWidth(), 375 * (19200 / 20000) * 0.75);
    assert.equal(result.captures.length, 5);
    for (const capture of result.captures) {
      assert.deepEqual(capture.bottomRight, [255, 0, 0, 255], 'bottom and right edges must be captured');
    }
    assert.equal(result.remainingFrames, 0);

    const widths = await page.evaluate(async () => {
      window.captures = [];
      await window.vsbExport.generateVsbPdfBlob([
        { html: window.vsbExport.buildVariableCopyHtml([], 'Test'), width: 600 },
        { html: window.vsbExport.buildAltNameHtml([], 'Test'), width: 600 },
      ]);
      return window.captures.map(capture => capture.width);
    });
    assert.deepEqual(widths, [600, 600], 'structured-page padding must fit within the page width');
    const textBytes = await page.evaluate(async () => {
      const blob = await window.vsbExport.generateVsbPdfBlob([
        { html: window.vsbExport.buildVariableCopyHtml([], 'Test'), width: 600, mode: 'text' },
        { html: window.vsbExport.buildAltNameHtml([], 'Test'), width: 600, mode: 'text' },
      ]);
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });
    const textPdf = await PDFDocument.load(Uint8Array.from(textBytes));
    assert.equal(textPdf.getPageCount(), 2, 'both remote text-mode pages survive the merge');
  } finally {
    await browser.close();
  }
});
