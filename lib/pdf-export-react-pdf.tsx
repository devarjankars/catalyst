"use server"

import { Document, Page, View, Text, StyleSheet, Table, TableRow, TableCell, Image, Font, pdf } from '@react-pdf/renderer'
import { PDFDocument } from 'pdf-lib'
import https from 'https'
import http from 'http'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@react-pdf/fonts@3.0.0/Helvetica/Helvetica-Regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@react-pdf/fonts@3.0.0/Helvetica/Helvetica-Bold.ttf', fontWeight: 'bold' },
    { src: 'https://cdn.jsdelivr.net/npm/@react-pdf/fonts@3.0.0/Helvetica/Helvetica-Oblique.ttf', fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/npm/@react-pdf/fonts@3.0.0/Helvetica/Helvetica-BoldOblique.ttf', fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000',
    backgroundColor: '#fff',
  },
  pageWide: {
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000',
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#006937',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  heading: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  normalText: {
    fontSize: 10,
    marginBottom: 2,
  },
  boldLabel: {
    fontWeight: 'bold',
    marginRight: 6,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'solid',
    fontSize: 9,
    marginBottom: 16,
  },
  tableHeader: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'solid',
    padding: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FF66CC',
  },
  tableCell: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'solid',
    padding: 6,
    verticalAlign: 'top',
  },
  tableCellCenter: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'solid',
    padding: 6,
    verticalAlign: 'middle',
    textAlign: 'center',
  },
  thirdPartyRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 3,
  },
  bracketImage: {
    width: 25,
    height: 25,
  },
  thirdPartyText: {
    textAlign: 'center',
    color: '#FF66CC',
    fontSize: 10,
  },
  altNameTable: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid',
    borderCollapse: 'collapse',
  },
  altNameHeader: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 12,
    paddingBottom: 16,
  },
  altNameCell: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid',
    padding: 12,
    width: '50%',
    verticalAlign: 'middle',
  },
  altNameImageCell: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid',
    padding: 12,
    width: '50%',
    verticalAlign: 'middle',
    alignItems: 'center',
    justifyContent: 'center',
  },
  altNameImage: {
    maxHeight: 120,
    maxWidth: '100%',
  },
  altNamePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  altNamePlaceholderText: {
    fontSize: 10,
    color: '#d1d5db',
  },
  altNameValue: {
    fontSize: 13,
    color: '#000',
  },
  altNameNoValue: {
    fontSize: 13,
    color: '#d1d5db',
    fontStyle: 'italic',
  },
  emailNameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006937',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  headerDetailRow: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 10,
  },
  headerDetailLabel: {
    fontWeight: 'bold',
    marginRight: 4,
    color: '#000',
  },
  headerDetailValue: {
    color: '#000',
  },
  headerDetailValueVar: {
    color: '#FF66CC',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 10,
  },
  headerInner: {
    marginLeft: 20,
    width: 'fit-content',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    padding: 5,
    marginBottom: 10,
    fontSize: 13,
    color: '#000',
    fontWeight: 'bold',
  },
  headerDetailsWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    marginLeft: 20,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
    paddingTop: 20,
  },
})

interface HeaderDetail {
  name: string
  value: string
}

interface VariableSection {
  heading: string
  options: string[] | Array<{ fromEmail: string; friendlyNames: string[] }>
  structure: 'normal' | 'table' | 'third-party-placeholder'
  listText?: string | null
}

interface AltNameImage {
  name: string
  value: string
}

function HeaderDetails({ details }: { details: HeaderDetail[] }) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerInner}>Email Header Details</View>
      <View style={styles.headerDetailsWrapper}>
        {details.map((detail, idx) => (
          <View key={idx} style={styles.headerDetailRow}>
            <Text style={styles.headerDetailLabel}>{detail.name}: </Text>
            <Text style={detail.value.includes('[') || detail.value.includes(']') ? styles.headerDetailValueVar : styles.headerDetailValue}>
              {detail.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function VariableCopySection({ data, emailName, headingColor }: { data: VariableSection[]; emailName: string; headingColor?: string }) {
  const accent = headingColor || '#FF66CC'

  const renderNormalSection = (section: VariableSection) => {
    const listLabel = section.listText ?? 'Option'
    const options = section.options as string[]
    return (
      <View key={section.heading} style={{ marginBottom: 16 }}>
        {section.structure !== 'third-party-placeholder' && (
          <Text style={{ ...styles.heading, color: accent }}>{section.heading}</Text>
        )}
        {options.map((opt, i) => (
          <Text key={i} style={styles.normalText}>
            <Text style={styles.boldLabel}>{listLabel} {i + 1}:</Text>
            <Text>{opt}</Text>
          </Text>
        ))}
      </View>
    )
  }

  const renderTableSection = (section: VariableSection) => {
    const options = section.options as Array<{ fromEmail: string; friendlyNames: string[] }>
    return (
      <Table key={section.heading} style={styles.table}>
        <TableRow style={{ backgroundColor: '#f9f9f9' }}>
          <TableCell style={styles.tableHeader}>Friendly From Name</TableCell>
          <TableCell style={styles.tableHeader}>From Email Address</TableCell>
        </TableRow>
        {options.map((row, rowIdx) => (
          <TableRow key={rowIdx}>
            <TableCell style={styles.tableCell}>
              {row.friendlyNames.map((name, nameIdx) => (
                <Text key={nameIdx} style={{ marginBottom: 3 }}>
                  <Text style={{ fontWeight: 'bold', marginRight: 4 }}>{nameIdx + 1}.</Text>
                  {name}
                </Text>
              ))}
            </TableCell>
            <TableCell style={styles.tableCellCenter}>{row.fromEmail}</TableCell>
          </TableRow>
        ))}
      </Table>
    )
  }

  const renderThirdPartySection = (section: VariableSection) => {
    const options = section.options as string[]
    if (options.length === 0) return null
    return (
      <View key={section.heading} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {options.map((op, idx) => (
          <View key={idx} style={styles.thirdPartyRow}>
            <Image src="/sqr_bracket_left.png" style={styles.bracketImage} />
            <Text style={styles.thirdPartyText}>{op}</Text>
            <Image src="/sqr_bracket_right.png" style={styles.bracketImage} />
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{emailName}</Text>
      <Text style={{ ...styles.sectionTitle, color: accent }}>Variable copy</Text>
      {data.map((section, index) => {
        switch (section.structure) {
          case 'table':
            return renderTableSection(section)
          case 'third-party-placeholder':
            return renderThirdPartySection(section)
          default:
            return renderNormalSection(section)
        }
      })}
    </View>
  )
}

function AltNamePageSection({ data, emailName }: { data: { images: AltNameImage[]; headingColor?: string } | AltNameImage[]; emailName?: string }) {
  const images = Array.isArray(data) ? data : (data?.images ?? [])
  const headingColor = (!Array.isArray(data) && data?.headingColor) ? data.headingColor : '#006836'

  return (
    <View style={styles.page}>
      <View style={{ marginBottom: 12, paddingBottom: 16 }}>
        <Text style={{ ...styles.altNameHeader, color: headingColor }}>ALT-Text for HTML version</Text>
      </View>
      <Table style={styles.altNameTable}>
        {images.length === 0 ? (
          <TableRow>
            <TableCell style={{ ...styles.altNameCell, colSpan: 2, textAlign: 'center', padding: 32, fontSize: 12, fontStyle: 'italic', color: '#9ca3af' }}>
              No images selected for alt text.
            </TableCell>
          </TableRow>
        ) : (
          images.map((img, idx) => (
            <TableRow key={idx}>
              <TableCell style={styles.altNameImageCell}>
                {img.name ? (
                  <Image src={img.name} style={styles.altNameImage} />
                ) : (
                  <View style={styles.altNamePlaceholder}>
                    <Text style={styles.altNamePlaceholderText}>No Image</Text>
                  </View>
                )}
              </TableCell>
              <TableCell style={styles.altNameCell}>
                <Text style={img.value ? styles.altNameValue : styles.altNameNoValue}>
                  {img.value || 'No description provided'}
                </Text>
              </TableCell>
            </TableRow>
          ))
        )}
      </Table>
    </View>
  )
}

function EmailHTMLPreview({ html, title, width }: { html: string; title: string; width: string }) {
  return (
    <View style={styles.page}>
      <Text style={styles.emailNameTitle}>{title}</Text>
      <Text style={styles.previewLabel}>HTML Preview - {width}</Text>
      <View style={{ borderWidth: 1, borderColor: '#ddd', borderStyle: 'solid', padding: 10, backgroundColor: '#f9f9f9', fontFamily: 'Courier', fontSize: 7 }}>
        <Text>{html.substring(0, 3000)}...</Text>
      </View>
    </View>
  )
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, { timeout: 8000 }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        const mime = res.headers['content-type'] || 'image/png'
        resolve(`data:${mime};base64,${buf.toString('base64')}`)
      })
      res.on('error', () => resolve(null))
    })
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
  })
}

async function inlineImagesInHtml(html: string, baseUrl: string): Promise<string> {
  const srcPattern = /(<img[^>]+src=["'])([^"']+)(["'])/gi
  const matches: Array<{ full: string; prefix: string; src: string; suffix: string }> = []
  let m: RegExpExecArray | null
  while ((m = srcPattern.exec(html)) !== null) {
    matches.push({ full: m[0], prefix: m[1], src: m[2], suffix: m[3] })
  }
  for (const match of matches) {
    let { src } = match
    if (src.startsWith('data:')) continue
    if (src.startsWith('/')) src = `${baseUrl}${src}`
    else if (!src.startsWith('http')) src = `${baseUrl}/${src}`
    const dataUri = await fetchImageAsBase64(src)
    if (dataUri) html = html.replace(match.full, `${match.prefix}${dataUri}${match.suffix}`)
  }
  return html
}

export async function generateCombinedPdfReactPdf(params: {
  emailHtmlDesktop?: string
  emailHtmlMobile?: string
  emailHtmlsMobile?: string[]
  variableCopyData?: { data: VariableSection[]; emailname: string; headingColor?: string }
  altNameData?: { data: { images: AltNameImage[]; headingColor?: string } | AltNameImage[]; emailName?: string }
  emailName: string
  desktopWidthOverride?: string
  mobileWidthOverride?: string
}): Promise<Buffer> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'

  let desktopHtml = params.emailHtmlDesktop
  let mobileHtml = params.emailHtmlMobile
  let mobileHtmls = params.emailHtmlsMobile

  if (desktopHtml) desktopHtml = await inlineImagesInHtml(desktopHtml, baseUrl)
  if (mobileHtml) mobileHtml = await inlineImagesInHtml(mobileHtml, baseUrl)
  if (mobileHtmls) mobileHtmls = await Promise.all(mobileHtmls.map(h => inlineImagesInHtml(h, baseUrl)))

  const bracketLeft = await fetchImageAsBase64(`${baseUrl}/sqr_bracket_left.png`)
  const bracketRight = await fetchImageAsBase64(`${baseUrl}/sqr_bracket_right.png`)

  const doc = (
    <Document>
      {params.variableCopyData && (
        <Page size="A4" style={styles.page}>
          <VariableCopySection
            data={params.variableCopyData.data}
            emailName={params.variableCopyData.emailname}
            headingColor={params.variableCopyData.headingColor}
          />
        </Page>
      )}
      {params.altNameData && (
        <Page size="A4" style={styles.page}>
          <AltNamePageSection data={params.altNameData.data} emailName={params.altNameData.emailName} />
        </Page>
      )}
      {desktopHtml && (
        <Page size={[params.desktopWidthOverride ? parseInt(params.desktopWidthOverride) : 600, 'auto']} style={styles.pageWide}>
          <EmailHTMLPreview
            html={desktopHtml}
            title={params.emailName}
            width={params.desktopWidthOverride || '600px'}
          />
        </Page>
      )}
      {(mobileHtml || (mobileHtmls && mobileHtmls.length > 0)) && (
        <Page size={[params.mobileWidthOverride ? parseInt(params.mobileWidthOverride) : 375, 'auto']} style={styles.pageWide}>
          <EmailHTMLPreview
            html={mobileHtmls && mobileHtmls.length > 1 ? mobileHtmls.join('\n\n---\n\n') : (mobileHtml || mobileHtmls?.[0] || '')}
            title={params.emailName}
            width={params.mobileWidthOverride || (mobileHtmls && mobileHtmls.length > 1 ? '1200px (3 options)' : '375px')}
          />
        </Page>
      )}
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  return Buffer.from(await blob.arrayBuffer())
}

export async function mergePdfBuffers(pdfBuffers: Buffer[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create()
  for (const buffer of pdfBuffers) {
    const pdfDoc = await PDFDocument.load(buffer)
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
    copiedPages.forEach(p => mergedPdf.addPage(p))
  }
  return Buffer.from(await mergedPdf.save())
}