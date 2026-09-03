/**
 * Client-side PDF generation — runs entirely in the browser.
 * No server action, no body size limits, no network round-trip.
 * Uses @react-pdf/renderer via dynamic import so it only loads when needed.
 */

export interface PdfSection {
  type: 'variableCopy' | 'altName' | 'emailImage';
  label?: string;
  imageBase64?: string;       // for emailImage sections
  variableCopyData?: any;     // for variableCopy sections
  altNameData?: any;          // for altName sections
  emailName?: string;
  headingColor?: string;
  isMobile?: boolean;
}

/**
 * Screenshot an HTML string into a base64 JPEG.
 * Renders in a hidden iframe, waits for images to load, then captures.
 */
export async function screenshotEmailHtml(
  html: string,
  width: number,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: fixed;
      top: -9999px; left: -9999px;
      width: ${width}px; height: 2px;
      border: none; visibility: hidden;
    `;
    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        await new Promise(r => setTimeout(r, 900)); // let remote images load
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc?.body) { resolve(''); return; }

        // Force exact width
        doc.body.style.margin  = '0';
        doc.body.style.padding = '0';
        doc.body.style.width   = `${width}px`;

        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(doc.body, {
          useCORS:     true,
          allowTaint:  true,
          scale:       1.5,              // good balance: sharp but not huge
          width,
          scrollX:     0,
          scrollY:     0,
          windowWidth: width,
          windowHeight: 9999,
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

    // Write HTML into the iframe
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) { doc.open(); doc.write(html); doc.close(); }
  });
}

/**
 * Generate and download the VSB PDF entirely in the browser.
 * Returns a Blob so callers can also upload it to Firebase if needed.
 */
export async function generateVSBPdfClientSide(params: {
  emailName:          string;
  sections:           PdfSection[];
}): Promise<Blob> {
  // Dynamically import react-pdf so it's only bundled when called
  const { pdf, Document, Page, View, Text, Image, StyleSheet, Font } =
    await import('@react-pdf/renderer');

  // Register font
  try {
    Font.register({
      family: 'Arial',
      fonts: [
        { src: 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsiH0C4n.woff2' },
      ],
    });
  } catch {}

  const styles = StyleSheet.create({
    pageA4: {
      padding: 28,
      backgroundColor: '#fff',
      fontFamily: 'Helvetica',
      fontSize: 9,
    },
    pageEmail: {
      padding: 16,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#006937',
      marginBottom: 6,
    },
    label: {
      fontSize: 8,
      color: '#666',
      fontStyle: 'italic',
      marginBottom: 8,
    },
    heading: {
      fontSize: 11,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    normalText: {
      fontSize: 9,
      marginBottom: 3,
      lineHeight: 1.4,
    },
    boldLabel: {
      fontWeight: 'bold',
    },
    row: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      borderBottomStyle: 'solid',
    },
    cell: {
      padding: 6,
      flex: 1,
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
      borderRightStyle: 'solid',
      fontSize: 9,
    },
    cellHeader: {
      padding: 6,
      flex: 1,
      fontWeight: 'bold',
      backgroundColor: '#f9fafb',
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
      borderRightStyle: 'solid',
      fontSize: 9,
      color: '#FF66CC',
    },
  });

  // ── Section renderers ────────────────────────────────────────────────────

  const renderVariableCopy = (data: any[], emailname: string, headingColor = '#FF66CC') => (
    <Page size="A4" style={styles.pageA4}>
      <Text style={{ ...styles.title, color: headingColor }}>{emailname}</Text>
      <Text style={{ ...styles.heading, color: headingColor }}>Variable copy</Text>
      {data.map((section: any, idx: number) => {
        if (section.structure === 'table') {
          const opts = section.options as Array<{ fromEmail: string; friendlyNames: string[] }>;
          return (
            <View key={idx} style={{ marginBottom: 12 }}>
              <Text style={{ ...styles.heading, color: headingColor }}>{section.heading}</Text>
              <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' }}>
                <View style={styles.row}>
                  <Text style={styles.cellHeader}>Friendly From Name</Text>
                  <Text style={[styles.cellHeader, { borderRightWidth: 0 }]}>From Email Address</Text>
                </View>
                {opts.map((row, ri) => (
                  <View key={ri} style={styles.row}>
                    <View style={styles.cell}>
                      {row.friendlyNames.map((n, ni) => (
                        <Text key={ni} style={styles.normalText}>{ni + 1}. {n}</Text>
                      ))}
                    </View>
                    <Text style={[styles.cell, { borderRightWidth: 0 }]}>{row.fromEmail}</Text>
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
        // normal
        const listLabel = section.listText ?? 'Option';
        return (
          <View key={idx} style={{ marginBottom: 12 }}>
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

  const renderAltName = (data: any, emailName?: string, headingColor = '#006836') => {
    const images = Array.isArray(data) ? data : (data?.images ?? []);
    const color  = (!Array.isArray(data) && data?.headingColor) ? data.headingColor : headingColor;
    return (
      <Page size="A4" style={styles.pageA4}>
        <Text style={{ ...styles.title, color, textAlign: 'center', fontSize: 15, marginBottom: 16 }}>
          ALT-Text for HTML version
        </Text>
        <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'solid' }}>
          {images.length === 0 ? (
            <View style={styles.row}>
              <Text style={{ padding: 20, fontSize: 11, fontStyle: 'italic', color: '#9ca3af', textAlign: 'center', flex: 1 }}>
                No images selected for alt text.
              </Text>
            </View>
          ) : images.map((img: any, i: number) => (
            <View key={i} style={[styles.row, { minHeight: 60 }]}>
              <View style={[styles.cell, { width: '40%', alignItems: 'center', justifyContent: 'center' }]}>
                {img.name
                  ? <Image src={img.name} style={{ maxWidth: 120, maxHeight: 90, objectFit: 'contain' }} />
                  : <Text style={{ color: '#d1d5db', fontSize: 9 }}>No image</Text>
                }
              </View>
              <View style={[styles.cell, { borderRightWidth: 0, flex: 1, justifyContent: 'center' }]}>
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
    const pageW = isMobile ? 415 : 640;
    return (
      <Page size={[pageW, 2400]} style={styles.pageEmail}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.label}>{label}</Text>
        <Image
          src={imageBase64}
          style={{ width: pageW - 32, objectFit: 'contain' }}
        />
      </Page>
    );
  };

  // ── Build document ────────────────────────────────────────────────────────

  const pages = params.sections.map((section, i) => {
    switch (section.type) {
      case 'variableCopy':
        return renderVariableCopy(
          section.variableCopyData?.data ?? [],
          section.variableCopyData?.emailname ?? params.emailName,
          section.variableCopyData?.headingColor,
        );
      case 'altName':
        return renderAltName(
          section.altNameData?.data,
          section.altNameData?.emailName ?? params.emailName,
        );
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
