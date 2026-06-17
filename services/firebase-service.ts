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
        console.log(data, "dhggfdgfg data fdrom firebase");
        console.log(
          "RAW Firestore data:",
          data.createdAt,
          data.updatedAt,
          typeof data.createdAt
        );

        templates.push({
          id: doc.id,
          ...data,
          createdAt: parseDate(data.createdAt),
          updatedAt: parseDate(data.updatedAt),
        } as EmailTemplate);
      });

      // Add sample templates if no templates exist
      if (templates.length === 0) {
        const sampleTemplates = this.getSampleTemplates();
        for (const template of sampleTemplates) {
          await this.createTemplate(template);
        }
        return this.getAllTemplates();
      }

      return templates;
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
        } as EmailComponent);
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

    console.log("Saving custom component with custom ID:", component.id);

    try {
      const docRef = doc(db, this.customComponentsCollection, component.id); // your custom ID
      await setDoc(docRef, {
        ...component,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return {
        ...component,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Failed to save custom component:", error);
      return component;
    }
  }

  async deleteCustomComponent(id: string): Promise<boolean> {
    if (!this.isFirebaseAvailable) {
      return true; // Fallback to local deletion
    }
    try {
      const docRef = doc(db, this.customComponentsCollection, id);
      console.log("Deleting custom component with ID in firebase:", docRef.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        console.log("Document not found. Cannot delete.");
      } else {
        console.log("Found doc, trying to delete...");
        await deleteDoc(docRef);
      }
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Failed to delete custom component:", error);
      return false; // Fallback to local deletion
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
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
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
      components: this.deepCloneComponents(template.components),
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
      // Check storage limit (e.g., 100MB = 100 * 1024 * 1024 bytes)
      const MAX_STORAGE_SIZE = 1 * 1024 * 1024; // 100MB
      const currentUsage = await this.getStorageUsage(templateId);

      console.log("toytal size", currentUsage, MAX_STORAGE_SIZE, file.size);

      if (!templateId) {
        return "PATH_NOT_FOUND"
      }

      if (currentUsage + file.size > MAX_STORAGE_SIZE) {
        console.log(
          `Storage limit exceeded. Current usage: ${(currentUsage / 1024 / 1024).toFixed(2)}MB, ` +
          `File size: ${(file.size / 1024 / 1024).toFixed(2)}MB, ` +
          `Limit: ${(MAX_STORAGE_SIZE / 1024 / 1024).toFixed(2)}MB`
        );
        return "MAX_LIMIT"
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
      if (!stored) {
        const sampleTemplates = this.getSampleTemplates().map(
          (template, index) => ({
            ...template,
            id: `sample-${index + 1}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
        localStorage.setItem(
          "email-templates",
          JSON.stringify(sampleTemplates)
        );
        return sampleTemplates;
      }
      const templates = JSON.parse(stored);
      return templates.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
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

  private getSampleTemplates(): Omit<
    EmailTemplate,
    "id" | "createdAt" | "updatedAt"
  >[] {
    return [
      {
        name: "Welcome Newsletter",
        description: "A warm welcome email template for new subscribers",
        category: "rte",
        components: [
          {
            id: "hero-1",
            type: "section",
            backgroundColor: "#4f46e5",
            padding: "40px 20px",
            borderRadius: "8px",
            direction: "column",
            children: [
              {
                id: "hero-text-1",
                type: "text",
                content:
                  "<h1>Welcome to Our Community!</h1><p>Thank you for joining us. We're excited to have you aboard.</p>",
                fontSize: "24px",
                color: "#ffffff",
                textAlign: "center",
                fontWeight: "bold",
                padding: "20px",
              },
            ],
          },
        ],
        thumbnail:
          "/placeholder.svg?height=200&width=300&text=Welcome Newsletter",
        isUserCreated: false,
      },
      {
        name: "Product Launch",
        description: "Announce your latest product with style",
        category: "sfmc",
        components: [
          {
            id: "product-section-1",
            type: "section",
            backgroundColor: "#ffffff",
            padding: "30px",
            direction: "row",
            children: [
              {
                id: "product-image-1",
                type: "image",
                src: "/placeholder.svg?height=300&width=300&text=Product Image",
                alt: "New Product",
                width: "100%",
                padding: "10px",
              },
              {
                id: "product-text-1",
                type: "text",
                content:
                  "<h2>Introducing Our Latest Innovation</h2><p>Experience the future with our groundbreaking new product.</p>",
                fontSize: "18px",
                color: "#333333",
                padding: "10px",
              },
            ],
          },
        ],
        thumbnail: "/placeholder.svg?height=200&width=300&text=Product Launch",
        isUserCreated: false,
      },
      {
        name: "Simple Newsletter",
        description: "Clean and minimal newsletter template",
        category: "unbranded",
        components: [
          {
            id: "simple-text-1",
            type: "text",
            content:
              "<h2>Monthly Update</h2><p>Here's what's been happening this month...</p>",
            fontSize: "16px",
            color: "#444444",
            padding: "20px",
          },
          {
            id: "simple-divider-1",
            type: "divider",
            height: "2px",
            backgroundColor: "#e5e7eb",
            margin: "20px 0",
          },
        ],
        thumbnail:
          "/placeholder.svg?height=200&width=300&text=Simple Newsletter",
        isUserCreated: false,
      },
      {
        name: "ORSERDU Standard Template",
        description: "Professional pharmaceutical template featuring ORSERDU medication information",
        category: "rte",
        components: [
          {
            id: "header-section",
            type: "section",
            backgroundColor: "#f5f5f5",
            padding: "30px 20px",
            borderRadius: "0px",
            direction: "column",
            children: [
              {
                id: "header-title",
                type: "text",
                content: "<h1 style=\"color: #1a1a1a; text-align: center; margin: 0;\">Dr. Adam Brufsky on ORSERDU's utility in various patient types</h1>",
                fontSize: "24px",
                color: "#1a1a1a",
                textAlign: "center",
                fontWeight: "bold",
                padding: "20px 0px",
              },
            ],
          },
          {
            id: "doctor-info-section",
            type: "section",
            backgroundColor: "#ffffff",
            padding: "30px 20px",
            borderRadius: "0px",
            direction: "column",
            children: [
              {
                id: "doctor-greeting",
                type: "text",
                content: "<p>Dear [Recipient],</p><p>I hope this email finds you well. Thank you for the opportunity to discuss ORSERDU with you.</p>",
                fontSize: "14px",
                color: "#333333",
                padding: "10px 0px",
              },
            ],
          },
          {
            id: "intro-section",
            type: "section",
            backgroundColor: "#ffffff",
            padding: "30px 20px",
            borderRadius: "0px",
            direction: "column",
            children: [
              {
                id: "intro-text",
                type: "text",
                content: "<h2>ORSERDU in Clinical Practice</h2><p>ORSERDU is approved to treat postmenopausal women or adult men with estrogen receptor (ER)-positive, HER2-negative breast cancer, following progression on prior endocrine therapy.</p>",
                fontSize: "16px",
                color: "#333333",
                padding: "15px 0px",
              },
              {
                id: "key-highlights",
                type: "bullet-list",
                listItems: [
                  "Multiple sites of metastases, including the brain",
                  "Complexities such as PIKCA mutations",
                ],
                markerColor: "#22c55e",
                discSize: "8px",
                spaceBetweenItems: "10px",
                padding: "15px 0px",
              },
            ],
          },
          {
            id: "quote-section",
            type: "section",
            backgroundColor: "#f0f9ff",
            padding: "25px 20px",
            borderRadius: "4px",
            direction: "column",
            margin: "20px 0px",
            children: [
              {
                id: "quote-text",
                type: "text",
                content: "<p style=\"font-style: italic; color: #1e40af; font-weight: 500;\">\"I found the data from the post hoc analysis of EMERALD to be remarkable in many different subsetting including patients with both ESR1 and PIK3CA mutations.\"</p>",
                fontSize: "14px",
                color: "#1e40af",
                padding: "10px 0px",
              },
              {
                id: "quote-note",
                type: "text",
                content: "<p style=\"color: #666666; font-size: 12px; margin-top: 10px;\"><strong>Note:</strong> ORSERDU is NOT indicated to target PIK3CA mutations.</p>",
                fontSize: "12px",
                color: "#666666",
              },
            ],
          },
          {
            id: "safety-section",
            type: "section",
            backgroundColor: "#ffffff",
            padding: "30px 20px",
            borderRadius: "0px",
            direction: "column",
            children: [
              {
                id: "safety-title",
                type: "text",
                content: "<h2>SELECT IMPORTANT SAFETY INFORMATION</h2>",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#1a1a1a",
                padding: "15px 0px",
              },
              {
                id: "safety-warning",
                type: "text",
                content: "<p><strong>Warnings and Precautions:</strong></p><p>Dyslipidemia: Hypercholesterolemia and hypertriglyceridemia occurred in patients taking ORSERDU. Monitor lipid profile prior to starting and periodically while taking ORSERDU.</p><p>Hepatic Impairment: ORSERDU may cause liver toxicity when administered to pregnant women. Advise pregnant women of the potential risk of harm to a fetus.</p>",
                fontSize: "13px",
                color: "#333333",
                padding: "10px 0px",
              },
              {
                id: "adverse-reactions-title",
                type: "text",
                content: "<p><strong>Adverse Reactions:</strong></p>",
                fontSize: "13px",
                fontWeight: "bold",
                color: "#333333",
                padding: "15px 0px 5px 0px",
              },
              {
                id: "adverse-list",
                type: "bullet-list",
                listItems: [
                  "Serious adverse reactions occurred in 12% of patients",
                  "Most common serious adverse reactions: 11% myocardial infarction, 8% cerebrovascular accident",
                  "Other serious adverse reactions: arrhythmia, arterial thrombosis, venous thromboembolism",
                ],
                markerColor: "#ef4444",
                discSize: "8px",
                spaceBetweenItems: "8px",
                padding: "10px 0px",
              },
            ],
          },
          {
            id: "indication-section",
            type: "section",
            backgroundColor: "#fafaf9",
            padding: "25px 20px",
            borderRadius: "4px",
            direction: "column",
            children: [
              {
                id: "indication-title",
                type: "text",
                content: "<h3>INDICATION</h3>",
                fontSize: "15px",
                fontWeight: "bold",
                color: "#1a1a1a",
              },
              {
                id: "indication-text",
                type: "text",
                content: "<p>ORSERDU (elacestrant) is indicated for the treatment of postmenopausal women or adult men with estrogen receptor (ER)-positive, HER2-negative breast cancer, following progression on prior endocrine therapy.</p>",
                fontSize: "13px",
                color: "#333333",
                padding: "10px 0px",
              },
            ],
          },
          {
            id: "footer-section",
            type: "section",
            backgroundColor: "#f3f4f6",
            padding: "25px 20px",
            borderRadius: "0px",
            direction: "column",
            children: [
              {
                id: "footer-text",
                type: "text",
                content: "<p>For more information about ORSERDU, visit the prescribing information.</p><p style=\"margin-top: 15px; color: #666666; font-size: 12px;\">To report SUSPECTED ADVERSE REACTIONS, contact Stemline Therapeutics, Inc. at 1-800-XXX-XXXX or FDA at www.fda.gov/medwatch.</p>",
                fontSize: "13px",
                color: "#333333",
                padding: "10px 0px",
              },
            ],
          },
        ],
        thumbnail:
          "/placeholder.svg?height=200&width=300&text=ORSERDU Template",
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
