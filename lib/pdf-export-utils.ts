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

        // Temporarily inject styles from head to body to ensure html2canvas captures them
        // (This fixes the issue where mobile styles were lost when capturing body)
        const styles = iframeDoc.head.querySelectorAll('style, link[rel="stylesheet"]')
        const injectedStyles: Element[] = []

        styles.forEach(style => {
            const clone = style.cloneNode(true) as Element
            element.prepend(clone)
            injectedStyles.push(clone)
        })

        // Try to get the actual content height to avoid massive whitespace
        const emailContainer = iframeDoc.querySelector('.email-container')

        // Calculate height: prioritize email container, then body, then document
        let contentHeight = emailContainer ? emailContainer.scrollHeight : element.scrollHeight
        // Add a small buffer just in case
        contentHeight += 20

        const width = viewMode === "desktop" ? 600 : 375

        // Options for html2pdf
        const opt = {
            margin: 0,
            filename: pdfFileName,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: width,
                // Important: clear the height so it doesn't force a specific canvas size unnecessarily
                // unless we want to clip it. limiting windowHeight can help if issues persist.
            },
            jsPDF: {
                unit: 'px' as const,
                format: [width, contentHeight] as [number, number],
                orientation: 'portrait' as const,
                hotfixes: ["px_scaling"]
            },
            enableLinks: true
        }

        try {
            await html2pdf().set(opt).from(element).save()
        } finally {
            // Cleanup injected styles
            injectedStyles.forEach(style => style.remove())
        }

        return true
    } catch (error) {
        console.error("PDF export failed:", error)
        throw error
    }
}
