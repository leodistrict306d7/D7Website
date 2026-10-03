"use client";
import { auth, db } from './firebase';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

export type UserRole = 'member' | 'trainer' | 'admin' | 'superadmin';

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  mylci?: string; // unique ID
  leoDistrict?: string;
  leoClubType?: string;
  leoClub?: string;
  createdAt?: unknown;
};

export function onAuth(cb: (user: User | null) => void) {
  if (!auth) {
    cb(null);
    return () => { };
  }
  return onAuthStateChanged(auth, cb);
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as AppUser) : null;
}

// Check MyLCI availability with a single read (no write), safe to call before account creation.
async function isMyLCIAvailable(mylci: string): Promise<boolean> {
  if (!mylci.trim()) return false;
  const mylciRef = doc(db, 'mylci', mylci.trim());
  const snap = await getDoc(mylciRef);
  return !snap.exists();
}

// Enforce MyLCI uniqueness using a mapping collection: mylci/{id} -> { uid }
async function claimMyLCI(mylci: string, uid: string) {
  const mylciRef = doc(db, 'mylci', mylci);
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const lock = await tx.get(mylciRef);
    if (lock.exists()) {
      throw new Error('This MyLCI number is already registered.');
    }
    tx.set(mylciRef, { uid, createdAt: serverTimestamp() });
    tx.set(userRef, { mylci }, { merge: true });
  });
}

export async function registerWithEmail(params: {
  email: string;
  password: string;
  displayName: string;
  mylci: string; // must be unique
  leoDistrict: string;
  leoClubType?: string;
  leoClub: string;
}) {
  const { email, password, displayName, mylci, leoDistrict, leoClubType, leoClub } = params;

  // Check MyLCI uniqueness BEFORE creating the account to avoid orphaned auth accounts.
  const available = await isMyLCIAvailable(mylci);
  if (!available) {
    throw { code: 'custom/mylci-taken', message: 'This MyLCI number is already registered. Please check your number or contact support.' };
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(cred.user, { displayName });

  // Send Branded Verification Email via our API
  try {
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });
    if (!response.ok) {
      const errData = await response.json();
      console.error('[Auth] Verification email request FAILED:', errData.error);
    }
  } catch (error) {
    console.error('[Auth] Failed to send branded verification email (Network Error):', error);
  }

  // Create profile first with role = member by default
  const userRef = doc(db, 'users', cred.user.uid);
  await setDoc(userRef, {
    uid: cred.user.uid,
    email,
    displayName,
    role: 'member',
    mylci,
    leoDistrict,
    ...(leoClubType ? { leoClubType } : {}),
    leoClub,
    createdAt: serverTimestamp(),
  } as AppUser);

  // Attempt to claim MyLCI (unique)
  try {
    await claimMyLCI(mylci, cred.user.uid);
  } catch (err) {
    // If the final claim fails (edge-case double registration), delete the orphan account.
    try { await cred.user.delete(); } catch { /* best-effort cleanup */ }
    throw err;
  }
  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  await ensureUserDoc(user);
  return user;
}

export async function loginWithMicrosoft() {
  const provider = new OAuthProvider('microsoft.com');
  const { user } = await signInWithPopup(auth, provider);
  await ensureUserDoc(user);
  return user;
}

async function ensureUserDoc(user: User) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      role: 'member',
      createdAt: serverTimestamp(),
    } satisfies AppUser);
  }
}

export async function logout() {
  await signOut(auth);
}

export async function sendVerificationEmail(email: string, displayName?: string) {
  try {
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });
    if (!response.ok) {
      const errData = await response.json();
      console.error('[Auth] Resend API error:', errData.error);
    }
    return response;
  } catch (e) {
    console.error('[Auth] Resend network error:', e);
    throw e;
  }
}