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
  // Saves the selection range before toolbar interactions cause blur
  const savedRangeRef = useRef<Range | null>(null)

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
    } else {
      console.log("editorRef.current is null");
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

  // Check if the entire selection is within a single existing anchor element
  const commonAncestor = range.commonAncestorContainer

  // Get the parent element (handle both text nodes and element nodes)
  let targetElement: HTMLElement | null = null
  
  if (commonAncestor.nodeType === Node.TEXT_NODE) {
    // If common ancestor is a text node, check its parent
    targetElement = commonAncestor.parentElement
  } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
    // If it's already an element, use it
    targetElement = commonAncestor as HTMLElement
  }

  // Check if the target is an anchor and contains the entire selection
  if (
    targetElement &&
    targetElement.nodeName === 'A' &&
    targetElement.contains(range.startContainer) &&
    targetElement.contains(range.endContainer)
  ) {
    // Check if the entire anchor content is selected
    const anchorText = targetElement.textContent?.trim() || ''
    const selectedText = range.toString().trim()
    
    if (anchorText === selectedText) {
      // Remove the link - replace anchor with its text content
      const textNode = document.createTextNode(targetElement.textContent || '')
      targetElement.parentNode?.replaceChild(textNode, targetElement)
      
      // Select the text that was unlinked
      const newRange = document.createRange()
      newRange.selectNodeContents(textNode)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      handleInput()
      return
    }
  }

  const url = prompt("Enter the URL:")
  if (!url) return

  // Otherwise, create a new anchor for the selected text only
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.target = "_blank"
  anchor.rel = "noopener noreferrer"
  anchor.style.color = "inherit"
  anchor.style.textDecoration = "underline"
  anchor.appendChild(range.extractContents())
  range.insertNode(anchor)

  // Move caret after link
  range.setStartAfter(anchor)
  range.setEndAfter(anchor)
  selection.removeAllRanges()
  selection.addRange(range)

  handleInput()
}

  const toggleSuperscript = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  if (range.collapsed) return

  // Check if the entire selection is within a single existing sup element
  const commonAncestor = range.commonAncestorContainer

  // Get the parent element (handle both text nodes and element nodes)
  let targetElement: HTMLElement | null = null
  
  if (commonAncestor.nodeType === Node.TEXT_NODE) {
    // If common ancestor is a text node, check its parent
    targetElement = commonAncestor.parentElement
  } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
    // If it's already an element, use it
    targetElement = commonAncestor as HTMLElement
  }

  // Check if the target is a sup element and contains the entire selection
  if (
    targetElement &&
    targetElement.nodeName === 'SUP' &&
    targetElement.contains(range.startContainer) &&
    targetElement.contains(range.endContainer)
  ) {
    // Check if the entire sup content is selected
    const supText = targetElement.textContent?.trim() || ''
    const selectedText = range.toString().trim()
    
    if (supText === selectedText) {
      // Remove the superscript - replace sup with its text content
      const textNode = document.createTextNode(targetElement.textContent || '')
      targetElement.parentNode?.replaceChild(textNode, targetElement)
      
      // Select the text that was unsuperscripted
      const newRange = document.createRange()
      newRange.selectNodeContents(textNode)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      handleInput()
      return
    }
  }

  // Otherwise, apply superscript
  document.execCommand("superscript")
  handleInput()
}

  const applyColor = (color: string) => {
  // Restore the selection that was saved before the color picker stole focus
  restoreSelection()

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  if (range.collapsed) return

  const commonAncestor = range.commonAncestorContainer

  // Get the parent element (handle both text nodes and element nodes)
  let targetElement: HTMLElement | null = null
  
  if (commonAncestor.nodeType === Node.TEXT_NODE) {
    targetElement = commonAncestor.parentElement
  } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
    targetElement = commonAncestor as HTMLElement
  }

  // If the entire selection is within an existing span, just update its color
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

  // Otherwise, wrap the selected text in a new colored span
  const span = document.createElement("span")
  span.style.color = color
  span.appendChild(range.extractContents())
  range.insertNode(span)

  // Move caret after the colored text
  range.setStartAfter(span)
  range.setEndAfter(span)
  selection.removeAllRanges()
  selection.addRange(range)

  handleInput()
}

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

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
          // Delay so that clicks on toolbar don't immediately hide
          setTimeout(() => {
              const active = document.activeElement
              if (toolbarRef.current && active && toolbarRef.current.contains(active)) {
                return
              }
              setFocused(false)
            }, 0)
        }}
        style={{
          minHeight: "min-content",
          outline: "none",
          ...style,
        }}
        className={" px-3 py-2"}
      />

      {/* Toolbar only visible for this editor when focused */}
      {isSelected && (
        <div
          ref={toolbarRef}
          className="absolute -top-10 left-0 bg-white border rounded shadow-lg p-1 flex gap-1 z-10"
          tabIndex={-1}
          onMouseDown={() => saveSelection()}
        >
          <button
            type="button"
            className="px-2 py-1 text-xs hover:bg-gray-100 rounded text-black"
            onClick={() => {
              document.execCommand("bold")
              handleInput()
            }}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs hover:bg-gray-100 rounded text-black"
            onClick={() => {
              document.execCommand("italic")
              handleInput()
            }}
          >
            <Italic className="h-3 w-3"/>
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs hover:bg-gray-100 rounded text-black"
            onClick={() => {
              document.execCommand("underline")
              handleInput()
            }}
          >
            <u>U</u>
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs hover:bg-gray-100 rounded text-black"
            onClick={() => LinkifyText()}
          >
            <Link className="h-3 w-3" />
          </button>
          <button
           type="button"
            className="px-2 py-1 text-md hover:bg-gray-100 rounded text-black"
            onClick={() => toggleSuperscript()}
          >
            <Superscript className="h-4 w-4" />
          </button>
          <div className="relative">
            <input
              type="color"
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              onBlur={(e) => applyColor(e.target.value)}
              title="Text Color"
            />
          </div>
        </div>
      )}
    </div>
  )
}
