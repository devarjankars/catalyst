import { initializeApp, getApps } from "firebase/app"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"
import { getAuth, connectAuthEmulator } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDlgvxsqQ-wQ1hOuXkR0ZUSUu_0AK1PohE",
  authDomain: "med-email-builder.firebaseapp.com",
  projectId: "med-email-builder",
  storageBucket: "med-email-builder.firebasestorage.app",
  messagingSenderId: "250705978608",
  appId: "1:250705978608:web:51e8ebced1274fa8fc4e35"
};

export const firebaseProjectId = firebaseConfig.projectId;

// Use a project-specific app name so hot reload cannot reuse another project's app.
const appName = `email-builder-${firebaseConfig.projectId}`;
const app =
  getApps().find((existingApp) => existingApp.name === appName) ??
  initializeApp(firebaseConfig, appName);

// Initialize Firebase services with error handling
let db: any = null
let storage: any = null
let auth: any = null

try {
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)

} catch (error) {
  console.warn("Firebase services not available:", error)
}

export { db, storage, auth }
export default app
