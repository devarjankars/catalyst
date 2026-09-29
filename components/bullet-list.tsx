import { memo, useState } from "react"
import type { EmailComponent } from "@/types/email-builder"
import { RichTextEditor } from "./rich-text-editor"
import { Trash, Code } from "lucide-react"
import { HtmlEditorModal } from "./html-editor-modal"
import { Button } from "./ui/button"

// ── Marker helpers — mirrors email-generator.ts getMarker() exactly ─────────
const toRoman = (n: number): string => {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1]
  const syms = ['m','cm','d','cd','c','xc','l','xl','x','ix','v','iv','i']
  let result = ''
  let num = n
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i] }
  }
  return result
}

const MARKER_SYMBOLS: Record<string, string> = {
  dash:   '–',
  arrow:  '→',
  check:  '✓',
  square: '▪',
}

function getMarker(markerType: string, index: number): string {
  switch (markerType) {
    case 'dash':   return '–'
    case 'arrow':  return '→'
    case 'check':  return '✓'
    case 'square': return '▪'
    case 'number': return `${index + 1}.`
    case 'roman':  return `${toRoman(index + 1)}.`
    case 'alpha':  return `${String.fromCharCode(97 + index % 26)}.`
    default:       return '•'
  }
}

// ── Component ────────────────────────────────────────────────────────────────
function BulletList({
  component,
  onUpdate,
  isSelected,
  previewMode,
}: {
  component: EmailComponent
  onUpdate: (updatedProps: Partial<EmailComponent>) => void
  isSelected?: boolean
  previewMode?: boolean
}) {
  const [htmlEditorIndex, setHtmlEditorIndex] = useState<number>(-1)

  const handleAddItem = () =>
    onUpdate({ listItems: [...(component.listItems || []), 'New Item'] })

  const handleDeleteItem = (index: number) =>
    onUpdate({ listItems: component.listItems?.filter((_: string, i: number) => i !== index) })

  const handleUpdateItem = (index: number, content: string) => {
    const updated = [...(component.listItems || [])]
    updated[index] = content
    onUpdate({ listItems: updated })
  }

  const canEdit    = isSelected && !previewMode
  const markerType = (component as any).markerType || 'bullet'
  const isCounter  = ['number', 'roman', 'alpha'].includes(markerType)
  const bg         = component.backgroundColor || 'transparent'
  const spacePx    = parseInt((component.spaceBetweenItems || '5px').replace(/px$/i, ''), 10) || 5
  // Mirror the outer padding the email-generator applies so canvas matches the email output
  const outerPadding = (component as any).padding || '0px 20px 0px 20px'

  const markerStyle: React.CSSProperties = {
    color:       component.markerColor || '#000000',
    fontSize:    component.discSize    || '16px',
    lineHeight:  component.lineHeight  || '18px',
    fontFamily:  component.fontFamily  || 'Arial, sans-serif',
    verticalAlign: 'top',
    paddingTop:  '1px',
    whiteSpace:  isCounter ? 'nowrap' : undefined,
    width:       isCounter ? '28px' : '14px',
    minWidth:    isCounter ? '28px' : '14px',
  }

  const itemStyle: React.CSSProperties = {
    fontSize:    component.fontSize   || '12px',
    color:       component.color      || '#000000',
    fontWeight:  component.fontWeight || 'normal',
    textAlign:   (component.textAlign as any) || 'left',
    lineHeight:  component.lineHeight || '18px',
    fontFamily:  component.fontFamily || 'Arial, sans-serif',
    paddingLeft: '5px',
    verticalAlign: 'middle',
  }

  return (
    <div
      style={{
        marginTop: '5px',
        backgroundColor: bg,
        margin: (component as any).margin || undefined,
        padding: outerPadding,
        boxSizing: 'border-box',
      }}
    >
      <table
        cellPadding={0}
        cellSpacing={0}
        style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: bg }}
      >
        <tbody>
          {(component.listItems || []).map((item: string, index: number) => (
            <>
              <tr key={`item-${index}`}>
                {/* Marker cell */}
                <td style={markerStyle}>
                  {getMarker(markerType, index)}
                </td>

                {/* Text cell */}
                <td style={itemStyle}>
                  {canEdit ? (
                    <div style={{ paddingRight: '52px', position: 'relative' }}>
                      <RichTextEditor
                        value={item}
                        isSelected={isSelected}
                        onChange={(content) => handleUpdateItem(index, content)}
                        style={{
                          fontSize:   component.fontSize   || '12px',
                          color:      component.color      || '#000000',
                          textAlign:  (component.textAlign as any) || 'left',
                          fontWeight: component.fontWeight || 'normal',
                          lineHeight: component.lineHeight || '18px',
                          fontFamily: component.fontFamily || 'Arial, sans-serif',
                        }}
                      />
                      {/* Action buttons */}
                      <div
                        style={{ position: 'absolute', right: 0, top: 0 }}
                        className="flex items-center gap-1"
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          title="Edit HTML"
                          onClick={(e) => { e.stopPropagation(); setHtmlEditorIndex(index) }}
                        >
                          <Code className="h-3 w-3" />
                        </Button>
                        {(component.listItems?.length ?? 0) > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-700"
                            title="Delete item"
                            onClick={(e) => { e.stopPropagation(); handleDeleteItem(index) }}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p
                      style={{ margin: 0, fontSize: component.fontSize || '12px', color: component.color || '#000000', fontWeight: component.fontWeight || 'normal', lineHeight: component.lineHeight || '18px', fontFamily: component.fontFamily || 'Arial, sans-serif' }}
                      dangerouslySetInnerHTML={{ __html: item }}
                    />
                  )}
                </td>
              </tr>

              {/* Spacer row between items */}
              {index < (component.listItems?.length ?? 0) - 1 && (
                <tr key={`spacer-${index}`}>
                  <td
                    colSpan={2}
                    style={{ height: `${spacePx}px`, lineHeight: `${spacePx}px`, fontSize: '0px', backgroundColor: bg }}
                  />
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {/* Add Item button */}
      {canEdit && (
        <div className="flex justify-center mt-2">
          <button
            onClick={handleAddItem}
            className="px-2 py-1 text-sm border rounded-md border-dashed"
          >
            + Add item
          </button>
        </div>
      )}

      {/* HTML Editor Modal */}
      {htmlEditorIndex >= 0 && (
        <HtmlEditorModal
          isOpen={true}
          onClose={() => setHtmlEditorIndex(-1)}
          initialValue={component.listItems?.[htmlEditorIndex] ?? ''}
          onSave={(newHtml) => {
            handleUpdateItem(htmlEditorIndex, newHtml)
            setHtmlEditorIndex(-1)
          }}
        />
      )}
    </div>
  )
}

// memo prevents re-render when parent re-renders but this component's props haven't changed
export default memo(BulletList)
