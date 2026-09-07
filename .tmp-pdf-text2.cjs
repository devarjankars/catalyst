const fs = require('fs');

// Try to use pdf-parse if available
try {
  const pdfParse = require('pdf-parse');
  const pdfPath = process.argv[2];
  const data = fs.readFileSync(pdfPath);
  pdfParse(data).then(result => {
    console.log('Pages: ' + result.numpages);
    console.log('--- TEXT (first 3000 chars) ---');
    console.log(result.text.substring(0, 3000));
  }).catch(err => {
    console.error('pdf-parse error:', err.message);
  });
} catch(e) {
  console.log('pdf-parse not available, trying pdf-lib...');
  try {
    const { PDFDocument } = require('pdf-lib');
    const pdfPath = process.argv[2];
    const data = fs.readFileSync(pdfPath);
    PDFDocument.load(data).then(doc => {
      console.log('Pages: ' + doc.getPageCount());
      const pageTexts = [];
      for (let i = 0; i < doc.getPageCount(); i++) {
        const page = doc.getPage(i);
        const imgs = page.images || [];
        console.log('p' + (i+1) + ' w:' + page.getWidth() + ' h:' + page.getHeight() + ' images:' + imgs.length);
      }
    });
  } catch(e2) {
    console.error('No PDF libraries available');
  }
}
