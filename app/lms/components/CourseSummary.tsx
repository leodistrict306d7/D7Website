import { useMemo } from 'react';
import { Course } from '@/types/course';
import { UserProgress } from '../types';

export function CourseSummary({ 
  course, 
  userProgress, 
  onStartQuiz, 
  onCompleteNoQuiz, 
  onBack 
}: {
  course: Course;
  userProgress: UserProgress;
  onStartQuiz: () => void;
  onCompleteNoQuiz: () => void;
  onBack: () => void;
}) {
  const passThreshold = Math.ceil(course.quiz.length * 0.5);
  const summaryModules = useMemo(() => {
    if (course.requiredSelectionCount && course.requiredSelectionCount > 0) {
      const selected = userProgress.selectedModules || [];
      return course.modules.filter(m => selected.includes(m.id));
    }
    return course.modules;
  }, [course.modules, course.requiredSelectionCount, userProgress.selectedModules]);

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-4xl sm:text-6xl mb-4">🎉</div>
          <h1 className="heading-serif text-2xl sm:text-3xl font-bold mb-2">Congratulations!</h1>
          <p className="text-base sm:text-lg opacity-70">You've completed all modules in {course.title}</p>
        </div>

        <div className="glass rounded-2xl p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Course Summary</h2>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <h3 className="font-semibold mb-3">What You've Learned</h3>
              <ul className="space-y-2">
                {summaryModules.map((module) => (
                  <li key={module.id} className="flex items-center gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs sm:text-sm">{module.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Course Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm opacity-70">Modules Completed</span>
                  <span className="font-semibold text-sm">{userProgress.completedModules.length}/{summaryModules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm opacity-70">Time Invested</span>
                  <span className="font-semibold text-sm">{course.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm opacity-70">Difficulty Level</span>
                  <span className="font-semibold text-sm">{course.difficulty}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            {course.quiz.length > 0 ? (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Ready for the Final Quiz?</h3>
                <p className="opacity-70 mb-6 text-sm sm:text-base">
                  Test your knowledge with {course.quiz.length} questions. You need to answer at least {passThreshold} correctly to complete the course.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={onBack}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm sm:text-base"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={onStartQuiz}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all font-semibold text-sm sm:text-base"
                    aria-label={`Start final quiz for ${course.title}`}
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">No Quiz Required</h3>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={onBack}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm sm:text-base"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={onCompleteNoQuiz}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all font-semibold text-sm sm:text-base"
                    aria-label={`Complete ${course.title} course`}
                  >
                    Complete Course
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
