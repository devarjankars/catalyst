"use client"

export async function exportToPDF(
    iframeElement: HTMLIFrameElement,
    fileName: string = "email-preview",
    viewMode: "desktop" | "mobile" = "desktop"
) {
    try {
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
            import("html2canvas-pro"),
            import("jspdf"),
        ])

        const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document
        if (!iframeDoc || !iframeDoc.documentElement) {
            throw new Error("Unable to access iframe content")
        }

        if (!fileName.endsWith(".pdf")) fileName = `${fileName}.pdf`

        const width = viewMode === "desktop" ? 600 : 375

        // ── Resize the iframe viewport itself so @media queries fire correctly ──
        const originalIframeWidth = iframeElement.style.width
        const originalIframeMinWidth = iframeElement.style.minWidth
        iframeElement.style.width = `${width}px`
        iframeElement.style.minWidth = `${width}px`

        // Give the browser a frame to reflow at the new viewport width
        await new Promise(r => setTimeout(r, 200))

        const element = iframeDoc.body

        const originalBodyWidth = element.style.width
        const originalBodyOverflow = element.style.overflow
        const originalMinWidth = element.style.minWidth

        element.style.width = `${width}px`
        element.style.minWidth = `${width}px`
        element.style.overflow = "visible"

        // Inject head styles into body so html2canvas picks them up
        const styles = iframeDoc.head.querySelectorAll('style, link[rel="stylesheet"]')
        const injectedStyles: Element[] = []
        styles.forEach(style => {
            const clone = style.cloneNode(true) as Element
            element.prepend(clone)
            injectedStyles.push(clone)
        })

        // Force body + email container to exact width
        const centeringStyle = iframeDoc.createElement('style')
        centeringStyle.textContent = `
            body {
                margin: 0 !important;
                padding: 0 !important;
                width: ${width}px !important;
                min-width: ${width}px !important;
            }
            .email-container {
                width: ${width}px !important;
                max-width: ${width}px !important;
            }
            * { box-sizing: border-box !important; }
            img { max-width: 100% !important; height: auto !important; }
        `
        element.prepend(centeringStyle)
        injectedStyles.push(centeringStyle)

        // Wait for images to load
        await new Promise<void>(resolve => {
            const imgs = Array.from(iframeDoc.images)
            if (!imgs.length) { resolve(); return }
            let done = 0
            const tick = () => { if (++done >= imgs.length) resolve() }
            imgs.forEach(img => img.complete ? tick() : (img.onload = img.onerror = tick))
            setTimeout(resolve, 3000)
        })

        // Let layout fully settle at new width
        await new Promise(r => setTimeout(r, 150))

        const emailContainer = iframeDoc.querySelector<HTMLElement>('.email-container')
        const contentHeight = (emailContainer ? emailContainer.scrollHeight : element.scrollHeight) + 40

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: width,
                windowWidth: width,
                scrollX: 0,
                scrollY: 0,
                backgroundColor: "#ffffff",
            })

            const imgData = canvas.toDataURL("image/jpeg", 0.98)

            const pdf = new jsPDF({
                unit: "px",
                format: [width, contentHeight],
                orientation: "portrait",
                hotfixes: ["px_scaling"],
                compress: true,
            })

            pdf.addImage(imgData, "JPEG", 0, 0, width, contentHeight, undefined, "FAST")
            pdf.save(fileName)
        } finally {
            // Restore everything
            injectedStyles.forEach(s => s.remove())
            element.style.width = originalBodyWidth
            element.style.minWidth = originalMinWidth
            element.style.overflow = originalBodyOverflow
            iframeElement.style.width = originalIframeWidth
            iframeElement.style.minWidth = originalIframeMinWidth
        }

        return true
    } catch (error) {
        console.error("PDF export failed:", error)
        throw error
    }
}