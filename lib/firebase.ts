// Firebase client SDK initialization
// Replace env variables with your Firebase config
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Check if all required config values are present
  const isValid = config.apiKey && config.projectId && config.appId;

  if (!isValid) {
    console.warn('[firebase] Missing required Firebase configuration. Firebase features will be disabled.');
    return null;
  }

  return config;
};

const firebaseConfig = validateFirebaseConfig();

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (firebaseConfig) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('[firebase] Failed to initialize Firebase:', error);
  }
} else {
  console.warn('[firebase] Firebase initialization skipped due to missing configuration');
}

export { auth, db, storage };