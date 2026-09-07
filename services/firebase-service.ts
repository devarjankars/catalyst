import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { EmailTemplate } from "@/types/template";
import { EmailComponent } from "@/types/email-builder";

function removeUndefinedDeep(value: any): any {
  if (value === undefined) return undefined;
  if (value === null) return null;

  // Preserve date-like values so Firestore stores real timestamps instead of
  // turning them into empty objects via the object branch below.
  if (value instanceof Date || value instanceof Timestamp || typeof value.toDate === "function") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(removeUndefinedDeep).filter((v) => v !== undefined);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([k, v]) => [k, removeUndefinedDeep(v)])
        .filter(([_, v]) => v !== undefined)
    );
  }

  return value;
}


//  const parseDate = (value: any) => {
//     if (!value) return new Date();
//     if (value instanceof Timestamp) return value.toDate();
//     if (value instanceof Date) return value;
//     if (typeof value === "string") return new Date(value);
//     return new Date(); // fallback
//   };

const parseDate = (value: any): Date | null => {
  if (!value) return null;

  if (value._methodName === "serverTimestamp") return null;

  if (value.toDate) return value.toDate();

  if (typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  return null;
}

class FirebaseService {
  private templatesCollection = "email-templates";
  private imagesPath = "template-images";
  private isFirebaseAvailable = false;
  private customComponentsCollection = "custom-components";
  private vsbsCollection = "vsbs";
  private vsbImagesPath = "vsb-images";
  private vsbPdfsPath = "vsb-pdfs";

  constructor() {
    this.isFirebaseAvailable = !!(db && storage);
    if (!this.isFirebaseAvailable) {
      console.warn("Firebase not available, falling back to localStorage");
    }
  }

  // Template operations
  async getAllTemplates(): Promise<EmailTemplate[]> {

    if (!this.isFirebaseAvailable) {
      return this.getLocalTemplates();
    }

    try {
      const querySnapshot = await getDocs(collection(db, this.templatesCollection));
      const templates: EmailTemplate[] = [];
      // for (const docSnap of querySnapshot.docs) {
      //   const data = docSnap.data();

      //   if (data.createdAt?._methodName || data.updatedAt?._methodName) {
      //     await updateDoc(docSnap.ref, {
      //       createdAt: serverTimestamp(),
      //       updatedAt: serverTimestamp(),
      //     });
      //   }
      // }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          ...data,
          createdAt: parseDate(data.createdAt),
          updatedAt: parseDate(data.updatedAt),
        } as EmailTemplate);
      });

      // ── Normalise standard templates ─────────────────────────────────────
      const CANONICAL_NAMES = [
        "Orserdu RTE", "Orserdu SFMC", "Orserdu Unbranded",
        "Elzonris RTE", "Elzonris SFMC", "Elzonris Unbranded",
        "Ferring RTE",
      ];

      const standardTemplates = templates.filter(t => !t.isUserCreated);
      const userTemplates      = templates.filter(t => t.isUserCreated);

      // Delete legacy / unknown standard templates
      const legacyToDelete = standardTemplates.filter(t => !CANONICAL_NAMES.includes(t.name));
      for (const t of legacyToDelete) {
        try { await deleteDoc(doc(db, this.templatesCollection, t.id)); } catch {}
      }

      // Deduplicate: keep only the first per canonical name
      const seen = new Set<string>();
      const dupes: EmailTemplate[] = [];
      const canonical: EmailTemplate[] = [];
      for (const t of standardTemplates.filter(t => CANONICAL_NAMES.includes(t.name))) {
        if (seen.has(t.name)) { dupes.push(t); }
        else { seen.add(t.name); canonical.push(t); }
      }
      for (const t of dupes) {
        try { await deleteDoc(doc(db, this.templatesCollection, t.id)); } catch {}
      }

      // ── Brand correction + content seeding from existing user emailers ────
      const SEED_MAP: Record<string, { source: string; brand: string }> = {
        "Elzonris RTE":       { source: "MAT-US-TAG-00227-v2_BPDCN_Skin lesions_RTE", brand: "elzonris" },
        "Elzonris Unbranded": { source: "MAT-US-TAG-00334_Speaker-Program-Invite",     brand: "elzonris" },
        "Elzonris SFMC":      { source: "MAT-US-TAG-00291_v2",                         brand: "elzonris" },
        "Orserdu Unbranded":  { source: "75.1300",                                     brand: "orserdu"  },
        "Ferring RTE":        { source: "Ferring RTE",                                 brand: "ferring"  },
      };
      const sampleMap = new Map(this.getSampleTemplates().map(s => [s.name, s]));

      for (const t of canonical) {
        const expected = sampleMap.get(t.name);
        if (!expected) continue;

        const wrongBrand = (t as any).brand !== expected.brand;
        const seedConfig = SEED_MAP[t.name];
        // Seed if blank (≤2 components) OR if brand is wrong
        const isBlank = !t.components || t.components.length <= 2;

        if (wrongBrand && !seedConfig) {
          // Wrong brand, no seed source — reset to blank placeholder
          try {
            await updateDoc(doc(db, this.templatesCollection, t.id), {
              brand: expected.brand,
              components: expected.components,
              updatedAt: new Date(),
            });
            (t as any).brand = expected.brand;
            t.components = expected.components;
          } catch {}
        } else if (seedConfig && (isBlank || wrongBrand)) {
          // Find source emailer using partial name match (case-insensitive)
          const needle = seedConfig.source.toLowerCase().trim();
          const sourceTemplate = templates.find(src => {
            const srcName = (src.name ?? "").toLowerCase().trim();
            return srcName === needle || srcName.includes(needle) || needle.includes(srcName);
          });
          if (sourceTemplate && sourceTemplate.components?.length > 0) {
            try {
              await updateDoc(doc(db, this.templatesCollection, t.id), {
                brand: seedConfig.brand,
                components: sourceTemplate.components,
                option2Components: sourceTemplate.option2Components ?? [],
                option3Components: sourceTemplate.option3Components ?? [],
                optionMode: sourceTemplate.optionMode ?? "single",
                preheaderText: sourceTemplate.preheaderText ?? "",
                updatedAt: new Date(),
              });
              t.components = sourceTemplate.components;
              (t as any).brand = seedConfig.brand;
            } catch {}
          }
        }
      }

      // Seed missing canonical templates
      const missingNames = CANONICAL_NAMES.filter(n => !seen.has(n));
      if (missingNames.length > 0 || legacyToDelete.length > 0 || dupes.length > 0) {
        const toCreate = this.getSampleTemplates().filter(s => missingNames.includes(s.name));
        for (const template of toCreate) {
          await this.createTemplate(template);
        }
        // Re-fetch clean state
        return this.getAllTemplates();
      }

      return [...canonical, ...userTemplates];
    } catch (error) {
      console.error(
        "Failed to load templates from Firebase, falling back to localStorage:",
        error
      );
      return this.getLocalTemplates();
    }
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    if (!this.isFirebaseAvailable) {
      return this.getLocalTemplate(id);
    }

    try {
      const docRef = doc(db, this.templatesCollection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: parseDate(data.createdAt),
          updatedAt: parseDate(data.updatedAt),
        } as EmailTemplate;
      }

      return null;
    } catch (error) {
      console.error(
        "Failed to get template from Firebase, falling back to localStorage:",
        error
      );
      return this.getLocalTemplate(id);
    }
  }

  async getCustomComponents(): Promise<EmailComponent[]> {
    if (!this.isFirebaseAvailable) {
      return [];
    }

    try {
      const querySnapshot = await getDocs(
        collection(db, this.customComponentsCollection)
      );
      const components: EmailComponent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        components.push({
          id: doc.id,
          ...data,
          createdAt: parseDate(data.createdAt),
          updatedAt: parseDate(data.updatedAt),
        } as unknown as EmailComponent);
      });
      return components;
    } catch (error) {
      console.error(
        "Failed to load custom components from Firebase:",
        error
      );
      return [];
    }
  }

  async saveCustomComponent(component: EmailComponent): Promise<EmailComponent> {
    if (!this.isFirebaseAvailable) {
      return component;
    }

    try {
      const docRef = doc(db, this.customComponentsCollection, component.id); // your custom ID
      await setDoc(docRef, {
        ...removeUndefinedDeep(component),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { ...component };
    } catch (error) {
      console.error("Failed to save custom component:", error);
      throw error;
    }
  }

  async deleteCustomComponent(id: string): Promise<boolean> {
    if (!this.isFirebaseAvailable) {
      return true; // Fallback to local deletion
    }
    try {
      const docRef = doc(db, this.customComponentsCollection, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Failed to delete custom component:", error);
      return false;
    }
  }


  async createTemplate(
    data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<EmailTemplate> {
    if (!this.isFirebaseAvailable) {
      return this.createLocalTemplate(data);
    }

    try {
      // Remove undefined fields
      const rawData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cleanData = removeUndefinedDeep(rawData);

      console.log("Cleaned before Firestore:", cleanData);

      const docRef = await addDoc(
        collection(db, this.templatesCollection),
        cleanData
      );

      return {
        id: docRef.id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error(
        "Failed to create template in Firebase, falling back to localStorage:",
        error
      );
      return this.createLocalTemplate(data);
    }
  }

  async updateTemplate(
    id: string,
    updates: Partial<EmailTemplate>
  ): Promise<EmailTemplate | null> {
    if (!this.isFirebaseAvailable) {
      return this.updateLocalTemplate(id, updates);
    }
    const { createdAt, updatedAt, ...safeUpdates } = updates;
    try {
      const docRef = doc(db, this.templatesCollection, id);


      await updateDoc(docRef, {
        ...removeUndefinedDeep(safeUpdates),
        updatedAt: new Date(),
      });
      const snap = await getDoc(docRef);
      const data = snap.data();

      if (!data?.updatedAt || data.updatedAt._methodName) {
        // Firestore hasn't resolved yet — wait one tick
        await new Promise(r => setTimeout(r, 100));
        return this.getTemplate(id);
      }

      return {
        id,
        ...data,
        createdAt: parseDate(data.createdAt),
        updatedAt: parseDate(data.updatedAt),
      } as EmailTemplate;
    } catch (error) {
      console.error(
        "Failed to update template in Firebase, falling back to localStorage:",
        error
      );
      return this.updateLocalTemplate(id, updates);
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    if (!this.isFirebaseAvailable) {
      return this.deleteLocalTemplate(id);
    }

    try {
      const docRef = doc(db, this.templatesCollection, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(
        "Failed to delete template from Firebase, falling back to localStorage:",
        error
      );
      return this.deleteLocalTemplate(id);
    }
  }

  async duplicateTemplate(id: string): Promise<EmailTemplate> {
    const template = await this.getTemplate(id);
    if (!template) throw new Error("Template not found");

    return this.createTemplate({
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      brand: template.brand,
      components: this.deepCloneComponents(template.components),
      optionMode: template.optionMode || "single",
      optionSubMode: template.optionSubMode,
      option2Components: template.option2Components ? this.deepCloneComponents(template.option2Components) : undefined,
      option3Components: template.option3Components ? this.deepCloneComponents(template.option3Components) : undefined,
      preheaderText: template.preheaderText,
      isUserCreated: true,
    });
  }

  async getStorageUsage(templateId?: string): Promise<number> {
    if (!this.isFirebaseAvailable || !storage) {
      return 0;
    }

    try {
      const folderPath = `${this.imagesPath}/${templateId}`


      const folderRef = ref(storage, folderPath);
      const listResult = await listAll(folderRef);

      let totalSize = 0;

      // Get metadata for each file and sum up sizes
      const metadataPromises = listResult.items.map(async (itemRef) => {
        const metadata = await getMetadata(itemRef);
        return metadata.size; // Size in bytes
      });

      const sizes = await Promise.all(metadataPromises);
      totalSize = sizes.reduce((sum, size) => sum + size, 0);

      return totalSize; // Returns size in bytes
    } catch (error) {
      console.error("Failed to get storage usage:", error);
      return 0;
    }
  }

  async getTemplateImages(templateId: string): Promise<string[]> {
    if (!this.isFirebaseAvailable || !storage || !templateId) {
      return [];
    }

    try {
      const folderPath = `${this.imagesPath}/${templateId}`;
      const folderRef = ref(storage, folderPath);
      const listResult = await listAll(folderRef);

      const urlPromises = listResult.items.map(async (itemRef) => {
        return await getDownloadURL(itemRef);
      });

      return await Promise.all(urlPromises);
    } catch (error) {
      console.error("Failed to fetch template images:", error);
      return [];
    }
  }

  // Image operations
  async uploadImage(file: File, templateId?: string): Promise<string> {
    if (!this.isFirebaseAvailable || !storage) {
      return URL.createObjectURL(file);
    }

    try {
      if (!templateId) {
        return "PATH_NOT_FOUND"
      }

      const fileName = `${Date.now()}-${file.name}`;
      const imagePath = `${this.imagesPath}/${templateId}/${fileName}`

      const imageRef = ref(storage, imagePath);

      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error("Failed to upload image to Firebase:", error);
      throw error; // Throw instead of fallback so you can handle the error appropriately
    }
  }

  async deleteImage(imageUrl: string): Promise<boolean> {
    if (!this.isFirebaseAvailable || !storage || imageUrl.startsWith("blob:")) {
      return true; // Can't delete blob URLs, but that's okay
    }

    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      return true;
    } catch (error) {
      console.error("Failed to delete image from Firebase:", error);
      return false;
    }
  }

  // LocalStorage fallback methods
  private async getLocalTemplates(): Promise<EmailTemplate[]> {
    try {
      const stored = localStorage.getItem("email-templates");
      const STANDARD_NAMES = [
        "Orserdu RTE", "Orserdu SFMC", "Orserdu Unbranded",
        "Elzonris RTE", "Elzonris SFMC", "Elzonris Unbranded",
      ];

      if (!stored) {
        const sampleTemplates = this.getSampleTemplates().map(
          (template, index) => ({
            ...template,
            id: `sample-${index + 1}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
        localStorage.setItem("email-templates", JSON.stringify(sampleTemplates));
        return sampleTemplates;
      }

      function templatesWithDates(items: any[]): EmailTemplate[] {
        return items.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
      }

      let templates = templatesWithDates(JSON.parse(stored));

      // Seed any missing standard templates
      const existingNames = templates.filter((t: EmailTemplate) => !t.isUserCreated).map((t: EmailTemplate) => t.name);
      const missing = this.getSampleTemplates().filter(s => !existingNames.includes(s.name));
      if (missing.length > 0) {
        const newOnes = missing.map((t, i) => ({
          ...t,
          id: `sample-${Date.now()}-${i}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        templates = [...templates, ...newOnes];
        localStorage.setItem("email-templates", JSON.stringify(templates));
      }

      return templates;
    } catch (error) {
      console.error("Failed to load templates from localStorage:", error);
      return [];
    }
  }

  private async getLocalTemplate(id: string): Promise<EmailTemplate | null> {
    const templates = await this.getLocalTemplates();
    return templates.find((t) => t.id === id) || null;
  }

  private async createLocalTemplate(
    data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<EmailTemplate> {
    const templates = await this.getLocalTemplates();
    const newTemplate: EmailTemplate = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    templates.unshift(newTemplate);
    localStorage.setItem("email-templates", JSON.stringify(templates));
    return newTemplate;
  }

  private async updateLocalTemplate(
    id: string,
    updates: Partial<EmailTemplate>
  ): Promise<EmailTemplate | null> {
    const templates = await this.getLocalTemplates();
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) return null;

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date(),
    };
    localStorage.setItem("email-templates", JSON.stringify(templates));
    return templates[index];
  }

  private async deleteLocalTemplate(id: string): Promise<boolean> {
    const templates = await this.getLocalTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    if (filtered.length === templates.length) return false;

    localStorage.setItem("email-templates", JSON.stringify(filtered));
    return true;
  }

  // Helper methods
  private deepCloneComponents(components: any[]): any[] {
    return components.map((component) => ({
      ...component,
      id: `${component.type}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      children: component.children
        ? this.deepCloneComponents(component.children)
        : undefined,
    }));
  }

  private getSampleTemplates(): Array<
    Omit<Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">, "components"> & {
      components: any[];
    }
  > {
    // Minimal placeholder component — just a header image slot and a text block
    const placeholderComponents = (brandLabel: string) => [
      {
        id: `header-${brandLabel}-1`,
        type: "header-image",
        src: "/header-placeholder.png",
        imageAlt: `${brandLabel} Header`,
        width: "100%",
        height: "auto",
        maxWidth: "600px",
      },
      {
        id: `body-${brandLabel}-1`,
        type: "text",
        content: `<p style="color:#333333;font-family:Arial,sans-serif;">Add your ${brandLabel} email content here.</p>`,
        fontSize: "14px",
        color: "#333333",
        textAlign: "left",
        fontWeight: "normal",
        padding: "20px 20px 10px 20px",
        backgroundColor: "#ffffff",
      },
    ];

    return [
      // ── Orserdu ───────────────────────────────────────────────────────────
      {
        name: "Orserdu RTE",
        description: "Orserdu RTE email template — edit to build your content",
        category: "rte",
        brand: "orserdu",
        components: placeholderComponents("Orserdu"),
        isUserCreated: false,
      },
      {
        name: "Orserdu SFMC",
        description: "Orserdu SFMC email template — edit to build your content",
        category: "sfmc",
        brand: "orserdu",
        components: placeholderComponents("Orserdu"),
        isUserCreated: false,
      },
      {
        name: "Orserdu Unbranded",
        description: "Orserdu Unbranded email template — edit to build your content",
        category: "unbranded",
        brand: "orserdu",
        components: placeholderComponents("Orserdu"),
        isUserCreated: false,
      },
      // ── Ferring ──────────────────────────────────────────────────────────
      {
        name: "Ferring RTE",
        description: "Ferring RTE email template — edit to build your content",
        category: "rte",
        brand: "ferring",
        components: placeholderComponents("Ferring"),
        isUserCreated: false,
      },
      {
        name: "Ferring SFMC",
        description: "Ferring SFMC email template — edit to build your content",
        category: "sfmc",
        brand: "ferring",
        components: placeholderComponents("Ferring"),
        isUserCreated: false,
      },
      {
        name: "Ferring Unbranded",
        description: "Ferring Unbranded email template — edit to build your content",
        category: "unbranded",
        brand: "ferring",
        components: placeholderComponents("Ferring"),
        isUserCreated: false,
      },
      {
        name: "Elzonris RTE",
        description: "Elzonris RTE email template — edit to build your content",
        category: "rte",
        brand: "elzonris",
        components: placeholderComponents("Elzonris"),
        isUserCreated: false,
      },
      {
        name: "Elzonris SFMC",
        description: "Elzonris SFMC email template — edit to build your content",
        category: "sfmc",
        brand: "elzonris",
        components: placeholderComponents("Elzonris"),
        isUserCreated: false,
      },
      {
        name: "Elzonris Unbranded",
        description: "Elzonris Unbranded email template — edit to build your content",
        category: "unbranded",
        brand: "elzonris",
        components: placeholderComponents("Elzonris"),
        isUserCreated: false,
      },
    ];
  }
  // VSB Operations
  async getVSBs(templateId: string): Promise<any[]> {
    if (!this.isFirebaseAvailable) return [];
    try {
      const q = query(collection(db, this.vsbsCollection));
      const querySnapshot = await getDocs(q);
      const vsbs: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.templateId === templateId) {
          vsbs.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          });
        }
      });
      return vsbs;
    } catch (error) {
      console.error("Failed to fetch VSBs:", error);
      return [];
    }
  }

  async getAllAllVSBs(): Promise<any[]> {
    if (!this.isFirebaseAvailable) return [];
    try {
      const q = query(collection(db, this.vsbsCollection));
      const querySnapshot = await getDocs(q);
      const vsbs: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vsbs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        });
      });
      return vsbs;
    } catch (error) {
      console.error("Failed to fetch all VSBs:", error);
      return [];
    }
  }

  async createVSB(data: any): Promise<any> {
    if (!this.isFirebaseAvailable) return null;
    try {
      const docRef = await addDoc(collection(db, this.vsbsCollection), {
        ...removeUndefinedDeep(data),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error("Failed to create VSB:", error);
      return null;
    }
  }

  async updateVSB(id: string, updates: any): Promise<boolean> {
    if (!this.isFirebaseAvailable) return false;
    try {
      const docRef = doc(db, this.vsbsCollection, id);
      await updateDoc(docRef, {
        ...removeUndefinedDeep(updates),
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error("Failed to update VSB:", error);
      return false;
    }
  }

  async deleteVSB(id: string): Promise<boolean> {
    if (!this.isFirebaseAvailable) return false;
    try {
      await deleteDoc(doc(db, this.vsbsCollection, id));
      return true;
    } catch (error) {
      console.error("Failed to delete VSB:", error);
      return false;
    }
  }

  async uploadVSBImage(file: File, templateId: string): Promise<string> {
    if (!this.isFirebaseAvailable || !storage) return "";
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const imagePath = `${this.vsbImagesPath}/${templateId}/${fileName}`;
      const imageRef = ref(storage, imagePath);
      const snapshot = await uploadBytes(imageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Failed to upload VSB image:", error);
      return "";
    }
  }

  async uploadVSBPDF(blob: Blob, templateId: string, vsbId: string): Promise<string> {
    if (!this.isFirebaseAvailable || !storage) return "";
    try {
      const fileName = `vsb_${Date.now()}.pdf`;
      const pdfPath = `${this.vsbPdfsPath}/${templateId}/${vsbId}/${fileName}`;
      const pdfRef = ref(storage, pdfPath);
      const snapshot = await uploadBytes(pdfRef, blob);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Failed to upload VSB PDF:", error);
      return "";
    }
  }
}

export const firebaseService = new FirebaseService();


