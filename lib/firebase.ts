import { initializeApp, getApps } from "firebase/app"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"
import { getAuth, connectAuthEmulator } from "firebase/auth"

const firebaseConfig = {
  // apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  // authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  // messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  // appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id",
  apiKey: "AIzaSyDlgvxsqQ-wQ1hOuXkR0ZUSUu_0AK1PohE",
  authDomain: "med-email-builder.firebaseapp.com",
  projectId: "med-email-builder",
  storageBucket: "med-email-builder.firebasestorage.app",
  messagingSenderId: "250705978608",
  appId: "1:250705978608:web:51e8ebced1274fa8fc4e35"
}

// Initialize Firebase only if it hasn't been initialized
let app
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

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
