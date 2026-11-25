"use client"


import { ArrowUpDown, Bold, Italic, Link, Subscript, Superscript, Underline } from "lucide-react"
import type React from "react"
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import { BuilderToolbarContext } from "./builder-toolbar-context"
import { createPortal } from "react-dom"
import { applyTextParagraphSpacing, PARAGRAPH_SPACING_OVERRIDE, removeTextParagraphSpacing } from "@/lib/text-paragraph-spacing"

import { TEXT_FONT_FAMILIES } from "@/lib/email-fonts"

const fontSizes = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px"]
const lineHeights = fontSizes.slice(2, 9)
const typographyControl = "h-8 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"

function selectedTextNodes(range: Range): Text[] {
  const root = range.commonAncestorContainer
  if (root.nodeType === Node.TEXT_NODE) return [root as Text]
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent && range.intersectsNode(node)) nodes.push(node as Text)
  }
  return nodes
}

const fontLabel = (font: string) => font.split(",")[0].trim().replace(/^["']|["']$/g, "")

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
  useBlockColorPresets?: boolean
  allowIsiBulletColorOverride?: boolean
  toolbarPlacement?: "below" | "selection"
}

export function RichTextEditor({ value, onChange, style, className, isSelected, paragraphSpacingPx, useBlockColorPresets, allowIsiBulletColorOverride, toolbarPlacement = "below" }: RichTextEditorProps) {
  const { formatting: formattingHost, applySelectionColor } = useContext(BuilderToolbarContext)
  const inTextSection = formattingHost?.dataset.formattingPlacement === "text-section"
  const floating = !formattingHost && toolbarPlacement === "selection"
  const editorRef = useRef<HTMLDivElement>(null)
  const selectionColorInputRef = useRef<HTMLInputElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const changeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoHistoryRef = useRef<string[]>([])
  const redoHistoryRef = useRef<string[]>([])
  const lastEditorHtmlRef = useRef<string | null>(null)
  const [selectionColors, setSelectionColors] = useState<string[]>([])
  const [selectionFont, setSelectionFont] = useState("")
  const [selectionSize, setSelectionSize] = useState("")
  const [focused, setFocused] = useState(false)
  const [paragraphSpacing, setParagraphSpacing] = useState("0")
  const paragraphSpacingDirty = useRef(false)
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
    if (!floating) return
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

    const toolbarWidth = toolbarRef.current?.offsetWidth || 256
    const toolbarHeight = toolbarRef.current?.offsetHeight || 190
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

    const wasCollapsed = range.collapsed
    const startContainer = range.startContainer
    const startOffset = range.startOffset
    const endContainer = range.endContainer
    const endOffset = range.endOffset
    const selectedLines: HTMLElement[] = []
    let didSplit = false

    blocks.forEach((block) => {
      const childNodes = Array.from(block.childNodes)
      if (!childNodes.some((node) => node.nodeName === "BR")) {
        selectedLines.push(block)
        return
      }

      didSplit = true
      const lines: Node[][] = [[]]
      childNodes.forEach((node) => {
        if (node.nodeName === "BR") lines.push([])
        else lines[lines.length - 1].push(node)
      })
      const caretLine = wasCollapsed && startContainer === block
        ? childNodes.slice(0, startOffset).filter(node => node.nodeName === "BR").length
        : -1
      const selectedLineFlags = lines.map((nodes, index) =>
        caretLine !== -1 ? index === caretLine : nodes.some(node => range.intersectsNode(node))
      )

      const lineElements = lines.map((nodes, index) => {
        const line = block === editor
          ? document.createElement("div")
          : block.cloneNode(false) as HTMLElement
        if (line !== block) {
          line.removeAttribute("id")
          if (index > 0) line.style.paddingTop = ""
          if (index < lines.length - 1) {
            line.removeAttribute(PARAGRAPH_SPACING_OVERRIDE)
            line.style.marginBottom = ""
          }
        }
        if (selectedLineFlags[index]) selectedLines.push(line)
        nodes.forEach((node) => line.appendChild(node))
        if (!nodes.length) line.appendChild(document.createElement("br"))
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
      if (wasCollapsed) updatedRange.collapse(true)
      else {
        const last = selectedLines[selectedLines.length - 1]
        updatedRange.setEnd(last, last.childNodes.length)
      }
    } else {
      return []
    }
    savedRangeRef.current = updatedRange
    return selectedLines
  }

  const readSelectionStyle = (range: Range) => {
    const colors = new Set<string>()
    const fonts = new Set<string>()
    const sizes = new Set<string>()
    const nodes = range.collapsed ? [range.startContainer] : selectedTextNodes(range)
    for (const node of nodes) {
      const element = node instanceof HTMLElement ? node : node.parentElement
      if (!element) continue
      const { color, fontFamily, fontSize } = window.getComputedStyle(element)
      const channels = color.match(/^rgb\((\d+), (\d+), (\d+)\)$/)
      if (channels) colors.add("#" + channels.slice(1).map(value => Number(value).toString(16).padStart(2, "0")).join(""))
      fonts.add(fontLabel(fontFamily))
      sizes.add(fontSize)
    }
    setSelectionColors([...colors])
    setSelectionFont(fonts.size === 1 ? [...fonts][0] : "")
    setSelectionSize(sizes.size === 1 ? [...sizes][0] : "")
  }

  const saveSelection = () => {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (selection && editor && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editor.contains(range.startContainer) && editor.contains(range.endContainer)) {
        savedRangeRef.current = range.cloneRange()
        readSelectionStyle(range)
        const paragraph = getParagraphsForRange(range)[0]
        if (!paragraphSpacingDirty.current) {
          setParagraphSpacing(String(Number.parseFloat(paragraph?.style.marginBottom || "") || 0))
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
    if (floating && toolbarPosition) updateToolbarPosition()
  }, [floating, toolbarPosition])

  useEffect(() => {
    if (!focused || !floating) return
    const repositionToolbar = () => updateToolbarPosition()
    window.addEventListener("scroll", repositionToolbar, true)
    window.addEventListener("resize", repositionToolbar)
    const handleSelectionChange = () => {
      const editor = editorRef.current
      const selection = window.getSelection()
      if (
        editor &&
        selection &&
        selection.rangeCount > 0 &&
        !selection.isCollapsed
      ) {
        const range = selection.getRangeAt(0)
        if (editor.contains(range.startContainer) && editor.contains(range.endContainer)) {
          savedRangeRef.current = range.cloneRange()
        }
      }
      updateToolbarPosition()
    }
    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      window.removeEventListener("scroll", repositionToolbar, true)
      window.removeEventListener("resize", repositionToolbar)
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [focused, floating])

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

  const toggleScript = (command: "superscript" | "subscript") => {
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
      targetElement.nodeName === (command === "superscript" ? "SUP" : "SUB") &&
      targetElement.contains(range.startContainer) &&
      targetElement.contains(range.endContainer)
    ) {
      const scriptText = targetElement.textContent?.trim() || ''
      const selectedText = range.toString().trim()

      if (scriptText === selectedText) {
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

    document.execCommand(command)
    handleInput()
  }

  const applyInlineStyle = (
    selection: Selection,
    range: Range,
    property: "fontFamily" | "fontSize" | "color",
    value: string,
  ) => {
    // Format each text run so selections spanning links or paragraphs keep their markup.
    const runs = selectedTextNodes(range).map(node => ({
      node,
      start: node === range.startContainer ? range.startOffset : 0,
      end: node === range.endContainer ? range.endOffset : node.length,
    })).filter(({ start, end }) => end > start)
    if (runs.length === 0) return

    const formatted = runs.map(({ node, start, end }) => {
      const parent = node.parentElement
      if (start === 0 && end === node.length && parent?.tagName === "SPAN" && parent.childNodes.length === 1) {
        parent.style[property] = value
        return node
      }
      if (end < node.length) node.splitText(end)
      const selected = start > 0 ? node.splitText(start) : node
      const span = document.createElement("span")
      span.style[property] = value
      selected.replaceWith(span)
      span.appendChild(selected)
      return selected
    })
    const last = formatted[formatted.length - 1]
    range.setStart(formatted[0], 0)
    range.setEnd(last, last.length)
    selection.removeAllRanges()
    selection.addRange(range)
    savedRangeRef.current = range.cloneRange()
    readSelectionStyle(range)
    handleInput()
    // Publish toolbar edits immediately so a blur save cannot replay older markup.
    flushInput()
  }

  const applyTypography = (property: "fontFamily" | "fontSize", value: string) => {
    restoreSelection()
    const selection = window.getSelection()
    const editor = editorRef.current
    if (!selection?.rangeCount || !editor) return
    const range = selection.getRangeAt(0)
    if (range.collapsed || !editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return
    applyInlineStyle(selection, range, property, value)
  }

  const applyColor = (color: string) => {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (!selection || !editor) return

    const isEditorSelection = (range: Range) => !range.collapsed &&
      editor.contains(range.startContainer) && editor.contains(range.endContainer)
    const liveRange = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    if (!liveRange || !isEditorSelection(liveRange)) restoreSelection()
    if (selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (!isEditorSelection(range)) return

    const commonAncestor = range.commonAncestorContainer
    let targetElement: HTMLElement | null = null

    if (commonAncestor.nodeType === Node.TEXT_NODE) {
      targetElement = commonAncestor.parentElement
    } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
      targetElement = commonAncestor as HTMLElement
    }

    const markerCell = allowIsiBulletColorOverride && targetElement?.closest("td")
    if (markerCell && editor.contains(markerCell) &&
        markerCell.textContent?.trim() === "•" && range.toString().trim() === "•") {
      markerCell.setAttribute("data-orserdu-isi-bullet-color", color)
      for (const element of [markerCell, ...markerCell.querySelectorAll<HTMLElement>("span, font, b, strong, i, em, u")]) {
        element.style.setProperty("color", color, "important")
        element.style.setProperty("-webkit-text-fill-color", color, "important")
      }
      savedRangeRef.current = range.cloneRange()
      setSelectionColors([color])
      handleInput()
      return
    }

    // The element that draws the underline owns its color.
    for (let element = targetElement; element && element !== editor; element = element.parentElement) {
      if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) break
      const decoration = window.getComputedStyle(element).textDecorationLine
      if (decoration.includes("underline") && element.textContent === range.toString()) {
        element.style.textDecorationColor = color
      }
    }
    applyInlineStyle(selection, range, "color", color)
  }

  useBrowserLayoutEffect(() => {
    const input = selectionColorInputRef.current
    if (!input) return
    input.value = selectionColors[0] || "#000000"
    const applyChosenColor = () => applyColor(input.value)
    input.addEventListener("input", applyChosenColor)
    return () => input.removeEventListener("input", applyChosenColor)
  })

  useBrowserLayoutEffect(() => {
    if (!applySelectionColor || !useBlockColorPresets || !isSelected || !focused) return;

    const applyPreset = (color: string) => {
      const selection = window.getSelection();
      const editor = editorRef.current;
      if (!editor || !selection?.rangeCount) return false;
      const range = selection.getRangeAt(0);
      if (range.collapsed || !editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return false;

      savedRangeRef.current = range.cloneRange();
      applyColor(color);
      return true;
    };

    applySelectionColor.current = applyPreset;
    return () => {
      if (applySelectionColor.current === applyPreset) applySelectionColor.current = null;
    };
  });

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

  const applyParagraphSpacing = (spacing: number) => {
    restoreSelection()
    const range = savedRangeRef.current
    const paragraphs = (range && splitSelectedBreakLines(range)) ?? getSelectedParagraphs()
    for (const paragraph of paragraphs) {
      paragraph.setAttribute(PARAGRAPH_SPACING_OVERRIDE, String(spacing))
      paragraph.style.setProperty("margin-bottom", `${spacing}px`, "important")
    }
    restoreSelection()
    handleInput()
    flushInput()
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

  const selectedFontValue = TEXT_FONT_FAMILIES.find(font => fontLabel(font) === selectionFont) ?? ""

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
            if (floating) setToolbarPosition(null)
          }, 0)
        }}
        style={{ minHeight: "min-content", outline: "none", ...style }}
        className={`px-3 py-2 ${className || ""}`}
      />

      {/* Toolbar */}
      {typeof document !== "undefined" && isSelected && focused && (!floating || toolbarPosition) && createPortal(
        <div
          ref={toolbarRef}
          aria-label="Rich text formatting toolbar"
          className={formattingHost
            ? `grid w-full gap-2 ${inTextSection ? "" : "rounded-lg border border-slate-200 bg-white p-3"}`
            : `grid w-64 max-w-full gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg z-[10000] ${floating ? "fixed" : "mt-2"}`}
          style={floating && toolbarPosition
            ? { top: toolbarPosition.top, left: toolbarPosition.left, maxWidth: "calc(100vw - 16px)" }
            : undefined}
          tabIndex={-1}
          onMouseDown={saveSelection}
          onClick={(event) => event.stopPropagation()}
        >
          <h3 className="text-xs font-semibold text-slate-900">{inTextSection ? "Selection formatting" : "Text formatting"}</h3>
          <select
            aria-label="Selection font family"
            title="Font family for selected text"
            className={typographyControl}
            value={selectedFontValue}
            onChange={e => applyTypography("fontFamily", e.currentTarget.value)}
          >
            <option value="" disabled>{selectionFont || "Font family"}</option>
            {TEXT_FONT_FAMILIES.map(font => <option key={font} value={font}>{fontLabel(font)}</option>)}
          </select>
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
            <select
              aria-label="Selection font size"
              title="Font size for selected text"
              className={typographyControl}
              value={selectionSize}
              onChange={e => applyTypography("fontSize", e.currentTarget.value)}
            >
              <option value="" disabled>Size</option>
              {selectionSize && !fontSizes.includes(selectionSize) && <option value={selectionSize} disabled>{selectionSize}</option>}
              {fontSizes.map(size => <option key={size} value={size}>{size}</option>)}
            </select>
            <select
              aria-label="Line height for selected paragraph"
              title="Line height for selected paragraph"
              className={typographyControl}
              defaultValue=""
              onChange={e => {
                if (e.currentTarget.value) applyLineHeight(e.currentTarget.value)
                e.currentTarget.value = ""
              }}
            >
              <option value="" disabled>Line height</option>
              {lineHeights.map(size => <option key={size} value={size}>{size}</option>)}
            </select>
            <input ref={selectionColorInputRef} type="color"
              aria-label={inTextSection ? "Selection color" : "Text color"}
              title={selectionColors.join(", ") || "Text color"}
              className="h-8 w-9 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
              onFocus={saveSelection} />
          </div>
          <div className="flex flex-wrap items-center gap-0.5 rounded-md bg-slate-100 p-0.5">
            {[
              { label: "Bold", Icon: Bold, action: () => applyFormattingCommand("bold") },
              { label: "Italic", Icon: Italic, action: () => applyFormattingCommand("italic") },
              { label: "Underline", Icon: Underline, action: () => applyFormattingCommand("underline") },
              { label: "Insert link", Icon: Link, action: LinkifyText },
              { label: "Superscript", Icon: Superscript, action: () => toggleScript("superscript") },
              { label: "Subscript", Icon: Subscript, action: () => toggleScript("subscript") },
            ].map(({ label, Icon, action }) => (
              <button key={label} type="button" title={label} aria-label={label}
                className="grid h-7 w-7 place-items-center rounded text-slate-700 hover:bg-white hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                onClick={action}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
          </div>
          <label title="Space below selected paragraph" className="flex items-center gap-2 text-xs text-slate-600">
            <ArrowUpDown className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="grow">Paragraph spacing after</span>
            <input
              type="number"
              min="0"
              max="200"
              step="any"
              value={paragraphSpacing}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              onBlur={() => {
                if (!paragraphSpacingDirty.current) return
                paragraphSpacingDirty.current = false
                const spacing = Number(paragraphSpacing)
                if (Number.isFinite(spacing)) {
                  const value = Math.min(200, Math.max(0, spacing))
                  setParagraphSpacing(String(value))
                  applyParagraphSpacing(value)
                }
              }}
              onChange={e => {
                paragraphSpacingDirty.current = true
                setParagraphSpacing(e.target.value)
              }}
              className={`${typographyControl} max-w-14`}
              aria-label="Space below selected paragraph in pixels"
            />
            px
          </label>
        </div>,
        formattingHost ?? (floating ? document.body : editorRef.current?.parentElement ?? document.body),
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
