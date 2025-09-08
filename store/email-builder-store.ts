import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { EmailComponent } from "@/types/email-builder"
import type { EmailTemplate } from "@/types/template"
import { firebaseService } from "@/services/firebase-service"

function deleteByIdRecursive(components: any[], targetId: string): any[] {
  return components
    .filter(comp => comp.id !== targetId) // remove if it's the target itself
    .map(comp => {
      if (Array.isArray(comp.children) && comp.children.length > 0) {
        return {
          ...comp,
          children: deleteByIdRecursive(comp.children, targetId), // recurse into children
        };
      }
      return comp;
    });
}

interface EmailBuilderState {
  // Template data
  currentTemplate: EmailTemplate | null
  originalTemplate: EmailTemplate | null
  components: EmailComponent[]
  originalComponents: EmailComponent[]

  // Working copy state (for template copies that aren't saved yet)
  isWorkingCopy: boolean
  workingCopySource: EmailTemplate | null

  // UI state
  selectedComponent: string | null
  previewMode: boolean
  customComponents: EmailComponent[]

  // Change tracking - separate component changes from template saving
  hasComponentChanges: boolean // Changes to components (add/edit/delete/move)
  hasUnsavedTemplate: boolean // Template not saved yet (new or copy)
  isNewTemplate: boolean

  // Loading states
  loading: boolean
  saving: boolean

  // Actions
  setCurrentTemplate: (template: EmailTemplate | null) => void
  setOriginalTemplate: (template: EmailTemplate | null) => void
  setComponents: (components: EmailComponent[]) => void
  setOriginalComponents: (components: EmailComponent[]) => void

  // Working copy actions
  startWorkingCopy: (sourceTemplate: EmailTemplate) => void
  saveWorkingCopyAsTemplate: (
    templateData: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt" | "components">,
  ) => void

  // Component actions
  addComponent: (component: EmailComponent, index?: number) => void
  updateComponent: (id: string, updates: Partial<EmailComponent>,parentId : string | null) => void
  deleteComponent: (id: string) => void
  moveComponent: (dragIndex: number, hoverIndex: number) => void
  duplicateComponent: (id: string) => void

  // UI actions
  setSelectedComponent: (id: string | null) => void
  setPreviewMode: (preview: boolean) => void
  addCustomComponent: (component: EmailComponent) => void
  loadCustomComponents: (components: EmailComponent[]) => void
  deleteCustomComponent: (id: string) => void

  // State management
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  markAsNewTemplate: () => void
  resetComponentChanges: () => void
  clearAll: () => void

  // Change detection
  checkForChanges: () => void
}

export const useEmailBuilderStore = create<EmailBuilderState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentTemplate: null,
        originalTemplate: null,
        components: [],
        originalComponents: [],
        isWorkingCopy: false,
        workingCopySource: null,
        selectedComponent: null,
        previewMode: false,
        customComponents: [],
        hasComponentChanges: false,
        hasUnsavedTemplate: false,
        isNewTemplate: false,
        loading: false,
        saving: false,

        // Template actions
        setCurrentTemplate: (template) => {
          set({
            currentTemplate: template,
            isWorkingCopy: false,
            workingCopySource: null,
            hasUnsavedTemplate: false,
            isNewTemplate: false,
          })
          get().checkForChanges()
        },

        setOriginalTemplate: (template) => {
          set({ originalTemplate: template })
          get().checkForChanges()
        },

        setComponents: (components) => {
          set({ components })
          get().checkForChanges()
        },

        setOriginalComponents: (components) => {
          set({ originalComponents: components })
          get().checkForChanges()
        },

        // Working copy actions
        startWorkingCopy: (sourceTemplate) => {
          set({
            isWorkingCopy: true,
            workingCopySource: sourceTemplate,
            currentTemplate: null,
            originalTemplate: null,
            components: get().deepCloneComponents(sourceTemplate.components),
            originalComponents: [], // Empty for working copy
            hasUnsavedTemplate: true,
            hasComponentChanges: false,
            isNewTemplate: false,
          })
        },

        saveWorkingCopyAsTemplate: (templateData) => {
          const { components, workingCopySource } = get()
          const newTemplate: EmailTemplate = {
            ...templateData,
            id: Date.now().toString(),
            components,
            createdAt: new Date(),
            updatedAt: new Date(),
            isUserCreated: true,
          }

          set({
            currentTemplate: newTemplate,
            originalTemplate: newTemplate,
            originalComponents: [...components],
            isWorkingCopy: false,
            workingCopySource: null,
            hasUnsavedTemplate: false,
            hasComponentChanges: false,
          })
        },

        // Component actions
        addComponent: (component, index) => {
          const { components } = get()
          const newComponent = {
            ...component,
            id: `${component.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }

          let newComponents
          if (index !== undefined) {
            newComponents = [...components]
            newComponents.splice(index, 0, newComponent)
          } else {
            newComponents = [...components, newComponent]
          }

          set({ components: newComponents })
          get().checkForChanges()
        },

        updateComponent: (id, updates, parentId = null) => {
          console.log("Updating component:", id,"under parentId:", parentId);
          
        const { components } = get();

        // Recursive function to update component
          const updateInTree = (items) => {
            return items.map((comp) => {
              // If parentId is given, look only inside that component's children
              if (comp.id === parentId && Array.isArray(comp.children)) {
                console.log("Updating child component:", id, "inside parent:", parentId);
                const updatedChildren = comp.children.map((child) =>
                  child.id === id ? { ...child, ...updates } : child
                );
                return { ...comp, children: updatedChildren };
              }

              // If no parentId, update top-level component
              if (!parentId && comp.id === id) {
                return { ...comp, ...updates };
              }

              // Recurse deeper if children exist
              if (Array.isArray(comp.children)) {
                return { ...comp, children: updateInTree(comp.children) };
              }

              return comp;
            });
          };

          const newComponents = updateInTree(components);
          set({ components: newComponents });
          get().checkForChanges();
        },

        deleteComponent: (id) => {
          const { components, selectedComponent } = get();

          const newComponents = deleteByIdRecursive(components, id);

          set({
            components: newComponents,
            selectedComponent: selectedComponent === id ? null : selectedComponent,
          });

          get().checkForChanges();
        },

        moveComponent: (dragIndex, hoverIndex) => {
          const { components } = get()
          const newComponents = [...components]
          const draggedComponent = newComponents[dragIndex]
          newComponents.splice(dragIndex, 1)
          newComponents.splice(hoverIndex, 0, draggedComponent)
          set({ components: newComponents })
          get().checkForChanges()
        },

        duplicateComponent: (id) => {
          const { components } = get()
          const componentToDuplicate = components.find((comp) => comp.id === id)
          if (!componentToDuplicate) return

          const duplicatedComponent = get().deepCloneComponent(componentToDuplicate)
          const componentIndex = components.findIndex((comp) => comp.id === id)
          const newComponents = [...components]
          newComponents.splice(componentIndex + 1, 0, duplicatedComponent)

          set({ components: newComponents })
          get().checkForChanges()
        },

        // UI actions
        setSelectedComponent: (id) => set({ selectedComponent: id }),
        setPreviewMode: (preview) => set({ previewMode: preview }),
        loadCustomComponents: (components) => {
          console.log("Loading custom components:", components)
          set({ customComponents: components })
        },
        addCustomComponent: async(component) => {
          const { customComponents } = get()
          console.log("Adding custom component:");
          if (!Array.isArray(customComponents)){
            console.error("Custom components is not an array, resetting to empty array.");
            const createComponent = await firebaseService.saveCustomComponent(component)
            set({ customComponents: [createComponent] });
          }else{
            const createComponent = await firebaseService.saveCustomComponent(component)
             set({ customComponents: [...customComponents, createComponent] })
          }
        },
        deleteCustomComponent: async (id) => {
          const { customComponents } = get()
          console.log("Deleting custom component with ID:", id);
          
          await firebaseService.deleteCustomComponent(id)
          set({ customComponents: customComponents.filter((comp) => comp.id !== id) })
        },

        // State management
        setLoading: (loading) => set({ loading }),
        setSaving: (saving) => set({ saving }),

        markAsNewTemplate: () => {
          set({
            isNewTemplate: true,
            hasUnsavedTemplate: true,
            currentTemplate: null,
            originalTemplate: null,
            originalComponents: [],
            isWorkingCopy: false,
            workingCopySource: null,
          })
        },

        resetComponentChanges: () => {
          const { originalComponents } = get()
          set({
            components: [...originalComponents],
            hasComponentChanges: false,
          })
        },

        clearAll: () => {
          set({
            currentTemplate: null,
            originalTemplate: null,
            components: [],
            originalComponents: [],
            isWorkingCopy: false,
            workingCopySource: null,
            selectedComponent: null,
            hasComponentChanges: false,
            hasUnsavedTemplate: false,
            isNewTemplate: false,
          })
        },

        // Change detection
        checkForChanges: () => {
          const { components, originalComponents, isWorkingCopy, isNewTemplate } = get()

          const componentsChanged = JSON.stringify(components) !== JSON.stringify(originalComponents)

          set({
            hasComponentChanges: componentsChanged,
            hasUnsavedTemplate: isWorkingCopy || isNewTemplate,
          })
        },

        // Helper methods (not exposed in interface but available internally)
        deepCloneComponent: (component: EmailComponent): EmailComponent => ({
          ...component,
          id: `${component.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          children: component.children?.map((child) => get().deepCloneComponent(child)),
        }),

        deepCloneComponents: (components: EmailComponent[]): EmailComponent[] =>
          components.map((component) => get().deepCloneComponent(component)),
      }),
      {
        name: "email-builder-store",
        partialize: (state) => ({
          customComponents: state.customComponents,
          // Don't persist working state to avoid confusion on reload
        }),
      },
    ),
    {
      name: "email-builder-store",
    },
  ),
)
