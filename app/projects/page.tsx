import ErrorBoundary from '@/components/error-boundary';
import { getAdminDb } from '@/lib/firebase-admin';
import type { Project, ProjectCategory } from '@/types/project';
import ProjectsClient from './projects-client';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const FALLBACK_CATEGORY: ProjectCategory = 'service';
const VALID_CATEGORIES: readonly ProjectCategory[] = ['meetings', 'orientations', 'youth', 'religious', 'service', 'events', 'upcoming'];

function isProjectCategory(value: unknown): value is ProjectCategory {
  return typeof value === 'string' && (VALID_CATEGORIES as readonly string[]).includes(value);
}

function normalizeProject(doc: QueryDocumentSnapshot): Project {
  const data = doc.data();
  const rawDate = data.date;
  const date = typeof rawDate === 'string'
    ? rawDate
    : rawDate?.toDate?.()?.toISOString?.() ?? new Date().toISOString();

  const gallery = Array.isArray(data.gallery)
    ? data.gallery.filter((item: unknown): item is string => typeof item === 'string')
    : [];

  const image = typeof data.image === 'string' && data.image.length > 0
    ? data.image
    : gallery[0] ?? '/images/coming-soon.svg';

  return {
    id: doc.id,
    title: typeof data.title === 'string' && data.title.trim() ? data.title : 'Untitled Project',
    category: isProjectCategory(data.category) ? data.category : FALLBACK_CATEGORY,
    description: typeof data.description === 'string' ? data.description : 'Description coming soon.',
    image,
    date,
    venue: typeof data.venue === 'string' ? data.venue : 'To be announced',
    impact: typeof data.impact === 'string' ? data.impact : 'Impact details coming soon.',
    gallery: gallery.length > 0 ? gallery : [image],
  } satisfies Project;
}

async function fetchProjects(): Promise<Project[]> {
  try {
    const db = getAdminDb();
    if (!db) {
      console.warn('[projects] Firebase admin disabled; returning empty project list.');
      return [];
    }

    const snapshot = await db
      .collection('projects')
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(normalizeProject);
  } catch (error) {
    console.error('Failed to load projects from Firestore:', error);
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await fetchProjects();

  return (
    <ErrorBoundary>
      <ProjectsClient initialProjects={projects} />
    </ErrorBoundary>
  );
}