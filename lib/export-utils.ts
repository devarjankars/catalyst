"use client"
import JSZip from "jszip"
import { generateEmailHTML } from "./email-generator"
import type { EmailComponent } from "@/types/email-builder"
import { cleanHtmlString } from "./html-cleaner"

async function fetchImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { mode: "cors" })
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url}`)
  }
  return await response.blob()
}

export async function exportToZip(components: EmailComponent[], canvasElement: HTMLElement, templateName: string = "email-template") {
  const zip = new JSZip()

  // Create root folder with template name (remove .zip if present)
  const folderName = templateName.replace(/\.zip$/i, "")
  const rootFolder = zip.folder(folderName)
  const imageFolder = rootFolder!.folder("images")

  // Step 1: Generate HTML
  let html = generateEmailHTML(components)

  // Step 2: Find all image srcs (firebase links or any external)
  const imageRegex = /<img[^>]+src="([^">]+)"/g
  const srcMatches = [...html.matchAll(imageRegex)]

  // Track downloaded image URLs to avoid duplicate fetch
  const downloadedImages = new Map<string, string>()

  for (let i = 0; i < srcMatches.length; i++) {
    const fullMatch = srcMatches[i][0]
    const srcUrl = srcMatches[i][1]

    try {
      if (!downloadedImages.has(srcUrl)) {
        const imageBlob = await fetchImageAsBlob(srcUrl)
        const imageExt = srcUrl.split(".").pop()?.split(/\#|\?/)[0] || "png"
        const imageFileName = `image-${i}.${imageExt}`

        imageFolder!.file(imageFileName, imageBlob)

        downloadedImages.set(srcUrl, `./images/${imageFileName}`)
      }

      // Replace src in HTML with local relative path
      const localPath = downloadedImages.get(srcUrl)!
      html = html.replace(srcUrl, localPath)
      html = cleanHtmlString(html)
    } catch (err) {
      console.warn(`Skipping image ${srcUrl}`, err)
    }
  }

  // Step 3: Add modified HTML to root folder
  rootFolder!.file("index.html", html)

  // Step 4: Generate preview image


  // Step 5: Generate ZIP and trigger download
  const zipBlob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(zipBlob)

  // console.log("ZIP Blob created:", zipBlob);
  // console.log("Blob URL:", url);

  // Ensure the filename has .zip extension
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

  // console.log("Download triggered for:", fileName)
}