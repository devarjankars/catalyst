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
    clearAll,
  } = useEmailBuilderStore();

  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
      
    } else {
      markAsNewTemplate();
    }
    
    // Load custom components from store
    const getCustomComponents = async () => {
      const customComponents = await firebaseService.getCustomComponents()
       loadCustomComponents(customComponents)
    }

    getCustomComponents();


  }, [templateId]);

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

  const loadTemplate = async (id: string) => {
    setLoading(true);
    try {
      const template = await firebaseService.getTemplate(id);
      if (template) {
        if (isCopy) {
          // Start working copy - doesn't save until user explicitly saves
          startWorkingCopy(template);
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
            name,
            description,
            category,
            components,
          }
        );
      } else {
        // Create new template (from working copy or new template)
        savedTemplate = await firebaseService.createTemplate({
          name,
          description,
          category,
          components,
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


const result = findComponentWithParentById(components, selectedComponent);
const selectedComponentData = result?.component || null;
const parentId = result?.parentId || null;


  

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
                ? "Update Template"
                : "Save Template"}
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
              />
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8" 
            onClick={(e)=>{
              e.stopPropagation()
              setSelectedComponent(null)
            }}>
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

          {/* Right Panel: Properties */}
          {!previewMode && selectedComponent && (
            <div className="w-80 bg-white border-l p-4 overflow-y-auto">
              <h4 className="font-bold text-lg text-gray-700 mb-3">Properties</h4>
              <PropertiesPanel
                component={selectedComponentData}
                onUpdateComponent={(updates) =>
                  selectedComponent && updateComponent(selectedComponent, updates,parentId)
                }
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


      {/* Email Preview Modal */}
      <EmailPreviewModal components={components} open={openPreview} onOpenChange={setOpenPreview} />
    </DndProvider>
  );
}
