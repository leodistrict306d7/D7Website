export type CourseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CourseModule {
  id: string;
  title: string;
  type: 'pdf' | 'video';
  url: string;
  videoUrl?: string; // For YouTube or other video embeds
  description: string;
  quiz?: QuizQuestion[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: CourseDifficulty;
  thumbnail: string;
  modules: CourseModule[];
  quiz: QuizQuestion[];
  requiredSelectionCount?: number;
}

export interface CourseDocument extends Course {
  createdAt?: unknown;
  updatedAt?: unknown;
}
