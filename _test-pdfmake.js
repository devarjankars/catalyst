const pdfmake = require('pdfmake');
const htmlToPdfmake = require('html-to-pdfmake');

const html = `<!DOCTYPE html><html><head><style>
body{margin:0;padding:0;width:600px;background:#fff;font-family:Arial;}
table{width:100%;border-collapse:collapse}
td{border:1px solid #ddd;padding:6px}
</style></head><body style="margin:0;padding:0;width:600px;">
<div style="background:#333;color:#fff;padding:20px;text-align:center;"><h1 style="margin:0;font-size:18px;">Product Title</h1></div>
<table><tr><td>Name</td><td>Price</td></tr><tr><td>Widget</td><td>$10</td></tr></table>
<p>Hello <b>World</b> from <i>pdfmake</i>.</p>
</body></html>`;

(async () => {
  try {
    const docDefinition = htmlToPdfmake(html);
    const printer = new pdfmake({});
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on('data', (c) => chunks.push(c));
    pdfDoc.on('end', () => {
      const buf = Buffer.concat(chunks);
      console.log('PDF bytes:', buf.length);
      console.log('Header:', buf.toString('latin1', 0, 8));
      require('fs').writeFileSync(require('path').join(process.env.TEMP, 'opencode', 'test-pdfmake.pdf'), buf);
      console.log('written');
    });
    pdfDoc.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
})();