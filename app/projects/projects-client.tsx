"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, orderBy, query, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoadingSpinner, CardSkeleton } from '@/components/loading';
import type { Project, ProjectCategory } from '@/types/project';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'orientations', label: 'Orientations' },
  { key: 'youth', label: 'Youth' },
  { key: 'religious', label: 'Religious' },
  { key: 'service', label: 'Service' },
  { key: 'events', label: 'Events' },
  { key: 'upcoming', label: 'Coming Soon' },
] as const satisfies readonly { key: 'all' | ProjectCategory; label: string }[];

type CatKey = (typeof categories)[number]['key'];

type NormalizedSnapshot = QueryDocumentSnapshot<DocumentData>;

function normalizeProject(doc: NormalizedSnapshot): Project {
  const data = doc.data();
  const rawDate = data.date;
  const timestampToIso = (value: unknown) => {
    if (!value) return new Date().toISOString();
    if (typeof value === 'string') return value;
    // Firestore Timestamp
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
      try {
        return (value as any).toDate().toISOString();
      } catch (error) {
        console.warn('Failed to convert Firestore Timestamp to ISO string:', error);
      }
    }
    return new Date().toISOString();
  };

  const gallery = Array.isArray(data.gallery)
    ? data.gallery.filter((item: unknown): item is string => typeof item === 'string' && item.length > 0)
    : [];

  const image = typeof data.image === 'string' && data.image.length > 0
    ? data.image
    : gallery[0] ?? '/images/coming-soon.svg';

  return {
    id: doc.id,
    title: typeof data.title === 'string' && data.title.trim() ? data.title : 'Untitled Project',
    category: (typeof data.category === 'string' && data.category.length > 0 ? data.category : 'service') as ProjectCategory,
    description: typeof data.description === 'string' ? data.description : 'Description coming soon.',
    image,
    date: timestampToIso(rawDate),
    venue: typeof data.venue === 'string' ? data.venue : 'To be announced',
    impact: typeof data.impact === 'string' ? data.impact : 'Impact details coming soon.',
    gallery: gallery.length > 0 ? gallery : [image],
  } satisfies Project;
}

interface ProjectsClientProps {
  initialProjects: Project[];
}

export default function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const [active, setActive] = useState<CatKey>('all');
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [open, setOpen] = useState<Project | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [hoverImageIndex, setHoverImageIndex] = useState<Record<string, number>>({});
  const [isHydrating, setIsHydrating] = useState(initialProjects.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const hoverIntervals = useRef<Record<string, number>>({});

  const filteredProjects = useMemo(() => {
    if (active === 'all') {
      return projects.filter((project) => project.category !== 'upcoming');
    }

    return projects.filter((project) => project.category === active);
  }, [active, projects]);

  const subscribe = useCallback(() => {
    setIsHydrating(true);
    const projectsQuery = query(collection(db, 'projects'), orderBy('date', 'desc'));

    return onSnapshot(projectsQuery, (snapshot) => {
      const items = snapshot.docs.map(normalizeProject);
      setProjects(items);
      setIsHydrating(false);
      setError(null);
    }, (err) => {
      console.error('Realtime projects subscription failed:', err);
      setError('Failed to load projects. Please retry.');
      setIsHydrating(false);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe();
    return () => {
      unsubscribe();
      Object.values(hoverIntervals.current).forEach((intervalId) => window.clearInterval(intervalId));
      hoverIntervals.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, refreshToken]);

  useEffect(() => {
    projects.forEach((project) => {
      project.gallery.forEach((src: string) => {
        const img = new Image();
        img.src = src;
      });
    });
  }, [projects]);

  const handleRetry = () => {
    setRefreshToken((token) => token + 1);
  };

  const nextImage = () => {
    if (open) {
      setCurrentImageIndex((prev) => (prev + 1) % open.gallery.length);
    }
  };

  const prevImage = () => {
    if (open) {
      setCurrentImageIndex((prev) => (prev - 1 + open.gallery.length) % open.gallery.length);
    }
  };

  const openProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setOpen(project);
    setCurrentImageIndex(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!open) return;

    const swipeThreshold = 50;
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  };

  const handleMouseEnter = (projectId: string) => {
    setHoveredProject(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (project && project.gallery.length > 1) {
      const intervalId = window.setInterval(() => {
        setHoverImageIndex((prev) => ({
          ...prev,
          [projectId]: ((prev[projectId] || 0) + 1) % project.gallery.length,
        }));
      }, 1200);
      hoverIntervals.current[projectId] = intervalId;
    }
  };

  const handleMouseLeave = (projectId: string) => {
    setHoveredProject(null);
    const intervalId = hoverIntervals.current[projectId];
    if (intervalId) {
      window.clearInterval(intervalId);
      delete hoverIntervals.current[projectId];
    }
    setHoverImageIndex((prev) => ({
      ...prev,
      [projectId]: 0,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="heading-serif text-3xl font-bold">Projects</h1>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              active === c.key
                ? 'bg-gold text-black border-gold shadow-lg'
                : 'border-white/20 hover:bg-white/10 hover:border-white/40'
            }`}
            aria-pressed={active === c.key}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="glass rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-red-400 text-xl" aria-hidden="true">⚠️</div>
          <div className="flex-1">
            <p className="font-semibold text-red-200">{error}</p>
            <p className="text-sm opacity-70">We will keep showing the last known data. Retry to attempt fetching again.</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {isHydrating && projects.length === 0 ? (
          <>
            {Array.from({ length: 6 }, (_: unknown, index: number) => index).map((index) => (
              <CardSkeleton key={`project-skeleton-${index}`} />
            ))}
          </>
        ) : (
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="surface-card overflow-hidden group hover:shadow-xl"
                onMouseEnter={() => handleMouseEnter(project.id)}
                onMouseLeave={() => handleMouseLeave(project.id)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={hoveredProject === project.id && project.gallery.length > 1
                      ? project.gallery[hoverImageIndex[project.id] || 0]
                      : project.image}
                    alt={project.title}
                    className="h-56 sm:h-48 md:h-52 lg:h-56 w-full object-cover group-hover:scale-105 transition-all duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {project.gallery.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      {hoveredProject === project.id ? (hoverImageIndex[project.id] || 0) + 1 : 1} / {project.gallery.length}
                    </div>
                  )}

                  {project.gallery.length > 1 && hoveredProject === project.id && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {project.gallery.map((unused: string, index: number) => (
                        <div
                          // eslint-disable-next-line react/no-array-index-key
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            index === (hoverImageIndex[project.id] || 0) ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-4">
                  <div className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">{project.title}</div>
                  <div className="text-xs sm:text-sm opacity-70 mb-3 line-clamp-2">
                    {project.description.length > 80 ? `${project.description.substring(0, 80)}...` : project.description}
                  </div>
                  <div className="text-xs opacity-60 mb-3">
                    {new Date(project.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <button
                    onClick={() => openProject(project.id)}
                    className="w-full px-3 py-2 text-sm rounded-md btn-primary transition-colors"
                  >
                    View Details & Gallery
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {!isHydrating && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl opacity-20 mb-4" aria-hidden="true">📷</div>
          <h3 className="text-xl font-semibold mb-2">No projects found</h3>
          <p className="opacity-70 mb-4">Try choosing a different category or check back later.</p>
          {active !== 'all' && (
            <button
              onClick={() => setActive('all')}
              className="px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-black/70 p-4 overscroll-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 10, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto overscroll-contain mx-2 sm:mx-4"
            >
              <div className="flex justify-between items-start p-4 sm:p-6 border-b border-white/10">
                <div className="flex-1 pr-4">
                  <h3 className="text-xl sm:text-2xl font-bold heading-serif line-clamp-2">{open.title}</h3>
                  <p className="text-xs sm:text-sm opacity-70 mt-1">
                    {new Date(open.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(null)}
                  className="p-2 rounded-full bg-white/10 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 transition-colors flex-shrink-0"
                  aria-label="Close project details"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-base sm:text-lg">Project Gallery</h4>
                  <div className="relative">
                    <div
                      className="aspect-video rounded-lg overflow-hidden bg-black/5"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <img
                        src={open.gallery[currentImageIndex]}
                        alt={`${open.title} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover select-none"
                        loading="eager"
                        decoding="async"
                        draggable={false}
                      />
                    </div>

                    {open.gallery.length > 1 && (
                      <>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            prevImage();
                          }}
                          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                          aria-label="Previous image"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            nextImage();
                          }}
                          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                          aria-label="Next image"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                          {currentImageIndex + 1} / {open.gallery.length}
                        </div>

                        <div className="flex justify-center mt-3 gap-1.5 sm:gap-2">
                          {open.gallery.map((_: string, index: number) => (
                            <button
                              key={index}
                              onClick={(event) => {
                                event.stopPropagation();
                                setCurrentImageIndex(index);
                              }}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-base sm:text-lg">About This Project</h4>
                  <p className="opacity-90 leading-relaxed text-sm sm:text-base">{open.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="bg-white/10 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/20 rounded-lg p-3">
                      <span className="opacity-70">Date: </span>
                      <span className="font-medium">
                        {new Date(open.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="bg-white/10 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/20 rounded-lg p-3">
                      <span className="opacity-70">Venue: </span>
                      <span className="font-medium">{open.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isHydrating && projects.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm opacity-70">
          <LoadingSpinner size="sm" />
          <span>Refreshing projects…</span>
        </div>
      )}
    </div>
  );
}
