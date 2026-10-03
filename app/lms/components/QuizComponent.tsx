import { motion } from 'framer-motion';
import { Course } from '@/types/course';

export function QuizComponent({ 
  course, 
  answers, 
  onAnswerChange, 
  onSubmit, 
  submitted, 
  onBack, 
  onRetry 
}: {
  course: Course;
  answers: { [questionId: string]: number };
  onAnswerChange: (answers: { [questionId: string]: number }) => void;
  onSubmit: () => void;
  submitted: boolean;
  onBack: () => void;
  onRetry?: () => void;
}) {
  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (submitted) return;
    onAnswerChange({ ...answers, [questionId]: answerIndex });
  };

  const getScore = () => {
    return course.quiz.filter(q => answers[q.id] === q.correctAnswer).length;
  };

  const canSubmit = () => {
    return course.quiz.every(q => answers[q.id] !== undefined);
  };

  const passThreshold = Math.ceil(course.quiz.length * 0.5);
  const isPassed = () => {
    return getScore() >= passThreshold;
  };

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-white/20 dark:hover:bg-black/30 transition-all text-sm sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center flex-1 sm:flex-none">
            <h1 className="heading-serif text-xl sm:text-2xl font-bold">{course.title} Quiz</h1>
            <p className="text-xs sm:text-sm opacity-70">Answer at least {passThreshold} out of {course.quiz.length} questions correctly</p>
          </div>

          <div className="hidden sm:block w-20"></div>
        </div>

        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 sm:p-6 rounded-2xl text-center ${isPassed()
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-red-500/20 border border-red-500/30'
              }`}
          >
            <div className="text-3xl sm:text-4xl mb-2">{isPassed() ? '🎉' : '😔'}</div>
            <h2 className="text-lg sm:text-xl font-bold mb-2">
              {isPassed() ? 'Congratulations!' : 'Not Quite There'}
            </h2>
            <p className="mb-4 text-sm sm:text-base">
              You scored {getScore()} out of {course.quiz.length} questions correctly.
            </p>
            {isPassed() ? (
              <p className="text-green-400 text-sm sm:text-base">You have successfully completed the course!</p>
            ) : (
              <p className="text-red-400 text-sm sm:text-base">You need at least {passThreshold} correct answers to pass. Please review the materials and try again.</p>
            )}
          </motion.div>
        )}

        <div className="space-y-6">
          {course.quiz.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-4 sm:p-6"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-4" id={`question-${question.id}`}>
                {index + 1}. {question.question}
              </h3>

              <div className="space-y-3" role="radiogroup" aria-labelledby={`question-${question.id}`}>
                {question.options.map((option, optionIndex) => (
                  <button
                    key={optionIndex}
                    onClick={() => handleAnswerSelect(question.id, optionIndex)}
                    disabled={submitted}
                    className={`w-full text-left p-3 sm:p-4 rounded-lg transition-all ${answers[question.id] === optionIndex
                        ? submitted
                          ? optionIndex === question.correctAnswer
                            ? 'bg-green-500/30 border border-green-500/50'
                            : 'bg-red-500/30 border border-red-500/50'
                          : 'bg-burgundy/30 border border-burgundy/50'
                        : submitted && optionIndex === question.correctAnswer
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'glass hover:bg-white/15 dark:hover:bg-black/25'
                      } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    role="radio"
                    aria-checked={answers[question.id] === optionIndex}
                    aria-describedby={submitted && optionIndex === question.correctAnswer ? `correct-${question.id}` : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[question.id] === optionIndex
                          ? 'border-current'
                          : 'border-white/40'
                        }`}>
                        {answers[question.id] === optionIndex && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current"></div>
                        )}
                      </div>
                      <span className="text-sm sm:text-base flex-1">{option}</span>
                      {submitted && optionIndex === question.correctAnswer && (
                        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {!submitted ? (
           <div className="text-center mt-8">
             <button
               onClick={onSubmit}
               disabled={!canSubmit()}
               className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
               aria-label="Submit quiz answers"
               aria-describedby={!canSubmit() ? 'submit-help' : undefined}
             >
               Submit Quiz
             </button>
             {!canSubmit() && (
               <p id="submit-help" className="text-xs opacity-70 mt-2 text-center">
                 Please answer all questions before submitting
               </p>
             )}
           </div>
        ) : (
           <div className="text-center mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
             <button
               onClick={() => {
                 onAnswerChange({});
                 onBack();
               }}
               className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all font-semibold text-sm sm:text-base mr-0 sm:mr-3 mb-3 sm:mb-0"
             >
               ← Back to Course
             </button>
             {onRetry && (
               <button
                 onClick={onRetry}
                 className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all font-semibold text-sm sm:text-base"
                 aria-label="Retry quiz"
               >
                 Try Again
               </button>
             )}
           </div>
        )}
      </div>
    </div>
  );
}
