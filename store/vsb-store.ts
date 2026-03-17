import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { firebaseService } from '@/services/firebase-service'

export interface VariableCopy {
  heading: string,
  options: [string]
}

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
  altNamePage: { images: AltnamePage[] };
  headerDetails?: HeaderDetail[];
  currentVersion? : string,
  versions?: string[],
  createdAt?: string;
  updatedAt?: string;
}

interface VSBStoreState {
  vsbs: VSBData[];
  currentVsb: VSBData | null;
  loading: boolean;
  error: string | null;
  fetchVSBs: (templateId: string) => Promise<void>;
  createVSB: (vsb: Omit<VSBData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VSBData | null>;
  updateVSB: (id: string, updates: Partial<VSBData>) => Promise<void>;
  deleteVSB: (id: string) => Promise<void>;
  duplicateVSB: (id: string) => Promise<void>;
  setCurrentVsb: (vsb: VSBData | null) => void;
  fetchAllVSBs: () => Promise<void>;
}

export const useVSBStore = create<VSBStoreState>()(
  devtools(persist(
    (set, get) => ({
    vsbs: [],
    currentVsb: null,
    loading: false,
    error: null,
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
      set({ loading: true, error: null })
      try {
        const success = await firebaseService.updateVSB(id, updates)
        if (success) {
          const updatedVsbs = get().vsbs.map(v =>
            v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
          )
          const currentVsb = get().currentVsb
          set({
            vsbs: updatedVsbs,
            currentVsb: currentVsb?.id === id ? { ...currentVsb, ...updates, updatedAt: new Date().toISOString() } : currentVsb,
            loading: false
          })
        }
      } catch (e: any) {
        set({ error: e.message || 'Failed to update VSB', loading: false })
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
    setCurrentVsb: (vsb) => set({ currentVsb: vsb }),
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
