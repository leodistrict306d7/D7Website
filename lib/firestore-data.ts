import { getAdminDb } from './firebase-admin';

// Types for Firestore data
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  location?: string;
  organizer?: string;
  impact?: string;
  beneficiaries?: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  instructor?: string;
  enrollmentStatus: 'open' | 'closed' | 'coming-soon';
  startDate?: string;
  endDate?: string;
  modules?: string[];
  prerequisites?: string[];
  enrollmentLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Newsletter {
  id: string;
  title: string;
  description: string;
  issue: string;
  publishDate: string;
  pdfUrl?: string;
  embedUrl?: string;
  content?: string;
  featuredArticles?: Array<{
    title: string;
    summary: string;
  }>;
  createdAt: string;
}

// Firestore data fetching functions
export async function getRecentProjects(limit: number = 10): Promise<Project[]> {
  try {
    const db = getAdminDb();
    if (!db) {
      console.warn('Firestore not available, returning empty projects array');
      return [];
    }

    const projectsRef = db.collection('projects');
    const snapshot = await projectsRef
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
  } catch (error) {
    console.error('Error fetching projects from Firestore:', error);
    return [];
  }
}

export async function getProjectsByCategory(category: string): Promise<Project[]> {
  try {
    const db = getAdminDb();
    if (!db) return [];

    const projectsRef = db.collection('projects');
    const snapshot = await projectsRef
      .where('category', '==', category)
      .orderBy('date', 'desc')
      .limit(20)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
  } catch (error) {
    console.error(`Error fetching projects for category ${category}:`, error);
    return [];
  }
}

export async function getAvailableCourses(): Promise<Course[]> {
  try {
    const db = getAdminDb();
    if (!db) return [];

    const coursesRef = db.collection('courses');
    const snapshot = await coursesRef
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const allCourses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));

    // Filter manually to avoid complex query index requirements
    return allCourses.filter(course =>
      course.enrollmentStatus === 'open' || course.enrollmentStatus === 'coming-soon'
    );
  } catch (error) {
    console.error('Error fetching courses from Firestore:', error);
    return [];
  }
}

export async function getCoursesByCategory(category: string): Promise<Course[]> {
  try {
    const db = getAdminDb();
    if (!db) return [];

    const coursesRef = db.collection('courses');
    const snapshot = await coursesRef
      .where('category', '==', category)
      .where('enrollmentStatus', 'in', ['open', 'coming-soon'])
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));
  } catch (error) {
    console.error(`Error fetching courses for category ${category}:`, error);
    return [];
  }
}

export async function getLatestNewsletters(limit: number = 5): Promise<Newsletter[]> {
  try {
    const db = getAdminDb();
    if (!db) return [];

    const newslettersRef = db.collection('newsletters');
    const snapshot = await newslettersRef
      .orderBy('publishDate', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Newsletter));
  } catch (error) {
    console.error('Error fetching newsletters from Firestore:', error);
    return [];
  }
}

export async function searchProjects(query: string): Promise<Project[]> {
  try {
    const db = getAdminDb();
    if (!db) return [];

    const projectsRef = db.collection('projects');
    const snapshot = await projectsRef
      .orderBy('date', 'desc')
      .limit(50)
      .get();

    const allProjects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));

    // Simple text search
    const lowerQuery = query.toLowerCase();
    return allProjects.filter(project =>
      project.title.toLowerCase().includes(lowerQuery) ||
      project.description.toLowerCase().includes(lowerQuery) ||
      project.category.toLowerCase().includes(lowerQuery) ||
      (project.location && project.location.toLowerCase().includes(lowerQuery)) ||
      (project.organizer && project.organizer.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Error searching projects:', error);
    return [];
  }
}

export async function searchCourses(query: string): Promise<Course[]> {
  try {
    const db = getAdminDb();
    if (!db) return [];

    const coursesRef = db.collection('courses');
    const snapshot = await coursesRef
      .where('enrollmentStatus', 'in', ['open', 'coming-soon'])
      .limit(50)
      .get();

    const allCourses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));

    // Simple text search
    const lowerQuery = query.toLowerCase();
    return allCourses.filter(course =>
      course.title.toLowerCase().includes(lowerQuery) ||
      course.description.toLowerCase().includes(lowerQuery) ||
      course.category.toLowerCase().includes(lowerQuery) ||
      (course.instructor && course.instructor.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Error searching courses:', error);
    return [];
  }
}