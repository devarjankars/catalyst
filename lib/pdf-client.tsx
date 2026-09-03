/**
 * Client-side PDF generation — runs entirely in the browser.
 * No server action, no body size limits, no network round-trip.
 */
"use client";

export interface PdfSection {
  type: 'variableCopy' | 'altName' | 'emailImage';
  label?: string;
  imageBase64?: string;
  variableCopyData?: any;
  altNameData?: any;
  emailName?: string;
  headingColor?: string;
  isMobile?: boolean;
}

/**
 * Screenshot an HTML string into a base64 JPEG using html2canvas.
 */
export async function screenshotEmailHtml(
  html: string,
  width: number,
  quality = 0.92,
): Promise<string> {
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
        await new Promise(r => setTimeout(r, 1000)); // let remote images load
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc?.body) { resolve(''); return; }
        doc.body.style.margin  = '0';
        doc.body.style.padding = '0';
        doc.body.style.width   = `${width}px`;

        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(doc.body, {
          useCORS:      true,
          allowTaint:   true,
          scale:        2,            // 2x for sharp, readable text
          width,
          scrollX:      0,
          scrollY:      0,
          windowWidth:  width,
          windowHeight: 12000,        // capture full-length emails
          backgroundColor: '#ffffff',
          logging: false,
        });
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        console.error('[screenshotEmailHtml] failed:', e);
        resolve('');
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

  const renderEmailImage = (imageBase64: string, title: string, label: string, isMobile = false) => {
    // Mobile pages are narrower; desktop fills A4 width
    const pageW   = isMobile ? 415 : EMAIL_W;
    const imgW    = pageW - EMAIL_PADDING * 2;
    return (
      <Page size={[pageW, EMAIL_H_TALL]} style={styles.pageEmail}>
        {/* Header bar */}
        <View style={{
          backgroundColor: '#1a1a2e', padding: '8 12', marginBottom: 12,
          borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#ffffff' }}>{title}</Text>
          <Text style={{ fontSize: 8, color: '#aaaaaa' }}>{label}</Text>
        </View>
        {/* Email image in a white card */}
        <View style={{ backgroundColor: '#fff', padding: 0, borderRadius: 2 }}>
          <Image
            src={imageBase64}
            style={{ width: imgW, objectFit: 'contain' }}
          />
        </View>
      </Page>
    );
  };

  // ── Assemble document ─────────────────────────────────────────────────────

  const pages = params.sections.map((section, i) => {
    switch (section.type) {
      case 'variableCopy':
        return renderVariableCopy(
          section.variableCopyData?.data ?? [],
          section.variableCopyData?.emailname ?? params.emailName,
          section.variableCopyData?.headingColor,
        );
      case 'altName':
        return renderAltName(section.altNameData?.data, section.altNameData?.emailName ?? params.emailName);
      case 'emailImage':
        return section.imageBase64
          ? renderEmailImage(section.imageBase64, params.emailName, section.label ?? '', section.isMobile)
          : null;
      default:
        return null;
    }
  }).filter(Boolean);

  const doc = <Document>{pages}</Document>;
  const blob = await pdf(doc).toBlob();
  return blob;
}
