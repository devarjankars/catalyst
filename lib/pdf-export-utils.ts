"use client"

/**
 * exportToPDF — Email Preview PDF export
 *
 * Previously used html2canvas + jsPDF which rendered a flat PNG image inside
 * the PDF, making every link completely dead (no PDF annotations possible).
 *
 * Now uses the same /api/generate-pdf Playwright/Chromium pipeline that the
 * VSB download uses. This means:
 *   • All <a href> links become real, clickable PDF annotations.
 *   • The PDF is vector text, not a rasterised screenshot.
 *   • The same mobile/desktop widths are honoured.
 *
 * The only change visible to the user is that clicking "Export PDF" in the
 * preview modal now produces a PDF with working links.
 */
export async function exportToPDF(
    iframeElement: HTMLIFrameElement,
    fileName: string = "email-preview",
    viewMode: "desktop" | "mobile" = "desktop"
): Promise<boolean> {
    try {
        const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document
        if (!iframeDoc || !iframeDoc.documentElement) {
            throw new Error("Unable to access iframe content")
        }

        if (!fileName.endsWith(".pdf")) fileName = `${fileName}.pdf`

        const width = viewMode === "desktop" ? 600 : 375

        // Serialise the current iframe HTML — this already has the correct
        // mobile/desktop CSS injected by the preview modal's buildHtml().
        const rawHtml = iframeDoc.documentElement.outerHTML

        // Normalise the body tag so the server-side renderer knows the exact
        // pixel width to use.  This mirrors what the VSB path does.
        const normalizedHtml = rawHtml.replace(
            /<body([^>]*)>/i,
            (_match: string, attrs: string) => {
                const existingStyle = attrs.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i)?.[2] || ''
                const attrsNoStyle  = attrs.replace(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i, '')
                const merged        = `${existingStyle};margin:0;padding:0;width:${width}px;`
                return `<body${attrsNoStyle} style="${merged}">`
            }
        )

        const pages = [{ html: normalizedHtml, width }]

        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages, fileName }),
        })

        if (!response.ok) {
            const errBody = await response.json().catch(() => null) as { error?: string } | null
            throw new Error(errBody?.error || `PDF generation failed (${response.status})`)
        }

        const blob   = await response.blob()
        const url    = URL.createObjectURL(blob)
        const link   = document.createElement('a')
        link.href     = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        return true
    } catch (error) {
        console.error("PDF export failed:", error)
        throw error
    }
}
