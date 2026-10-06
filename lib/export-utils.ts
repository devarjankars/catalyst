"use client"
import JSZip from "jszip"
import { generateEmailHTML } from "./email-generator"
import type { EmailComponent } from "@/types/email-builder"
import { cleanHtmlString } from "./html-cleaner"

/** Returns a clean file extension from any URL (handles Firebase Storage query strings). */
function getImageExtension(url: string): string {
  try {
    // Strip query string before extracting extension
    const pathname = new URL(url).pathname
    const ext = pathname.split(".").pop()?.toLowerCase() || "png"
    // Only allow known image extensions
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) ? ext : "png"
  } catch {
    // Relative URL — just split on . and strip query
    const ext = url.split(".").pop()?.split(/[#?]/)[0]?.toLowerCase() || "png"
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) ? ext : "png"
  }
}

/** Returns true for URLs we can actually fetch as blobs (absolute http/https). */
function isFetchableUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://")
}

async function fetchImageAsBlob(url: string): Promise<Blob> {
  // Try direct fetch first (works when CORS is configured on the server)
  try {
    const response = await fetch(url, { mode: "cors", cache: "no-store" })
    if (response.ok) return await response.blob()
  } catch {
    // Fall through to proxy
  }

  // Fallback: proxy through our own API to bypass CORS restrictions
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`
  const response = await fetch(proxyUrl)
  if (!response.ok) throw new Error(`Failed to fetch image: ${url}`)
  return await response.blob()
}

export async function exportToZip(
  options: { name: string; components: EmailComponent[]; sourceHtml?: string }[],
  templateName: string = "email-template",
  preHeaderText?: string,
  separateFolders = false, // true when optionSubMode === "completely-different"
) {
  const zip = new JSZip()

  const folderName = templateName.replace(/\.zip$/i, "")
  const rootFolder = zip.folder(folderName)!

  let imageCounter = 0

  if (separateFolders) {
    // Each option gets its own subfolder with its own images/ inside it
    // Structure: folderName/Option1/index.html
    //            folderName/Option1/images/
    //            folderName/Option2/index.html
    //            folderName/Option2/images/
    for (const option of options) {
      const optionFolder = rootFolder.folder(option.name)!
      const imageFolder = optionFolder.folder("images")!

      // Images are scoped per-option — no cross-option deduplication
      const downloadedImages = new Map<string, string>()

      let html = option.sourceHtml || generateEmailHTML(option.components, preHeaderText)

      const imageRegex = /<img[^>]+src="([^">]+)"/g
      const srcMatches = [...html.matchAll(imageRegex)]

      for (const match of srcMatches) {
        const srcUrl = match[1]
        if (srcUrl.startsWith("data:") || !isFetchableUrl(srcUrl)) continue
        try {
          if (!downloadedImages.has(srcUrl)) {
            const imageBlob = await fetchImageAsBlob(srcUrl)
            const imageExt = getImageExtension(srcUrl)
            const imageFileName = `image-${imageCounter++}.${imageExt}`

            imageFolder.file(imageFileName, imageBlob)
            downloadedImages.set(srcUrl, `./images/${imageFileName}`)
          }

          const localPath = downloadedImages.get(srcUrl)!
          html = html.replaceAll(srcUrl, localPath)
          html = cleanHtmlString(html)
        } catch (err) {
          console.warn(`Skipping image ${srcUrl}`, err)
        }
      }

      optionFolder.file("index.html", html)
    }
  } else {
    // Original behaviour: shared images/ at root level
    // Structure: folderName/Option1.html (or index.html)
    //            folderName/images/  ← shared
    const imageFolder = rootFolder.folder("images")!
    const downloadedImages = new Map<string, string>()

    for (const option of options) {
      let html = option.sourceHtml || generateEmailHTML(option.components, preHeaderText)

      const imageRegex = /<img[^>]+src="([^">]+)"/g
      const srcMatches = [...html.matchAll(imageRegex)]

      for (const match of srcMatches) {
        const srcUrl = match[1]
        if (srcUrl.startsWith("data:") || !isFetchableUrl(srcUrl)) continue
        try {
          if (!downloadedImages.has(srcUrl)) {
            const imageBlob = await fetchImageAsBlob(srcUrl)
            const imageExt = getImageExtension(srcUrl)
            const imageFileName = `image-${imageCounter++}.${imageExt}`

            imageFolder.file(imageFileName, imageBlob)
            downloadedImages.set(srcUrl, `./images/${imageFileName}`)
          }

          const localPath = downloadedImages.get(srcUrl)!
          html = html.replaceAll(srcUrl, localPath)
          html = cleanHtmlString(html)
        } catch (err) {
          console.warn(`Skipping image ${srcUrl}`, err)
        }
      }

      const htmlFileName = options.length > 1 ? `${option.name}.html` : "index.html"
      rootFolder.file(htmlFileName, html)
    }
  }

  // Generate ZIP and trigger download
  const zipBlob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(zipBlob)

  let fileName = templateName || "email-template"
  if (!fileName.endsWith(".zip")) {
    fileName = `${fileName}.zip`
  }

  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}