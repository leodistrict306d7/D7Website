"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import LMSErrorBoundary from '@/components/lms-error-boundary';
import Breadcrumb from '@/components/breadcrumb';
import type { Course } from '@/types/course';
import { UserProgress } from './types';

// Components
import { Dashboard } from './components/Dashboard';
import { AuthCard } from './components/AuthCard';
import { CourseViewer } from './components/CourseViewer';

export default function LMSPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Selection State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeCourseProgress, setActiveCourseProgress] = useState<UserProgress | undefined>(undefined);
  const [activeUpdateProgress, setActiveUpdateProgress] = useState<((p: UserProgress) => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        setAuthError(null);
        setShowAuthModal(false);
      }
    }, (error) => {
      console.error('Auth state change error:', error);
      setAuthError('Authentication error. Please try again.');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleCourseSelect = (course: Course, progress: UserProgress, updateProgress: (p: UserProgress) => void) => {
    setSelectedCourse(course);
    setActiveCourseProgress(progress);
    setActiveUpdateProgress(() => updateProgress);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading LMS">
      <div className="glass rounded-2xl p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy mx-auto" aria-hidden="true"></div>
        <p className="mt-4 text-center" id="loading-text">Loading LMS...</p>
      </div>
    </div>
  );

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4 opacity-50">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
          <p className="text-sm opacity-70 mb-4">{authError}</p>
          <button
            onClick={() => {
              setAuthError(null);
              setLoading(true);
            }}
            className="px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <LMSErrorBoundary>
      {/* Skip Links for Accessibility */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
        <a
          href="#main-content"
          className="px-4 py-2 bg-burgundy text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/50"
        >
          Skip to main content
        </a>
      </div>

      <main id="main-content">
        {selectedCourse && activeUpdateProgress ? (
          <div className="p-2 sm:p-4">
            <Breadcrumb
              items={[
                { label: 'Dashboard', onClick: () => setSelectedCourse(null) },
                { label: selectedCourse.title, current: true }
              ]}
              className="mb-4"
            />
            <CourseViewer
              course={selectedCourse}
              onBack={() => setSelectedCourse(null)}
              userProgress={activeCourseProgress}
              onProgressUpdate={(newProgress) => {
                setActiveCourseProgress(newProgress);
                activeUpdateProgress(newProgress);
              }}
            />
          </div>
        ) : (
          <Dashboard
            user={user}
            onRequestLogin={() => setShowAuthModal(true)}
            onCourseSelect={handleCourseSelect}
          />
        )}
      </main>

      {/* Auth Modal Overlay */}
      {(!user && showAuthModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <AuthCard
            isLogin={isLogin}
            setIsLogin={setIsLogin}
            onClose={() => setShowAuthModal(false)}
          />
        </div>
      )}
    </LMSErrorBoundary>
  );
}