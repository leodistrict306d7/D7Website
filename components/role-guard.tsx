"use client";
import React, { useEffect, useState } from 'react';
import { onAuth, getUserProfile, type UserRole } from '../lib/auth';
import Link from 'next/link';

// Guard component to protect routes by role
export function RoleGuard({ role, children }: { role: UserRole | UserRole[]; children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuth(async (fbUser) => {
      if (!fbUser) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      const profile = await getUserProfile(fbUser.uid);
      const needed = Array.isArray(role) ? role : [role];
      const adminEmails = ['thusalrana@gmail.com', 'gallagehansa@gmail.com'];
      const isHardcodedAdmin = fbUser.email && adminEmails.includes(fbUser.email);
      const canAccess = isHardcodedAdmin || (profile
        ? profile.role === 'superadmin' || needed.includes(profile.role)
        : false);
      setAllowed(canAccess);
      setLoading(false);
    });
    return () => unsub();
  }, [role]);

  if (loading) return <div className="text-sm opacity-70">Checking access…</div>;
  if (!allowed)
    return (
      <div className="space-y-3">
        <p className="text-red-500">Access denied. You do not have permission to view this page.</p>
        <Link className="underline" href="/auth/login">Go to Login</Link>
      </div>
    );
  return <>{children}</>;
}