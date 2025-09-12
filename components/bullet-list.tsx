import { useState } from "react"
import type { EmailComponent } from "@/types/email-builder"
import { RichTextEditor } from "./rich-text-editor"
import { Trash } from "lucide-react";
import { relative } from "path";

export default function BulletList({ component, onUpdate,isSelected }: { component: EmailComponent; onUpdate: (updatedProps: Partial<EmailComponent>) => void; isSelected?:boolean }) {
  // Track which item is being edited
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  

  const handleAddItem = () => {
    const updated = [...(component.listItems || []), `New Item`]
    onUpdate({ listItems: updated })
  }

  

  const handleDeleteItem = (index: number) => {
    const updated = component.listItems?.filter((_: string, i: number) => i !== index)
    onUpdate({ listItems: updated })
    if (editingIndex === index) setEditingIndex(null) // reset editor if deleted
  }

  const handleUpdateItem = (index: number, content: string) => {
    const updated = [...component.listItems]
    updated[index] = `${content}`
    onUpdate({ listItems: updated })
  }

  return (
    <div style={{ padding: "10px",marginTop:"5px" }}>
      <ul
        style={{
          listStyleType: "disc",
          color: component.markerColor || "#000000",
          paddingLeft: "20px",
          backgroundColor: component.backgroundColor || "transparent",
          fontSize: component.discSize || "16px",
        }}
      >
        {component.listItems?.map((item: string, index: number) => (
          <li onBlur={() => setEditingIndex(null) } key={index} style={{ marginBottom: "8px",position:"relative" }}>
            {editingIndex === index ? (
              <RichTextEditor
                value={item}
                
                 // exit editor on blur
                 isSelected={isSelected}
                onChange={(content) => handleUpdateItem(index, content)}
                style={{
                  flex: 1,
                  fontSize: component.fontSize || "16px",
                  color: component.color || "#000000",
                  textAlign: component.textAlign || "left",
                  fontWeight: component.fontWeight || "normal",
                  lineHeight: component.lineHeight || "18px",
                }}
              />
            ) : (
              <div
          onClick={() => setEditingIndex(index)}
          
        >
          <p style={{
            flex: 1,
                  fontSize: component.fontSize || "16px",
                  color: component.color || "#000000",
                  textAlign: component.textAlign || "left",
                  fontWeight: component.fontWeight || "normal",
                  lineHeight: component.lineHeight || "18px",
          }} dangerouslySetInnerHTML={{ __html: item }}></p>
        </div>
            )}

            {/* Delete button */}
             {component.listItems?.length > 1 && <button
              onClick={() => handleDeleteItem(index)}
              className="ml-2 text-red-500 hover:text-red-700 absolute right-0 top-1"
            >
              <Trash className="h-4 w-4"/>
            </button>}
          </li>
        ))}
      </ul>

      {/* Add Item button */}
      {isSelected && <div className="flex justify-center">
        <button
            onClick={handleAddItem}
            className="mt-2 px-2 py-1 text-sm border rounded-md border-dashed"
        >
            + 
        </button>
      </div>}
    </div>
  )
}
