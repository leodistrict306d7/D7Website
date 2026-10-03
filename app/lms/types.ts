import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export interface UserProgress {
  courseId: string;
  completedModules: string[];
  quizScore?: number;
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
  // new fields
  selectedModules?: string[]; // for Intermediate/Advanced selection
  moduleQuizScores?: { [moduleId: string]: number };
  overallQuizScore?: number;
  updatedAt?: Date;
}

export type CourseSnapshot = QueryDocumentSnapshot<DocumentData>;
