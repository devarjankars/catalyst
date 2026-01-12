"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"

interface EmailPreviewProps {
  html: string
  width?: string // Make width optional in the interface as it has a default value
}

const EmailPreview = forwardRef<HTMLIFrameElement, EmailPreviewProps>(
  ({ html, width = "20%" }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Expose the iframe ref to parent components
    useImperativeHandle(ref, () => iframeRef.current!)


    useEffect(() => {
      if (!iframeRef.current) return
      const doc = iframeRef.current.contentDocument

      if (!doc) return

      doc.open()
      doc.write(html)
      doc.close()
      
      // Delay slightly to ensure rendering is complete
      // setTimeout(adjustHeight, 50)
      
      // Add load listener for images etc
      // iframeRef.current.onload = adjustHeight
    }, [html])

    // Update height when width changes (mobile/desktop toggle)
    useEffect(() => {
        // setTimeout(adjustHeight, 50)
    }, [width])

    return (
      <iframe
        ref={iframeRef}
        title="Email Preview"
        style={{ width: `${width}`, minHeight: "600px", border: "1px solid #ccc" }}
      />
    )
  }
)

EmailPreview.displayName = "EmailPreview"

export default EmailPreview