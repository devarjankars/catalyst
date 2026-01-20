"use client"

export async function exportToPDF(
    iframeElement: HTMLIFrameElement,
    fileName: string = "email-preview",
    viewMode: "desktop" | "mobile" = "desktop"
) {
    try {
        // Dynamic import to avoid server-side issues
        const html2pdf = (await import("html2pdf.js")).default

        const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document
        if (!iframeDoc || !iframeDoc.documentElement) {
            throw new Error("Unable to access iframe content")
        }

        // Ensure filename has .pdf extension
        let pdfFileName = fileName
        if (!pdfFileName.endsWith(".pdf")) {
            pdfFileName = `${pdfFileName}.pdf`
        }

        // Use body to ensure links are clickable (documentElement offsets can break html2pdf links)
        const element = iframeDoc.body

        // Force the capture width on the body to ensure media queries trigger correctly
        const width = viewMode === "desktop" ? 600 : 375
        const originalBodyWidth = element.style.width
        const originalBodyOverflow = element.style.overflow
        const originalMinWidth = element.style.minWidth

        element.style.width = `${width}px`
        element.style.minWidth = `${width}px`
        element.style.overflow = "visible"

        // Temporarily inject styles from head to body to ensure html2canvas captures them
        const styles = iframeDoc.head.querySelectorAll('style, link[rel="stylesheet"]')
        const injectedStyles: Element[] = []

        styles.forEach(style => {
            const clone = style.cloneNode(true) as Element
            element.prepend(clone)
            injectedStyles.push(clone)
        })

        // Inject centering style for email tables
        const centeringStyle = iframeDoc.createElement('style')
        centeringStyle.textContent = `
            body { 
                margin: 0 !important; 
                padding: 0 !important; 
                width: ${width}px !important; 
            }
            .email-container, table[align="center"] { 
                margin: 0 auto !important; 
            }
        `
        element.prepend(centeringStyle)
        injectedStyles.push(centeringStyle)

        // Try to get the actual content height to avoid massive whitespace
        const emailContainer = iframeDoc.querySelector('.email-container')

        // Calculate height: prioritize email container, then body, then document
        let contentHeight = emailContainer ? emailContainer.scrollHeight : element.scrollHeight
        // Add a buffer to prevent cutting off content
        contentHeight += 40

        // Options for html2pdf
        const opt = {
            margin: 0,
            filename: pdfFileName,
            image: { type: 'png' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                width: width,
                windowWidth: width,
            },
            jsPDF: {
                unit: 'px' as const,
                format: [width, contentHeight] as [number, number],
                orientation: 'portrait' as const,
                hotfixes: ["px_scaling"]
            },
            enableLinks: true,
            pagebreak: { mode: 'avoid-all' },
        }

        try {
            await html2pdf().set(opt).from(element).save()
        } finally {
            // Cleanup injected styles and restore original body styles
            injectedStyles.forEach(style => style.remove())
            element.style.width = originalBodyWidth
            element.style.minWidth = originalMinWidth
            element.style.overflow = originalBodyOverflow
        }

        return true
    } catch (error) {
        console.error("PDF export failed:", error)
        throw error
    }
}
