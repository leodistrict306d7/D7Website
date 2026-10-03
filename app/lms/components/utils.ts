import { Course, CourseModule, QuizQuestion } from '@/types/course';
import { CourseSnapshot } from '../types';

const FALLBACK_DIFFICULTY: Course['difficulty'] = 'Beginner';
const FALLBACK_THUMBNAIL = '/images/coming-soon.svg';
const VALID_DIFFICULTIES: readonly Course['difficulty'][] = ['Beginner', 'Intermediate', 'Advanced'];

export function normalizeDifficulty(value: unknown): Course['difficulty'] {
  if (typeof value === 'string' && (VALID_DIFFICULTIES as readonly string[]).includes(value)) {
    return value as Course['difficulty'];
  }
  return FALLBACK_DIFFICULTY;
}

export function normalizeQuizQuestions(rawQuiz: unknown, parentId: string): QuizQuestion[] {
  if (!Array.isArray(rawQuiz)) return [];

  return rawQuiz
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const data = item as Record<string, unknown>;

      const options = Array.isArray(data.options)
        ? data.options.filter((option): option is string => typeof option === 'string' && option.trim().length > 0)
        : [];

      if (options.length < 2) {
        options.push('Option 1', 'Option 2');
      }

      const safeCorrectAnswer = typeof data.correctAnswer === 'number' && data.correctAnswer >= 0 && data.correctAnswer < options.length
        ? Math.floor(data.correctAnswer)
        : 0;

      return {
        id: typeof data.id === 'string' && data.id.trim()
          ? data.id
          : `${parentId}-q${index + 1}`,
        question: typeof data.question === 'string' && data.question.trim()
          ? data.question
          : 'Question coming soon.',
        options,
        correctAnswer: safeCorrectAnswer,
      } satisfies QuizQuestion;
    })
    .filter((item): item is QuizQuestion => Boolean(item));
}

export function normalizeModules(rawModules: unknown, courseId: string): CourseModule[] {
  if (!Array.isArray(rawModules)) return [];

  return rawModules
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const data = item as Record<string, unknown>;

      const moduleId = typeof data.id === 'string' && data.id.trim()
        ? data.id
        : `${courseId}-module-${index + 1}`;

      const quiz = normalizeQuizQuestions(data.quiz, moduleId);

      const type = (data.type === 'video' || data.type === 'pdf') ? data.type : 'pdf';

      const courseModule: CourseModule = {
        id: moduleId,
        title: typeof data.title === 'string' && data.title.trim() ? data.title : `Module ${index + 1}`,
        type,
        url: typeof data.url === 'string' ? data.url : '',
        videoUrl: typeof data.videoUrl === 'string' ? data.videoUrl : undefined,
        description: typeof data.description === 'string' && data.description.trim()
          ? data.description
          : 'Details coming soon.',
      };

      if (quiz.length > 0) {
        courseModule.quiz = quiz;
      }

      return courseModule;
    })
    .filter((module): module is CourseModule => Boolean(module));
}

export function normalizeCourse(doc: CourseSnapshot): Course {
  const data = doc.data();
  const modules = normalizeModules(data.modules, doc.id);
  const quiz = normalizeQuizQuestions(data.quiz, doc.id);

  const requiredSelectionCount = typeof data.requiredSelectionCount === 'number' && data.requiredSelectionCount > 0
    ? Math.floor(data.requiredSelectionCount)
    : undefined;

  return {
    id: doc.id,
    title: typeof data.title === 'string' && data.title.trim() ? data.title : 'Untitled Course',
    description: typeof data.description === 'string' && data.description.trim()
      ? data.description
      : 'Course description coming soon.',
    category: typeof data.category === 'string' && data.category.trim() ? data.category : 'General',
    duration: typeof data.duration === 'string' && data.duration.trim() ? data.duration : 'Self-paced',
    difficulty: normalizeDifficulty(data.difficulty),
    thumbnail: typeof data.thumbnail === 'string' && data.thumbnail.trim() ? data.thumbnail : FALLBACK_THUMBNAIL,
    modules,
    quiz,
    requiredSelectionCount,
  } satisfies Course;
}
