const pdfMake = require('pdfmake/build/pdfmake');

const docDefinition = {
  content: [
    { text: 'Variable Copy', style: 'title' },
    { text: 'Hello World', style: 'normal' },
    { text: 'Some <b>bold</b> and <i>italic</i> text' },
  ],
  styles: {
    title: { fontSize: 14, bold: true, color: '#006937' },
    normal: { fontSize: 10 },
  },
};

(async () => {
  try {
    const result = pdfMake.createPdf(docDefinition);
    const buffer = await new Promise((resolve, reject) => {
      result.getBuffer((buf) => resolve(Buffer.from(buf)), reject);
      setTimeout(() => reject(new Error('timeout')), 20000);
    });
    console.log('PDF bytes:', buffer.length);
    console.log('Header:', buffer.toString('latin1', 0, 8));
    require('fs').writeFileSync(require('path').join(process.env.TEMP, 'opencode', 'test-pdfmake3.pdf'), buffer);
    console.log('written');
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
})();