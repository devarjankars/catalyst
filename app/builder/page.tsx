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
import { Eye, Code, ArrowLeft, Save, FileText, RotateCcw, Lock, LayoutTemplate } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
    optionMode,
    optionSubMode,
    activeOption,
    option2Components,
    option3Components,
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
    setActiveOption,
    getActiveComponents,
    ensureThreeOptions,
    markComponentsSaved,
    applyOptionConfiguration,
  } = useEmailBuilderStore();

  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [awaitingModeSelection, setAwaitingModeSelection] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const selectMode = searchParams.get("selectMode") === "true";
    const urlOptionMode = mode === "three" ? ("three" as const) : undefined;
    const urlOptionSubMode = searchParams.get("subMode") as
      | "header-only"
      | "completely-different"
      | null;

    if (selectMode && !isEdit) {
      setModeDialogOpen(true);
      setAwaitingModeSelection(true);
      if (!templateId) {
        markAsNewTemplate();
      }
    } else if (templateId) {
      loadTemplate(
        templateId,
        urlOptionMode
          ? {
              optionMode: urlOptionMode,
              optionSubMode: urlOptionSubMode || undefined,
            }
          : undefined,
      );
    } else {
      markAsNewTemplate();
    }

    const getCustomComponents = async () => {
      const customComponents = await firebaseService.getCustomComponents();
      loadCustomComponents(customComponents);
    };

    if (templateId && !(selectMode && !isEdit)) {
      loadTemplateImages(templateId);
    }

    getCustomComponents();
  }, [templateId, searchParams, isEdit]);

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

  const loadTemplate = async (
    id: string,
    optionOverrides?: {
      optionMode: "single" | "three";
      optionSubMode?: "header-only" | "completely-different";
    },
  ): Promise<void> => {
    setLoading(true);
    try {
      const template = await firebaseService.getTemplate(id);
      if (template) {
        const templateWithPlaceholders = isCopy
          ? {
              ...template,
              components: replaceImagesInComponents(template.components || []),
              option2Components: template.option2Components
                ? replaceImagesInComponents(template.option2Components)
                : undefined,
              option3Components: template.option3Components
                ? replaceImagesInComponents(template.option3Components)
                : undefined,
            }
          : template;

        if (isCopy) {
          startWorkingCopy(templateWithPlaceholders, optionOverrides);
        } else if (isEdit) {
          setCurrentTemplate(template);
          setOriginalTemplate(template);
          if (optionOverrides) {
            applyOptionConfiguration({
              mode: optionOverrides.optionMode,
              subMode: optionOverrides.optionSubMode,
            });
          }
        } else {
          startWorkingCopy(templateWithPlaceholders, optionOverrides);
        }

        if (!optionOverrides && (template.optionMode || "single") === "three") {
          ensureThreeOptions();
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

  const handleModeSelect = async (
    mode: "single" | "three",
    subMode?: "header-only" | "completely-different",
  ) => {
    const shouldLoadTemplateFirst = Boolean(templateId && awaitingModeSelection);
    setModeDialogOpen(false);
    setAwaitingModeSelection(false);

    const optionOverrides =
      mode === "three"
        ? {
            optionMode: "three" as const,
            optionSubMode: subMode || ("header-only" as const),
          }
        : { optionMode: "single" as const };

    if (shouldLoadTemplateFirst && templateId) {
      await loadTemplate(templateId, optionOverrides);
      await loadTemplateImages(templateId);
    } else {
      applyOptionConfiguration({ mode, subMode });
    }

    const params = new URLSearchParams(window.location.search);
    params.delete("selectMode");
    if (mode === "three") {
      params.set("mode", "three");
      if (subMode) {
        params.set("subMode", subMode);
      } else {
        params.delete("subMode");
      }
    } else {
      params.delete("mode");
      params.delete("subMode");
    }

    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);

    // Force save template after mode selection
    setSaveTemplateDialog(true);
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
          optionMode,
          optionSubMode,
          option2Components,
          option3Components,
          preheaderText,
          updatedAt: new Date(),
        }
      );

      if (updatedTemplate) {
        setCurrentTemplate(updatedTemplate);
        setOriginalTemplate(updatedTemplate);
        markComponentsSaved();
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
            name,
            description,
            category: category as any,
            components,
            optionMode,
            optionSubMode,
            option2Components,
            option3Components,
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
          optionMode,
          optionSubMode,
          option2Components,
          option3Components,
          preheaderText,
          isUserCreated: true,
        });
      }

      if (savedTemplate) {
        setCurrentTemplate(savedTemplate);
        setOriginalTemplate(savedTemplate);
        markComponentsSaved();
        setSavedTemplateId(savedTemplate.id);

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
      } else if (searchParams.get("createVsb") === "true") {
        // Auto-navigate to VSB if user chose "Create VSB" at the start
        const id = savedTemplate?.id;
        if (id) router.push(`/vsb/${id}`);
      }
      // Otherwise just stay in builder — no extra prompt
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


// Determine the currently active selected component and its parent
let activeSelectedId: string | null = selectedComponent;
let selectedComponentData: any = null;
let parentId: string | null = null;

if (activeSelectedId) {
  const activeComponentsArray = getActiveComponents();
  const found = findComponentWithParentById(activeComponentsArray, activeSelectedId);
  selectedComponentData = found?.component || null;
  parentId = found?.parentId || null;
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

  const isHeaderOnlyLocked =
    optionMode === "three" && optionSubMode === "header-only" && activeOption !== 1;

  const canSaveComponentChanges =
    currentTemplate && hasComponentChanges && !isWorkingCopy && !isNewTemplate;
  const needsTemplateSave = hasUnsavedTemplate || isWorkingCopy;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header - sticky */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20">
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
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              onClick={() => {
                const id = currentTemplate?.id || savedTemplateId;
                if (id) router.push(`/vsb/${id}`);
              }}
            >
              <LayoutTemplate className="w-4 h-4" />
              Create VSB
            </Button>

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
                disabled={isHeaderOnlyLocked}
                getSelectionInfo={() => {
                  return { components: getActiveComponents(), selectedComponent: activeSelectedId || selectedComponent }
                }}
                applyUpdates={(updates, parentId) => {
                  if (!activeSelectedId) return
                  updateComponent(activeSelectedId, updates, parentId)
                }}
              />
            </div>
          )}

          {/* Canvas */}
          <div className={`flex-1 overflow-auto bg-gray-100 ${optionMode === "three" ?" pt-0" : ""} p-8 flex flex-col items-center`} 
            onClick={(e)=>{
              e.stopPropagation()
              setSelectedComponent(null)
            }}>
            
            {optionMode === "three" && (
              <div className="mb-6 w-full max-w-[600px] space-y-3 sticky top-0 z-10 bg-gray-100 py-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-gray-700">Email Options</p>
                  <span className="text-xs text-gray-500 capitalize">
                    {optionSubMode === "header-only" ? "Header only different" : "Completely different"}
                  </span>
                </div>
                <Tabs value={`option-${activeOption}`} className="w-full" onValueChange={(val) => setActiveOption(parseInt(val.split('-')[1]) as 1|2|3)}>
                  <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-300 shadow-sm h-11 p-1">
                    <TabsTrigger value="option-1" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      Option 1
                      {activeOption === 1 && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </TabsTrigger>
                    <TabsTrigger value="option-2" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      Option 2
                      {activeOption === 2 && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </TabsTrigger>
                    <TabsTrigger value="option-3" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      Option 3
                      {activeOption === 3 && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {isHeaderOnlyLocked && (
                  <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <Lock className="h-4 w-4 shrink-0" />
                    Header-only mode: body is synced from Option 1. Only the header image can be edited here.
                  </div>
                )}
              </div>
            )}

            <div className="w-full flex justify-center">
              <EmailCanvas
                ref={canvasRef}
                components={getActiveComponents()}
                selectedComponent={selectedComponent}
                onSelectComponent={(id) => {
                  if (optionMode === "three" && optionSubMode === "header-only" && activeOption !== 1) {
                     // Check if it's a header-image component
                     const comp = findComponentWithParentById(getActiveComponents(), id || "");
                     if (comp && comp.component.type !== "header-image") {
                        return; // Block selection of non-header elements in Option 2/3 header-only mode
                     }
                  }
                  setSelectedComponent(id)
                }}
                onUpdateComponent={updateComponent}
                onDeleteComponent={deleteComponent}
                onMoveComponent={moveComponent}
                previewMode={previewMode}
                duplicateComponent={duplicateComponent}
                addComponent={addComponent}
                isLockedMode={isHeaderOnlyLocked}
              />
            </div>
          </div>

          {/* Right Panel: Properties */}
          {!previewMode && selectedComponent && (
            <div className="w-80 bg-white border-l p-4 overflow-y-auto">
              <h4 className="font-bold text-lg text-gray-700 mb-3">Properties</h4>
              <PropertiesPanel
                component={selectedComponentData}
                onUpdateComponent={(updates) => {
                  if (!activeSelectedId) return;
                  updateComponent(activeSelectedId, updates, parentId);
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


