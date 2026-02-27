import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface VariableCopy {
   heading :  string,
   options : [string]
}

export interface AltnamePage {
  name : string,
  value : string
}

export interface VSBData {
  id: string;
  templateId: string;
  variableCopy: VariableCopy[];
  altNamePage: AltnamePage[];
  createdAt?: string;
  updatedAt?: string;
}

interface VSBStoreState {
  vsbs: VSBData[];
  loading: boolean;
  error: string | null;
  fetchVSBs: (templateId: string) => Promise<void>;
  createVSB: (vsb: Omit<VSBData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  // Add more CRUD as needed
}

export const useVSBStore = create<VSBStoreState>()(
  devtools((set, get) => ({
    vsbs: [],
    loading: false,
    error: null,
    fetchVSBs: async (templateId: string) => {
      set({ loading: true, error: null })
      try {
        // TODO: Replace with Firebase fetch logic
        // Example: const vsbs = await firebaseService.getVSBsByTemplateId(templateId)
        const vsbs: VSBData[] = []
        set({ vsbs, loading: false })
      } catch (e: any) {
        set({ error: e.message || 'Failed to fetch VSBs', loading: false })
      }
    },
    createVSB: async (vsb) => {
      set({ loading: true, error: null })
      try {
        // TODO: Replace with Firebase create logic
        // Example: const newVSB = await firebaseService.createVSB(vsb)
        const newVSB: VSBData = {
          ...vsb,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set({ vsbs: [...get().vsbs, newVSB], loading: false })
      } catch (e: any) {
        set({ error: e.message || 'Failed to create VSB', loading: false })
      }
    },
  }))
)
