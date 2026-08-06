import { useState } from "react"
import type { EmailComponent } from "@/types/email-builder"
import { RichTextEditor } from "./rich-text-editor"
import { Trash, Code } from "lucide-react"
import { HtmlEditorModal } from "./html-editor-modal"
import { Button } from "./ui/button"


export default function BulletList({
  component,
  onUpdate,
  isSelected,
  previewMode,
}: {
  component: EmailComponent;
  onUpdate: (updatedProps: Partial<EmailComponent>) => void;
  isSelected?: boolean;
  previewMode?: boolean;
}) {
  // Which item's HTML editor modal is open (-1 = none)
  const [htmlEditorIndex, setHtmlEditorIndex] = useState<number>(-1)

  const handleAddItem = () => {
    const updated = [...(component.listItems || []), `New Item`]
    onUpdate({ listItems: updated })
  }

  const handleDeleteItem = (index: number) => {
    const updated = component.listItems?.filter((_: string, i: number) => i !== index)
    onUpdate({ listItems: updated })
  }

  const handleUpdateItem = (index: number, content: string) => {
    const updated = [...(component.listItems || [])]
    updated[index] = content
    onUpdate({ listItems: updated })
  }

  const canEdit = isSelected && !previewMode

  return (
    <div style={{ padding: "10px", marginTop: "5px" }}>
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
          <li key={index} style={{ marginBottom: "8px", position: "relative" }}>
            {canEdit ? (
              <div style={{ paddingRight: "60px" }}>
                <RichTextEditor
                  value={item}
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
              </div>
            ) : (
              <p
                style={{
                  flex: 1,
                  fontSize: component.fontSize || "16px",
                  color: component.color || "#000000",
                  textAlign: component.textAlign || "left",
                  fontWeight: component.fontWeight || "normal",
                  lineHeight: component.lineHeight || "18px",
                  margin: 0,
                }}
                dangerouslySetInnerHTML={{ __html: item }}
              />
            )}

            {/* Action buttons — Edit HTML + Delete */}
            {canEdit && (
              <div className="absolute right-0 top-0 flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  title="Edit HTML"
                  onClick={(e) => { e.stopPropagation(); setHtmlEditorIndex(index); }}
                >
                  <Code className="h-3 w-3" />
                </Button>
                {(component.listItems?.length ?? 0) > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-700"
                    title="Delete item"
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(index); }}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Add Item button */}
      {canEdit && (
        <div className="flex justify-center">
          <button
            onClick={handleAddItem}
            className="mt-2 px-2 py-1 text-sm border rounded-md border-dashed"
          >
            + Add item
          </button>
        </div>
      )}

      {/* HTML Editor Modal — one per open item */}
      {htmlEditorIndex >= 0 && (
        <HtmlEditorModal
          isOpen={true}
          onClose={() => setHtmlEditorIndex(-1)}
          initialValue={component.listItems?.[htmlEditorIndex] ?? ""}
          onSave={(newHtml) => {
            handleUpdateItem(htmlEditorIndex, newHtml)
            setHtmlEditorIndex(-1)
          }}
        />
      )}
    </div>
  )
}
