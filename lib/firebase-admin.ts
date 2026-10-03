import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

interface ServiceAccountConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

type ServiceAccountInput = Partial<ServiceAccountConfig> & {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function normalizePrivateKey(key: string): string {
  if (!key) return '';
  let normalized = key.replace(/^['"]|['"]$/g, '');
  normalized = normalized.replace(/\\n/g, '\n');
  if (normalized.includes('\n')) return normalized;
  return normalized
    .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
    .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
}

function toConfig(candidate: ServiceAccountInput | null | undefined): ServiceAccountConfig | null {
  if (!candidate) return null;
  const projectId = candidate.projectId ?? candidate.project_id;
  const clientEmail = candidate.clientEmail ?? candidate.client_email;
  const privateKey = candidate.privateKey ?? candidate.private_key;
  if (!projectId || !clientEmail || !privateKey) return null;
  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKey),
  };
}

function resolveServiceAccount(): ServiceAccountConfig {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (fromEnv) {
    try {
      const parsed = JSON.parse(fromEnv) as ServiceAccountInput;
      const credentials = toConfig(parsed);
      if (credentials) return credentials;
    } catch {}
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    try {
      const decoded = Buffer.from(base64, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded) as ServiceAccountInput;
      const credentials = toConfig(parsed);
      if (credentials) return credentials;
    } catch {}
  }

  const projectId = process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID ?? 
                    process.env.FIREBASE_PROJECT_ID ?? 
                    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
                    
  const clientEmail = process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL ?? 
                      process.env.FIREBASE_CLIENT_EMAIL;
                      
  let privateKey = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY ?? 
                   process.env.FIREBASE_PRIVATE_KEY;

  const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (base64Key) {
    try {
      privateKey = Buffer.from(base64Key, 'base64').toString('utf8');
    } catch {}
  }

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    };
  }

  const missing = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
  
  throw new Error(`Firebase admin credentials missing: ${missing.join(', ')}`);
}

let app: App | undefined;

function getAdminApp(): App | null {
  if (app) return app;

  try {
    const credentials = resolveServiceAccount();
    app = getApps().length > 0 ? getApp() : initializeApp({
      credential: cert({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey,
      }),
      projectId: credentials.projectId,
    });
    return app;
  } catch (error) {
    console.error('[firebase-admin] Initialization error:', error);
    return null;
  }
}

export function getAdminDb() {
  const adminApp = getAdminApp();
  return adminApp ? getFirestore(adminApp) : null;
}

export function getAdminAuth() {
  const adminApp = getAdminApp();
  return adminApp ? getAuth(adminApp) : null;
}