import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { User, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, orderBy, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { sendVerificationEmail } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';
import { Course } from '@/types/course';
import { UserProgress } from '../types';
import { normalizeCourse } from './utils';
import { CourseCardSkeleton } from '@/components/lms-loading';

const CourseCard = React.memo(function CourseCard({ course, progress, onSelect, user }: {
  course: Course;
  progress?: UserProgress;
  onSelect: () => void;
  user: User | null;
}) {
  const getProgressPercentage = () => {
    if (!progress) return 0;
    
    // Use requiredSelectionCount if specified (for Intermediate/Advanced courses)
    const denominator = (course.requiredSelectionCount && course.requiredSelectionCount > 0)
      ? course.requiredSelectionCount
      : course.modules.length;

    if (denominator === 0) {
      return progress.completed ? 100 : 0;
    }

    const completedCount = progress.completedModules.length;

    // If there's an overall quiz, modules account for 80% and quiz for 20%
    if (course.quiz && course.quiz.length > 0) {
      const moduleProgress = Math.min(completedCount / denominator, 1) * 80;
      const quizProgress = progress.completed ? 20 : 0;
      return Math.round(moduleProgress + quizProgress);
    }

    return Math.min(Math.round((completedCount / denominator) * 100), 100);
  };

  const isModulesFinished = progress && progress.completedModules.length >= (
    (course.requiredSelectionCount && course.requiredSelectionCount > 0)
      ? course.requiredSelectionCount
      : course.modules.length
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass rounded-2xl overflow-hidden hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-300 group cursor-pointer"
      onClick={onSelect}
    >
      <div className="relative h-48 bg-gray-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
        {course.thumbnail && course.thumbnail !== '/images/coming-soon.svg' ? (
          <Image
            src={course.thumbnail}
            alt={`${course.title} thumbnail`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-burgundy/20 to-amberD7/20 flex items-center justify-center">
            <div className="text-6xl opacity-30" aria-hidden="true">📚</div>
          </div>
        )}
        {(progress?.completed || isModulesFinished) && (
          <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-bold text-lg mb-2 group-hover:text-burgundy transition-colors">
          {course.title}
        </h3>

        <p className="text-sm opacity-70 mb-4 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {course.description}
        </p>

        <div className="flex items-center justify-between text-xs opacity-60 mb-4">
          <span>{course.duration}</span>
          <span>
            {(course.requiredSelectionCount && course.requiredSelectionCount > 0)
              ? `${course.requiredSelectionCount} required modules`
              : `${course.modules.length} modules`
            }
          </span>
        </div>

        {progress && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-burgundy to-amberD7 transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
                role="progressbar"
                aria-valuenow={getProgressPercentage()}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Course progress: ${getProgressPercentage()}%`}
              />
            </div>
          </div>
        )}

        <button
          className="w-full px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all font-semibold"
          aria-label={`${user ? (progress ? (progress.completed ? 'Review' : (isModulesFinished ? 'Final Quiz' : 'Continue')) : 'Start') : 'Sign in to Start'} ${course.title} course`}
        >
          {!user 
            ? 'Sign in to Start' 
            : progress 
              ? (progress.completed 
                  ? 'Review Course' 
                  : (isModulesFinished 
                      ? (course.quiz && course.quiz.length > 0 ? 'Take Final Quiz' : 'Review Course')
                      : 'Continue Learning'
                    )
                ) 
              : 'Start Course'}
        </button>
      </div>
    </motion.div>
  );
});

// We expose a prop to tell the parent (page.tsx) that a course was selected,
// so the parent can render the CourseViewer.
export function Dashboard({
  user,
  onRequestLogin,
  onCourseSelect
}: {
  user: User | null;
  onRequestLogin: () => void;
  onCourseSelect?: (course: Course, progress: UserProgress, updateProgress: (p: UserProgress) => void) => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<{ [courseId: string]: UserProgress }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const isInitialisedRef = useRef(false);

  const categories = useMemo(() => {
    const unique = new Set<string>(['All']);
    courses.forEach((course) => unique.add(course.category));
    if (unique.size === 1) {
      ['Beginner', 'Intermediate', 'Advanced', 'Supplementary'].forEach((preset) => unique.add(preset));
    }
    return Array.from(unique);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const order = ['Beginner', 'Intermediate', 'Advanced', 'Supplementary'];

    return courses
      .filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const indexA = order.indexOf(a.category);
        const indexB = order.indexOf(b.category);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        return a.title.localeCompare(b.title);
      });
  }, [courses, searchTerm, selectedCategory]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesQuery = query(collection(db, 'courses'), orderBy('title', 'asc'));
        const snapshot = await getDocs(coursesQuery);
        const nextCourses = snapshot.docs.map(normalizeCourse);
        setCourses(nextCourses);
        setCourseError(null);
      } catch (error) {
        console.error('Error loading courses:', error);
        setCourseError('Failed to load courses. Please try again later.');
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const loadUserProgress = async () => {
    if (!user) return;
    setIsLoadingProgress(true);
    setProgressError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { progress: {}, createdAt: serverTimestamp() }, { merge: true });
        setUserProgress({});
        return;
      }
      const data: any = snap.data();
      const raw = (data?.progress || {}) as { [courseId: string]: any };
      const deserialized: { [courseId: string]: UserProgress } = {};
      Object.entries(raw).forEach(([courseId, p]) => {
        deserialized[courseId] = {
          ...p,
          startedAt: p?.startedAt?.toDate ? p.startedAt.toDate() : p?.startedAt || new Date(),
          completedAt: p?.completedAt?.toDate ? p.completedAt.toDate() : p?.completedAt,
          updatedAt: p?.updatedAt?.toDate ? p.updatedAt.toDate() : p?.updatedAt,
        } as UserProgress;
      });
      setUserProgress(deserialized);
    } catch (error) {
      console.error('Error loading user progress:', error);
      setProgressError('Failed to load your progress. Please try refreshing the page.');
    } finally {
      setIsLoadingProgress(false);
      isInitialisedRef.current = true;
    }
  };

  useEffect(() => {
    if (user) {
      loadUserProgress();
    } else {
      isInitialisedRef.current = false;
      setUserProgress({});
      setIsLoadingProgress(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateUserProgress = async (courseId: string, progress: UserProgress) => {
    if (!user || !isInitialisedRef.current) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newProgress: UserProgress = { ...progress, updatedAt: new Date() };

      setUserProgress(prev => ({ ...prev, [courseId]: newProgress }));

      // Sanitize progress to remove undefined values for Firestore
      const sanitizedProgress = JSON.parse(JSON.stringify(progress, (key, value) =>
        value === undefined ? null : value
      ));

      await updateDoc(userRef, {
        [`progress.${courseId}`]: {
          ...sanitizedProgress,
          startedAt: progress.startedAt || new Date(), // Important for dates
          completedAt: progress.completedAt || null,
          updatedAt: serverTimestamp(),
        }
      });

      trackEvent('course_progress_updated', {
        courseId,
        completed: progress.completed,
        modulesCompleted: progress.completedModules.length
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      loadUserProgress();
    }
  };

  const graduationStats = useMemo(() => {
    const beginnerCourse = courses.find(c => c.id === 'beginner-course');
    const intermediateCourse = courses.find(c => c.id === 'intermediate-course');
    const advancedCourse = courses.find(c => c.id === 'advanced-course');

    const beginnerTotal = beginnerCourse?.modules.length || 0;
    
    // Count how many of the currently required modules they have actually completed
    const beginnerDone = beginnerCourse?.modules.filter(m => 
      userProgress['beginner-course']?.completedModules?.includes(m.id)
    ).length || 0;
    
    const beginnerCompleted = beginnerTotal > 0 && beginnerDone === beginnerTotal;
    
    const intermediateRequired = intermediateCourse?.requiredSelectionCount || 1;
    const intermediateDone = userProgress['intermediate-course']?.completedModules?.length || 0;

    const advancedRequired = advancedCourse?.requiredSelectionCount || 2;
    const advancedDone = userProgress['advanced-course']?.completedModules?.length || 0;

    return {
      beginner: { done: beginnerDone, total: beginnerTotal, met: beginnerCompleted },
      intermediate: { done: intermediateDone, total: intermediateRequired, met: intermediateDone >= intermediateRequired },
      advanced: { done: advancedDone, total: advancedRequired, met: advancedDone >= advancedRequired }
    };
  }, [courses, userProgress]);

  const isLMSCompleted = useMemo(() => {
    if (isLoadingCourses || isLoadingProgress) return false;
    return graduationStats.beginner.met && graduationStats.intermediate.met && graduationStats.advanced.met;
  }, [graduationStats, isLoadingCourses, isLoadingProgress]);

  const handleResendEmail = async () => {
    if (!user) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      await sendVerificationEmail(user.email!, user.displayName || '');
      setResendStatus('Verification email sent! Please check your inbox.');
    } catch (e: any) {
      setResendStatus('Error: ' + (e.message || 'Could not send email.'));
    } finally {
      setIsResending(false);
    }
  };

  // Auto-verification logic: checks status every 3s and when user returns to tab
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkVerification = async () => {
      if (user && !user.emailVerified) {
        try {
          await user.reload();
          if (user.emailVerified) {
            setTimeout(() => {
              // Intentionally blank, rely on user reload state map changing
            }, 3000);
          }
        } catch {
          // Silent fail for background polling
        }
      }
    };

    if (user && !user.emailVerified) {
      interval = setInterval(checkVerification, 3000);
      window.addEventListener('focus', checkVerification);
    }

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('focus', checkVerification);
    };
  }, [user]);

  // If user is logged in but NOT verified, show verification guard
  if (user && !user.emailVerified) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass rounded-2xl p-8 text-center shadow-2xl"
        >
          <div className="text-6xl mb-6 flex justify-center">
            <div className="relative">
              <span className="relative z-10">📧</span>
              <div className="absolute inset-0 bg-burgundy/20 blur-xl rounded-full"></div>
            </div>
          </div>
          <h2 className="heading-serif text-3xl font-bold text-burgundy mb-4">Check Your Inbox</h2>
          <p className="opacity-80 mb-8 leading-relaxed">
            We've sent a verification link to <strong>{user.email}</strong>.<br /><br />
            Please click the link in your email to unlock your D7 LMS account. This page will update automatically once verified.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white/5 text-sm opacity-70">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-burgundy"></div>
              Waiting for verification...
            </div>

            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full px-6 py-3 rounded-lg glass hover:bg-white/10 transition-all text-sm disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>

            {resendStatus && (
              <p className="text-sm text-amberD7 mt-2 animate-in fade-in duration-300">
                {resendStatus}
              </p>
            )}

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => signOut(auth)}
                className="text-sm opacity-60 hover:opacity-100 transition-opacity"
              >
                Sign out and use a different account
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-serif text-3xl font-bold">D7 LMS Dashboard</h1>
          <p className="text-sm opacity-70 mt-1">
            {user ? `Welcome back, ${user.displayName || user.email}` : 'Join us to start learning'}
          </p>
        </div>
        {user ? (
          <button
            onClick={() => signOut(auth)}
            className="px-4 py-2 rounded-lg glass hover:bg-white/20 dark:hover:bg-black/30 transition-all"
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={onRequestLogin}
            className="px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all"
          >
            Sign In
          </button>
        )}
      </div>

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Completion Banner */}
          {isLMSCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-3 glass border-2 border-green-500/30 rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 flex flex-col sm:flex-row items-center gap-6"
            >
              <div className="text-6xl sm:text-7xl animate-bounce">🎓</div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="heading-serif text-2xl sm:text-3xl font-bold text-green-400 mb-2">Congratulations, Graduate!</h2>
                <p className="text-base sm:text-lg opacity-90 leading-relaxed max-w-2xl">
                  You have successfully completed the core requirements of the Leo District 306 D7 LMS! 
                  By finishing all Beginner modules, plus essential Intermediate and Advanced content, 
                  you've demonstrated commitment to leadership excellence.
                  <br /><br />
                  <strong>You will be receiving your graduation certificate at the Annual District Conference of Leo District 306 D7.</strong>
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">✓ Beginner Mastered</span>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">✓ Intermediate Qualified</span>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">✓ Advanced Leadership</span>
                </div>
              </div>
            </motion.div>
          )}

          {!isLMSCompleted && (
            <div className="md:col-span-3 glass rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span>🎓</span> Graduation Progress
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-3 rounded-xl border ${graduationStats.beginner.met ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold">Beginner Course</span>
                    {graduationStats.beginner.met && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                  <div className="text-sm font-bold">{graduationStats.beginner.done}/{graduationStats.beginner.total} Modules</div>
                  <p className="text-[10px] opacity-50 mt-1">Complete all modules to graduate</p>
                </div>
                <div className={`p-3 rounded-xl border ${graduationStats.intermediate.met ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold">Intermediate Modules</span>
                    {graduationStats.intermediate.met && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                  <div className="text-sm font-bold">{graduationStats.intermediate.done}/{graduationStats.intermediate.total} Required</div>
                  <p className="text-[10px] opacity-50 mt-1">Complete at least 1 module</p>
                </div>
                <div className={`p-3 rounded-xl border ${graduationStats.advanced.met ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold">Advanced Modules</span>
                    {graduationStats.advanced.met && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                  <div className="text-sm font-bold">{graduationStats.advanced.done}/{graduationStats.advanced.total} Required</div>
                  <p className="text-[10px] opacity-50 mt-1">Complete at least 2 modules</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-burgundy/50 transition-all"
            aria-label="Search courses"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${selectedCategory === category
                ? 'bg-burgundy text-white'
                : 'glass hover:bg-white/20 dark:hover:bg-black/30'
                }`}
              aria-pressed={selectedCategory === category}
              aria-label={`Filter by ${category} courses`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Error States */}
      {courseError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
          role="alert"
        >
          <div className="text-red-400">⚠️</div>
          <div>
            <p className="text-red-400 font-medium">Error Loading Courses</p>
            <p className="text-sm opacity-70">{courseError}</p>
          </div>
        </motion.div>
      )}

      {progressError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
          role="alert"
        >
          <div className="text-red-400">⚠️</div>
          <div>
            <p className="text-red-400 font-medium">Error Loading Progress</p>
            <p className="text-sm opacity-70">{progressError}</p>
          </div>
          <button
            onClick={loadUserProgress}
            className="ml-auto px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-all text-sm"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingCourses ? (
          <CourseCardSkeleton count={6} />
        ) : isLoadingProgress ? (
          <CourseCardSkeleton count={6} />
        ) : (
          <AnimatePresence>
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                progress={userProgress[course.id]}
                onSelect={() => {
                  if (user) {
                    onCourseSelect?.(course, userProgress[course.id], (p) => updateUserProgress(course.id, p));
                    trackEvent('course_selected', { courseId: course.id, category: course.category });
                  } else {
                    onRequestLogin();
                  }
                }}
                user={user}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {filteredCourses.length === 0 && !isLoadingCourses && !isLoadingProgress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl opacity-20 mb-4" aria-hidden="true">📚</div>
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="opacity-70 mb-4">Try adjusting your search or filter criteria</p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all"
            >
              Clear Filters
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
