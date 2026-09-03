const pdfMake = require('pdfmake/build/pdfmake');
const vfsFonts = require('pdfmake/build/vfs_fonts');

// Try to attach the base64 font map into the virtual file system
try {
  pdfMake.virtualfs.storage = vfsFonts;
  console.log('storage set, size =', Object.keys(pdfMake.virtualfs.storage).length);
} catch (e) {
  console.error('set storage failed:', e.message);
}

const docDefinition = {
  pageSize: 'A4',
  content: [
    { text: 'Variable Copy', style: 'title' },
    { text: 'Hello <b>World</b> from pdfmake 0.3.0', style: 'normal' },
    { table: { headerRows: 1, widths: ['*', '*'], body: [
        [{ text: 'Friendly From Name', style: 'th' }, { text: 'From Email Address', style: 'th' }],
        ['Hello Corp', 'hello@corp.com'],
      ] } },
  ],
  styles: {
    title: { fontSize: 14, bold: true, color: '#006937' },
    normal: { fontSize: 10 },
    th: { fontSize: 9, bold: true, color: '#FF66CC' },
  },
};

(async () => {
  try {
    const result = pdfMake.createPdf(docDefinition);
    const buffer = await new Promise((resolve, reject) => {
      result.getBuffer((buf) => resolve(Buffer.from(buf)));
      setTimeout(() => reject(new Error('timeout')), 30000);
    });
    console.log('PDF bytes:', buffer.length);
    console.log('Header:', buffer.toString('latin1', 0, 8));
    require('fs').writeFileSync(require('path').join(process.env.TEMP, 'opencode', 'test-pdfmake4.pdf'), buffer);
    console.log('written');
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error((e.stack || '').split('\n').slice(0, 4).join('\n'));
  }
})();