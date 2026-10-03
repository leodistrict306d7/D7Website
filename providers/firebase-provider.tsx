'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { auth, db, storage } from '@/lib/firebase';

interface FirebaseContextType {
  auth: typeof auth;
  db: typeof db;
  storage: typeof storage;
  isFirebaseAvailable: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const isFirebaseAvailable = !!(auth && db && storage);

  const contextValue: FirebaseContextType = {
    auth,
    db,
    storage,
    isFirebaseAvailable,
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function withFirebaseGuard<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType
) {
  return function WrappedComponent(props: P) {
    const { isFirebaseAvailable } = useFirebase();

    if (!isFirebaseAvailable) {
      const FallbackComponent = fallbackComponent || (() => (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Firebase Unavailable</h2>
          <p className="opacity-70">This feature requires Firebase connectivity. Please check your configuration.</p>
        </div>
      ));
      return <FallbackComponent />;
    }

    return <Component {...props} />;
  };
}