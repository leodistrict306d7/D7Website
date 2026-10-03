'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { type QueryDocumentSnapshot } from 'firebase/firestore';
import { safeCollection, safeOnSnapshot, safeOrderBy, safeBuildQuery } from '../../lib/firebase-utils';
import { useFirebase } from '../../providers/firebase-provider';
import type { AllRounder, MonthHighlight } from '@/types/all-rounder';

type RawAllRounder = {
  name?: string;
  photo?: string;
  achievement?: string;
  description?: string;
  gallery?: string[];
  galleryDir?: string;
};

type RawMonthData = {
  month: string;
  year: string;
  allRounders: RawAllRounder[];
};

const MONTH_SEQUENCE = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const normalizeRawAllRounder = (leo: RawAllRounder, highlightId: string, index: number): AllRounder => ({
  id: `${highlightId}-${slugify(leo.name ?? `leo-${index + 1}`)}`,
  name: leo.name ?? 'Outstanding Leo',
  photo: leo.photo ?? '/images/coming-soon.svg',
  achievement: leo.achievement ?? 'Milestone achievement',
  description: leo.description ?? 'Details coming soon.',
  gallery: Array.isArray(leo.gallery) ? leo.gallery.filter((src): src is string => typeof src === 'string') : [],
  galleryDir: leo.galleryDir ?? null,
});

const normalizeRawMonth = (month: RawMonthData, monthIndex: number): MonthHighlight => {
  const highlightId = `${month.year}-${slugify(month.month)}`;

  return {
    id: highlightId,
    month: month.month,
    year: month.year,
    monthIndex,
    allRounders: month.allRounders.map((leo, index) => normalizeRawAllRounder(leo, highlightId, index)),
  };
};

const sortHighlights = (items: MonthHighlight[]) =>
  items.slice().sort((a, b) => {
    const yearDelta = Number(a.year) - Number(b.year);
    if (yearDelta !== 0) return yearDelta;

    const aIndex = a.monthIndex ?? MONTH_SEQUENCE.indexOf(a.month);
    const bIndex = b.monthIndex ?? MONTH_SEQUENCE.indexOf(b.month);
    return aIndex - bIndex;
  });

const RAW_FALLBACK_HIGHLIGHTS: RawMonthData[] = [
  {
    month: 'July',
    year: '2025',
    allRounders: [
      {
        name: 'Leo Lion Anuk Nisalitha',
        photo: '/images/council/anuk.jpeg',
        achievement: "President’s Scout Award",
        description:
          'Leo Lion Anuk Nisalitha was awarded the prestigious President’s Scout Award on 19th July 2025, the highest honor in Sri Lankan Scouting. Recognized for his unwavering dedication, service, and leadership, this milestone stands as a testament to his commitment to personal growth and community impact.',
        gallery: [
          '/images/d7allrounders/july25/anuk/1.jpeg',
          '/images/d7allrounders/july25/anuk/2.jpeg',
        ],
        galleryDir: '/images/d7allrounders/july25/anuk',
      },
      {
        name: 'Leo Lion Thusal Ranawaka',
        photo: '/images/council/thusal.jpeg',
        achievement: "President’s Scout Award",
        description:
          'Leo Lion Thusal Ranawaka proudly earned the prestigious President’s Scout Award on 19th July 2025, the pinnacle of achievement in Sri Lankan Scouting. His journey of resilience, service, and leadership reflects an unwavering dedication to the Scout Movement and the community, marking him as a true all-rounder of Leo District 306 D7.',
        gallery: [
          '/images/d7allrounders/july25/thusal/1.jpeg',
          '/images/d7allrounders/july25/thusal/2.jpeg',
        ],
        galleryDir: '/images/d7allrounders/july25/thusal',
      },
      {
        name: 'Leo Buwani Dishnika Attanayake',
        photo: '/images/council/buwani.jpg',
        achievement: 'Debut Novel – Nomala Aehaela',
        description:
          'Leo Buwani Dishnika Attanayake, from the Leo Club of Nawala Metro, officially published her debut novel "Nomala Aehaela" on 13th July 2025. Courageously addressing themes of mental health, self-harm, and teenage dreams, the book stands as a bold literary contribution that challenges stigma and sparks dialogue. Overcoming initial setbacks, she pursued her vision with determination, and today Nomala Aehaela is available island-wide at Sarasavi Bookshops, inspiring readers across Sri Lanka.',
        gallery: [
          '/images/d7allrounders/july25/buwani/1.jpeg',
          '/images/d7allrounders/july25/buwani/2.jpeg',
        ],
        galleryDir: '/images/d7allrounders/july25/buwani',
      },
    ],
  },
  {
    month: 'August',
    year: '2025',
    allRounders: [
      {
        name: 'Leo Lion Yohani Gunathilaka',
        photo: '/images/council/yohani.jpg',
        achievement: "President’s Guide Award",
        description:
          'Leo Lion Yohani Gunathilaka was conferred the prestigious President’s Guide Award on 1st August 2025, the highest honor in Sri Lankan Guiding. Her achievement showcases a journey of commitment, leadership, and service, embodying the true spirit of Scouting and Guiding while exemplifying the all-round excellence of Leo District 306 D7.',
        gallery: [
          '/images/d7allrounders/august25/yohani/1.jpeg',
          '/images/d7allrounders/august25/yohani/2.jpeg',
        ],
        galleryDir: '/images/d7allrounders/august25/yohani',
      },
      {
        name: 'Leo Kavindu Dehiwala',
        photo: '/images/council/kavindu.JPG',
        achievement: 'Sustainable Development Youth Partnership Ambassador – United Kingdom (2025–2026)',
        description:
          'Leo Kavindu Dehiwala was appointed as the Sustainable Development Youth Partnership Ambassador – United Kingdom for the term 2025–2026 on 31st August 2025. This prestigious appointment reflects his passion for sustainability, global citizenship, and youth leadership, further strengthening the all-rounder spirit of Leo District 306 D7.',
        gallery: [
          '/images/d7allrounders/august25/kavindu/1.jpeg',
          '/images/d7allrounders/august25/kavindu/2.jpeg',
        ],
        galleryDir: '/images/d7allrounders/august25/kavindu',
      },
    ],
  },
  {
    month: 'September',
    year: '2025',
    allRounders: [
      {
        name: 'Leo Thevindu Damsith',
        photo: '/images/council/thevindu.jpg',
        achievement: 'OTHM Level 5 Diploma in Information Technology',
        description:
          'Leo Thevindu Damsith successfully graduated with an OTHM Level 5 Diploma in Information Technology on 3rd September 2025. This achievement highlights his academic excellence and dedication to advancing his expertise, further showcasing the versatile talents of Leo District 306 D7 All Rounders.',
        gallery: [
          '/images/d7allrounders/september25/thevindu/1.jpeg',
          '/images/d7allrounders/september25/thevindu/2.jpeg',
        ],
        galleryDir: '/images/d7allrounders/september25/thevindu',
      },
      {
        name: 'Leo Sathsari Jayathma',
        photo: '/images/council/sathsari.jpg',
        achievement: 'Second Upper Division – BSc (Hons) International Management and Business, University of Plymouth',
        description:
          'Leo Sathsari Jayathma earned a Second Upper Division in BSc (Hons) International Management and Business from the University of Plymouth on 18th September 2025. This academic milestone reflects her dedication, perseverance, and commitment to excellence, adding yet another dimension to the diverse achievements of Leo District 306 D7 All Rounders.',
        gallery: [],
        galleryDir: '/images/d7allrounders/september25/sathsari',
      },
    ],
  },
  { month: 'October', year: '2025', allRounders: [] },
  { month: 'November', year: '2025', allRounders: [] },
  {
    month: 'December',
    year: '2025',
    allRounders: [
      {
        name: 'Leo Gaveshi Theekshana',
        photo: '/images/d7allrounders/december25/gaveshi/1.jpeg',
        achievement: 'BESA FUAB – Best Employability Skills Award & 1st Runner-Up JESA',
        description:
          'Leo Gaveshi Theekshana, Assistant Treasurer of the Leo Club of the University of Sri Jayewardenepura, has demonstrated outstanding professional and leadership potential through notable recognitions in employability excellence. She was awarded the BESA FUAB – Best Employability Skills Award by the Faculty of Urban and Aquatic Bioresources and secured 1st Runner-Up at the Japura Employability Skills Awards (JESA). These achievements underscore her strong competency portfolio and future-ready skill set, reinforcing the all-round excellence of Leo District 306 D7.',
        gallery: [
          '/images/d7allrounders/december25/gaveshi/1.jpeg',
          '/images/d7allrounders/december25/gaveshi/2.jpeg',
        ],
        galleryDir: '/images/d7allrounders/december25/gaveshi',
      },
      {
        name: 'Leo Lasith Saranga',
        photo: '/images/d7allrounders/december25/lasith/1.jpeg',
        achievement: 'BESA FAS – Best Employability Skills Award & 1st Runner-Up JESA',
        description:
          'Leo Lasith Saranga, Immediate Past President of the Leo Club of the University of Sri Jayewardenepura, has been recognized for excellence in professional competency and leadership. He was awarded the BESA FAS – Best Employability Skills Award by the Faculty of Applied Sciences and secured 1st Runner-Up at the Japura Employability Skills Awards (JESA). These accolades highlight his strong employability profile and leadership-driven impact, reinforcing the high-performance standard of Leo District 306 D7 All Rounders.',
        gallery: [
          '/images/d7allrounders/december25/lasith/1.jpeg',
          '/images/d7allrounders/december25/lasith/2.jpeg',
        ],
        galleryDir: '/images/d7allrounders/december25/lasith',
      },
    ],
  },
  { month: 'January', year: '2026', allRounders: [] },
  { month: 'February', year: '2026', allRounders: [] },
  { month: 'March', year: '2026', allRounders: [] },
  { month: 'April', year: '2026', allRounders: [] },
  { month: 'May', year: '2026', allRounders: [] },
  { month: 'June', year: '2026', allRounders: [] },
];

const FALLBACK_HIGHLIGHTS: MonthHighlight[] = sortHighlights(
  RAW_FALLBACK_HIGHLIGHTS.map((month, index) => normalizeRawMonth(month, index)),
);

export const dynamic = 'force-dynamic';

export default function AllRoundersPage() {
  const [highlights, setHighlights] = useState<MonthHighlight[]>(FALLBACK_HIGHLIGHTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [query, setQuery] = useState<string>('');
  const [selectedGallery, setSelectedGallery] = useState<{
    name: string;
    images: string[];
    index: number;
    description: string;
    achievement: string;
  } | null>(null);
  const [hoveredLeo, setHoveredLeo] = useState<string | null>(null);
  const [hoverImageIndex, setHoverImageIndex] = useState<Record<string, number>>({});
  const [discoveredGalleries, setDiscoveredGalleries] = useState<Record<string, string[]>>({});
  const preloaded = useRef<Record<string, HTMLImageElement[]>>({});
  const [portraitError, setPortraitError] = useState<Record<string, boolean>>({});
  const { isFirebaseAvailable } = useFirebase();

  useEffect(() => {
    if (!isFirebaseAvailable) {
      setHighlights(FALLBACK_HIGHLIGHTS);
      setLoading(false);
      setError('Firebase not available. Showing fallback content.');
      return;
    }

    const collectionRef = safeCollection('allRoundersHighlights');
    if (!collectionRef) {
      setHighlights(FALLBACK_HIGHLIGHTS);
      setLoading(false);
      setError('Firebase not available. Showing fallback content.');
      return;
    }

    const orderedQuery = safeBuildQuery(collectionRef, safeOrderBy('monthIndex', 'asc'));

    if (!orderedQuery) {
      setHighlights(FALLBACK_HIGHLIGHTS);
      setLoading(false);
      setError('Firebase not available. Showing fallback content.');
      return;
    }

    const unsubscribe = safeOnSnapshot(
      orderedQuery,
      (snapshot) => {
        const nextHighlights = snapshot.docs.map((doc: any) => normalizeDoc(doc)).filter(Boolean) as MonthHighlight[];
        if (nextHighlights.length > 0) {
          setHighlights(sortHighlights(nextHighlights));
        } else {
          setHighlights(FALLBACK_HIGHLIGHTS);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Failed to load All Rounders highlights:', err);
        setError('Live data unavailable. Showing fallback content.');
        setHighlights(FALLBACK_HIGHLIGHTS);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [isFirebaseAvailable]);

  const years = useMemo(() => {
    const unique = new Set<string>(['All']);
    highlights.forEach((highlight) => unique.add(highlight.year));
    return Array.from(unique).sort();
  }, [highlights]);

  const filteredMonths = useMemo(() => {
    const byYear =
      yearFilter === 'All' ? highlights : highlights.filter((highlight) => highlight.year === yearFilter);
    const search = query.trim().toLowerCase();

    if (!search) {
      return byYear;
    }

    return byYear
      .map((highlight) => ({
        ...highlight,
        allRounders: highlight.allRounders.filter((leo) => leo.name.toLowerCase().includes(search)),
      }))
      .filter((highlight) => highlight.allRounders.length > 0);
  }, [highlights, yearFilter, query]);

  const leoKey = (month: string, year: string, leo: AllRounder) => `${month}-${year}-${leo.id}`;

  useEffect(() => {
    const loadForLeo = (key: string, leo: AllRounder) => {
      if (discoveredGalleries[key]) return;

      if (leo.gallery.length > 0) {
        setDiscoveredGalleries((prev) => ({ ...prev, [key]: leo.gallery }));
        preloaded.current[key] = leo.gallery.map((src) => {
          const img = new Image();
          img.src = src;
          return img;
        });
      }
    };

    filteredMonths.forEach((highlight) => {
      highlight.allRounders.forEach((leo) => {
        const key = leoKey(highlight.month, highlight.year, leo);
        loadForLeo(key, leo);
      });
    });
  }, [filteredMonths, discoveredGalleries]);

  const handleMouseEnter = (key: string, images: string[]) => {
    if (images.length <= 1) return;
    setHoveredLeo(key);
    const interval = window.setInterval(() => {
      setHoverImageIndex((prev) => ({
        ...prev,
        [key]: ((prev[key] ?? 0) + 1) % images.length,
      }));
    }, 1200);
    (window as any)[`interval_${key}`] = interval;
  };

  const handleMouseLeave = (key: string) => {
    setHoveredLeo(null);
    const stored = (window as any)[`interval_${key}`];
    if (stored) {
      window.clearInterval(stored);
      delete (window as any)[`interval_${key}`];
    }
    setHoverImageIndex((prev) => ({ ...prev, [key]: 0 }));
  };

  const openGallery = (leo: AllRounder, images: string[]) => {
    const finalImages = images.length > 0 ? images : ['/images/coming-soon.svg'];
    setSelectedGallery({
      name: leo.name,
      images: finalImages,
      index: 0,
      description: leo.description,
      achievement: leo.achievement,
    });
  };

  const closeGallery = () => setSelectedGallery(null);

  const nextInGallery = () =>
    setSelectedGallery((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : prev));

  const prevInGallery = () =>
    setSelectedGallery((prev) =>
      prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : prev,
    );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl p-8 md:p-10 bg-gradient-to-r from-rose/20 via-fuchsia/10 to-crimson/20 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-serif text-3xl md:text-4xl font-extrabold tracking-tight">D7 All-Rounders</h1>
            <p className="mt-2 opacity-90 text-sm md:text-base max-w-2xl">
              Celebrating outstanding achievements by Leos of District 306 D7 beyond Leoism — academics, sports, arts,
              service, and more.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1 rounded-full text-xs md:text-sm bg-white/10">July 2025 – June 2026</span>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-4 md:p-6 space-y-4">
        {loading && (
          <div className="text-sm opacity-70">
            Loading latest highlights…
          </div>
        )}
        {error && !loading && (
          <div className="text-sm text-amber-300">
            {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm opacity-70">Year</label>
            <select
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-rose/40"
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
            >
              {years.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>
          </div>
          <div className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-rose/40"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60">🔎</span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {filteredMonths.map((highlight) => (
          <div key={highlight.id} className="surface-card rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="heading-serif text-xl md:text-2xl font-semibold">
                  {highlight.month} {highlight.year}
                </h2>
                <p className="text-xs opacity-70">
                  {highlight.allRounders.length > 0 ? 'Recognizing excellence' : 'Coming soon'}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs bg-white/10">
                {highlight.allRounders.length} {highlight.allRounders.length === 1 ? 'Leo' : 'Leos'}
              </span>
            </div>

            {highlight.allRounders.length === 0 ? (
              <div className="text-center py-10 opacity-70">No entries for this month yet.</div>
            ) : (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {highlight.allRounders.map((leo) => {
                  const key = leoKey(highlight.month, highlight.year, leo);
                  const images = discoveredGalleries[key] ?? [];
                  const displayImage =
                    images.length > 0
                      ? hoveredLeo === key && images.length > 1
                        ? images[hoverImageIndex[key] ?? 0]
                        : images[0]
                      : '/images/coming-soon.svg';
                  const portraitFallback = leo.name.toLowerCase().includes('buwani')
                    ? '/images/portrait-placeholder.svg'
                    : '/images/coming-soon.svg';
                  const portraitSrc = portraitError[key] ? portraitFallback : leo.photo;

                  return (
                    <motion.div
                      key={leo.id}
                      whileHover={{ y: -2 }}
                      className="rounded-xl p-4 border border-white/10 surface-card cursor-pointer"
                      onClick={() => openGallery(leo, images)}
                    >
                      <div
                        className="relative w-full h-56 md:h-64 rounded-lg overflow-hidden bg-black/80"
                        onMouseEnter={() => handleMouseEnter(key, images)}
                        onMouseLeave={() => handleMouseLeave(key)}
                      >
                        <NextImage
                          src={displayImage}
                          alt={leo.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-contain transition-all duration-500"
                        />
                        {images.length > 1 && hoveredLeo === key && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, idx) => (
                              <div
                                key={`${key}-dot-${idx}`}
                                className={`w-2 h-2 rounded-full ${
                                  idx === (hoverImageIndex[key] ?? 0) ? 'bg-white' : 'bg-white/40'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-start gap-4">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/5 flex-shrink-0">
                          <NextImage
                            src={portraitSrc}
                            alt={leo.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                            onError={() => setPortraitError((prev) => ({ ...prev, [key]: true }))}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base md:text-lg truncate">{leo.name}</h3>
                          <p className="text-rose font-medium text-sm md:text-[15px]">{leo.achievement}</p>
                          <p className="opacity-80 text-sm mt-2 line-clamp-3">{leo.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {filteredMonths.length === 0 && (
          <div className="surface-card rounded-2xl p-8 text-center opacity-70">
            No results found. Try a different year or search.
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={closeGallery}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-4 sm:p-6 max-w-5xl w-full max-h-[90vh] overflow-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="heading-serif text-lg sm:text-xl font-semibold">{selectedGallery.name}</h3>
                  <p className="text-sm opacity-80">{selectedGallery.achievement}</p>
                </div>
                <button onClick={closeGallery} className="px-3 py-1.5 rounded-lg glass hover:bg-white/10">
                  Close
                </button>
              </div>
              <div className="relative w-full aspect-video bg-black/90 rounded-xl overflow-hidden">
                <NextImage
                  src={selectedGallery.images[selectedGallery.index]}
                  alt={`${selectedGallery.name} ${selectedGallery.index + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
                {selectedGallery.images.length > 1 && (
                  <>
                    <button
                      onClick={prevInGallery}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-white/10"
                      title="Previous"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextInGallery}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-white/10"
                      title="Next"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {selectedGallery.images.map((_, index) => (
                        <div
                          key={`${selectedGallery.name}-gallery-dot-${index}`}
                          className={`w-2 h-2 rounded-full ${
                            index === selectedGallery.index ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-white/5 max-h-40 overflow-auto text-sm">
                {selectedGallery.description}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function normalizeDoc(doc: QueryDocumentSnapshot): MonthHighlight | null {
  const data = doc.data({ serverTimestamps: 'estimate' }) as Partial<MonthHighlight> & {
    allRounders?: Partial<AllRounder>[];
  };

  const month = data.month ?? '';
  const year = data.year ?? '';
  if (!month || !year) return null;

  const highlightId = doc.id;
  const monthIndex =
    typeof data.monthIndex === 'number'
      ? data.monthIndex
      : MONTH_SEQUENCE.indexOf(month) >= 0
      ? MONTH_SEQUENCE.indexOf(month)
      : 0;

  const normalizedAllRounders =
    Array.isArray(data.allRounders) && data.allRounders.length > 0
      ? data.allRounders.map((leo, index) =>
          normalizeRawAllRounder(
            {
              name: leo.name,
              photo: leo.photo,
              achievement: leo.achievement,
              description: leo.description,
              gallery: leo.gallery,
              galleryDir: leo.galleryDir ?? undefined,
            },
            highlightId,
            index,
          ),
        )
      : [];

  return {
    id: highlightId,
    month,
    year,
    monthIndex,
    allRounders: normalizedAllRounders,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}