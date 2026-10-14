"use client"


import { Italic, Link, Superscript } from "lucide-react"
import type React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { applyTextParagraphSpacing, removeTextParagraphSpacing } from "@/lib/text-paragraph-spacing"

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

interface SelectionBoundary {
  path: number[]
  offset: number
}

interface SelectionSnapshot {
  start: SelectionBoundary
  end: SelectionBoundary
}

function getNodePath(root: Node, node: Node): number[] | null {
  const path: number[] = [];
  let current: Node | null = node;

  while (current && current !== root) {
    const parent: Node | null = current.parentNode;
    if (!parent) return null;
    const index = Array.prototype.indexOf.call(parent.childNodes, current);
    if (index < 0) return null;
    path.unshift(index);
    current = parent;
  }

  return current === root ? path : null;
}

function getSelectionSnapshot(root: HTMLElement): SelectionSnapshot | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const startPath = getNodePath(root, range.startContainer);
  const endPath = getNodePath(root, range.endContainer);
  if (!startPath || !endPath) return null;
  return {
    start: { path: startPath, offset: range.startOffset },
    end: { path: endPath, offset: range.endOffset },
  }
}

function resolveBoundary(root: Node, boundary: SelectionBoundary): { node: Node; offset: number } | null {
  let node = root;
  for (const index of boundary.path) {
    const child = node.childNodes[index];
    if (!child) return null;
    node = child;
  }
  const maxOffset = node.nodeType === Node.TEXT_NODE ? node.textContent?.length ?? 0 : node.childNodes.length;
  return { node, offset: Math.min(boundary.offset, maxOffset) };
}

function restoreSelectionSnapshot(root: HTMLElement, snapshot: SelectionSnapshot | null) {
  if (!snapshot) return;
  const start = resolveBoundary(root, snapshot.start);
  const end = resolveBoundary(root, snapshot.end);
  if (!start || !end) return;
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
}

interface RichTextEditorProps {

  value: string
  onChange: (value: string) => void
  style?: React.CSSProperties
  className?: string
  isSelected?: boolean
  paragraphSpacingPx?: number
  toolbarPlacement?: "below" | "selection"
}

export function RichTextEditor({ value, onChange, style, className, isSelected, paragraphSpacingPx, toolbarPlacement = "below" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const changeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoHistoryRef = useRef<string[]>([])
  const redoHistoryRef = useRef<string[]>([])
  const lastEditorHtmlRef = useRef<string | null>(null)
  const [focused, setFocused] = useState(false)
  const [paragraphPadding, setParagraphPadding] = useState("8")
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null)
  const savedRangeRef = useRef<Range | null>(null)

  // Link dialog state
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; url: string; title: string }>({
    open: false, url: "", title: ""
  })
  // Saved range when dialog opens (prompt steals focus)
  const pendingRangeRef = useRef<Range | null>(null)

  const getParagraphsForRange = (range: Range): HTMLElement[] => {
    const editor = editorRef.current
    if (!editor) return []

    const blockSelector = "blockquote,div,h1,h2,h3,h4,h5,h6,li,p,pre"
    return Array.from(editor.querySelectorAll<HTMLElement>(blockSelector))
      .filter((element) => !element.querySelector(blockSelector))
      .filter((element) => range.intersectsNode(element))
  }

  const updateToolbarPosition = () => {
    if (toolbarPlacement !== "selection") return
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor) {
      setToolbarPosition(null)
      return
    }

    const selectionRange = selection && selection.rangeCount > 0
      ? selection.getRangeAt(0)
      : null
    const range = selectionRange &&
      !selectionRange.collapsed &&
      editor.contains(selectionRange.startContainer) &&
      editor.contains(selectionRange.endContainer)
      ? selectionRange
      : savedRangeRef.current
    if (!range || range.collapsed) {
      setToolbarPosition(null)
      return
    }
    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
      setToolbarPosition(null)
      return
    }

    const selectionRect = range.getBoundingClientRect()
    if (selectionRect.width === 0 && selectionRect.height === 0) {
      setToolbarPosition(null)
      return
    }

    const toolbarWidth = toolbarRef.current?.offsetWidth || 480
    const toolbarHeight = toolbarRef.current?.offsetHeight || 44
    const maxLeft = Math.max(8, window.innerWidth - toolbarWidth - 8)
    const left = Math.max(
      8,
      Math.min(
        selectionRect.left + selectionRect.width / 2 - toolbarWidth / 2,
        maxLeft,
      ),
    )
    const preferredTop = selectionRect.top >= toolbarHeight + 8
      ? selectionRect.top - toolbarHeight - 8
      : selectionRect.bottom + 8
    const maxTop = Math.max(8, window.innerHeight - toolbarHeight - 8)
    const top = Math.max(8, Math.min(preferredTop, maxTop))
    setToolbarPosition((current) =>
      current?.top === top && current.left === left ? current : { top, left }
    )
  }

  const splitSelectedBreakLines = (range: Range): HTMLElement[] | null => {
    const editor = editorRef.current
    if (!editor) return null

    const blockSelector = "blockquote,div,h1,h2,h3,h4,h5,h6,li,p,pre"
    const blocks = Array.from(editor.querySelectorAll<HTMLElement>(blockSelector))
      .filter((element) => !element.querySelector(blockSelector) && range.intersectsNode(element))
    if (blocks.length === 0 && editor.querySelector("br")) blocks.push(editor)

    const startContainer = range.startContainer
    const startOffset = range.startOffset
    const endContainer = range.endContainer
    const endOffset = range.endOffset
    const selectedLines: HTMLElement[] = []
    let didSplit = false

    blocks.forEach((block) => {
      const childNodes = Array.from(block.childNodes)
      if (!childNodes.some((node) => node.nodeName === "BR")) return

      didSplit = true
      const lines: Node[][] = [[]]
      childNodes.forEach((node) => {
        if (node.nodeName === "BR") lines.push([])
        else lines[lines.length - 1].push(node)
      })
      const selectedLineFlags = lines.map((nodes) =>
        nodes.some((node) => range.intersectsNode(node))
      )

      const lineElements = lines.map((nodes, index) => {
        const line = block === editor
          ? document.createElement("div")
          : block.cloneNode(false) as HTMLElement
        if (line !== block) {
          line.removeAttribute("id")
          if (index > 0) line.style.paddingTop = ""
        }
        if (selectedLineFlags[index]) selectedLines.push(line)
        nodes.forEach((node) => line.appendChild(node))
        return line
      })

      if (block === editor) {
        editor.replaceChildren(...lineElements)
      } else {
        block.replaceWith(...lineElements)
      }
    })

    if (!didSplit) return null

    const updatedRange = document.createRange()
    if (editor.contains(startContainer) && editor.contains(endContainer)) {
      updatedRange.setStart(startContainer, startOffset)
      updatedRange.setEnd(endContainer, endOffset)
    } else if (selectedLines.length > 0) {
      updatedRange.selectNodeContents(selectedLines[0])
      updatedRange.setEnd(
        selectedLines[selectedLines.length - 1],
        selectedLines[selectedLines.length - 1].childNodes.length,
      )
    } else {
      return []
    }
    savedRangeRef.current = updatedRange
    return selectedLines
  }

  const saveSelection = () => {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (selection && editor && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editor.contains(range.startContainer) && editor.contains(range.endContainer)) {
        savedRangeRef.current = range.cloneRange()
        const paragraph = getParagraphsForRange(range)[0]
        if (paragraph) {
          setParagraphPadding(String(Number.parseFloat(paragraph.style.paddingTop) || 0))
        }
      }
    }
    updateToolbarPosition()
  }

  const restoreSelection = () => {
    const selection = window.getSelection()
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges()
      selection.addRange(savedRangeRef.current)
    }
  }

  useBrowserLayoutEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const spacedValue = paragraphSpacingPx === undefined
        ? value
        : applyTextParagraphSpacing(value, paragraphSpacingPx)
      const normalizedTarget = document.createElement("div");
      normalizedTarget.innerHTML = spacedValue;
      if (editor.innerHTML !== normalizedTarget.innerHTML) {
        const selectionSnapshot = getSelectionSnapshot(editor);
        editor.innerHTML = normalizedTarget.innerHTML;
        restoreSelectionSnapshot(editor, selectionSnapshot);
      }
      lastEditorHtmlRef.current = editor.innerHTML
    }
  }, [value, paragraphSpacingPx])

  useEffect(() => () => {
    if (changeTimerRef.current) clearTimeout(changeTimerRef.current)
  }, [])

  useLayoutEffect(() => {
    if (toolbarPlacement === "selection" && toolbarPosition) updateToolbarPosition()
  }, [toolbarPlacement, toolbarPosition])

  useEffect(() => {
    if (!focused || toolbarPlacement !== "selection") return
    const repositionToolbar = () => updateToolbarPosition()
    window.addEventListener("scroll", repositionToolbar, true)
    window.addEventListener("resize", repositionToolbar)
    return () => {
      window.removeEventListener("scroll", repositionToolbar, true)
      window.removeEventListener("resize", repositionToolbar)
    }
  }, [focused, toolbarPlacement])

  const flushInput = () => {
    if (changeTimerRef.current) {
      clearTimeout(changeTimerRef.current)
      changeTimerRef.current = null
    }
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      onChange(paragraphSpacingPx === undefined ? html : removeTextParagraphSpacing(html))
    }
  }

  const applyHistorySnapshot = (html: string) => {
    const editor = editorRef.current
    if (!editor) return

    editor.innerHTML = html
    lastEditorHtmlRef.current = html
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
      savedRangeRef.current = range.cloneRange()
    }

    if (changeTimerRef.current) {
      clearTimeout(changeTimerRef.current)
      changeTimerRef.current = null
    }
    onChange(paragraphSpacingPx === undefined ? html : removeTextParagraphSpacing(html))
  }

  const undo = () => {
    const editor = editorRef.current
    const previousHtml = undoHistoryRef.current.pop()
    if (!editor || previousHtml === undefined) return

    redoHistoryRef.current.push(editor.innerHTML)
    applyHistorySnapshot(previousHtml)
  }

  const redo = () => {
    const editor = editorRef.current
    const nextHtml = redoHistoryRef.current.pop()
    if (!editor || nextHtml === undefined) return

    undoHistoryRef.current.push(editor.innerHTML)
    applyHistorySnapshot(nextHtml)
  }

  const handleInput = () => {
    const editor = editorRef.current
    if (editor) {
      const currentHtml = editor.innerHTML
      const previousHtml = lastEditorHtmlRef.current
      if (previousHtml !== null && previousHtml !== currentHtml) {
        undoHistoryRef.current.push(previousHtml)
        if (undoHistoryRef.current.length > 100) undoHistoryRef.current.shift()
        redoHistoryRef.current = []
      }
      lastEditorHtmlRef.current = currentHtml
    }

    updateToolbarPosition()
    if (changeTimerRef.current) clearTimeout(changeTimerRef.current)
    changeTimerRef.current = setTimeout(flushInput, 300)
  }

  const LinkifyText = () => {
    restoreSelection()
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

  const applyFontSize = (size: string) => {
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
        targetElement.style.fontSize = size
        handleInput()
        return
      }
    }

    const span = document.createElement("span")
    span.style.fontSize = size
    span.appendChild(range.extractContents())
    range.insertNode(span)

    range.setStartAfter(span)
    range.setEndAfter(span)
    selection.removeAllRanges()
    selection.addRange(range)

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
        savedRangeRef.current = range.cloneRange()
        handleInput()
        return
      }
    }

    const span = document.createElement("span")
    span.style.color = color
    span.appendChild(range.extractContents())
    range.insertNode(span)

    range.selectNodeContents(span)
    selection.removeAllRanges()
    selection.addRange(range)
    savedRangeRef.current = range.cloneRange()

    handleInput()
  }

  const applyFormattingCommand = (command: "bold" | "italic" | "underline") => {
    restoreSelection()
    document.execCommand(command)
    handleInput()
  }

  const getSelectedParagraphs = (): HTMLElement[] => {
    const editor = editorRef.current
    const range = savedRangeRef.current
    if (!editor || !range) return []

    const paragraphs = getParagraphsForRange(range)

    if (paragraphs.length > 0) return paragraphs

    const paragraph = document.createElement("div")
    while (editor.firstChild) paragraph.appendChild(editor.firstChild)
    editor.appendChild(paragraph)
    return [paragraph]
  }

  const applyParagraphPadding = (paddingTop: string) => {
    restoreSelection()
    const range = savedRangeRef.current
    const splitParagraphs = range ? splitSelectedBreakLines(range) : null
    const paragraphs = splitParagraphs ?? getSelectedParagraphs()
    paragraphs.forEach((paragraph) => {
      paragraph.style.paddingTop = paddingTop === "0px" ? "" : paddingTop
    })
    handleInput()
  }

  const applyLineHeight = (lineHeight: string) => {
    restoreSelection()
    getSelectedParagraphs().forEach((paragraph) => {
      paragraph.style.lineHeight = lineHeight
    })
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
      switch (e.key.toLowerCase()) {
        case "z":
          e.preventDefault()
          if (e.shiftKey) redo()
          else undo()
          break
        case "y":
          e.preventDefault()
          redo()
          break
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
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={handlePaste}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          flushInput()
          setTimeout(() => {
            const active = document.activeElement
            if (toolbarRef.current && active && toolbarRef.current.contains(active)) return
            setFocused(false)
            if (toolbarPlacement === "selection") setToolbarPosition(null)
          }, 0)
        }}
        style={{ minHeight: "min-content", outline: "none", ...style }}
        className={`px-3 py-2 ${className || ""}`}
      />

      {/* Toolbar */}
      {isSelected && focused && (toolbarPlacement !== "selection" || toolbarPosition) && (
        <div
          ref={toolbarRef}
          aria-label="Rich text formatting toolbar"
          className={`w-fit max-w-full bg-white/95 border border-slate-200 rounded-xl shadow-xl ring-1 ring-black/5 backdrop-blur p-2 flex flex-wrap items-center gap-1.5 z-50 ${toolbarPlacement === "selection" ? "fixed" : "mt-2"}`}
          style={toolbarPlacement === "selection" && toolbarPosition
            ? { top: toolbarPosition.top, left: toolbarPosition.left, maxWidth: "calc(100vw - 16px)" }
            : undefined}
          tabIndex={-1}
          onMouseDown={saveSelection}
        >
          <button type="button" title="Bold" className="px-2.5 py-1.5 text-xs hover:bg-slate-100 rounded-lg text-slate-800 transition-colors"
            onClick={() => applyFormattingCommand("bold")}>
            <strong>B</strong>
          </button>
          <button type="button" title="Italic" className="px-2.5 py-1.5 text-xs hover:bg-slate-100 rounded-lg text-slate-800 transition-colors"
            onClick={() => applyFormattingCommand("italic")}>
            <Italic className="h-3 w-3" />
          </button>
          <button type="button" title="Underline" className="px-2.5 py-1.5 text-xs hover:bg-slate-100 rounded-lg text-slate-800 transition-colors"
            onClick={() => applyFormattingCommand("underline")}>
            <u>U</u>
          </button>
          <button type="button" title="Insert link" className="px-2.5 py-1.5 text-xs hover:bg-slate-100 rounded-lg text-slate-800 transition-colors"
            onClick={() => LinkifyText()}>
            <Link className="h-3 w-3" />
          </button>
          <button type="button" title="Superscript" className="px-2.5 py-1.5 text-md hover:bg-slate-100 rounded-lg text-slate-800 transition-colors"
            onClick={() => toggleSuperscript()}>
            <Superscript className="h-4 w-4" />
          </button>
          <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />
          <label className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100">
            Color
            <input type="color" className="h-6 w-6 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
              onMouseDown={saveSelection}
              onChange={(e) => applyColor(e.currentTarget.value)}
              title="Text color"
              aria-label="Text color" />
          </label>
          <select
            className="px-1 py-1 text-xs rounded border border-gray-300 bg-white text-black cursor-pointer"
            value=""
            onChange={(e) => { if (e.target.value) applyFontSize(e.target.value) }}
            onMouseDown={() => saveSelection()}
            title="Font Size"
          >
            <option value="" disabled>Size</option>
            <option value="10px">10</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
            <option value="28px">28</option>
            <option value="32px">32</option>
            <option value="40px">40</option>
            <option value="48px">48</option>
          </select>
          <select
            className="px-1 py-1 text-xs rounded border border-gray-300 bg-white text-black cursor-pointer"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyLineHeight(e.target.value)
              e.currentTarget.value = ""
            }}
            title="Line height for selected paragraph"
          >
            <option value="" disabled>Line height</option>
            <option value="14px">14px line</option>
            <option value="16px">16px line</option>
            <option value="18px">18px line</option>
            <option value="20px">20px line</option>
            <option value="24px">24px line</option>
            <option value="28px">28px line</option>
            <option value="32px">32px line</option>
          </select>
          <label className="flex items-center gap-1 border-l pl-2 px-1 text-xs text-black">
            Top space
            <input
              type="number"
              min="0"
              max="200"
              step="any"
              value={paragraphPadding}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  const padding = Number(paragraphPadding)
                  if (Number.isFinite(padding) && padding >= 0 && padding <= 200) {
                    applyParagraphPadding(`${padding}px`)
                  }
                }
              }}
              onMouseDown={saveSelection}
              onBlur={() => {
                const padding = Number(paragraphPadding)
                if (Number.isFinite(padding) && padding >= 0 && padding <= 200) {
                  applyParagraphPadding(`${padding}px`)
                }
              }}
              onChange={(e) => {
                const value = e.target.value
                setParagraphPadding(value)
                const padding = Number(value)
                if (value !== "" && Number.isFinite(padding) && padding >= 0 && padding <= 200) {
                  applyParagraphPadding(`${padding}px`)
                }
              }}
              className="w-14 rounded border border-gray-300 px-1 py-1 text-xs text-black"
              aria-label="Space above selected paragraph in pixels"
            />
            px
          </label>
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
