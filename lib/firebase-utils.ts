import { db, auth, storage } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query as buildQuery,
  orderBy,
  where,
  limit as queryLimit,
  serverTimestamp,
  type DocumentReference,
  type CollectionReference,
  type Query,
  type DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';

// Firebase availability check
export const isFirebaseAvailable = () => {
  return !!(db && auth && storage);
};

// Safe Firestore operations
export const safeCollection = (path: string): CollectionReference<DocumentData> | null => {
  return db ? collection(db, path) : null;
};

export const safeDoc = (path: string): DocumentReference<DocumentData> | null => {
  return db ? doc(db, path) : null;
};

export const safeGetDoc = async (docRef: DocumentReference<DocumentData>) => {
  if (!db || !docRef) return null;
  try {
    return await getDoc(docRef);
  } catch (error) {
    console.error('[firebase] getDoc error:', error);
    return null;
  }
};

export const safeGetDocs = async (query: Query<DocumentData>) => {
  if (!db || !query) return [];
  try {
    return await getDocs(query);
  } catch (error) {
    console.error('[firebase] getDocs error:', error);
    return [];
  }
};

export const safeSetDoc = async (docRef: DocumentReference<DocumentData>, data: any) => {
  if (!db || !docRef) return false;
  try {
    await setDoc(docRef, data);
    return true;
  } catch (error) {
    console.error('[firebase] setDoc error:', error);
    return false;
  }
};

export const safeUpdateDoc = async (docRef: DocumentReference<DocumentData>, data: any) => {
  if (!db || !docRef) return false;
  try {
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error('[firebase] updateDoc error:', error);
    return false;
  }
};

export const safeDeleteDoc = async (docRef: DocumentReference<DocumentData>) => {
  if (!db || !docRef) return false;
  try {
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('[firebase] deleteDoc error:', error);
    return false;
  }
};

export const safeOnSnapshot = (
  query: Query<DocumentData>,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
) => {
  if (!db || !query) {
    onError?.(new Error('Firebase not available'));
    return () => {}; // Return empty unsubscribe function
  }

  return onSnapshot(
    query,
    onNext,
    (error) => {
      console.error('[firebase] onSnapshot error:', error);
      onError?.(error);
    }
  );
};

// Safe query builders
export const safeBuildQuery = (
  collectionRef: CollectionReference<DocumentData>,
  ...constraints: any[]
) => {
  if (!collectionRef) return null;
  try {
    return buildQuery(collectionRef, ...constraints.filter(Boolean));
  } catch (error) {
    console.error('[firebase] buildQuery error:', error);
    return null;
  }
};

export const safeOrderBy = (field: string, direction?: 'asc' | 'desc') => {
  try {
    return orderBy(field, direction);
  } catch (error) {
    console.error('[firebase] orderBy error:', error);
    return null;
  }
};

export const safeWhere = (field: string, op: any, value: any) => {
  try {
    return where(field, op, value);
  } catch (error) {
    console.error('[firebase] where error:', error);
    return null;
  }
};

export const safeLimit = (limit: number) => {
  try {
    return queryLimit(limit);
  } catch (error) {
    console.error('[firebase] limit error:', error);
    return null;
  }
};

// Safe auth operations
export const safeSignIn = async (email: string, password: string) => {
  if (!auth) return null;
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('[firebase] signIn error:', error);
    return null;
  }
};

export const safeCreateUser = async (email: string, password: string) => {
  if (!auth) return null;
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('[firebase] createUser error:', error);
    return null;
  }
};

export const safeSignOut = async () => {
  if (!auth) return false;
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('[firebase] signOut error:', error);
    return false;
  }
};

export const safeOnAuthStateChanged = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};

// Safe storage operations
export const safeStorageRef = (path: string) => {
  return storage ? ref(storage, path) : null;
};

export const safeUploadBytes = async (storageRef: any, data: Blob | Uint8Array) => {
  if (!storage || !storageRef) return null;
  try {
    return await uploadBytes(storageRef, data);
  } catch (error) {
    console.error('[firebase] uploadBytes error:', error);
    return null;
  }
};

export const safeGetDownloadURL = async (storageRef: any) => {
  if (!storage || !storageRef) return null;
  try {
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('[firebase] getDownloadURL error:', error);
    return null;
  }
};

export const safeDeleteObject = async (storageRef: any) => {
  if (!storage || !storageRef) return false;
  try {
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('[firebase] deleteObject error:', error);
    return false;
  }
};

// Server timestamp
export const safeServerTimestamp = () => {
  return serverTimestamp();
};