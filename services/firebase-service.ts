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
  serverTimestamp,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
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


 const parseDate = (value: any) => {
    if (!value) return new Date();
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(value);
    return new Date(); // fallback
  };

class FirebaseService {
  private templatesCollection = "email-templates";
  private imagesPath = "template-images";
  private isFirebaseAvailable = false;
  private customComponentsCollection = "custom-components";

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
      
      const querySnapshot = await getDocs(collection(db,this.templatesCollection));
      const templates: EmailTemplate[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(data,"dhggfdgfg data fdrom firebase");
        
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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

    try {
      const docRef = doc(db, this.templatesCollection, id);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      const cleanData = removeUndefinedDeep(updateData)

      await updateDoc(docRef, cleanData);
      return this.getTemplate(id);
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

  // Image operations
  async uploadImage(file: File, templateId?: string): Promise<string> {
    if (!this.isFirebaseAvailable || !storage) {
      // Fallback to creating a local blob URL for development
      return URL.createObjectURL(file);
    }

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const imagePath = templateId
        ? `${this.imagesPath}/${templateId}/${fileName}`
        : `${this.imagesPath}/general/${fileName}`;

      const imageRef = ref(storage, imagePath);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error("Failed to upload image to Firebase:", error);
      // Fallback to local blob URL
      return URL.createObjectURL(file);
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
    ];
  }
}

export const firebaseService = new FirebaseService();
