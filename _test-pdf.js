const React = require('react');
const { Document, Page, View, Text, StyleSheet, pdf } = require('@react-pdf/renderer');

const h = React.createElement;
const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 9, color: '#000', backgroundColor: '#fff' },
  title: { fontSize: 13, fontWeight: 'bold', color: '#006937', marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 12 },
  normalText: { fontSize: 10, marginBottom: 2 },
  boldLabel: { fontWeight: 'bold', marginRight: 6 },
  emailNameTitle: { fontSize: 18, fontWeight: 'bold', color: '#006937', textTransform: 'uppercase', marginBottom: 4 },
  previewLabel: { fontSize: 10, color: '#666', fontStyle: 'italic' },
});

const html = '<!DOCTYPE html><html><head><style>body{margin:0}</style></head><body style="margin:0;padding:0;width:600px;"><div>Hello <b>World</b><img src="/foo.png"></div></body></html>';

function pageSize(widthOverride, fallback) {
  const parsed = widthOverride ? parseInt(widthOverride, 10) : NaN;
  const width = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  return [width, Math.round(width * 1.414)];
}

const doc = h(
  Document,
  null,
  h(Page, { size: 'A4', style: styles.page },
    h(Text, { style: styles.title }, 'Test Email'),
    h(Text, { style: { ...styles.sectionTitle, color: '#FF66CC' } }, 'Variable copy'),
    h(Text, { style: styles.normalText }, h(Text, { style: styles.boldLabel }, 'Option 1:'), 'Value'),
  ),
  h(Page, { size: pageSize('600px', 600), style: styles.page },
    h(Text, { style: styles.emailNameTitle }, 'TEST'),
    h(Text, { style: styles.previewLabel }, 'HTML Preview - 600px'),
    h(Text, {}, html.substring(0, 3000) + '...'),
  ),
);

(async () => {
  try {
    const blob = await pdf(doc).toBlob();
    const buf = Buffer.from(await blob.arrayBuffer());
    console.log('PDF bytes:', buf.length);
    console.log('Header:', buf.toString('latin1', 0, 8));
    require('fs').writeFileSync(require('path').join(process.env.TEMP, 'opencode', 'test-vsb.pdf'), buf);
    console.log('written');
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
})();