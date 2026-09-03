const pdfmake = require('pdfmake');

const docDefinition = {
  content: [
    { text: 'Variable Copy', style: 'title' },
    { text: 'Hello World', style: 'normal' }
  ],
  styles: {
    title: { fontSize: 14, bold: true, color: '#006937' },
    normal: { fontSize: 10 }
  }
};

try {
  const fonts = {
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  };
  const printer = new pdfmake(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks = [];
  pdfDoc.on('data', c => chunks.push(c));
  pdfDoc.on('end', () => {
    const buf = Buffer.concat(chunks);
    console.log('PDF bytes:', buf.length);
    console.log('Header:', buf.toString('latin1', 0, 8));
    require('fs').writeFileSync(require('path').join(process.env.TEMP, 'opencode', 'test-pdfmake2.pdf'), buf);
    console.log('written');
  });
  pdfDoc.end();
} catch (e) {
  console.error('ERROR:', e.message);
  console.error(e.stack);
}