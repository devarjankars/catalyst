/**
 * Client-side PDF generation — runs entirely in the browser.
 * No server action, no body size limits, no network round-trip.
 */
"use client";

export interface PdfSection {
  type: 'variableCopy' | 'altName' | 'emailImage';
  label?: string;
  imageBase64?: string;
  imageHeight?: number;   // actual pixel height of the screenshot (for tight page sizing)
  variableCopyData?: any;
  altNameData?: any;
  emailName?: string;
  headingColor?: string;
  isMobile?: boolean;
}

/**
 * Screenshot an HTML string into a base64 JPEG using html2canvas.
 * Returns both the image data and the natural pixel height of the captured content.
 */
export async function screenshotEmailHtml(
  html: string,
  width: number,
  quality = 0.92,
): Promise<{ base64: string; height: number }> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: fixed; top: -9999px; left: -9999px;
      width: ${width}px; height: 2px;
      border: none; visibility: hidden;
    `;
    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        await new Promise(r => setTimeout(r, 1000));
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc?.body) { resolve({ base64: '', height: 800 }); return; }
        doc.body.style.margin  = '0';
        doc.body.style.padding = '0';
        doc.body.style.width   = `${width}px`;

        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(doc.body, {
          useCORS:      true,
          allowTaint:   true,
          scale:        2,
          width,
          scrollX:      0,
          scrollY:      0,
          windowWidth:  width,
          windowHeight: 12000,
          backgroundColor: '#ffffff',
          logging: false,
        });
        resolve({
          base64: canvas.toDataURL('image/jpeg', quality),
          height: canvas.height,   // actual pixel height at scale 2
        });
      } catch (e) {
        console.error('[screenshotEmailHtml] failed:', e);
        resolve({ base64: '', height: 800 });
      } finally {
        document.body.removeChild(iframe);
      }
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) { doc.open(); doc.write(html); doc.close(); }
  });
}

/**
 * Generate and download the VSB PDF entirely in the browser.
 */
export async function generateVSBPdfClientSide(params: {
  emailName: string;
  sections:  PdfSection[];
}): Promise<Blob> {
  const { pdf, Document, Page, View, Text, Image, StyleSheet, Font } =
    await import('@react-pdf/renderer');

  // ── Page dimensions ───────────────────────────────────────────────────────
  // A4 in pts: 595 × 842
  // Email pages: use full A4 width so the email image fills nicely
  const A4_W  = 595;
  const A4_H  = 842;
  // For email preview pages, we use a tall custom size so the full email fits
  // without being squashed. Width = A4, height auto-sized by content (tall cap).
  const EMAIL_W        = A4_W;
  const EMAIL_H_TALL   = 3000;   // pts — enough for the longest email
  const EMAIL_PADDING  = 24;     // pts padding on each side

  const styles = StyleSheet.create({
    pageA4: {
      padding: 32,
      backgroundColor: '#fff',
      fontFamily: 'Helvetica',
      fontSize: 9,
    },
    pageEmail: {
      padding: EMAIL_PADDING,
      backgroundColor: '#f3f4f6',   // light gray background behind the email
    },
    emailCard: {
      backgroundColor: '#ffffff',
      padding: 0,
      shadowColor:    '#000',
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#006937',
      marginBottom: 6,
    },
    label: {
      fontSize: 9,
      color: '#555',
      fontStyle: 'italic',
      marginBottom: 10,
    },
    heading: {
      fontSize: 11,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    normalText: {
      fontSize: 9,
      marginBottom: 3,
      lineHeight: 1.4,
    },
    boldLabel: { fontWeight: 'bold' },
    tableContainer: {
      borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid',
      marginBottom: 12,
    },
    row:    { flexDirection: 'row' },
    cell:   { padding: 6, flex: 1, borderRightWidth: 1, borderRightColor: '#e5e7eb', borderRightStyle: 'solid', fontSize: 9, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', borderBottomStyle: 'solid' },
    cellHd: { padding: 6, flex: 1, fontWeight: 'bold', backgroundColor: '#f9fafb', borderRightWidth: 1, borderRightColor: '#e5e7eb', borderRightStyle: 'solid', fontSize: 9, color: '#FF66CC', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', borderBottomStyle: 'solid' },
  });

  // ── Section renderers ─────────────────────────────────────────────────────

  const renderVariableCopy = (data: any[], emailname: string, headingColor = '#FF66CC') => (
    <Page size="A4" style={styles.pageA4}>
      <Text style={{ ...styles.sectionTitle, color: headingColor }}>{emailname}</Text>
      <Text style={{ ...styles.heading, color: headingColor }}>Variable Copy</Text>
      {data.map((section: any, idx: number) => {
        if (section.structure === 'table') {
          const opts = section.options as Array<{ fromEmail: string; friendlyNames: string[] }>;
          return (
            <View key={idx} style={{ marginBottom: 14 }}>
              <Text style={{ ...styles.heading, color: headingColor }}>{section.heading}</Text>
              <View style={styles.tableContainer}>
                <View style={styles.row}>
                  <Text style={styles.cellHd}>Friendly From Name</Text>
                  <Text style={{ ...styles.cellHd, borderRightWidth: 0 }}>From Email Address</Text>
                </View>
                {opts.map((row, ri) => (
                  <View key={ri} style={styles.row}>
                    <View style={styles.cell}>
                      {row.friendlyNames.map((n, ni) => (
                        <Text key={ni} style={styles.normalText}>{ni + 1}. {n}</Text>
                      ))}
                    </View>
                    <Text style={{ ...styles.cell, borderRightWidth: 0 }}>{row.fromEmail}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        }
        if (section.structure === 'third-party-placeholder') {
          return (
            <View key={idx} style={{ marginBottom: 12 }}>
              {(section.options as string[]).map((op: string, oi: number) => (
                <Text key={oi} style={{ ...styles.normalText, color: '#FF66CC', textAlign: 'center' }}>
                  [ {op} ]
                </Text>
              ))}
            </View>
          );
        }
        const listLabel = section.listText ?? 'Option';
        return (
          <View key={idx} style={{ marginBottom: 14 }}>
            <Text style={{ ...styles.heading, color: headingColor }}>{section.heading}</Text>
            {(section.options as string[]).map((opt: string, oi: number) => (
              <Text key={oi} style={styles.normalText}>
                <Text style={styles.boldLabel}>{listLabel} {oi + 1}: </Text>{opt}
              </Text>
            ))}
          </View>
        );
      })}
    </Page>
  );

  const renderAltName = (data: any, emailName?: string) => {
    const images     = Array.isArray(data) ? data : (data?.images ?? []);
    const accentColor = (!Array.isArray(data) && data?.headingColor) ? data.headingColor : '#006836';
    return (
      <Page size="A4" style={styles.pageA4}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: accentColor, textAlign: 'center', marginBottom: 16 }}>
          ALT-Text for HTML version
        </Text>
        <View style={styles.tableContainer}>
          {images.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontStyle: 'italic', color: '#9ca3af' }}>
                No images selected for alt text.
              </Text>
            </View>
          ) : images.map((img: any, i: number) => (
            <View key={i} style={[styles.row, { minHeight: 70 }]}>
              <View style={{ ...styles.cell, width: '38%', alignItems: 'center', justifyContent: 'center' }}>
                {img.name
                  ? <Image src={img.name} style={{ maxWidth: 130, maxHeight: 100, objectFit: 'contain' }} />
                  : <Text style={{ color: '#d1d5db', fontSize: 9 }}>No image</Text>
                }
              </View>
              <View style={{ ...styles.cell, borderRightWidth: 0, flex: 1, justifyContent: 'center' }}>
                <Text style={img.value ? { fontSize: 11 } : { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                  {img.value || 'No description provided'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    );
  };

  const renderEmailImage = (imageBase64: string, title: string, label: string, isMobile = false, imageHeight = 800) => {
    const pageW  = isMobile ? 415 : 595;
    const pad    = 16;
    const imgW   = pageW - pad * 2;
    const hdrH   = 32;
    const imgPtH = (imgW / (pageW * 2)) * imageHeight;
    const pageH  = Math.ceil(hdrH + imgPtH + pad + 16);

    return (
      <Page size={[pageW, pageH]} style={{ padding: 0, backgroundColor: '#f3f4f6' }}>
        <View style={{
          backgroundColor: '#1a1a2e',
          paddingTop: 7, paddingBottom: 7,
          paddingLeft: pad, paddingRight: pad,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#ffffff', maxWidth: '70%' }}>{title}</Text>
          <Text style={{ fontSize: 7, color: '#aaaaaa' }}>{label}</Text>
        </View>
        <View style={{ backgroundColor: '#fff', marginHorizontal: pad, marginTop: 8 }}>
          <Image src={imageBase64} style={{ width: imgW }} />
        </View>
      </Page>
    );
  };

  // Render multiple email options SIDE BY SIDE on one wide page (like the reference PDF)
  const renderEmailImagesSideBySide = (
    images: Array<{ base64: string; label: string; height: number }>,
    title: string,
    isMobile = false
  ) => {
    if (images.length === 0) return null;
    if (images.length === 1) return renderEmailImage(images[0].base64, title, images[0].label, isMobile, images[0].height);

    // For 3 options side-by-side: each column = (A4_width - margins) / 3
    const colCount  = images.length;
    const pad       = 12;
    const colGap    = 8;
    const singleW   = isMobile ? 375 : 600;
    // Page width = sum of all email widths proportionally scaled to fit A4+
    // Each column in PDF points: scale each column to fit on a wide page
    const colPtW    = isMobile ? 130 : 175;  // pts per column
    const pageW     = colCount * colPtW + (colCount - 1) * colGap + pad * 2;
    // Page height: scale the tallest image
    const maxH      = Math.max(...images.map(i => i.height));
    const imgPtH    = (colPtW / (singleW * 2)) * maxH;
    const hdrH      = 28;
    const pageH     = Math.ceil(hdrH + imgPtH + pad + 12);

    return (
      <Page size={[pageW, pageH]} style={{ padding: 0, backgroundColor: '#f3f4f6' }}>
        {/* Header spanning full width */}
        <View style={{
          backgroundColor: '#1a1a2e',
          paddingTop: 6, paddingBottom: 6,
          paddingLeft: pad, paddingRight: pad,
          flexDirection: 'row', alignItems: 'center',
        }}>
          <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#ffffff' }}>
            {title} — {isMobile ? 'Mobile View' : 'Desktop View'}
          </Text>
        </View>
        {/* Side-by-side columns */}
        <View style={{ flexDirection: 'row', paddingHorizontal: pad, paddingTop: 8, gap: colGap }}>
          {images.map((img, i) => (
            <View key={i} style={{ width: colPtW }}>
              {/* Option label */}
              <Text style={{ fontSize: 6, color: '#555', marginBottom: 4, textAlign: 'center' }}>
                {img.label}
              </Text>
              <View style={{ backgroundColor: '#fff' }}>
                <Image src={img.base64} style={{ width: colPtW }} />
              </View>
            </View>
          ))}
        </View>
      </Page>
    );
  };

  // ── Assemble document ─────────────────────────────────────────────────────
  // Group email image sections by view type (desktop/mobile) for side-by-side rendering
  const desktopImages = params.sections
    .filter(s => s.type === 'emailImage' && !s.isMobile && s.imageBase64)
    .map(s => ({ base64: s.imageBase64!, label: s.label ?? '', height: s.imageHeight ?? 800 }));

  const mobileImages = params.sections
    .filter(s => s.type === 'emailImage' && s.isMobile && s.imageBase64)
    .map(s => ({ base64: s.imageBase64!, label: s.label ?? '', height: s.imageHeight ?? 800 }));

  const otherSections = params.sections.filter(s => s.type !== 'emailImage');

  const pages = [
    // Variable copy + alt-name first
    ...otherSections.map((section, i) => {
      switch (section.type) {
        case 'variableCopy':
          return renderVariableCopy(
            section.variableCopyData?.data ?? [],
            section.variableCopyData?.emailname ?? params.emailName,
            section.variableCopyData?.headingColor,
          );
        case 'altName':
          return renderAltName(section.altNameData?.data, section.altNameData?.emailName ?? params.emailName);
        default:
          return null;
      }
    }),
    // Desktop: all options on one page (side by side)
    desktopImages.length > 0 ? renderEmailImagesSideBySide(desktopImages, params.emailName, false) : null,
    // Mobile: all options on one page (side by side)
    mobileImages.length > 0 ? renderEmailImagesSideBySide(mobileImages, params.emailName, true) : null,
  ].filter(Boolean);

  const doc = <Document>{pages}</Document>;
  const blob = await pdf(doc).toBlob();
  return blob;
}
