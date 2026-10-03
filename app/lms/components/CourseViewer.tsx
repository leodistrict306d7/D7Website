import { useState, useMemo, useEffect } from 'react';
import { Course, CourseModule } from '@/types/course';
import { UserProgress } from '../types';
import { QuizComponent } from './QuizComponent';
import { CourseSummary } from './CourseSummary';
import PdfReader from '@/components/pdf-reader';

// Add TypeScript declaration for YouTube iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function CourseViewer({ course, onBack, userProgress, onProgressUpdate }: {
  course: Course;
  onBack: () => void;
  userProgress?: UserProgress;
  onProgressUpdate: (progress: UserProgress) => void;
}) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [questionId: string]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [moduleQuizMode, setModuleQuizMode] = useState<{ moduleId: string } | null>(null);
  const [readProgress, setReadProgress] = useState<{ [moduleId: string]: { reachedEnd: boolean } }>({});
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<{ [moduleId: string]: { completed: boolean } }>({});

  // YouTube API initialization
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Determine effective module list depending on selection rules
  const effectiveModules = useMemo(() => {
    if (course.requiredSelectionCount && course.requiredSelectionCount > 0) {
      const selected = userProgress?.selectedModules || [];
      if (selected.length > 0) {
        return course.modules.filter(m => selected.includes(m.id));
      }
      // Return empty array if selection is required but none selected yet
      return [] as CourseModule[];
    }
    // For courses without selection requirements, return all modules
    return course.modules;
  }, [course.modules, course.requiredSelectionCount, userProgress?.selectedModules]);

  const hasModules = effectiveModules.length > 0;
  const currentModule = hasModules ? effectiveModules[currentModuleIndex] : undefined;
  const isLastModule = hasModules ? currentModuleIndex === effectiveModules.length - 1 : true;
  const isModuleCompleted = currentModule ? (userProgress?.completedModules.includes(currentModule.id) || false) : false;
  const hasReadToEnd = currentModule ? (readProgress[currentModule.id]?.reachedEnd === true) : false;

  useEffect(() => {
    // Wait for the Dashboard to finish loading user progress from Firestore
    // to avoid accidentally resetting a course that was already started.
    if (userProgress === undefined) return;

    if (userProgress === null || !userProgress.courseId) {
      // Initialize progress ONLY if we are sure no progress exists yet
      const initialProgress: UserProgress = {
        courseId: course.id,
        completedModules: [],
        completed: false,
        startedAt: new Date()
      };
      onProgressUpdate(initialProgress);
    }
  }, [course.id, userProgress, onProgressUpdate]);

  useEffect(() => {
    // If course requires selection and user hasn't selected enough modules, do NOT show summary
    const needsSelection = !!course.requiredSelectionCount && ((userProgress?.selectedModules?.length || 0) < (course.requiredSelectionCount || 0));
    if (!hasModules && !needsSelection) {
      // Only when there are truly no modules to show (e.g., placeholder course)
      setShowSummary(true);
    } else if (needsSelection) {
      setShowSummary(false);
    }
  }, [hasModules, course.requiredSelectionCount, userProgress?.selectedModules]);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    if (!currentModule || currentModule.type !== 'video' || !currentModule.videoUrl || !window.YT) return;

    let player: any;
    const videoId = getYouTubeId(currentModule.videoUrl);
    if (!videoId) return;

    const initPlayer = () => {
      // Small delay to ensure the DOM element is rendered
      setTimeout(() => {
        const playerElement = document.getElementById(`youtube-player-${currentModule.id}`);
        if (!playerElement) return;

        player = new window.YT.Player(`youtube-player-${currentModule.id}`, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                setVideoProgress(prev => ({
                  ...prev,
                  [currentModule.id]: { completed: true }
                }));
              }
            }
          }
        });
      }, 100);
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (player && player.destroy) {
        player.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule, window?.YT]);

  const totalModulesForDisplay = (course.requiredSelectionCount && course.requiredSelectionCount > 0)
    ? (course.requiredSelectionCount)
    : effectiveModules.length;
  const currentModuleNumberForDisplay = hasModules ? (currentModuleIndex + 1) : 0;

  const markModuleComplete = async () => {
    if (!userProgress || isModuleCompleted || !currentModule || isSubmittingProgress) return;

    setIsSubmittingProgress(true);
    setSubmitError(null);
    const updatedProgress: UserProgress = {
      ...userProgress,
      completedModules: Array.from(new Set([...userProgress.completedModules, currentModule.id]))
    };

    try {
      await onProgressUpdate(updatedProgress);

      if (isLastModule) {
        setShowSummary(true);
      }
    } catch (e) {
      console.error('Failed to mark module as complete:', e);
      setSubmitError('Failed to save progress. Please check your connection and try again.');
    } finally {
      setIsSubmittingProgress(false);
    }
  };

  const completeCourseWithoutQuiz = () => {
    if (!userProgress) return;
    const updatedProgress: UserProgress = {
      ...userProgress,
      completed: true,
      completedAt: new Date(),
    };
    onProgressUpdate(updatedProgress);
  };

  const nextModule = () => {
    if (currentModuleIndex < effectiveModules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const prevModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    }
  };

  const startQuiz = () => {
    setShowSummary(false);
    setShowQuiz(true);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const startModuleQuiz = (moduleId: string) => {
    setModuleQuizMode({ moduleId });
    setShowQuiz(true);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const submitQuiz = () => {
    const correctAnswers = course.quiz.filter(q => quizAnswers[q.id] === q.correctAnswer).length;
    const passThreshold = Math.ceil(course.quiz.length * 0.5);
    const passed = correctAnswers >= passThreshold;

    const updatedProgress: UserProgress = {
      ...userProgress!,
      quizScore: correctAnswers,
      completed: passed,
      completedAt: passed ? new Date() : undefined
    };

    onProgressUpdate(updatedProgress);
    setQuizSubmitted(true);
  };

  const getProgressPercentage = () => {
    if (!userProgress) return 0;

    // Use requiredSelectionCount if specified (for Intermediate/Advanced courses)
    const denominator = (course.requiredSelectionCount && course.requiredSelectionCount > 0)
      ? course.requiredSelectionCount
      : effectiveModules.length;

    if (denominator === 0) {
      return userProgress.completed ? 100 : 0;
    }

    const completedCount = userProgress.completedModules.length;

    // If there's an overall quiz, modules account for 80% and quiz for 20%
    if (course.quiz && course.quiz.length > 0) {
      const moduleProgress = Math.min(completedCount / denominator, 1) * 80;
      const quizProgress = userProgress.completed ? 20 : 0;
      return Math.round(moduleProgress + quizProgress);
    }

    return Math.min(Math.round((completedCount / denominator) * 100), 100);
  };

  // Reset all progress for this course (local, non-persistent)
  const resetCourseProgress = () => {
    if (!window.confirm('Are you sure you want to reset your progress for this course? This action cannot be undone.')) {
      return;
    }

    const cleared: UserProgress = {
      courseId: course.id,
      completedModules: [],
      completed: false,
      startedAt: new Date(),
      selectedModules: [],
      moduleQuizScores: {},
      overallQuizScore: undefined,
    };
    setCurrentModuleIndex(0);
    setShowSummary(false);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setModuleQuizMode(null);
    setReadProgress({});
    onProgressUpdate(cleared);
  };

  if (showQuiz) {
    // Determine whether this is overall course quiz or module recap quiz
    const quizCourse: Course = moduleQuizMode
      ? {
        ...course,
        // present only the module's quiz as the quiz data source
        quiz: (course.modules.find(m => m.id === moduleQuizMode.moduleId)?.quiz || []),
      }
      : course;
    const onQuizSubmitWrapper = () => {
      if (!moduleQuizMode) return submitQuiz();
      // handle module quiz submission
      const targetModule = course.modules.find(m => m.id === moduleQuizMode.moduleId);
      const correctAnswers = (targetModule?.quiz || []).filter(q => quizAnswers[q.id] === q.correctAnswer).length;
      const passThreshold = Math.ceil(((targetModule?.quiz || []).length) * 0.5);
      const passed = correctAnswers >= passThreshold;
      const updated: UserProgress = {
        ...userProgress!,
        moduleQuizScores: { ...(userProgress?.moduleQuizScores || {}), [moduleQuizMode.moduleId]: correctAnswers },
        completedModules: passed
          ? Array.from(new Set([...(userProgress?.completedModules || []), moduleQuizMode.moduleId]))
          : (userProgress?.completedModules || []),
      };
      onProgressUpdate(updated);
      setQuizSubmitted(true);
    };
    return (
      <QuizComponent
        course={quizCourse}
        answers={quizAnswers}
        onAnswerChange={setQuizAnswers}
        onSubmit={onQuizSubmitWrapper}
        submitted={quizSubmitted}
        onRetry={() => {
          setQuizAnswers({});
          setQuizSubmitted(false);
        }}
        onBack={() => { setShowQuiz(false); setQuizAnswers({}); setQuizSubmitted(false); }}
      />
    );
  }

  if (showSummary) {
    return (
      <CourseSummary
        course={course}
        userProgress={userProgress!}
        onStartQuiz={startQuiz}
        onCompleteNoQuiz={completeCourseWithoutQuiz}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-white/20 dark:hover:bg-black/30 transition-all"
          aria-label="Back to course dashboard"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Back to Courses</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="flex-1 text-center">
          <h1 className="heading-serif text-xl sm:text-2xl font-bold">{course.title}</h1>
          <p className="text-sm opacity-70" aria-live="polite">
            {hasModules ? `Module ${currentModuleNumberForDisplay} of ${totalModulesForDisplay}` : 'Course Overview'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetCourseProgress}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm"
            title="Reset your progress for this course"
            aria-label="Reset course progress"
          >
            ↻ Reset
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Course Progress</span>
          <span>{getProgressPercentage()}%</span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-burgundy to-amberD7 transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
            role="progressbar"
            aria-valuenow={getProgressPercentage()}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course progress"
          />
        </div>
      </div>

      {/* If selection is required and not made yet, show selection screen */}
      {course.requiredSelectionCount && course.requiredSelectionCount > 0 && ((userProgress?.selectedModules?.length || 0) < (course.requiredSelectionCount || 0)) ? (
        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Select Modules</h2>
              <p className="opacity-70 mb-4">Please select {course.requiredSelectionCount} module{course.requiredSelectionCount > 1 ? 's' : ''} to proceed.</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {course.modules.map(m => {
                  const selected = (userProgress?.selectedModules || []).includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={(e) => {
                        e.preventDefault();

                        const base: UserProgress = userProgress || {
                          courseId: course.id,
                          completedModules: [],
                          completed: false,
                          startedAt: new Date(),
                          selectedModules: []
                        };
                        const current = new Set(base.selectedModules || []);

                        if (selected) {
                          current.delete(m.id);
                        } else if ((current.size) < (course.requiredSelectionCount || 0)) {
                          current.add(m.id);
                        } else {
                          return;
                        }

                        const updatedProgress = { ...base, selectedModules: Array.from(current) };
                        onProgressUpdate(updatedProgress);
                      }}
                      className={`p-4 rounded-lg text-left transition-all ${selected ? 'bg-burgundy text-white' : 'bg-white/10 hover:bg-white/20'}`}
                      aria-pressed={selected}
                      aria-label={`${selected ? 'Deselect' : 'Select'} ${m.title} module`}
                    >
                      <div className="font-semibold mb-1">{m.title}</div>
                      <div className="text-xs opacity-70">{m.description}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    if ((userProgress?.selectedModules?.length || 0) === (course.requiredSelectionCount || 0)) {
                      setCurrentModuleIndex(0);
                      // Force re-render to show modules
                      const updatedProgress = {
                        ...userProgress,
                        selectedModules: userProgress?.selectedModules || []
                      } as UserProgress;
                      onProgressUpdate(updatedProgress);
                    }
                  }}
                  disabled={(userProgress?.selectedModules?.length || 0) !== (course.requiredSelectionCount || 0)}
                  className="px-6 py-3 rounded-lg bg-burgundy text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Start selected course modules"
                >
                  Start Course
                </button>
                <button
                  onClick={() => {
                    const clearedProgress = {
                      ...(userProgress || {
                        courseId: course.id,
                        completedModules: [],
                        completed: false,
                        startedAt: new Date()
                      }),
                      selectedModules: []
                    } as UserProgress;
                    onProgressUpdate(clearedProgress);
                  }}
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
          {/* Module Navigation */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="glass rounded-2xl p-4 sm:p-6">
              <h3 className="font-semibold mb-4">Course Modules</h3>
              {/* Mobile: Horizontal scroll */}
              <div className="lg:hidden">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {hasModules ? (
                    effectiveModules.map((module, index) => (
                      <button
                        key={module.id}
                        onClick={() => setCurrentModuleIndex(index)}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all text-xs font-medium whitespace-nowrap ${index === currentModuleIndex
                            ? 'bg-burgundy text-white'
                            : userProgress?.completedModules.includes(module.id)
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        aria-current={index === currentModuleIndex ? 'page' : undefined}
                        aria-label={`Module ${index + 1}: ${module.title}${userProgress?.completedModules.includes(module.id) ? ' (completed)' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {userProgress?.completedModules.includes(module.id) && (
                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="max-w-[100px] truncate">{module.title}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-sm opacity-70 text-center w-full">No modules available for this course.</div>
                  )}
                </div>
              </div>
              {/* Desktop: Vertical list */}
              <div className="hidden lg:block space-y-2">
                {hasModules ? (
                  effectiveModules.map((module, index) => (
                    <button
                      key={module.id}
                      onClick={() => setCurrentModuleIndex(index)}
                      className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all ${index === currentModuleIndex
                          ? 'bg-burgundy text-white'
                          : userProgress?.completedModules.includes(module.id)
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      aria-current={index === currentModuleIndex ? 'page' : undefined}
                      aria-label={`Module ${index + 1}: ${module.title}${userProgress?.completedModules.includes(module.id) ? ' (completed)' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {userProgress?.completedModules.includes(module.id) && (
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="text-xs sm:text-sm font-medium truncate">{module.title}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-sm opacity-70">No modules available for this course.</div>
                )}
              </div>
            </div>
          </div>

          {/* Module Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="glass rounded-2xl p-4 sm:p-6">
              {hasModules && currentModule ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold mb-2">{currentModule.title}</h2>
                      <p className="opacity-70 text-sm sm:text-base">{currentModule.description}</p>
                    </div>
                    {isModuleCompleted && (
                      <div className="bg-green-500 text-white rounded-full p-2 flex-shrink-0 self-start sm:self-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Module Content */}
                  {currentModule.type === 'video' && currentModule.videoUrl && currentModule.videoUrl.trim().length > 0 ? (
                    <div className="space-y-6">
                      <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
                        <div id={`youtube-player-${currentModule.id}`} className="w-full h-full"></div>
                      </div>

                      {currentModule.url && currentModule.url.trim().length > 0 && (
                        <div className="flex justify-center">
                          <a
                            href={currentModule.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View / Download Module PDF
                          </a>
                        </div>
                      )}
                    </div>
                  ) : currentModule.url && currentModule.url.trim().length > 0 && currentModule.url !== '#' ? (
                    <div className="w-full rounded-lg overflow-hidden">
                      <PdfReader
                        src={currentModule.url}
                        className="w-full"
                        onPageChange={(page, total) => {
                          if (page === total && total > 0) {
                            setReadProgress((prev) => ({
                              ...prev,
                              [currentModule.id]: { reachedEnd: true },
                            }));
                          }
                        }}
                        onProgress={(p) =>
                          setReadProgress((prev) => {
                            if (prev[currentModule.id]?.reachedEnd) return prev;
                            return {
                              ...prev,
                              [currentModule.id]: { reachedEnd: p.reachedEnd },
                            };
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center ring-1 ring-white/10 border-dashed border-2 border-white/20 my-6">
                      <div className="text-6xl mb-4 animate-pulse">🚀</div>
                      <h3 className="text-2xl font-bold mb-2 text-amberD7">Coming Soon</h3>
                      <p className="opacity-70 max-w-md mx-auto">This module&apos;s content is currently being prepared and curated by our district team. Check back later!</p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6">
                    <button
                      onClick={prevModule}
                      disabled={currentModuleIndex === 0}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Inline error if progress save fails */}
                      {submitError && (
                        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2" role="alert">
                          {submitError}
                        </p>
                      )}
                      {/* Show mark complete button for incomplete modules without quizzes */}
                      {!isModuleCompleted && (!currentModule.quiz || currentModule.quiz.length === 0) && (
                        <button
                          onClick={markModuleComplete}
                          disabled={(currentModule.type === 'video' ? !videoProgress[currentModule.id]?.completed : (!!currentModule.url && !hasReadToEnd)) || isSubmittingProgress}
                          className={`px-4 sm:px-6 py-2 rounded-lg transition-all text-sm sm:text-base flex items-center justify-center gap-2 ${((currentModule.type === 'video' ? videoProgress[currentModule.id]?.completed : (!currentModule.url || hasReadToEnd)) && !isSubmittingProgress)
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-white/10 text-white/70 cursor-not-allowed'
                            }`}
                          aria-label={`Mark ${currentModule.title} as complete`}
                        >
                          {isSubmittingProgress && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                          {currentModule.type === 'video'
                            ? (videoProgress[currentModule.id]?.completed ? 'Mark Complete' : 'Watch the entire video to complete')
                            : (currentModule.url
                              ? (hasReadToEnd ? 'Mark Complete' : 'Read the PDF to the end to complete')
                              : 'Mark Complete'
                            )
                          }
                        </button>
                      )}

                      {/* Show quiz button for modules with quizzes */}
                      {!isModuleCompleted && (currentModule.quiz && currentModule.quiz.length > 0) && (
                        <button
                          onClick={() => startModuleQuiz(currentModule.id)}
                          disabled={currentModule.type === 'video' ? !videoProgress[currentModule.id]?.completed : (!!currentModule.url && !hasReadToEnd)}
                          className={`px-4 sm:px-6 py-2 rounded-lg transition-all text-sm sm:text-base ${(currentModule.type === 'video' ? videoProgress[currentModule.id]?.completed : (!currentModule.url || hasReadToEnd))
                              ? 'bg-burgundy text-white hover:bg-burgundy/80'
                              : 'bg-white/10 text-white/70 cursor-not-allowed'
                            }`}
                          aria-label={`Start quiz for ${currentModule.title}`}
                        >
                          {currentModule.type === 'video'
                            ? (videoProgress[currentModule.id]?.completed ? 'Start Module Quiz' : 'Watch video to unlock quiz')
                            : (currentModule.url
                              ? (hasReadToEnd ? 'Start Module Quiz' : 'Read PDF to unlock quiz')
                              : 'Start Module Quiz'
                            )
                          }
                        </button>
                      )}

                      {!isLastModule ? (
                        <button
                          onClick={nextModule}
                          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all text-sm sm:text-base"
                          aria-label="Go to next module"
                        >
                          Next
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        userProgress?.completedModules.length === effectiveModules.length && (
                          <button
                            onClick={() => setShowSummary(true)}
                            className="px-4 sm:px-6 py-2 rounded-lg bg-amberD7 text-black hover:bg-amberD7/80 transition-all font-semibold text-sm sm:text-base"
                            aria-label="View course summary"
                          >
                            Course Summary
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="text-4xl mb-4 opacity-30" aria-hidden="true">📄</div>
                  <h3 className="text-lg font-semibold mb-2">No Modules Available</h3>
                  <p className="opacity-70 mb-4">This course does not have modules yet.</p>
                  <p className="text-sm opacity-70">You can proceed to completion from the summary screen.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
