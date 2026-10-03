"use client";

export const dynamic = 'force-dynamic';
import React, { useState } from 'react';
import { loginWithEmail, loginWithGoogle, loginWithMicrosoft, registerWithEmail } from '../../../lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mylci, setMylci] = useState('');
  const [leoDistrict, setLeoDistrict] = useState('');
  const [leoClubType, setLeoClubType] = useState('');
  const [leoClub, setLeoClub] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lists from About Page
  const alphaClubs = [
    'Leo Club of Ananda College', 'Leo Club of Anula Vidyalaya', 'Leo Club of Ashoka Vidyalaya',
    'Leo Club of Bomiriya Central College', 'Leo Club of Carey College', 'Leo Club of Asian Grammar School',
    'Leo Club of Gankanda Central College', 'Leo Club of Isipathana College', 'Leo Club of Lumbini College',
    'Leo Club of Mahanama College', 'Leo Club of Mahinda Rajapaksha College', 'Leo Club of Ferguson High School',
    'Leo Club of Pannipitiya Dharmapala Vidyalaya', "Leo Club of President's College Maharagama",
    'Leo Club of Royal College', 'Leo Club of Sivali College', "Leo Club of St. Aloysius' College",
    "Leo Club of St. John's College", 'Leo Club of Thurstan College',
  ];
  const omegaClubs = [
    'Leo Club of Cinnamon Gardens', 'Leo Club of Colombo Eminence', 'Leo Club of Colombo Griffins',
    'Leo Club of Colombo Hogwarts', 'Leo Club of Colombo Knights', 'Leo Club of Defence Marshals',
    'Leo Club of Gothami Balika', 'Leo Club of Homagama Central', 'Leo Club of Kottawa Central Golden City',
    'Leo Club of Kuruwita Paradise', 'Leo Club of Maharagama Golden City', 'Leo Club of Nawala Metro',
    'Leo Club of National Institute of Business Management', 'Leo Club of Pannipitiya Metro Titans',
    'Leo Club of Pannipitiya Paradise', 'Leo Club of Sabaragamuwa University',
    'Leo Club of University of Sri Jayewardenepura',
  ];

  const districts = Array.from({ length: 12 }, (_, i) => `D${i + 1}`);

  const onLogin = async () => {
    setLoading(true); setError(null);
    try {
      await loginWithEmail(email, password);
      router.push('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    setLoading(true); setError(null);
    try {
      if (!leoDistrict) throw new Error('Please select a Leo District.');
      if (leoDistrict === 'D7') {
          if (!leoClubType) throw new Error('Please select a Club Type.');
          if (!leoClub) throw new Error('Please select your Leo Club.');
      } else {
          if (!leoClub) throw new Error('Please enter your Leo Club name.');
      }

      await registerWithEmail({ 
        email, 
        password, 
        displayName, 
        mylci,
        leoDistrict,
        leoClubType: leoDistrict === 'D7' ? leoClubType : undefined,
        leoClub
      });
      router.push('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">{tab === 'login' ? 'Sign in' : 'Create account'}</h1>
      <div className="flex gap-3 text-sm">
        <button className={`px-3 py-1 rounded ${tab==='login'?'bg-zinc-200 dark:bg-zinc-800':''}`} onClick={()=>setTab('login')}>Login</button>
        <button className={`px-3 py-1 rounded ${tab==='register'?'bg-zinc-200 dark:bg-zinc-800':''}`} onClick={()=>setTab('register')}>Register</button>
      </div>

      {tab === 'register' && (
        <>
          <label className="block text-sm">Display name</label>
          <input className="w-full p-2 rounded bg-transparent border" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} />
          <label className="block text-sm mt-3">MyLCI number</label>
          <input className="w-full p-2 rounded bg-transparent border" value={mylci} onChange={(e)=>setMylci(e.target.value)} placeholder="Unique membership ID" />
          
          <label className="block text-sm mt-3">Leo District</label>
          <select 
            className="w-full p-2 rounded bg-transparent border" 
            value={leoDistrict} 
            onChange={(e)=>{
              setLeoDistrict(e.target.value);
              setLeoClubType('');
              setLeoClub('');
            }}
          >
            <option value="" disabled className="bg-zinc-800">Select Leo District</option>
            {districts.map(d => (
              <option key={d} value={d} className="bg-zinc-800">{d}</option>
            ))}
          </select>

          {leoDistrict === 'D7' ? (
            <>
              <label className="block text-sm mt-3">Club Type</label>
              <select 
                className="w-full p-2 rounded bg-transparent border" 
                value={leoClubType} 
                onChange={(e)=>{
                  setLeoClubType(e.target.value);
                  setLeoClub('');
                }}
              >
                <option value="" disabled className="bg-zinc-800">Select Club Type</option>
                <option value="Alpha" className="bg-zinc-800">Alpha</option>
                <option value="Omega" className="bg-zinc-800">Omega</option>
              </select>

              {leoClubType && (
                <>
                  <label className="block text-sm mt-3">Leo Club</label>
                  <select 
                    className="w-full p-2 rounded bg-transparent border" 
                    value={leoClub} 
                    onChange={(e)=>setLeoClub(e.target.value)}
                  >
                    <option value="" disabled className="bg-zinc-800">Select Leo Club</option>
                    {(leoClubType === 'Alpha' ? alphaClubs : omegaClubs).map(club => (
                      <option key={club} value={club} className="bg-zinc-800">{club}</option>
                    ))}
                  </select>
                </>
              )}
            </>
          ) : leoDistrict && (
            <>
              <label className="block text-sm mt-3">Leo Club Name</label>
              <input 
                className="w-full p-2 rounded bg-transparent border" 
                value={leoClub} 
                onChange={(e)=>setLeoClub(e.target.value)} 
                placeholder="Leo Club of ..." 
              />
            </>
          )}
        </>
      )}

      <label className="block text-sm mt-3">Email</label>
      <input className="w-full p-2 rounded bg-transparent border" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <label className="block text-sm mt-3">Password</label>
      <input type="password" className="w-full p-2 rounded bg-transparent border" value={password} onChange={(e)=>setPassword(e.target.value)} />

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        {tab === 'login' ? (
          <button disabled={loading} onClick={onLogin} className="px-4 py-2 rounded bg-blue-600 text-white">Sign in</button>
        ) : (
          <button disabled={loading} onClick={onRegister} className="px-4 py-2 rounded bg-green-600 text-white">Create account</button>
        )}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button disabled={loading} onClick={async()=>{ await loginWithGoogle(); router.push('/'); }} className="px-4 py-2 rounded border">Google</button>
          <button disabled={loading} onClick={async()=>{ await loginWithMicrosoft(); router.push('/'); }} className="px-4 py-2 rounded border">Microsoft</button>
        </div>
      </div>
    </div>
  );
}