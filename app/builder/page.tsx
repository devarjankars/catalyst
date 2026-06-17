"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EmailCanvas } from "@/components/email-canvas";
import { ComponentPalette } from "@/components/component-palette";
import { PropertiesPanel } from "@/components/properties-panel";
import { ExportPanel } from "@/components/export-panel";
import { SaveTemplateDialog } from "@/components/save-template-dialog";
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code, ArrowLeft, Save, FileText, RotateCcw } from "lucide-react";
import { useEmailBuilderStore } from "@/store/email-builder-store";
import { firebaseService } from "@/services/firebase-service";
import EmailPreviewModal from "@/components/email-previw-dalog";
import { EditorModeDialog } from "@/components/editor-mode-dialog";

export default function EmailBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const isCopy = searchParams.get("copy") === "true";
  const isEdit = searchParams.get("edit") === "true";

  const {
    currentTemplate,
    components,
    selectedComponent,
    previewMode,
    customComponents,
    hasComponentChanges,
    hasUnsavedTemplate,
    isNewTemplate,
    isWorkingCopy,
    workingCopySource,
    loading,
    saving,
    preheaderText,
    setCurrentTemplate,
    setOriginalTemplate,
    setComponents,
    setOriginalComponents,
    startWorkingCopy,
    addComponent,
    updateComponent,
    deleteComponent,
    moveComponent,
    duplicateComponent,
    setSelectedComponent,
    setPreviewMode,
    addCustomComponent,
    setLoading,
    setSaving,
    markAsNewTemplate,
    resetComponentChanges,
    loadCustomComponents,
    loadTemplateImages,
    clearAll,
  } = useEmailBuilderStore();

  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"single" | "three">("single");
  const canvasRef = useRef<HTMLDivElement>(null);
  const [openPreview, setOpenPreview] = useState(false);
  // When in three-canvas mode we maintain separate component lists per canvas
  const [threeCanvasComponents, setThreeCanvasComponents] = useState<EmailComponent[][] | null>(null);
  const [selectedPerCanvas, setSelectedPerCanvas] = useState<(string | null)[] | null>(null);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const selectMode = searchParams.get("selectMode") === "true";

    if (mode === "three") {
      setEditorMode("three");
    }

    if (selectMode && mode !== "three") {
      setModeDialogOpen(true);
    }

    if (templateId) {
      loadTemplate(templateId);
    } else {
      markAsNewTemplate();
    }

    const getCustomComponents = async () => {
      const customComponents = await firebaseService.getCustomComponents();
      loadCustomComponents(customComponents);
    };

    if (templateId) {
      loadTemplateImages(templateId);
    }

    getCustomComponents();
  }, [templateId, searchParams]);

  // Initialize three-canvas components when entering three mode
  useEffect(() => {
    if (editorMode === "three") {
      if (!threeCanvasComponents) {
        // initialize three canvases from current store components (deep clone to decouple)
        const base = components || [];
        const clone = (arr: EmailComponent[]) => JSON.parse(JSON.stringify(arr));
        setThreeCanvasComponents([clone(base), clone(base), clone(base)]);
        setSelectedPerCanvas([null, null, null]);
      }
    } else {
      // leaving three mode, clear local per-canvas state
      setThreeCanvasComponents(null);
      setSelectedPerCanvas(null);
    }
  }, [editorMode]);

  // console.log(selectedComponent, "selected component in builder");
  

  // Handle browser back button and navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasComponentChanges || hasUnsavedTemplate) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasComponentChanges, hasUnsavedTemplate]);

const PLACEHOLDER_IMAGE = "/placeholder.svg?";

function replaceImagesInComponents(components: any[]): any[] {
  return components.map((comp) => {
    const newComp = { ...comp };

    // Handle standard image components and others with src
    if (
      (newComp.type === "image" ||
        newComp.type === "header-image" ) &&
      newComp.src
    ) {
      newComp.src = PLACEHOLDER_IMAGE;
    }

    // Handle CTA button images
    if (newComp.type === "cta-button" && newComp.imageSrc) {
      newComp.imageSrc = PLACEHOLDER_IMAGE;
    }

    // Handle footer tokens user photo
    if (
      newComp.type === "footer-tokens" &&
      newComp.footerTokens?.userPhoto
    ) {
      newComp.footerTokens = {
        ...newComp.footerTokens,
        userPhoto: PLACEHOLDER_IMAGE,
      };
    }

    // Recursively handle children
    if (Array.isArray(newComp.children) && newComp.children.length > 0) {
      newComp.children = replaceImagesInComponents(newComp.children);
    }

    return newComp;
  });
}

  const loadTemplate = async (id: string) => {
    setLoading(true);
    try {
      const template = await firebaseService.getTemplate(id);
      if (template) {
        if (isCopy) {
          // Start working copy - doesn't save until user explicitly saves
          // Replace images with placeholders for copies
          const templateWithPlaceholders = {
            ...template,
            components: replaceImagesInComponents(template.components),
          };
          startWorkingCopy(templateWithPlaceholders);
        } else if (isEdit) {
          // Edit existing template
          setCurrentTemplate(template);
          setOriginalTemplate(template);
          setComponents(template.components);
          setOriginalComponents(template.components);
        } else {
          // View template (read-only or copy mode)
          startWorkingCopy(template);
        }
      }
    } catch (error) {
      console.error("Failed to load template:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    if (hasComponentChanges || hasUnsavedTemplate) {
      setPendingNavigation("/dashboard");
      setUnsavedDialog(true);
    } else {
      clearAll();
      router.push("/dashboard");
    }
  };

  const openModeDialog = () => {
    setModeDialogOpen(true);
  };

  const handleModeSelect = (mode: "single" | "three") => {
    setEditorMode(mode);
    setModeDialogOpen(false);

    const params = new URLSearchParams(window.location.search);
    params.delete("selectMode");
    if (mode === "three") {
      params.set("mode", "three");
    } else {
      params.delete("mode");
    }
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  // Helpers to operate on per-canvas component sets when in three mode
  const ensureThree = () => {
    if (!threeCanvasComponents) {
      const base = components || [];
      const clone = (arr: EmailComponent[]) => JSON.parse(JSON.stringify(arr));
      setThreeCanvasComponents([clone(base), clone(base), clone(base)]);
      setSelectedPerCanvas([null, null, null]);
    }
  };

  const updateInTree = (items: EmailComponent[], id: string, updates: Partial<EmailComponent>, parentId?: string | null): EmailComponent[] => {
    return items.map((comp) => {
      if (parentId && comp.id === parentId && Array.isArray(comp.children)) {
        return { ...comp, children: comp.children.map((child) => (child.id === id ? { ...child, ...updates } : child)) };
      }
      if (!parentId && comp.id === id) return { ...comp, ...updates };
      if (Array.isArray(comp.children)) return { ...comp, children: updateInTree(comp.children, id, updates, parentId) };
      return comp;
    });
  };

  const addComponentToCanvas = (canvasIndex: number, component: EmailComponent, index?: number) => {
    ensureThree();
    setThreeCanvasComponents((prev) => {
      if (!prev) return prev;
      const copy = prev.map((c) => JSON.parse(JSON.stringify(c)));
      const newComponent = { ...component, id: component.id || `${component.type}-${Date.now()}-${Math.random().toString(36).substr(2,9)}` };
      if (index !== undefined) copy[canvasIndex].splice(index, 0, newComponent);
      else copy[canvasIndex].push(newComponent);
      return copy;
    });
  };

  const updateComponentInCanvas = (canvasIndex: number, id: string, updates: Partial<EmailComponent>, parentId?: string | null) => {
    ensureThree();
    setThreeCanvasComponents((prev) => {
      if (!prev) return prev;
      const copy = prev.map((c) => JSON.parse(JSON.stringify(c)));
      copy[canvasIndex] = updateInTree(copy[canvasIndex], id, updates, parentId);
      return copy;
    });
  };

  const deleteComponentInCanvas = (canvasIndex: number, id: string) => {
    ensureThree();
    const deleteById = (items: EmailComponent[], targetId: string): EmailComponent[] => {
      return items
        .map((comp) => {
          if (comp.id === targetId) return null as any;
          if (Array.isArray(comp.children)) return { ...comp, children: deleteById(comp.children, targetId) };
          return comp;
        })
        .filter(Boolean) as EmailComponent[];
    };
    setThreeCanvasComponents((prev) => {
      if (!prev) return prev;
      const copy = prev.map((c) => JSON.parse(JSON.stringify(c)));
      copy[canvasIndex] = deleteById(copy[canvasIndex], id);
      return copy;
    });
  };

  const moveWithinCanvas = (canvasIndex: number, dragIndex: number, hoverIndex: number) => {
    ensureThree();
    setThreeCanvasComponents((prev) => {
      if (!prev) return prev;
      const copy = prev.map((c) => JSON.parse(JSON.stringify(c)));
      const arr = copy[canvasIndex];
      const item = arr[dragIndex];
      arr.splice(dragIndex, 1);
      arr.splice(hoverIndex, 0, item);
      copy[canvasIndex] = arr;
      return copy;
    });
  };

  const duplicateInCanvas = (canvasIndex: number, id: string) => {
    ensureThree();
    setThreeCanvasComponents((prev) => {
      if (!prev) return prev;
      const copy = prev.map((c) => JSON.parse(JSON.stringify(c)));
      const idx = copy[canvasIndex].findIndex((comp) => comp.id === id);
      if (idx === -1) return copy;
      const dup = JSON.parse(JSON.stringify(copy[canvasIndex][idx]));
      dup.id = `${dup.type}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
      copy[canvasIndex].splice(idx + 1, 0, dup);
      return copy;
    });
  };

  const handleUnsavedChangesAction = async (
    action: "save" | "discard" | "cancel"
  ) => {
    if (action === "cancel") {
      setUnsavedDialog(false);
      setPendingNavigation(null);
      return;
    }

    if (action === "save") {
      if (hasUnsavedTemplate || isWorkingCopy) {
        // Need to save as template first
        setUnsavedDialog(false);
        setSaveTemplateDialog(true);
        return;
      }

      if (hasComponentChanges && currentTemplate) {
        // Save component changes to existing template
        await handleSaveComponentChanges();
      }
    }

    // Navigate after saving or discarding
    if (pendingNavigation) {
      clearAll();
      router.push(pendingNavigation);
    }
    setUnsavedDialog(false);
    setPendingNavigation(null);
  };

  const handleSaveComponentChanges = async () => {
    if (!currentTemplate) return;

    setSaving(true);
    try {
      const updatedTemplate = await firebaseService.updateTemplate(
        currentTemplate.id,
        {
          components,
          preheaderText,
          updatedAt: new Date(),
        }
      );

      if (updatedTemplate) {
        // Update store with saved state
        setCurrentTemplate(updatedTemplate);
        setOriginalTemplate(updatedTemplate);
        setOriginalComponents(components);
      }
    } catch (error) {
      console.error("Failed to save component changes:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async (
    name: string,
    description: string,
    category: string
  ) => {
    setSaving(true);
    try {
      let savedTemplate;
 
      if (isEdit && currentTemplate) {
        // Update existing template metadata and components
        savedTemplate = await firebaseService.updateTemplate(
          currentTemplate.id,
          {
            category: category as any,
            components,
            preheaderText,
          }
        );
      } else {
        // Create new template (from working copy or new template)
        savedTemplate = await firebaseService.createTemplate({
          name,
          description,
          category: category as any,
          components,
          preheaderText,
          isUserCreated: true,
        });
      }

      if (savedTemplate) {
        setCurrentTemplate(savedTemplate);
        setOriginalTemplate(savedTemplate);
        setOriginalComponents(components);

        // Update URL to reflect saved template
        const newUrl = `/builder?template=${savedTemplate.id}&edit=true`;
        window.history.replaceState({}, "", newUrl);
      }

      setSaveTemplateDialog(false);

      // If there was pending navigation after save, execute it
      if (pendingNavigation) {
        clearAll();
        router.push(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveAsCustomComponent = (component: any) => {
    const customComponent = {
      ...component,
      id: `custom-${Date.now()}`,
      isCustom: true,
      name: `Custom ${component.type}`,
    };
    addCustomComponent(customComponent);
  };

  function findComponentWithParentById(
  components: any[],
  targetId: string,
  parentId: string | null = null
): { component: any; parentId: string | null } | null {
  for (const comp of components) {
    if (!comp) continue; // Defensive check
    if (comp.id === targetId) {
      return { component: comp, parentId };
    }

    if (Array.isArray(comp.children)) {
      const found = findComponentWithParentById(comp.children, targetId, comp.id);
      if (found) return found;
    }
  }

  return null;
}


// Determine the currently active selected component and its parent (supports three-canvas mode)
let activeSelectedId: string | null = selectedComponent;
let selectedComponentData: any = null;
let parentId: string | null = null;
let activeCanvasIndex: number | null = null;

if (editorMode === "three" && selectedPerCanvas) {
  // prefer first non-null selection among canvases
  for (let i = 0; i < selectedPerCanvas.length; i++) {
    if (selectedPerCanvas[i]) {
      activeSelectedId = selectedPerCanvas[i];
      activeCanvasIndex = i;
      break;
    }
  }
}

if (activeSelectedId) {
  if (editorMode === "three" && threeCanvasComponents && activeCanvasIndex !== null) {
    const found = findComponentWithParentById(threeCanvasComponents[activeCanvasIndex], activeSelectedId);
    selectedComponentData = found?.component || null;
    parentId = found?.parentId || null;
  } else {
    const found = findComponentWithParentById(components, activeSelectedId);
    selectedComponentData = found?.component || null;
    parentId = found?.parentId || null;
  }
} else {
  selectedComponentData = null;
  parentId = null;
}


  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Loading template..." />
      </div>
    );
  }

  const getHeaderTitle = () => {
    if (isWorkingCopy && workingCopySource) {
      return `${workingCopySource.name} (Working Copy)`;
    }
    if (currentTemplate) return currentTemplate.name;
    return "Untitled Template";
  };

  const getHeaderSubtitle = () => {
    if (isWorkingCopy)
      return "Working on a copy - save to create your template";
    if (isEdit && currentTemplate) return "Editing existing template";
    if (isNewTemplate) return "Creating new template";
    return "Template builder";
  };

  const canSaveComponentChanges =
    currentTemplate && hasComponentChanges && !isWorkingCopy && !isNewTemplate;
  const needsTemplateSave = hasUnsavedTemplate || isWorkingCopy;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="border-l pl-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {getHeaderTitle()}
                </h1>
                {hasComponentChanges && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    Component Changes
                  </span>
                )}
                {hasUnsavedTemplate && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Unsaved Template
                  </span>
                )}
                {isWorkingCopy && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Working Copy
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{getHeaderSubtitle()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {canSaveComponentChanges && (
              <Button
                variant="outline"
                onClick={handleSaveComponentChanges}
                disabled={saving}
                className="flex items-center gap-2 bg-transparent"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}

            {hasComponentChanges && !isWorkingCopy && (
              <Button
                variant="outline"
                onClick={resetComponentChanges}
                className="flex items-center gap-2 bg-transparent"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Changes
              </Button>
            )}

            <Button
              variant={needsTemplateSave ? "default" : "outline"}
              onClick={() => setSaveTemplateDialog(true)}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {currentTemplate && !isNewTemplate && !isWorkingCopy
                ? "Update Email"
                : "Save Email"}
            </Button>

            <Button
              variant={previewMode ? "default" : "outline"}
              // onClick={() => setPreviewMode(!previewMode)}
              onClick={() => setOpenPreview(true)}
              className="flex items-center gap-2"
            >
             
                <Eye className="w-4 h-4" />
             
               Preview
            </Button>

            <ExportPanel components={components} canvasRef={canvasRef} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          

          {/* components panel */}
          {!previewMode && (
            <div className="w-80 bg-white border-r flex flex-col p-4 overflow-y-auto">
              <h4 className="font-bold text-lg text-gray-700 mb-3">
                Components
              </h4>
              <ComponentPalette
                onAddComponent={addComponent}
                customComponents={customComponents}
                getSelectionInfo={() => {
                  if (editorMode === "three" && threeCanvasComponents && activeCanvasIndex !== null) {
                    return { components: threeCanvasComponents[activeCanvasIndex], selectedComponent: activeSelectedId }
                  }
                  return { components, selectedComponent: activeSelectedId || selectedComponent }
                }}
                applyUpdates={(updates, parentId) => {
                  if (!activeSelectedId) return
                  if (editorMode === "three" && activeCanvasIndex !== null) {
                    updateComponentInCanvas(activeCanvasIndex, activeSelectedId, updates, parentId)
                  } else {
                    updateComponent(activeSelectedId, updates, parentId)
                  }
                }}
              />
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8" 
            onClick={(e)=>{
              e.stopPropagation()
              setSelectedComponent(null)
            }}>
            {editorMode === "single" ? (
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
            ) : (
              <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-1 xl:auto-rows-fr">
                {[1, 2, 3].map((index) => {
                  const canvasIdx = index - 1;
                  const canvasComponents = editorMode === "three" && threeCanvasComponents ? threeCanvasComponents[canvasIdx] : components;
                  const canvasSelected = editorMode === "three" && selectedPerCanvas ? selectedPerCanvas[canvasIdx] : selectedComponent;

                  const handleSelectForCanvas = (id: string | null) => {
                    if (editorMode === "three") {
                      setSelectedPerCanvas((prev) => {
                        if (!prev) return [id, id, id];
                        const copy = [...prev];
                        copy[canvasIdx] = id;
                        return copy;
                      });
                      // also update global store selection for compatibility
                      setSelectedComponent(id);
                    } else {
                      setSelectedComponent(id);
                    }
                  };

                  const handleUpdateForCanvas = (id: string, updates: Partial<EmailComponent>, parentId?: string | null) => {
                    if (editorMode === "three") updateComponentInCanvas(canvasIdx, id, updates, parentId);
                    else updateComponent(id, updates, parentId);
                  };

                  const handleDeleteForCanvas = (id: string) => {
                    if (editorMode === "three") deleteComponentInCanvas(canvasIdx, id);
                    else deleteComponent(id);
                  };

                  const handleMoveForCanvas = (dragIndex: number, hoverIndex: number) => {
                    if (editorMode === "three") moveWithinCanvas(canvasIdx, dragIndex, hoverIndex);
                    else moveComponent(dragIndex, hoverIndex);
                  };

                  const handleDuplicateForCanvas = (id: string) => {
                    if (editorMode === "three") duplicateInCanvas(canvasIdx, id);
                    else duplicateComponent(id);
                  };

                  const handleAddForCanvas = (component: EmailComponent, idx?: number) => {
                    if (editorMode === "three") addComponentToCanvas(canvasIdx, component, idx);
                    else addComponent(component, idx);
                  };

                  return (
                    <div key={index} className="bg-white rounded-2xl shadow relative overflow-hidden">
                      <div className="border-b px-4 py-3 text-sm font-semibold text-slate-900">
                        Canvas {index}
                      </div>
                      <EmailCanvas
                        ref={index === 1 ? canvasRef : null}
                        components={canvasComponents}
                        selectedComponent={canvasSelected}
                        onSelectComponent={handleSelectForCanvas}
                        onUpdateComponent={handleUpdateForCanvas}
                        onDeleteComponent={handleDeleteForCanvas}
                        onMoveComponent={handleMoveForCanvas}
                        previewMode={previewMode}
                        duplicateComponent={handleDuplicateForCanvas}
                        addComponent={handleAddForCanvas}
                        canvasWidth={480}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Properties */}
          {!previewMode && selectedComponent && (
            <div className="w-80 bg-white border-l p-4 overflow-y-auto">
              <h4 className="font-bold text-lg text-gray-700 mb-3">Properties</h4>
              <PropertiesPanel
                component={selectedComponentData}
                onUpdateComponent={(updates) => {
                  if (!activeSelectedId) return;
                  if (editorMode === "three" && activeCanvasIndex !== null) {
                    updateComponentInCanvas(activeCanvasIndex, activeSelectedId, updates, parentId);
                  } else {
                    updateComponent(activeSelectedId, updates, parentId);
                  }
                }}
                onSaveAsCustom={() =>
                  selectedComponentData && saveAsCustomComponent(selectedComponentData)
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={saveTemplateDialog}
        onClose={() => setSaveTemplateDialog(false)}
        onSave={handleSaveTemplate}
        initialName={currentTemplate?.name || workingCopySource?.name || ""}
        initialDescription={
          currentTemplate?.description || workingCopySource?.description || ""
        }
        initialCategory={
          currentTemplate?.category || workingCopySource?.category || "other"
        }
        isEditing={isEdit && !!currentTemplate}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={unsavedDialog}
        onAction={handleUnsavedChangesAction}
        templateName={
          currentTemplate?.name ||
          workingCopySource?.name ||
          "Untitled Template"
        }
        hasComponentChanges={hasComponentChanges}
        hasUnsavedTemplate={hasUnsavedTemplate}
      />

      <EditorModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onSelectMode={handleModeSelect}
      />

      {/* Email Preview Modal */}
      <EmailPreviewModal components={components} open={openPreview} onOpenChange={setOpenPreview} />
    </DndProvider>
  );
}
