'use client';

import React, { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { useFirebase } from '../../providers/firebase-provider';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { RoleMapper } from '@/components/kpi/role-mapper';
import { KpiForm } from '@/components/kpi/kpi-form';
import { Loader2, LogOut, CheckCircle2, Medal } from 'lucide-react';

export function KpiDashboard({ user }: { user: User }) {
  const { auth, db } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [existingEval, setExistingEval] = useState<any>(null);

  useEffect(() => {
    if (!db || !user) return;
    
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [userSnap, evalSnap] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDoc(doc(db, 'evaluations', user.uid))
        ]);
        if (isMounted) {
          if (userSnap.exists()) setUserData(userSnap.data());
          if (evalSnap.exists()) setExistingEval(evalSnap.data());
        }
      } catch (err) {
        console.error("Failed to fetch user mapping or eval", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [db, user]);

  const handleRoleMapped = async (roleData: any) => {
    setLoading(true);
    try {
      if (!db) return;
      const docRef = doc(db, 'users', user.uid);
      const dataToSave = {
        email: user.email || '',
        mappedRole: roleData,
        createdAt: serverTimestamp(),
      };
      await setDoc(docRef, dataToSave);
      setUserData(dataToSave);
    } catch (e) {
      console.error(e);
      alert('Error saving your details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-maroon mb-4" />
        <p className="opacity-70 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  const renderSubmissionResult = () => {
    const totalRaw = existingEval?.totalScore || 0;
    const outOf100 = Math.round((totalRaw / 115) * 100);
    
    let rankLabel = "Participant";
    let rankColor = "text-gray-500 bg-gray-500/10 border-gray-500/20";
    let Icon = CheckCircle2;
    
    if (outOf100 >= 80) {
      rankLabel = "Gold Tier";
      rankColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
      Icon = Medal;
    } else if (outOf100 >= 60) {
      rankLabel = "Silver Tier";
      rankColor = "text-slate-400 bg-slate-400/10 border-slate-400/20";
      Icon = Medal;
    } else if (outOf100 >= 40) {
      rankLabel = "Bronze Tier";
      rankColor = "text-amber-700 bg-amber-700/10 border-amber-700/20";
      Icon = Medal;
    }

    return (
      <div className="surface-card p-12 rounded-2xl flex flex-col items-center text-center max-w-2xl mx-auto border-maroon/20 mt-10 shadow-glass">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg border-2 ${rankColor}`}>
          <Icon className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-maroon dark:text-petal mb-2 heading-serif">Evaluation Completed</h2>
        <div className={`inline-flex items-center px-4 py-1.5 rounded-full font-bold text-sm mb-6 border ${rankColor}`}>
          {rankLabel}
        </div>
        <p className="opacity-80 mb-6 max-w-md">Thank you for reflecting on your journey as a district officer. Your self-assessment has been successfully recorded and locked.</p>
        
        <div className="w-full bg-black/5 dark:bg-white/5 rounded-xl p-6 border border-black/5 dark:border-white/5">
          <div className="text-sm uppercase tracking-wider font-semibold opacity-60 mb-2">Your Preliminary Score</div>
          <div className="text-5xl font-bold font-mono text-maroon dark:text-rose-400">
            {outOf100} <span className="text-2xl opacity-50">/ 100</span>
          </div>
          <p className="text-xs opacity-50 mt-4 italic">* This score calculates your pure self-assessment. Final indices are subject to Admin review.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-8 border-b border-black/10 dark:border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold heading-serif text-maroon dark:text-petal">District Officer KPI Portal</h1>
          <p className="text-sm opacity-70">Logged in securely as {user.email}</p>
        </div>
        <button onClick={handleSignOut} className="px-4 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {!userData?.mappedRole ? (
        <RoleMapper onMapped={handleRoleMapped} />
      ) : existingEval ? (
        renderSubmissionResult()
      ) : (
        <KpiForm user={user} userData={userData} onComplete={(evalData) => setExistingEval(evalData)} />
      )}
    </div>
  );
}
