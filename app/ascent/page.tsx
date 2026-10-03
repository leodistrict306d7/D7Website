'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type QueryDocumentSnapshot } from 'firebase/firestore';
import { safeCollection, safeOnSnapshot, safeOrderBy, safeBuildQuery } from '../../lib/firebase-utils';
import { useFirebase } from '../../providers/firebase-provider';
import { LoadingSpinner } from '@/components/loading';
import type { NewsletterIssue } from '@/types/newsletter';

type IssueRecord = NewsletterIssue & {
  createdAt?: string;
};

const normalizeTimestamp = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch (error) {
      console.error('Failed to convert Firestore timestamp:', error);
      return undefined;
    }
  }
  return undefined;
};

const normalizeIssue = (snapshot: QueryDocumentSnapshot): IssueRecord => {
  const data = snapshot.data() as Partial<IssueRecord> & { createdAt?: unknown };

  return {
    id: snapshot.id,
    title: data.title?.trim() || 'Untitled Issue',
    coverImage: data.coverImage?.trim() || '/images/coming-soon.svg',
    heyzineEmbedUrl: data.heyzineEmbedUrl?.trim() || '',
    heyzineDirectUrl: data.heyzineDirectUrl?.trim() || data.heyzineEmbedUrl?.trim() || '#',
    createdAt: normalizeTimestamp(data.createdAt),
  } satisfies IssueRecord;
};

const FALLBACK_ISSUES: IssueRecord[] = [
  {
    id: 'ascent-coming-soon',
    title: 'Ascent Newsletter',
    coverImage: '/images/coming-soon.svg',
    heyzineEmbedUrl: '',
    heyzineDirectUrl: '#',
    createdAt: new Date().toISOString(),
  },
];

const issueTimestamp = (value?: string) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortIssues = (items: IssueRecord[]) =>
  items.slice().sort((a, b) => issueTimestamp(b.createdAt) - issueTimestamp(a.createdAt));

export const dynamic = 'force-dynamic';

export default function AscentPage() {
  const [issues, setIssues] = useState<IssueRecord[]>(FALLBACK_ISSUES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFirebaseAvailable } = useFirebase();

  useEffect(() => {
    if (!isFirebaseAvailable) {
      setIssues(FALLBACK_ISSUES);
      setLoading(false);
      setError('Firebase not available. Showing fallback content.');
      return;
    }

    const collectionRef = safeCollection('newsletters');
    if (!collectionRef) {
      setIssues(FALLBACK_ISSUES);
      setLoading(false);
      setError('Firebase not available. Showing fallback content.');
      return;
    }

    const orderedQuery = safeBuildQuery(collectionRef, safeOrderBy('createdAt', 'desc'));

    if (!orderedQuery) {
      setIssues(FALLBACK_ISSUES);
      setLoading(false);
      setError('Firebase not available. Showing fallback content.');
      return;
    }

    const unsubscribe = safeOnSnapshot(
      orderedQuery,
      (snapshot) => {
        const nextIssues = sortIssues(snapshot.docs.map((doc: any) => normalizeIssue(doc)));
        if (nextIssues.length > 0) {
          setIssues(nextIssues);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Failed to load newsletters:', err);
        setError('Unable to load the latest Ascent issues. Showing saved highlights.');
        setIssues(FALLBACK_ISSUES);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [isFirebaseAvailable]);

  const [latestIssue, previousIssues] = useMemo(() => {
    if (issues.length === 0) return [null, [] as IssueRecord[]];
    return [issues[0], issues.slice(1)];
  }, [issues]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-rose/20 via-fuchsia/10 to-crimson/20 p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4rem] text-white/70">District Newsletter</p>
            <h1 className="heading-serif text-3xl font-extrabold tracking-tight md:text-4xl">Ascent</h1>
            <p className="max-w-2xl text-sm opacity-90 md:text-base">
              Dive into the stories that shape Leo District 306 D7 — milestones, impact projects, leadership highlights, and
              upcoming initiatives. Each issue of Ascent captures the spirit of our district in motion.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs uppercase tracking-wide text-white md:items-end md:text-right">
            {latestIssue && <span className="text-[0.85rem] font-semibold">Latest issue · {latestIssue.title}</span>}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm">
            <LoadingSpinner className="text-burgundy" />
            <span>Loading the latest newsletter…</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-300/50 bg-amber-300/10 p-4 text-sm text-amber-100">
            {error}
          </div>
        ) : null}

        {latestIssue ? (
          <article className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
            <header className="space-y-3">
              <div className="space-y-2">
                <h2 className="heading-serif text-2xl font-semibold md:text-3xl">{latestIssue.title}</h2>
                <p className="text-sm opacity-70">
                  Enjoy the latest Ascent newsletter right here. Use the embedded viewer below or open it directly on Heyzine.
                </p>
              </div>
            </header>

            {latestIssue.heyzineEmbedUrl ? (
              <div className="relative w-full overflow-hidden rounded-xl border border-white/10">
                <div className="relative aspect-[3/4] w-full sm:aspect-[4/3] lg:aspect-[16/9]">
                  <iframe
                    title={`Read ${latestIssue.title}`}
                    src={latestIssue.heyzineEmbedUrl}
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm opacity-70">
                Heyzine embed will appear here once available.
              </div>
            )}

            <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
                <span className="rounded-full bg-white/10 px-3 py-1">Ascent</span>
                <span className="opacity-70">Latest release</span>
              </div>
              {latestIssue.heyzineDirectUrl && latestIssue.heyzineDirectUrl !== '#' && (
                <Link
                  href={latestIssue.heyzineDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-burgundy px-4 py-2 text-sm font-medium text-white transition hover:bg-burgundy/80"
                >
                  Read on Heyzine
                  <span aria-hidden="true">↗</span>
                </Link>
              )}
            </footer>
          </article>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm opacity-80">
            No Ascent issues have been published yet. Check back soon!
          </div>
        )}
      </section>

      <section className="space-y-4">
        <header className="space-y-2">
          <h3 className="text-xl font-semibold">Previous issues</h3>
          <p className="text-sm opacity-70">Explore past editions and launch them on Heyzine in a new tab.</p>
        </header>

        {previousIssues.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm opacity-70">
            Once new issues are published, they will be listed here with quick access links.
          </div>
        ) : (
          <ul className="space-y-3">
            {previousIssues.map((issue) => (
              <li key={issue.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-burgundy/60">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="text-lg font-semibold">{issue.title}</h4>
                  {issue.heyzineDirectUrl && issue.heyzineDirectUrl !== '#' && (
                    <Link
                      href={issue.heyzineDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-burgundy transition hover:text-burgundy/80"
                    >
                      Read on Heyzine ↗
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
