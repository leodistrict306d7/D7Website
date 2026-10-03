// Lightweight analytics helper
// Uses GA (gtag) if available; falls back to Firestore 'events' collection
"use client";
import { db } from './firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { onAuth } from './auth';

let currentUid: string | null = null;
onAuth((u) => { currentUid = u?.uid ?? null; });

export async function trackEvent(name: string, data: Record<string, unknown> = {}) {
  try {
    // Prefer GA via gtag if present
    if (typeof window !== 'undefined' && 'gtag' in window && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', name, data);
      return;
    }
  } catch {}

  try {
    await addDoc(collection(db, 'events'), {
      name,
      data,
      uid: currentUid,
      at: serverTimestamp(),
    });
  } catch {
    // no-op on failure
  }
}