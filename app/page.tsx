"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { EmailCanvas } from "@/components/email-canvas"
import { ComponentPalette } from "@/components/component-palette"
import { PropertiesPanel } from "@/components/properties-panel"
import { ExportPanel } from "@/components/export-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Code } from "lucide-react"
import type { EmailComponent } from "@/types/email-builder"

export default function EmailBuilder() {
  const router = useRouter()
  const [components, setComponents] = useState<EmailComponent[]>([])
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [customComponents, setCustomComponents] = useState<EmailComponent[]>([])

  useEffect(() => {
    // Redirect to dashboard on app load
    router.push("/dashboard")
  }, [router])

  const addComponent = (component: EmailComponent, index?: number) => {
    const newComponent = { ...component, id: Date.now().toString() }
    setComponents((prev) => {
      if (index !== undefined) {
        const newComponents = [...prev]
        newComponents.splice(index, 0, newComponent)
        return newComponents
      }
      return [...prev, newComponent]
    })
  }

  const duplicateComponent = (componentId: string) => {
    const componentToDuplicate = components.find((comp) => comp.id === componentId)
    if (!componentToDuplicate) return

    const duplicatedComponent = {
      ...componentToDuplicate,
      id: `${componentToDuplicate.id}-copy-${Date.now()}`,
      // Deep clone children if it's a section
      children: componentToDuplicate.children?.map((child) => ({
        ...child,
        id: `${child.id}-copy-${Date.now()}`,
      })),
    }

    const componentIndex = components.findIndex((comp) => comp.id === componentId)
    setComponents((prev) => {
      const newComponents = [...prev]
      newComponents.splice(componentIndex + 1, 0, duplicatedComponent)
      return newComponents
    })
  }

  const saveAsCustomComponent = (component: EmailComponent) => {
    const customComponent = {
      ...component,
      id: `custom-${Date.now()}`,
      isCustom: true,
      name: `Custom ${component.type}`,
    }
    setCustomComponents((prev) => [...prev, customComponent])
  }

  const updateComponent = (id: string, updates: Partial<EmailComponent>) => {
    setComponents((prev) => prev.map((comp) => (comp.id === id ? { ...comp, ...updates } : comp)))
  }

  const deleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== id))
    if (selectedComponent === id) {
      setSelectedComponent(null)
    }
  }

  const moveComponent = (dragIndex: number, hoverIndex: number) => {
    setComponents((prev) => {
      const newComponents = [...prev]
      const draggedComponent = newComponents[dragIndex]
      newComponents.splice(dragIndex, 1)
      newComponents.splice(hoverIndex, 0, draggedComponent)
      return newComponents
    })
  }

  const selectedComponentData = components.find((comp) => comp.id === selectedComponent)

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Email Builder</h1>
          <div className="flex items-center gap-4">
            <Button
              variant={previewMode ? "default" : "outline"}
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2"
            >
              {previewMode ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <ExportPanel components={components} canvasRef={canvasRef} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {!previewMode && (
            <div className="w-80 bg-white border-r flex flex-col">
              <Tabs defaultValue="components" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 m-4">
                  <TabsTrigger value="components">Components</TabsTrigger>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                </TabsList>
                <TabsContent value="components" className="flex-1 p-4 pt-0">
                  <ComponentPalette onAddComponent={addComponent} customComponents={customComponents} />
                </TabsContent>
                <TabsContent value="properties" className="flex-1 p-4 pt-0">
                  <PropertiesPanel
                    component={selectedComponentData}
                    onUpdateComponent={(updates) => selectedComponent && updateComponent(selectedComponent, updates)}
                    onSaveAsCustom={() => selectedComponentData && saveAsCustomComponent(selectedComponentData)}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8">
            <EmailCanvas
              ref={canvasRef}
              components={components}
              selectedComponent={selectedComponent}
              onSelectComponent={setSelectedComponent}
              onUpdateComponent={updateComponent}
              onDeleteComponent={deleteComponent}
              onMoveComponent={moveComponent}
              previewMode={previewMode}
              duplicateComponent={duplicateComponent}
              addComponent={addComponent}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  )
}
