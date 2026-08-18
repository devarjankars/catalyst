import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { firebaseService } from '@/services/firebase-service'
import type { VariableSection } from '@/types/variableSectionTemplate'

export type VariableCopy = VariableSection;

export interface AltnamePage {
  name: string,
  value: string
}

export interface HeaderDetail {
  name: string;
  value: string;
}

export interface VSBData {
  id: string;
  templateId: string;
  variableCopy: VariableCopy[];
  variableCopyHeadingColor?: string;
  altNamePage: { images: AltnamePage[], headingColor?: string };
  headerDetails?: HeaderDetail[];
  desktopView?: any[];
  mobileView?: any[];
  currentVersion?: string,
  versions?: string[],
  createdAt?: string;
  updatedAt?: string;
}

interface VSBStoreState {
  vsbs: VSBData[];
  currentVsb: VSBData | null;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  fetchVSBs: (templateId: string) => Promise<void>;
  createVSB: (vsb: Omit<VSBData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VSBData | null>;
  updateVSB: (id: string, updates: Partial<VSBData>) => Promise<void>;
  saveVSB: (id: string) => Promise<void>;
  deleteVSB: (id: string) => Promise<void>;
  duplicateVSB: (id: string) => Promise<void>;
  setCurrentVsb: (vsb: VSBData | null) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  fetchAllVSBs: () => Promise<void>;
}

export const useVSBStore = create<VSBStoreState>()(
  devtools(persist(
    (set, get) => ({
      vsbs: [],
      currentVsb: null,
      loading: false,
      error: null,
      hasUnsavedChanges: false,
      setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
      fetchVSBs: async (templateId: string) => {
        set({ loading: true, error: null })
        try {
          const vsbs = await firebaseService.getVSBs(templateId)
          set({ vsbs, loading: false })
        } catch (e: any) {
          set({ error: e.message || 'Failed to fetch VSBs', loading: false })
        }
      },
      fetchAllVSBs: async () => {
        set({ loading: true, error: null })
        try {
          const vsbs = await firebaseService.getAllAllVSBs()
          set({ vsbs, loading: false })
        } catch (e: any) {
          set({ error: e.message || 'Failed to fetch all VSBs', loading: false })
        }
      },
      createVSB: async (vsb) => {
        set({ loading: true, error: null })
        try {
          const newVSB = await firebaseService.createVSB(vsb)
          if (newVSB) {
            set({ vsbs: [...get().vsbs, newVSB], currentVsb: newVSB, loading: false })
          }
          return newVSB
        } catch (e: any) {
          set({ error: e.message || 'Failed to create VSB', loading: false })
          return null
        }
      },
      updateVSB: async (id, updates) => {
        // Only update local state
        const currentVsbs = get().vsbs;
        const currentVsb = get().currentVsb;
        
        const newCurrentVsb = currentVsb?.id === id ? { ...currentVsb, ...updates } : currentVsb;
        if (!newCurrentVsb) return;

        const originalVsb = currentVsbs.find(v => v.id === id);
        const hasChanges = originalVsb ? JSON.stringify(newCurrentVsb) !== JSON.stringify(originalVsb) : true;
        
        set({
          currentVsb: newCurrentVsb,
          hasUnsavedChanges: hasChanges
        });
      },
      saveVSB: async (id) => {
        set({ loading: true, error: null })
        try {
          const vsbToSave = get().currentVsb;
          if (!vsbToSave || vsbToSave.id !== id) throw new Error("No active VSB to save");
          
          const success = await firebaseService.updateVSB(id, vsbToSave)
          if (success) {
            const updatedTimestamp = new Date().toISOString();
            const updatedVsbs = get().vsbs.map(v => 
               v.id === id ? { ...vsbToSave, updatedAt: updatedTimestamp } : v
            );
            set({ 
              vsbs: updatedVsbs, 
              currentVsb: { ...vsbToSave, updatedAt: updatedTimestamp }, 
              hasUnsavedChanges: false, 
              loading: false 
            });
          }
        } catch (e: any) {
          set({ error: e.message || 'Failed to save VSB', loading: false })
        }
      },
      deleteVSB: async (id) => {
        set({ loading: true, error: null })
        try {
          const success = await firebaseService.deleteVSB(id)
          if (success) {
            set({
              vsbs: get().vsbs.filter(v => v.id !== id),
              currentVsb: get().currentVsb?.id === id ? null : get().currentVsb,
              loading: false
            })
          }
        } catch (e: any) {
          set({ error: e.message || 'Failed to delete VSB', loading: false })
        }
      },
      duplicateVSB: async (id) => {
        set({ loading: true, error: null })
        try {
          const original = get().vsbs.find(v => v.id === id)
          if (!original) throw new Error('Original VSB not found')

          const duplicate: VSBData = {
            ...original,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          set({ vsbs: [...get().vsbs, duplicate], loading: false })
        } catch (e: any) {
          set({ error: e.message || 'Failed to duplicate VSB', loading: false })
        }
      },
      setCurrentVsb: (vsb) => set({ currentVsb: vsb, hasUnsavedChanges: false }),
    }),
    {
      name: "email-vsb-store",
      partialize: (state) => ({
        vsbs: state.vsbs,
      }),
    }
  ),
    {
      name: "email-vsb-store"
    }
  )
)
