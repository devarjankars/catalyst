"use client";

import { useEffect, useRef } from "react"

function EmailPreview({ html,width="20%" }: { html: string,width:string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!iframeRef.current) return
    const doc = iframeRef.current.contentDocument
    // console.log("Setting HTML content in iframe:", html);
    
    if (!doc) return

    doc.open()
    doc.write(html)
    doc.close()
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      title="Email Preview"
      style={{ width: `${width}`, height: "600px", border: "1px solid #ccc" }}
    />
  )
}

export default EmailPreview