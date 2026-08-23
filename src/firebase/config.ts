import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

// Firebase configuration schema
export interface CustomFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

// 1. Strictly read from Vite import.meta.env
const metaEnv = (import.meta as any).env || {};

export const rawFirebaseConfig: CustomFirebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '',
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Check if all mandatory keys are provided
export function getMissingFirebaseKeys(): string[] {
  const missing: string[] = [];
  if (!rawFirebaseConfig.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!rawFirebaseConfig.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!rawFirebaseConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!rawFirebaseConfig.appId) missing.push('VITE_FIREBASE_APP_ID');
  return missing;
}

export function isFirebaseConfigured(): boolean {
  return getMissingFirebaseKeys().length === 0;
}

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
  if (isFirebaseConfigured()) {
    app = initializeApp(rawFirebaseConfig);
  } else {
    // If not configured, initialize with blank placeholder so module exports don't crash before UI renders banner
    app = initializeApp({
      apiKey: 'missing-api-key',
      authDomain: 'missing-auth-domain',
      projectId: 'missing-project-id',
      appId: 'missing-app-id',
    }, '[UNCONFIGURED_APP]');
  }
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Test connection on boot
export async function testFirestoreConnection(classId?: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  if (!classId) return true;
  try {
    await getDocFromServer(doc(db, 'classes', classId));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline. Operating with cache/offline persistence.');
    }
    return false;
  }
}

// Error handling helper as per Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}
