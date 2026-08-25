"use client"

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmailCanvas } from "@/components/email-canvas";
import { ComponentPalette } from "@/components/component-palette";
import { PropertiesPanel } from "@/components/properties-panel";
import { ExportPanel } from "@/components/export-panel";
import { SaveTemplateDialog } from "@/components/save-template-dialog";
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Eye, ArrowLeft, Save, FileText, RotateCcw, Lock, LayoutTemplate, Undo2, Redo2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useEmailBuilderStore } from "@/store/email-builder-store";
import { firebaseService } from "@/services/firebase-service";
import EmailPreviewModal from "@/components/email-previw-dalog";
import { EditorModeDialog } from "@/components/editor-mode-dialog";
import { toast } from "sonner";

export default function EmailBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const isCopy = searchParams.get("copy") === "true";
  const isEdit = searchParams.get("edit") === "true";
  const keepImages = searchParams.get("keepImages") === "true";
  const urlTemplateName = searchParams.get("name") || "";
  // Brand selected on the landing page — defaults to "orserdu" if not set
  const selectedBrand = (searchParams.get("brand") || "orserdu") as
    | "orserdu"
    | "ferring"
    | "idorsia"
    | "elzonris";

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
    undo,
    redo,
    past,
    future,
  } = useEmailBuilderStore();

  const addComponentToOption = useEmailBuilderStore((s) => s.addComponentToOption);

  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [awaitingModeSelection, setAwaitingModeSelection] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const [copyToDialogOpen, setCopyToDialogOpen] = useState(false);
  const [copyToTargets, setCopyToTargets] = useState<(1 | 2 | 3)[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [openPreview, setOpenPreview] = useState(false);

  // Run the builder initialization only ONCE per mount. The URL is rewritten
  // after mode selection (history.replaceState), which changes `searchParams`
  // and would otherwise re-run this effect and reset the chosen option mode.
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

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

  // Global undo/redo shortcuts (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

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
        const templateWithPlaceholders = isCopy && !keepImages
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
      } else if (optionOverrides) {
        // Template could not be loaded — still apply the chosen configuration
        // so the editor doesn't get stuck in the wrong mode.
        applyOptionConfiguration({
          mode: optionOverrides.optionMode,
          subMode: optionOverrides.optionSubMode,
        });
      }
    } catch (error) {
      console.error("Failed to load template:", error);
      if (optionOverrides) {
        // Even on failure, apply the chosen configuration so the editor
        // doesn't get stuck in the wrong mode (e.g. tabs never appearing).
        applyOptionConfiguration({
          mode: optionOverrides.optionMode,
          subMode: optionOverrides.optionSubMode,
        });
      }
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
    category: string,
    brand: "orserdu" | "ferring" | "idorsia" | "elzonris"
  ) => {
    setSaving(true);
    try {
      let savedTemplate;
 
      if (isEdit && currentTemplate) {
        savedTemplate = await firebaseService.updateTemplate(
          currentTemplate.id,
          {
            name,
            description,
            category: category as any,
            brand,
            components,
            optionMode,
            optionSubMode,
            option2Components,
            option3Components,
            preheaderText,
          }
        );
      } else {
        savedTemplate = await firebaseService.createTemplate({
          name,
          description,
          category: category as any,
          brand,
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

  const saveAsCustomComponent = async (name?: string) => {
    if (!selectedComponentData) return;
    const customComponent = {
      ...selectedComponentData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      isCustom: true,
      name: name || selectedComponentData.name || `Custom ${selectedComponentData.type}`,
    };
    const saved = await addCustomComponent(customComponent);
    if (saved) {
      toast.success("Block saved to Saved Blocks");
    } else {
      toast.error("Failed to save block. Please try again.");
    }
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
    <>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header - sticky */}
        <div className="bg-white border-b border-gray-200 shadow-sm px-5 py-0 flex items-center justify-between sticky top-0 z-30 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Button>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-900 max-w-[260px] truncate">
                {getHeaderTitle()}
              </h1>
              {hasComponentChanges && (
                <span className="text-[11px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
                  Unsaved changes
                </span>
              )}
              {hasUnsavedTemplate && !hasComponentChanges && (
                <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                  Draft
                </span>
              )}
              {isWorkingCopy && (
                <span className="text-[11px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                  Working copy
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => undo()}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 rounded-full h-8 px-3 text-xs disabled:opacity-40"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => redo()}
              disabled={future.length === 0}
              title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 rounded-full h-8 px-3 text-xs disabled:opacity-40"
            >
              <Redo2 className="w-3.5 h-3.5" />
              Redo
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-gray-600 rounded-full h-8 px-3 text-xs"
              onClick={() => {
                const id = currentTemplate?.id || savedTemplateId;
                if (id) router.push(`/vsb/${id}`);
              }}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Create VSB
            </Button>

            {hasComponentChanges && !isWorkingCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetComponentChanges}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 rounded-full h-8 px-3 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            )}

            {canSaveComponentChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveComponentChanges}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs border-gray-300"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save changes
                  </>
                )}
              </Button>
            )}

            <Button
              size="sm"
              variant={needsTemplateSave ? "default" : "outline"}
              onClick={() => setSaveTemplateDialog(true)}
              className={`flex items-center gap-1.5 rounded-full h-8 px-3 text-xs ${needsTemplateSave ? "bg-[#BC2030] hover:bg-[#a01c29] text-white border-0" : "border-gray-300"}`}
            >
              <FileText className="w-3.5 h-3.5" />
              {currentTemplate && !isNewTemplate && !isWorkingCopy ? "Update email" : "Save email"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenPreview(true)}
              className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs border-gray-300"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </Button>

            <ExportPanel components={components} canvasRef={canvasRef} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">

          {/* Components panel */}
          {!previewMode && (
            <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Components</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <ComponentPalette
                  onAddComponent={addComponent}
                  customComponents={customComponents}
                  disabled={isHeaderOnlyLocked}
                  selectedBrand={selectedBrand}
                  getSelectionInfo={() => {
                    return { components: getActiveComponents(), selectedComponent: activeSelectedId || selectedComponent }
                  }}
                  applyUpdates={(updates, parentId) => {
                    if (!activeSelectedId) return
                    updateComponent(activeSelectedId, updates, parentId)
                  }}
                />
              </div>
            </div>
          )}

          {/* Canvas */}
          <div
            className={`flex-1 overflow-auto bg-[#f0f2f5] ${optionMode === "three" ? "pt-0" : ""} p-8 flex flex-col items-center`}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedComponent(null)
            }}>

            {optionMode === "three" && (
              <div className="mb-5 w-full max-w-[600px] sticky top-0 z-20 pt-4 pb-3 bg-[#f0f2f5]">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Tab row */}
                  <div className="flex border-b border-gray-100">
                    {([1, 2, 3] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setActiveOption(opt)}
                        className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                          activeOption === opt
                            ? "text-[#BC2030] bg-red-50"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                        }`}
                      >
                        Option {opt}
                        {activeOption === opt && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#BC2030] rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Info row */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                      {optionSubMode === "header-only" ? "Header only different" : "Completely different"}
                    </span>
                  </div>
                  {isHeaderOnlyLocked && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      Body synced from Option 1 — only the header image can be edited here.
                    </div>
                  )}
                </div>
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
                showCopyToOption={
                  optionMode === "three" && optionSubMode === "completely-different" && !!selectedComponent
                }
                onCopyToOptions={
                  optionMode === "three" && optionSubMode === "completely-different" && selectedComponent
                    ? () => {
                        setCopyToTargets([]);
                        setCopyToDialogOpen(true);
                      }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Right Panel: Properties */}
          {!previewMode && selectedComponent && (
            <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Properties</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <PropertiesPanel
                  component={selectedComponentData}
                  onUpdateComponent={(updates) => {
                    if (!activeSelectedId) return;
                    updateComponent(activeSelectedId, updates, parentId);
                  }}
                  onSaveAsCustom={(name) => saveAsCustomComponent(name)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={saveTemplateDialog}
        onClose={() => setSaveTemplateDialog(false)}
        onSave={handleSaveTemplate}
        initialName={
          isWorkingCopy && urlTemplateName
            ? `${urlTemplateName} (Copy)`
            : currentTemplate?.name || workingCopySource?.name || ""
        }
        initialDescription={
          currentTemplate?.description || workingCopySource?.description || ""
        }
        initialCategory={
          currentTemplate?.category || workingCopySource?.category || "other"
        }
        initialBrand={
          (currentTemplate?.brand || workingCopySource?.brand || selectedBrand) as any
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

      {/* Copy Component To Dialog */}
      <Dialog open={copyToDialogOpen} onOpenChange={setCopyToDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Copy selected component to…</DialogTitle>
            <DialogDescription>
              Select which option(s) should receive a copy of the selected component ({selectedComponentData?.type || "component"}).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {([1, 2, 3] as const).filter((o) => o !== activeOption).map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer rounded-md border p-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  checked={copyToTargets.includes(opt)}
                  onChange={(e) =>
                    setCopyToTargets((prev) =>
                      e.target.checked ? [...prev, opt] : prev.filter((t) => t !== opt)
                    )
                  }
                />
                <span className="text-sm font-medium text-gray-800">Option {opt}</span>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCopyToDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={copyToTargets.length === 0}
              onClick={() => {
                if (!selectedComponentData) return;
                // Copy to the SAME position in the target option(s)
                const sourceIndex = getActiveComponents().findIndex((c) => c.id === activeSelectedId);
                const insertIndex = sourceIndex >= 0 ? sourceIndex : undefined;
                copyToTargets.forEach((opt) => {
                  addComponentToOption(selectedComponentData, opt, insertIndex);
                });
                setCopyToDialogOpen(false);
                setCopyToTargets([]);
                toast.success(
                  `Component copied to Option${copyToTargets.length > 1 ? "s" : ""} ${copyToTargets.join(" & ")}`
                );
              }}
            >
              Apply Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


