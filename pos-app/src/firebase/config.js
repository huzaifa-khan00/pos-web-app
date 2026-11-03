// ─────────────────────────────────────────────────────────────
//  FIREBASE CONFIG — the ONLY thing you need to add later.
//  Create a file named ".env" in the project root (copy .env.example)
//  and paste your Firebase web-app values. Until then the app runs
//  fully on browser localStorage with demo data.
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let db = null;
if (isFirebaseConfigured) {
  try {
    db = getFirestore(initializeApp(firebaseConfig));
  } catch (err) {
    console.error('Firebase init failed, falling back to local storage:', err);
  }
}

export { db };
