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
  name?: string;
  variableCopy: VariableCopy[];
  variableCopyHeadingColor?: string;
  altNamePage: { images: AltnamePage[], headingColor?: string };
  headerDetails?: HeaderDetail[];
  desktopView?: any[];
  mobileView?: any[];
  currentVersionNumber?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface VSBStoreState {
  vsbs: VSBData[];
  currentVsb: VSBData | null;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  isSyncing: boolean;
  lastActiveVsbId: string | null;
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

// Module-level timer so it survives re-renders without being in Zustand state
let _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

export const useVSBStore = create<VSBStoreState>()(
  devtools(persist(
    (set, get) => ({
      vsbs: [],
      currentVsb: null,
      loading: false,
      error: null,
      hasUnsavedChanges: false,
      isSyncing: false,
      lastActiveVsbId: null,

      setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),

      fetchVSBs: async (templateId: string) => {
        set({ loading: true, error: null, vsbs: [], hasUnsavedChanges: false })
        try {
          const vsbs = await firebaseService.getVSBs(templateId)
          // Restore last active VSB context if it belongs to this template
          const lastActiveVsbId = get().lastActiveVsbId
          const restoredVsb = lastActiveVsbId
            ? vsbs.find(v => v.id === lastActiveVsbId) ?? null
            : null
          set({ vsbs, currentVsb: restoredVsb, loading: false })
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
          if (!newVSB) throw new Error('Failed to create VSB. Please try again.')
          set({
            vsbs: [...get().vsbs, newVSB],
            currentVsb: newVSB,
            loading: false,
            hasUnsavedChanges: false,
            lastActiveVsbId: newVSB.id,
          })
          return newVSB
        } catch (e: any) {
          set({ error: e.message || 'Failed to create VSB', loading: false })
          return null
        }
      },

      updateVSB: async (id, updates) => {
        const currentVsb = get().currentVsb;
        const currentVsbs = get().vsbs;

        const newCurrentVsb = currentVsb?.id === id ? { ...currentVsb, ...updates } : currentVsb;
        if (!newCurrentVsb) return;

        const originalVsb = currentVsbs.find(v => v.id === id);
        const hasChanges = originalVsb
          ? JSON.stringify(newCurrentVsb) !== JSON.stringify(originalVsb)
          : true;

        set({ currentVsb: newCurrentVsb, hasUnsavedChanges: hasChanges });

        // Debounced auto-save to Firestore — 3 seconds after last change
        if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
        _autoSaveTimer = setTimeout(async () => {
          const current = get().currentVsb;
          if (!current || current.id !== id) return;
          set({ isSyncing: true });
          try {
            const success = await firebaseService.updateVSB(id, current);
            if (success) {
              const updatedTimestamp = new Date().toISOString();
              const updatedVsbs = get().vsbs.map(v =>
                v.id === id ? { ...current, updatedAt: updatedTimestamp } : v
              );
              set({
                vsbs: updatedVsbs,
                currentVsb: { ...current, updatedAt: updatedTimestamp },
                hasUnsavedChanges: false,
              });
            }
          } finally {
            set({ isSyncing: false });
          }
        }, 3000);
      },

      saveVSB: async (id) => {
        // Cancel any pending debounced save
        if (_autoSaveTimer) { clearTimeout(_autoSaveTimer); _autoSaveTimer = null; }
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
              loading: false,
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
            const wasActive = get().currentVsb?.id === id;
            set({
              vsbs: get().vsbs.filter(v => v.id !== id),
              currentVsb: wasActive ? null : get().currentVsb,
              lastActiveVsbId: wasActive ? null : get().lastActiveVsbId,
              loading: false,
            })
          }
        } catch (e: any) {
          set({ error: e.message || 'Failed to delete VSB', loading: false })
        }
      },

      // BUG 2 FIX: now persists to Firestore instead of creating a local-only copy
      duplicateVSB: async (id) => {
        set({ loading: true, error: null })
        try {
          const original = get().vsbs.find(v => v.id === id)
          if (!original) throw new Error('Original VSB not found')
          const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = original
          const newVSB = await firebaseService.createVSB(rest)
          if (!newVSB) throw new Error('Failed to duplicate VSB in Firestore')
          set({ vsbs: [...get().vsbs, newVSB], loading: false })
        } catch (e: any) {
          set({ error: e.message || 'Failed to duplicate VSB', loading: false })
        }
      },

      setCurrentVsb: (vsb) => set({
        currentVsb: vsb,
        hasUnsavedChanges: false,
        lastActiveVsbId: vsb?.id ?? null,
      }),
    }),
    {
      name: "email-vsb-store",
      // BUG 7 FIX: only persist the last active VSB ID, NOT the full vsbs array
      // The full array can exceed the 5MB localStorage quota for complex VSBs
      partialize: (state) => ({
        lastActiveVsbId: state.lastActiveVsbId,
      }),
    }
  ),
    {
      name: "email-vsb-store"
    }
  )
)
