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
  

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }

    
    
  }, [value])

  
  const handleInput = () => {
    if (editorRef.current) {
      setTimeout(() => {

        onChange(editorRef?.current.innerHTML)
      }, 1000);
    }else{
      console.log("editorRef.current is null");
    }
  }

  

  const LinkifyText = () => {
    const url = prompt("Enter the URL:")
    if (!url) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) {
      alert("Please select text to link.")
      return
    }

    const anchor = document.createElement("a")
    anchor.href = url
    anchor.target = "_blank"
    anchor.rel = "noopener noreferrer"
    anchor.style.color = "#3498eb"
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
          minHeight: "40px",
          outline: "none",
          ...style,
        }}
        className={"focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-3 py-2"}
      />

      {/* Toolbar only visible for this editor when focused */}
      {isSelected && (
        <div
          ref={toolbarRef}
          className="absolute -top-10 left-0 bg-white border rounded shadow-lg p-1 flex gap-1 z-10"
          tabIndex={-1}
         
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
            onClick={() => {
              document.execCommand("superscript")
              handleInput()
            }}
          >
            <Superscript className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
