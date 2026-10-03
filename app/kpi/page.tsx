'use client';

import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../providers/firebase-provider';
import { onAuthStateChanged, User } from 'firebase/auth';
import { KpiAuth } from '@/components/kpi/kpi-auth';
import { KpiDashboard } from '@/components/kpi/kpi-dashboard';
import { Loader2 } from 'lucide-react';

export default function KpiPage() {
  const { auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [auth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 animate-spin text-maroon mb-4" />
        <p className="text-xl heading-serif font-bold text-maroon/70">Connecting securely...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 md:px-8">
      {!user ? <KpiAuth /> : <KpiDashboard user={user} />}
    </div>
  );
}
