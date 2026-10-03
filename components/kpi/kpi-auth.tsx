'use client';

import React, { useState } from 'react';
import { useFirebase } from '../../providers/firebase-provider';
import { signInWithCustomToken } from 'firebase/auth';
import { Mail, KeyRound, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export function KpiAuth() {
  const { auth } = useFirebase();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setStep('OTP');
      setSuccessMsg('A 6-digit code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), otp })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      
      // We got the custom token, sign in
      if (!auth) throw new Error('Auth client not initialized');
      await signInWithCustomToken(auth, data.token);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 surface-card p-8 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 relative overflow-hidden">
      
      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gold/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white flex items-center justify-center rounded-full shadow-md mb-4 bg-gradient-to-tr from-maroon to-crimson">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold heading-serif text-maroon dark:text-rose mb-2">Secure KPI Login</h2>
          <p className="opacity-75 text-sm">Enter your preferred email to securely access your district performance portal.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
            {error}
          </div>
        )}
        
        {successMsg && step === 'OTP' && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-700 dark:text-green-400 text-sm rounded-lg text-center">
            {successMsg}
          </div>
        )}

        {step === 'EMAIL' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="leo@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-maroon/20 dark:border-rose/20 bg-white/50 dark:bg-black/30 focus:outline-none focus:ring-2 focus:ring-maroon dark:focus:ring-rose transition-all"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg btn-primary font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Send Verification Code <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">6-Digit Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-maroon/20 dark:border-rose/20 bg-white/50 dark:bg-black/30 focus:outline-none focus:ring-2 focus:ring-maroon dark:focus:ring-rose transition-all text-center tracking-widest text-xl font-bold"
                  required
                  maxLength={6}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 rounded-lg btn-primary font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('EMAIL');
                setOtp('');
                setError('');
                setSuccessMsg('');
              }}
              className="w-full py-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
