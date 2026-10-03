import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { registerWithEmail } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';

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

export function AuthCard({ isLogin, setIsLogin, onClose }: { isLogin: boolean; setIsLogin: (v: boolean) => void; onClose?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [myLCI, setMyLCI] = useState('');
  const [leoDistrict, setLeoDistrict] = useState('');
  const [leoClubType, setLeoClubType] = useState('');
  const [leoClub, setLeoClub] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Focus first focusable element when modal mounts
    if (modalRef.current) {
      const inputs = modalRef.current.querySelectorAll('input, button');
      if (inputs.length > 0) {
        (inputs[0] as HTMLElement).focus();
      }
    }
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, forgotPassword, isLogin, verificationSent]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsSendingReset(true);
    setForgotStatus(null);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotStatus('Reset email sent! Check your inbox (and spam folder).');
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === 'auth/user-not-found') {
        setForgotStatus('No account found for this email address.');
      } else if (code === 'auth/invalid-email') {
        setForgotStatus('Please enter a valid email address.');
      } else {
        setForgotStatus('Could not send reset email. Please try again.');
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  // Map Firebase auth error codes to friendly messages
  const getAuthErrorMessage = (code?: string, isLoginMode?: boolean) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or reset your password.';
      case 'auth/user-not-found':
        return 'No account found for this email address.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your internet connection and try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return isLoginMode ? 'Authentication failed.' : 'Password should be at least 6 characters.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        trackEvent('login', { method: 'password' });
      } else {
        // Validation for new fields
        if (!leoDistrict) throw { code: 'custom/missing-field', message: 'Please select a Leo District.' };
        if (leoDistrict === 'D7') {
          if (!leoClubType) throw { code: 'custom/missing-field', message: 'Please select a Club Type.' };
          if (!leoClub) throw { code: 'custom/missing-field', message: 'Please select your Leo Club.' };
        } else {
          if (!leoClub) throw { code: 'custom/missing-field', message: 'Please enter your Leo Club name.' };
        }

        // Use the robust registration function that checks MyLCI uniqueness
        await registerWithEmail({
          email,
          password,
          displayName: `${firstName} ${surname}`.trim(),
          mylci: myLCI,
          leoDistrict,
          leoClubType: leoDistrict === 'D7' ? leoClubType : undefined,
          leoClub
        });
        trackEvent('signup', { method: 'password' });
        setVerificationSent(true);
      }
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === 'custom/missing-field') {
        setError(err.message);
      } else {
        setError(getAuthErrorMessage(code, isLogin));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (forgotPassword) {
    return (
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass rounded-2xl p-6 relative shadow-2xl"
      >
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors opacity-70 hover:opacity-100" aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
        <h2 className="heading-serif text-2xl font-bold text-burgundy mb-2">Reset Password</h2>
        <p className="text-sm opacity-70 mb-4">Enter your email and we&apos;ll send you a reset link.</p>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <input
            type="email"
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            required
            placeholder="Email Address"
            className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all"
            aria-label="Email Address"
          />
          {forgotStatus && (
            <p className={`text-sm p-3 rounded-lg ${forgotStatus.startsWith('Reset email') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`} role="status" aria-live="polite">{forgotStatus}</p>
          )}
          <button type="submit" disabled={isSendingReset} className="w-full px-4 py-3 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all font-semibold disabled:opacity-50">
            {isSendingReset ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>
        <button onClick={() => setForgotPassword(false)} className="mt-4 w-full text-sm opacity-80 hover:opacity-100 transition-opacity">
          Back to Sign In
        </button>
      </motion.div>
    );
  }

  if (verificationSent) {
    return (
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass rounded-2xl p-8 relative shadow-2xl text-center"
      >
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
        <p className="opacity-80 mb-6">
          Registration successful! Please check your inbox (and spam folder) for a verification link sent to <strong>{email}</strong>.
        </p>
        <button
          onClick={() => {
            setVerificationSent(false);
            setIsLogin(true);
          }}
          className="px-6 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all font-semibold"
        >
          Back to Login
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={modalRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full glass rounded-2xl p-6 relative shadow-2xl"
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="text-center mb-6">
        <h1 className="heading-serif text-3xl font-bold text-burgundy">D7 LMS</h1>
        <p className="text-sm opacity-70 mt-2">Learning Management System</p>
      </div>

      <h2 className="heading-serif text-2xl font-semibold mb-4">{isLogin ? 'Welcome Back' : 'Join D7 LMS'}</h2>

      <form onSubmit={submit} className="space-y-4">
        {!isLogin && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="First Name"
                className="px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all"
                aria-label="First Name"
              />
              <input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                placeholder="Surname"
                className="px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all"
                aria-label="Surname"
              />
            </div>
            <input
              value={myLCI}
              onChange={(e) => setMyLCI(e.target.value)}
              required
              placeholder="MyLCI Number"
              className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all"
              aria-label="MyLCI Number"
            />

            {/* District Selection */}
            <select
              value={leoDistrict}
              onChange={(e) => {
                setLeoDistrict(e.target.value);
                setLeoClubType('');
                setLeoClub('');
              }}
              required
              className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all bg-transparent text-white dark:text-white"
              aria-label="Leo District"
            >
              <option value="" disabled className="bg-black text-white">Select Leo District</option>
              {districts.map(d => (
                <option key={d} value={d} className="bg-black text-white">{d}</option>
              ))}
            </select>

            {/* D7 Specific Logic */}
            {leoDistrict === 'D7' ? (
              <>
                <select
                  value={leoClubType}
                  onChange={(e) => {
                    setLeoClubType(e.target.value);
                    setLeoClub('');
                  }}
                  required
                  className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all bg-transparent text-white dark:text-white"
                  aria-label="Leo Club Type"
                >
                  <option value="" disabled className="bg-black text-white">Select Club Type</option>
                  <option value="Alpha" className="bg-black text-white">Alpha</option>
                  <option value="Omega" className="bg-black text-white">Omega</option>
                </select>

                {leoClubType && (
                  <select
                    value={leoClub}
                    onChange={(e) => setLeoClub(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all bg-transparent text-white dark:text-white"
                    aria-label="Leo Club"
                  >
                    <option value="" disabled className="bg-black text-white">Select Leo Club</option>
                    {(leoClubType === 'Alpha' ? alphaClubs : omegaClubs).map(club => (
                      <option key={club} value={club} className="bg-black text-white">{club}</option>
                    ))}
                  </select>
                )}
              </>
            ) : leoDistrict && (
              /* Non-D7 Logic */
              <input
                value={leoClub}
                onChange={(e) => setLeoClub(e.target.value)}
                required
                placeholder="Leo Club Name (e.g. Leo Club of ...)"
                className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all"
                aria-label="Leo Club Name"
              />
            )}
          </>
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          placeholder="Email Address"
          className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all"
          aria-label="Email Address"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          placeholder="Password"
          className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all"
          aria-label="Password"
        />

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
            role="alert"
            id="auth-error"
            aria-live="polite"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          aria-describedby={error ? 'auth-error' : undefined}
        >
          {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {isLogin && (
          <button
            type="button"
            onClick={() => { setForgotPassword(true); setError(null); }}
            className="w-full text-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            Forgot your password?
          </button>
        )}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-sm opacity-80 hover:opacity-100 transition-opacity"
        >
          {isLogin ? 'Need an account? Sign up here' : 'Already have an account? Sign in'}
        </button>
      </div>
    </motion.div>
  );
}
