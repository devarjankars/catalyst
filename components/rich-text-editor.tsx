"use client"


import { Italic, Link, Superscript } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"

interface RichTextEditorProps {

  value: string
  onChange: (value: string) => void
  style?: React.CSSProperties
  isSelected?: boolean
}

export function RichTextEditor({ value, onChange, style, isSelected }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const savedRangeRef = useRef<Range | null>(null)

  // Link dialog state
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; url: string; title: string }>({
    open: false, url: "", title: ""
  })
  // Saved range when dialog opens (prompt steals focus)
  const pendingRangeRef = useRef<Range | null>(null)

  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    }
  }

  const restoreSelection = () => {
    const selection = window.getSelection()
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges()
      selection.addRange(savedRangeRef.current)
    }
  }

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      setTimeout(() => {
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML)
        }
      }, 1000);
    }
  }

  const LinkifyText = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) {
      alert("Please select text to link.")
      return
    }

    const commonAncestor = range.commonAncestorContainer
    let targetElement: HTMLElement | null = null

    if (commonAncestor.nodeType === Node.TEXT_NODE) {
      targetElement = commonAncestor.parentElement
    } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
      targetElement = commonAncestor as HTMLElement
    }

    // Toggle off if entire anchor is selected
    if (
      targetElement &&
      targetElement.nodeName === 'A' &&
      targetElement.contains(range.startContainer) &&
      targetElement.contains(range.endContainer)
    ) {
      const anchorText = targetElement.textContent?.trim() || ''
      const selectedText = range.toString().trim()

      if (anchorText === selectedText) {
        const textNode = document.createTextNode(targetElement.textContent || '')
        targetElement.parentNode?.replaceChild(textNode, targetElement)
        const newRange = document.createRange()
        newRange.selectNodeContents(textNode)
        selection.removeAllRanges()
        selection.addRange(newRange)
        handleInput()
        return
      }
    }

    // Save the range then open our dialog
    pendingRangeRef.current = range.cloneRange()
    // Pre-fill if editing an existing link
    const existingUrl = (targetElement?.nodeName === 'A') ? (targetElement as HTMLAnchorElement).href : ""
    const existingTitle = (targetElement?.nodeName === 'A') ? (targetElement as HTMLAnchorElement).title : ""
    setLinkDialog({ open: true, url: existingUrl, title: existingTitle })
  }

  const applyLink = () => {
    const { url, title } = linkDialog
    setLinkDialog({ open: false, url: "", title: "" })
    if (!url) return

    const range = pendingRangeRef.current
    if (!range) return

    // Restore the saved range into the selection
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }

    const anchor = document.createElement("a")
    anchor.href = url
    anchor.target = "_blank"
    anchor.rel = "noopener noreferrer"
    anchor.style.color = "inherit"
    anchor.style.textDecoration = "underline"
    if (title.trim()) anchor.title = title.trim()
    anchor.appendChild(range.extractContents())
    range.insertNode(anchor)

    range.setStartAfter(anchor)
    range.setEndAfter(anchor)
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }

    handleInput()
  }

  const toggleSuperscript = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    const commonAncestor = range.commonAncestorContainer
    let targetElement: HTMLElement | null = null

    if (commonAncestor.nodeType === Node.TEXT_NODE) {
      targetElement = commonAncestor.parentElement
    } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
      targetElement = commonAncestor as HTMLElement
    }

    if (
      targetElement &&
      targetElement.nodeName === 'SUP' &&
      targetElement.contains(range.startContainer) &&
      targetElement.contains(range.endContainer)
    ) {
      const supText = targetElement.textContent?.trim() || ''
      const selectedText = range.toString().trim()

      if (supText === selectedText) {
        const textNode = document.createTextNode(targetElement.textContent || '')
        targetElement.parentNode?.replaceChild(textNode, targetElement)
        const newRange = document.createRange()
        newRange.selectNodeContents(textNode)
        selection.removeAllRanges()
        selection.addRange(newRange)
        handleInput()
        return
      }
    }

    document.execCommand("superscript")
    handleInput()
  }

  const applyColor = (color: string) => {
    restoreSelection()

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    const commonAncestor = range.commonAncestorContainer
    let targetElement: HTMLElement | null = null

    if (commonAncestor.nodeType === Node.TEXT_NODE) {
      targetElement = commonAncestor.parentElement
    } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
      targetElement = commonAncestor as HTMLElement
    }

    if (
      targetElement &&
      targetElement.nodeName === 'SPAN' &&
      targetElement.contains(range.startContainer) &&
      targetElement.contains(range.endContainer)
    ) {
      const spanText = targetElement.textContent?.trim() || ''
      const selectedText = range.toString().trim()

      if (spanText === selectedText) {
        targetElement.style.color = color
        handleInput()
        return
      }
    }

    const span = document.createElement("span")
    span.style.color = color
    span.appendChild(range.extractContents())
    range.insertNode(span)

    range.setStartAfter(span)
    range.setEndAfter(span)
    selection.removeAllRanges()
    selection.addRange(range)

    handleInput()
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    let text = e.clipboardData.getData("text/plain");
    if (!text && navigator.clipboard) {
      try { text = await navigator.clipboard.readText(); } catch {}
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    text.split("\n").forEach((line, index) => {
      if (index > 0) fragment.appendChild(document.createElement("br"));
      fragment.appendChild(document.createTextNode(line));
    });
    range.insertNode(fragment);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault()
          document.execCommand("bold")
          handleInput()
          break
        case "i":
          e.preventDefault()
          document.execCommand("italic")
          handleInput()
          break
        case "u":
          e.preventDefault()
          document.execCommand("underline")
          handleInput()
          break
      }
    }
  }

  return (
    <div className="relative w-full">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setTimeout(() => {
            const active = document.activeElement
            if (toolbarRef.current && active && toolbarRef.current.contains(active)) return
            setFocused(false)
          }, 0)
        }}
        style={{ minHeight: "min-content", outline: "none", ...style }}
        className="px-3 py-2"
      />

      {/* Toolbar */}
      {isSelected && focused && (
        <div
          ref={toolbarRef}
          className="absolute -top-10 left-0 bg-white border rounded shadow-lg p-1 flex gap-1 z-50"
          tabIndex={-1}
          onMouseDown={() => saveSelection()}
        >
          <button type="button" className="px-2 py-1 text-xs hover:bg-gray-100 rounded text-black"
            onClick={() => { document.execCommand("bold"); handleInput() }}>
            <strong>B</strong>
          </button>
          <button type="button" className="px-2 py-1 text-xs hover:bg-gray-100 rounded text-black"
            onClick={() => { document.execCommand("italic"); handleInput() }}>
            <Italic className="h-3 w-3" />
          </button>
          <button type="button" className="px-2 py-1 text-xs hover:bg-gray-100 rounded text-black"
            onClick={() => { document.execCommand("underline"); handleInput() }}>
            <u>U</u>
          </button>
          <button type="button" className="px-2 py-1 text-xs hover:bg-gray-100 rounded text-black"
            onClick={() => LinkifyText()}>
            <Link className="h-3 w-3" />
          </button>
          <button type="button" className="px-2 py-1 text-md hover:bg-gray-100 rounded text-black"
            onClick={() => toggleSuperscript()}>
            <Superscript className="h-4 w-4" />
          </button>
          <div className="relative">
            <input type="color" className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              onBlur={(e) => applyColor(e.target.value)} title="Text Color" />
          </div>
        </div>
      )}

      {/* Link insert dialog */}
      {linkDialog.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg shadow-xl p-5 w-80 space-y-3">
            <h3 className="font-semibold text-sm text-gray-800">Insert Link</h3>
            <div>
              <label className="text-xs text-gray-600 block mb-1">URL <span className="text-red-500">*</span></label>
              <input
                autoFocus
                type="url"
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="https://example.com"
                value={linkDialog.url}
                onChange={(e) => setLinkDialog(d => ({ ...d, url: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") applyLink(); if (e.key === "Escape") setLinkDialog({ open: false, url: "", title: "" }); }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Title <span className="text-gray-400">(optional — tooltip on hover)</span></label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder='e.g. "Visit our website"'
                value={linkDialog.title}
                onChange={(e) => setLinkDialog(d => ({ ...d, title: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") applyLink(); if (e.key === "Escape") setLinkDialog({ open: false, url: "", title: "" }); }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded border text-gray-600 hover:bg-gray-50"
                onClick={() => setLinkDialog({ open: false, url: "", title: "" })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                disabled={!linkDialog.url.trim()}
                onClick={applyLink}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
