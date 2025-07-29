"use client"

import { Link } from "lucide-react"
import type React from "react"

import { useEffect, useRef } from "react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  style?: React.CSSProperties
}

export function RichTextEditor({ value, onChange, style }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }


  const LinkifyText = () => {
    const url = prompt("Enter the URL:");
    if (!url) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      alert("Please select text to link.");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.style.color = "#3498eb" 
    anchor.style.textDecoration = "underline"
    anchor.appendChild(range.extractContents());
    range.insertNode(anchor);

    console.log("created link ",anchor)

    // Move caret after the inserted link
    range.setStartAfter(anchor);
    range.setEndAfter(anchor);
    selection.removeAllRanges();
    selection.addRange(range);

    handleInput();
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle basic formatting shortcuts
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
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          minHeight: "40px",
          outline: "none",
          ...style,
        }}
        className="focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded p-2"
        placeholder="Enter your text..."
      />

      {/* Formatting Toolbar */}
      <div className="absolute -top-10 left-0 bg-white border rounded shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          type="button"
          className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
          onClick={() => {
            document.execCommand("bold")
            handleInput()
          }}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
          onClick={() => {
            document.execCommand("italic")
            handleInput()
          }}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
          onClick={() => {
            document.execCommand("underline")
            handleInput()
          }}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
          onClick={() => {
            LinkifyText()
          }}
        >
          <Link className="h-3 w-3"/>
        </button>
      </div>
    </div>
  )
}
