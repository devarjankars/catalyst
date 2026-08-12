import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { EmailComponent } from "@/types/email-builder"
import type { EmailTemplate } from "@/types/template"
import { firebaseService } from "@/services/firebase-service"

function deleteByIdRecursive(components: any[], targetId: string): any[] {
  return components
    .map(comp => {
      // If this is the target component, do something before deletion
      if (comp.id === targetId) {
        if (comp.type === "image") {
          // e.g., delete file or perform cleanup
          firebaseService.deleteImage(comp.src)
        }
        return null; // mark for removal
      }

      // Recurse into children
      if (Array.isArray(comp.children) && comp.children.length > 0) {
        return {
          ...comp,
          children: deleteByIdRecursive(comp.children, targetId),
        };
      }

      return comp;
    })
    .filter(Boolean); // remove the nulls (deleted components)
}

interface EmailBuilderState {
  // Template data
  currentTemplate: EmailTemplate | null
  originalTemplate: EmailTemplate | null
  components: EmailComponent[]
  originalComponents: EmailComponent[]
  preheaderText: string

  // Multi-option state
  optionMode: "single" | "three"
  optionSubMode: "header-only" | "completely-different"
  activeOption: 1 | 2 | 3
  option2Components: EmailComponent[]
  option3Components: EmailComponent[]
  originalOption2Components: EmailComponent[]
  originalOption3Components: EmailComponent[]

  // Working copy state (for template copies that aren't saved yet)
  isWorkingCopy: boolean
  workingCopySource: EmailTemplate | null

  // UI state
  selectedComponent: string | null
  previewMode: boolean
  customComponents: EmailComponent[]
  templateImages: string[]

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

  // Multi-option actions
  setOptionMode: (mode: "single" | "three") => void
  setOptionSubMode: (subMode: "header-only" | "completely-different") => void
  setActiveOption: (option: 1 | 2 | 3) => void
  getActiveComponents: () => EmailComponent[]
  setActiveComponents: (components: EmailComponent[]) => void
  initializeOptions: (base: EmailComponent[]) => void
  syncBodyFromOption1: () => void
  ensureThreeOptions: () => void
  markComponentsSaved: () => void
  applyOptionConfiguration: (config: {
    mode: "single" | "three"
    subMode?: "header-only" | "completely-different"
  }) => void
  copyOptionTo: (fromOption: 1 | 2 | 3, toOptions: (1 | 2 | 3)[]) => void
  addComponentToOption: (component: EmailComponent, targetOption: 1 | 2 | 3) => void

  // Working copy actions
  startWorkingCopy: (
    sourceTemplate: EmailTemplate,
    optionOverrides?: {
      optionMode?: "single" | "three"
      optionSubMode?: "header-only" | "completely-different"
    },
  ) => void
  saveWorkingCopyAsTemplate: (
    templateData: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt" | "components">,
  ) => void

  // Component actions
  addComponent: (component: EmailComponent, index?: number) => void
  updateComponent: (id: string, updates: Partial<EmailComponent>, parentId?: string | null) => void
  deleteComponent: (id: string) => void
  moveComponent: (dragIndex: number, hoverIndex: number) => void
  duplicateComponent: (id: string) => void

  // UI actions
  setSelectedComponent: (id: string | null) => void
  setPreviewMode: (preview: boolean) => void
  addCustomComponent: (component: EmailComponent) => Promise<EmailComponent | null>
  loadCustomComponents: (components: EmailComponent[]) => void
  deleteCustomComponent: (id: string) => Promise<boolean>
  setPreheader: (preheaderTest: string) => void
  setTemplateImages: (images: string[]) => void
  loadTemplateImages: (templateId: string) => Promise<void>
  loadTemplate: (templateId: string) => Promise<void>
  addTemplateImage: (imageUrl: string) => void
  removeTemplateImage: (imageUrl: string) => void

  // State management
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  markAsNewTemplate: () => void
  resetComponentChanges: () => void
  clearAll: () => void

  // Change detection
  checkForChanges: () => void

  // Helper methods
  deepCloneComponent: (component: EmailComponent) => EmailComponent
  deepCloneComponents: (components: EmailComponent[]) => EmailComponent[]
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
        optionMode: "single",
        optionSubMode: "header-only",
        activeOption: 1,
        option2Components: [],
        option3Components: [],
        originalOption2Components: [],
        originalOption3Components: [],
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
        preheaderText: "",
        templateImages: [],

        // Template actions
        setCurrentTemplate: (template) => {
          const components = template?.components || []
          const option2Components = template?.option2Components || []
          const option3Components = template?.option3Components || []
          set({
            currentTemplate: template,
            components,
            originalComponents: components,
            option2Components,
            option3Components,
            originalOption2Components: option2Components,
            originalOption3Components: option3Components,
            isWorkingCopy: false,
            workingCopySource: null,
            hasUnsavedTemplate: false,
            isNewTemplate: false,
            preheaderText: template?.preheaderText || '',
            templateImages: [],
            optionMode: template?.optionMode || "single",
            optionSubMode: template?.optionSubMode || "header-only",
            activeOption: 1,
          })
          if (template?.id) {
            get().loadTemplateImages(template.id)
          }
          if ((template?.optionMode || "single") === "three") {
            get().ensureThreeOptions()
          }
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

        setPreheader: (preheadertext) => {
          set({ preheaderText: preheadertext })
          const { currentTemplate } = get()
          if (currentTemplate) {
            set({ currentTemplate: { ...currentTemplate, preheaderText: preheadertext } })
          }
          get().checkForChanges()
        },

        // Multi-option actions
        setOptionMode: (mode) => {
          set({ optionMode: mode })
          
          if (mode === "three") {
            const state = get()
            get().initializeOptions(state.components)
          } else {
            // Switching back to single: reset activeOption to 1
            set({ activeOption: 1 })
          }
          get().checkForChanges()
        },
        setOptionSubMode: (subMode) => {
          set({ optionSubMode: subMode })
          if (subMode === "header-only") {
            get().syncBodyFromOption1()
          }
          get().checkForChanges()
        },
        setActiveOption: (option) => {
          set({ activeOption: option, selectedComponent: null })
        },
        getActiveComponents: () => {
          const { activeOption, components, option2Components, option3Components } = get()
          if (activeOption === 1) return components
          if (activeOption === 2) return option2Components
          return option3Components
        },
        setActiveComponents: (components) => {
          const { activeOption } = get()
          if (activeOption === 1) set({ components })
          else if (activeOption === 2) set({ option2Components: components })
          else set({ option3Components: components })
          get().checkForChanges()
        },
        initializeOptions: (base) => {
          const state = get()
          const cloneWithoutNewIds = (items: EmailComponent[]): EmailComponent[] =>
            items.map((component) => ({
              ...component,
              children: component.children ? cloneWithoutNewIds(component.children) : undefined,
            }))

          const updates: Partial<EmailBuilderState> = {}
          if (state.option2Components.length === 0) {
            updates.option2Components = cloneWithoutNewIds(base)
          }
          if (state.option3Components.length === 0) {
            updates.option3Components = cloneWithoutNewIds(base)
          }

          if (updates.option2Components || updates.option3Components) {
            set(updates)
          }
        },
        syncBodyFromOption1: () => {
          // Syncs the body from Option 1 into Options 2 and 3, preserving ONLY their header-images
          const { components, option2Components, option3Components } = get()
          const cloneWithoutNewIds = (items: EmailComponent[]): EmailComponent[] =>
            items.map((component) => ({
              ...component,
              children: component.children ? cloneWithoutNewIds(component.children) : undefined,
            }))
          
          const syncBody = (targetOption: EmailComponent[]) => {
            const headerImg = targetOption.find(c => c.type === 'header-image')
            const newOption = cloneWithoutNewIds(components)
            if (headerImg) {
              // Replace header in the new cloned array with the existing header from the target option
              const headerIndex = newOption.findIndex(c => c.type === 'header-image')
              if (headerIndex !== -1) {
                newOption[headerIndex] = { ...headerImg }
              } else {
                newOption.unshift({ ...headerImg })
              }
            }
            return newOption
          }
          
          set({ 
            option2Components: syncBody(option2Components),
            option3Components: syncBody(option3Components)
          })
          get().checkForChanges()
        },
        ensureThreeOptions: () => {
          const { optionMode, components } = get()
          if (optionMode !== "three") return
          get().initializeOptions(components)
        },
        markComponentsSaved: () => {
          const { components, option2Components, option3Components } = get()
          set({
            originalComponents: [...components],
            originalOption2Components: [...option2Components],
            originalOption3Components: [...option3Components],
          })
          get().checkForChanges()
        },
        applyOptionConfiguration: (config) => {
          set({ optionMode: config.mode })
          if (config.subMode) {
            set({ optionSubMode: config.subMode })
          }

          if (config.mode === "three") {
            get().initializeOptions(get().components)
            const subMode = config.subMode ?? get().optionSubMode
            if (subMode === "header-only") {
              get().syncBodyFromOption1()
            }
          } else {
            set({ activeOption: 1 })
          }

          const { currentTemplate } = get()
          if (currentTemplate) {
            set({
              currentTemplate: {
                ...currentTemplate,
                optionMode: config.mode,
                ...(config.subMode ? { optionSubMode: config.subMode } : {}),
              },
            })
          }

          get().checkForChanges()
        },

        copyOptionTo: (fromOption, toOptions) => {
          const { components, option2Components, option3Components } = get()
          const getOptionComponents = (opt: 1 | 2 | 3) => {
            if (opt === 1) return components
            if (opt === 2) return option2Components
            return option3Components
          }
          const source = get().deepCloneComponents(getOptionComponents(fromOption))
          const updates: Partial<EmailBuilderState> = {}
          for (const to of toOptions) {
            if (to === fromOption) continue
            if (to === 1) updates.components = source
            else if (to === 2) updates.option2Components = source
            else updates.option3Components = source
          }
          set(updates)
          get().checkForChanges()
        },

        addComponentToOption: (component, targetOption) => {
          const { components, option2Components, option3Components } = get()
          const cloned = get().deepCloneComponent(component)
          if (targetOption === 1) set({ components: [...components, cloned] })
          else if (targetOption === 2) set({ option2Components: [...option2Components, cloned] })
          else set({ option3Components: [...option3Components, cloned] })
          get().checkForChanges()
        },

        // Working copy actions
        startWorkingCopy: (sourceTemplate, optionOverrides) => {
          const optionMode =
            optionOverrides?.optionMode ?? sourceTemplate.optionMode ?? "single"
          const optionSubMode =
            optionOverrides?.optionSubMode ?? sourceTemplate.optionSubMode ?? "header-only"

          set({
            isWorkingCopy: true,
            workingCopySource: sourceTemplate,
            currentTemplate: null,
            originalTemplate: null,
            components: get().deepCloneComponents(sourceTemplate.components || []),
            originalComponents: [], // Empty for working copy
            optionMode,
            optionSubMode,
            activeOption: 1,
            option2Components: sourceTemplate.option2Components
              ? get().deepCloneComponents(sourceTemplate.option2Components)
              : [],
            option3Components: sourceTemplate.option3Components
              ? get().deepCloneComponents(sourceTemplate.option3Components)
              : [],
            originalOption2Components: [],
            originalOption3Components: [],
            hasUnsavedTemplate: true,
            hasComponentChanges: false,
            isNewTemplate: false,
          })
          if (optionMode === "three") {
            get().ensureThreeOptions()
          }
        },

        saveWorkingCopyAsTemplate: (templateData) => {
          const { components, optionMode, optionSubMode, option2Components, option3Components } = get()
          const newTemplate: EmailTemplate = {
            ...templateData,
            id: Date.now().toString(),
            components,
            optionMode,
            optionSubMode,
            option2Components,
            option3Components,
            createdAt: new Date(),
            updatedAt: new Date(),
            isUserCreated: true,
          }

          set({
            currentTemplate: newTemplate,
            originalTemplate: newTemplate,
            originalComponents: [...components],
            originalOption2Components: [...option2Components],
            originalOption3Components: [...option3Components],
            isWorkingCopy: false,
            workingCopySource: null,
            hasUnsavedTemplate: false,
            hasComponentChanges: false,
          })
        },

        // Component actions
        addComponent: (component, index) => {
          const { activeOption, optionMode, optionSubMode } = get()
          if (optionMode === "three" && optionSubMode === "header-only" && activeOption !== 1) return
          const componentsToEdit = get().getActiveComponents()
          const newComponent = {
            ...component,
            id: component.id || `${component.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }

          let newComponents
          if (index !== undefined) {
            newComponents = [...componentsToEdit]
            newComponents.splice(index, 0, newComponent)
          } else {
            newComponents = [...componentsToEdit, newComponent]
          }

          if (activeOption === 1) set({ components: newComponents })
          else if (activeOption === 2) set({ option2Components: newComponents })
          else set({ option3Components: newComponents })

          if (activeOption === 1 && optionMode === "three" && optionSubMode === "header-only") {
            get().syncBodyFromOption1()
          }
          
          get().checkForChanges()
        },

        updateComponent: (id, updates, parentId = null) => {
          const { activeOption, optionMode, optionSubMode } = get()
          const componentsToEdit = get().getActiveComponents()
          const findById = (items: EmailComponent[]): EmailComponent | null => {
            for (const item of items) {
              if (item.id === id) return item
              if (item.children) {
                const found = findById(item.children)
                if (found) return found
              }
            }
            return null
          }
          if (optionMode === "three" && optionSubMode === "header-only" && activeOption !== 1 && findById(componentsToEdit)?.type !== "header-image") return

          const updateInTree = (items: any[]): any[] => {
            return items.map((comp) => {
              if (comp.id === parentId && Array.isArray(comp.children)) {
                const updatedChildren = comp.children.map((child: any) =>
                  child.id === id ? { ...child, ...updates } : child
                );
                return { ...comp, children: updatedChildren };
              }

              if (!parentId && comp.id === id) {
                return { ...comp, ...updates };
              }

              if (Array.isArray(comp.children)) {
                return { ...comp, children: updateInTree(comp.children) };
              }

              return comp;
            });
          };

          const newComponents = updateInTree(componentsToEdit);
          
          if (activeOption === 1) set({ components: newComponents })
          else if (activeOption === 2) set({ option2Components: newComponents })
          else set({ option3Components: newComponents })

          if (activeOption === 1 && optionMode === "three" && optionSubMode === "header-only") {
            get().syncBodyFromOption1()
          }

          get().checkForChanges();
        },

        deleteComponent: (id) => {
          const { activeOption, optionMode, optionSubMode, selectedComponent } = get()
          if (optionMode === "three" && optionSubMode === "header-only" && activeOption !== 1) return
          const componentsToEdit = get().getActiveComponents()

          const newComponents = deleteByIdRecursive(componentsToEdit, id);

          const updates: any = { selectedComponent: selectedComponent === id ? null : selectedComponent }
          if (activeOption === 1) updates.components = newComponents
          else if (activeOption === 2) updates.option2Components = newComponents
          else updates.option3Components = newComponents
          
          set(updates);

          if (activeOption === 1 && optionMode === "three" && optionSubMode === "header-only") {
            get().syncBodyFromOption1()
          }

          get().checkForChanges();
        },

        moveComponent: (dragIndex, hoverIndex) => {
          const { activeOption, optionMode, optionSubMode } = get()
          if (optionMode === "three" && optionSubMode === "header-only" && activeOption !== 1) return
          const componentsToEdit = get().getActiveComponents()
          const newComponents = [...componentsToEdit]
          const draggedComponent = newComponents[dragIndex]
          newComponents.splice(dragIndex, 1)
          newComponents.splice(hoverIndex, 0, draggedComponent)

          if (activeOption === 1) set({ components: newComponents })
          else if (activeOption === 2) set({ option2Components: newComponents })
          else set({ option3Components: newComponents })

          if (activeOption === 1 && optionMode === "three" && optionSubMode === "header-only") {
            get().syncBodyFromOption1()
          }

          get().checkForChanges()
        },

        duplicateComponent: (id) => {
          const { activeOption, optionMode, optionSubMode } = get()
          if (optionMode === "three" && optionSubMode === "header-only" && activeOption !== 1) return
          const componentsToEdit = get().getActiveComponents()
          const componentToDuplicate = componentsToEdit.find((comp) => comp.id === id)
          if (!componentToDuplicate) return

          const duplicatedComponent = get().deepCloneComponent(componentToDuplicate)
          const componentIndex = componentsToEdit.findIndex((comp) => comp.id === id)
          const newComponents = [...componentsToEdit]
          newComponents.splice(componentIndex + 1, 0, duplicatedComponent)

          if (activeOption === 1) set({ components: newComponents })
          else if (activeOption === 2) set({ option2Components: newComponents })
          else set({ option3Components: newComponents })

          if (activeOption === 1 && optionMode === "three" && optionSubMode === "header-only") {
            get().syncBodyFromOption1()
          }

          get().checkForChanges()
        },

        // UI actions
        setSelectedComponent: (id) => set({ selectedComponent: id }),
        setPreviewMode: (preview) => set({ previewMode: preview }),
        loadCustomComponents: (components) => {
          set({ customComponents: Array.isArray(components) ? components : [] })
        },
        addCustomComponent: async (component) => {
          const { customComponents } = get()
          try {
            const createComponent = await firebaseService.saveCustomComponent(component)
            const next = Array.isArray(customComponents)
              ? [...customComponents, createComponent]
              : [createComponent]
            set({ customComponents: next })
            return createComponent
          } catch (error) {
            console.error("Failed to save custom component:", error)
            return null
          }
        },
        deleteCustomComponent: async (id) => {
          const { customComponents } = get()
          const ok = await firebaseService.deleteCustomComponent(id)
          if (ok) {
            set({ customComponents: customComponents.filter((comp) => comp.id !== id) })
          }
          return ok
        },

        setTemplateImages: (images) => set({ templateImages: images }),

        loadTemplateImages: async (templateId) => {
          if (!templateId) return
          const images = await firebaseService.getTemplateImages(templateId)
          set({ templateImages: images })
        },

        loadTemplate: async (templateId: string) => {
          if (!templateId) return
          set({ loading: true })
          try {
            const template = await firebaseService.getTemplate(templateId)
            if (template) {
              set({
                currentTemplate: template,
                components: template.components || [],
                originalComponents: template.components || [],
                optionMode: template.optionMode || "single",
                optionSubMode: template.optionSubMode || "header-only",
                activeOption: 1,
                option2Components: template.option2Components || [],
                option3Components: template.option3Components || [],
                originalOption2Components: template.option2Components || [],
                originalOption3Components: template.option3Components || [],
                preheaderText: template.preheaderText || ''
              })
              if ((template.optionMode || "single") === "three") {
                get().ensureThreeOptions()
              }
            }
          } finally {
            set({ loading: false })
          }
        },

        addTemplateImage: (imageUrl) => {
          const { templateImages } = get()
          if (!templateImages.includes(imageUrl)) {
            set({ templateImages: [...templateImages, imageUrl] })
          }
        },

        removeTemplateImage: (imageUrl) => {
          const { templateImages } = get()
          set({ templateImages: templateImages.filter((url) => url !== imageUrl) })
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
            optionMode: "single",
            optionSubMode: "header-only",
            activeOption: 1,
            option2Components: [],
            option3Components: [],
            originalOption2Components: [],
            originalOption3Components: [],
            isWorkingCopy: false,
            workingCopySource: null,
          })
        },

        resetComponentChanges: () => {
          const { originalComponents, originalOption2Components, originalOption3Components, selectedComponent } = get()

          // Check if the currently selected component still exists in the original components
          const selectedComponentExists = originalComponents.some(comp => comp.id === selectedComponent) ||
            originalComponents.some(comp => comp.children?.some(child => child.id === selectedComponent)) ||
            originalOption2Components.some(comp => comp.id === selectedComponent) ||
            originalOption3Components.some(comp => comp.id === selectedComponent);

          set({
            components: [...originalComponents],
            option2Components: [...originalOption2Components],
            option3Components: [...originalOption3Components],
            hasComponentChanges: false,
            selectedComponent: selectedComponentExists ? selectedComponent : null,
          })
        },

        clearAll: () => {
          set({
            currentTemplate: null,
            originalTemplate: null,
            components: [],
            originalComponents: [],
            optionMode: "single",
            optionSubMode: "header-only",
            activeOption: 1,
            option2Components: [],
            option3Components: [],
            originalOption2Components: [],
            originalOption3Components: [],
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
          const { components, originalComponents, option2Components, originalOption2Components, option3Components, originalOption3Components, isWorkingCopy, isNewTemplate } = get()

          const componentsChanged = JSON.stringify(components) !== JSON.stringify(originalComponents)
          const option2Changed = JSON.stringify(option2Components) !== JSON.stringify(originalOption2Components)
          const option3Changed = JSON.stringify(option3Components) !== JSON.stringify(originalOption3Components)
          const preheaderChanged = get().preheaderText !== (get().originalTemplate?.preheaderText || "")

          set({
            hasComponentChanges: componentsChanged || option2Changed || option3Changed || preheaderChanged,
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




