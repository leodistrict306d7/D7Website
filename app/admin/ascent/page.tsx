'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { RoleGuard } from '@/components/role-guard';
import { LoadingSpinner } from '@/components/loading';
import { db } from '@/lib/firebase';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
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

const normalizeIssue = (docSnapshot: QueryDocumentSnapshot): IssueRecord => {
  const data = docSnapshot.data() as Partial<IssueRecord> & { createdAt?: unknown };

  return {
    id: docSnapshot.id,
    title: data.title?.trim() || 'Untitled Issue',
    coverImage: data.coverImage?.trim() || '/images/coming-soon.svg',
    heyzineEmbedUrl: data.heyzineEmbedUrl?.trim() || '',
    heyzineDirectUrl: data.heyzineDirectUrl?.trim() || data.heyzineEmbedUrl?.trim() || '#',
    createdAt: normalizeTimestamp(data.createdAt),
  } satisfies IssueRecord;
};

const slugPattern = /^[a-z0-9-]+$/i;

type NewsletterFormState = {
  id: string;
  title: string;
  coverImage: string;
  heyzineEmbedUrl: string;
  heyzineDirectUrl: string;
};

const emptyFormState: NewsletterFormState = {
  id: '',
  title: '',
  coverImage: '',
  heyzineEmbedUrl: '',
  heyzineDirectUrl: '',
};

type FieldErrors = Partial<Record<keyof NewsletterFormState, string>>;

const sanitizePayload = (state: NewsletterFormState): Omit<NewsletterIssue, 'id'> => {
  const embedUrl = state.heyzineEmbedUrl.trim();
  const directUrl = state.heyzineDirectUrl.trim() || embedUrl;

  return {
    title: state.title.trim() || 'Untitled Issue',
    coverImage: state.coverImage.trim() || '/images/coming-soon.svg',
    heyzineEmbedUrl: embedUrl,
    heyzineDirectUrl: directUrl || '#',
  } satisfies Omit<NewsletterIssue, 'id'>;
};

function AscentAdminInner() {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<NewsletterFormState>(emptyFormState);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const newslettersQuery = query(collection(db, 'newsletters'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      newslettersQuery,
      (snapshot) => {
        const next = snapshot.docs.map((docSnapshot) => normalizeIssue(docSnapshot));
        setIssues(next);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load newsletters:', err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setForm(emptyFormState);
    setErrors({});
    setSelectedId(null);
    setStatus(null);
  };

  const populateForm = (issue: IssueRecord) => {
    setSelectedId(issue.id);
    setForm({
      id: issue.id,
      title: issue.title,
      coverImage: issue.coverImage,
      heyzineEmbedUrl: issue.heyzineEmbedUrl,
      heyzineDirectUrl: issue.heyzineDirectUrl,
    });
    setErrors({});
    setStatus(null);
  };

  const validate = (state: NewsletterFormState): boolean => {
    const nextErrors: FieldErrors = {};

    if (!selectedId) {
      if (!state.id.trim()) {
        nextErrors.id = 'Provide a unique ID (letters, numbers, dashes).';
      } else if (!slugPattern.test(state.id.trim())) {
        nextErrors.id = 'ID may only contain letters, numbers, and dashes.';
      }
    }

    if (!state.title.trim()) nextErrors.title = 'Title is required.';
    if (!state.heyzineEmbedUrl.trim()) nextErrors.heyzineEmbedUrl = 'Heyzine embed link is required.';
    if (state.heyzineDirectUrl && !state.heyzineDirectUrl.trim().startsWith('http')) {
      nextErrors.heyzineDirectUrl = 'Provide a valid URL or leave blank to reuse the embed link.';
    }
    if (state.heyzineEmbedUrl && !state.heyzineEmbedUrl.trim().startsWith('http')) {
      nextErrors.heyzineEmbedUrl = 'Provide a valid Heyzine embed URL (must start with http).';
    }

    if (state.coverImage && !state.coverImage.trim().startsWith('http') && !state.coverImage.trim().startsWith('/')) {
      nextErrors.coverImage = 'Cover image should be a valid URL or relative path.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const draft: NewsletterFormState = {
      ...form,
      id: selectedId ?? form.id,
    };

    if (!validate(draft)) return;

    const payload = sanitizePayload(draft);
    const docId = selectedId ?? draft.id.trim();

    try {
      setSubmitting(true);
      await setDoc(
        doc(db, 'newsletters', docId),
        {
          ...payload,
          updatedAt: serverTimestamp(),
          ...(selectedId ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true },
      );

      setStatus(selectedId ? 'Newsletter updated successfully.' : 'Newsletter created successfully.');
      if (!selectedId) {
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save newsletter:', error);
      setStatus('Failed to save newsletter. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const issue = issues.find((item) => item.id === id);
    if (!issue) return;

    const confirmed = window.confirm(`Delete newsletter "${issue.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'newsletters', id));
      if (selectedId === id) {
        resetForm();
      }
      setStatus('Newsletter deleted.');
    } catch (error) {
      console.error('Failed to delete newsletter:', error);
      setStatus('Failed to delete newsletter. Please try again.');
    }
  };

  const sortedIssues = useMemo(
    () => issues.slice().sort((a, b) => ((a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1)),
    [issues],
  );
  const isEditMode = Boolean(selectedId);

  const formatCreatedAt = (value?: string) => {
    if (!value) return 'Date TBA';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Date TBA';
    return parsed.toLocaleString();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="heading-serif text-3xl font-bold">Ascent Newsletter Admin</h1>
        <p className="text-sm opacity-70">Embed Heyzine issues and curate the Ascent newsletter library.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="glass rounded-2xl p-6 space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{isEditMode ? 'Edit issue' : 'Add new issue'}</h2>
            {isEditMode && (
              <button type="button" onClick={resetForm} className="text-sm text-burgundy hover:underline">
                Create new entry
              </button>
            )}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isEditMode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Issue ID</label>
                <input
                  value={form.id}
                  onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  placeholder="e.g. ascent-2025-09"
                  aria-invalid={Boolean(errors.id)}
                />
                {errors.id && <p className="text-sm text-red-400">{errors.id}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Heyzine embed URL</label>
                <input
                  value={form.heyzineEmbedUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, heyzineEmbedUrl: event.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  placeholder="https://heyzine.com/flip-book/..."
                  aria-invalid={Boolean(errors.heyzineEmbedUrl)}
                />
                {errors.heyzineEmbedUrl && <p className="text-sm text-red-400">{errors.heyzineEmbedUrl}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Heyzine direct URL (optional)</label>
                <input
                  value={form.heyzineDirectUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, heyzineDirectUrl: event.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  placeholder="https://heyzine.com/flip-book/..."
                  aria-invalid={Boolean(errors.heyzineDirectUrl)}
                />
                {errors.heyzineDirectUrl && <p className="text-sm text-red-400">{errors.heyzineDirectUrl}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Cover image URL</label>
              <input
                value={form.coverImage}
                onChange={(event) => setForm((prev) => ({ ...prev, coverImage: event.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                placeholder="https://example.com/cover.jpg"
                aria-invalid={Boolean(errors.coverImage)}
              />
              {errors.coverImage && <p className="text-sm text-red-400">{errors.coverImage}</p>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-burgundy px-4 py-2 text-sm font-medium text-white transition hover:bg-burgundy/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Create issue'}
              </button>
              {status && (
                <p className="text-sm" role="status">
                  {status}
                </p>
              )}
            </div>
          </form>
        </section>

        <section className="glass rounded-2xl p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Published issues</h3>
            {loading && <LoadingSpinner size="sm" className="text-burgundy" />}
          </div>

          {sortedIssues.length === 0 && !loading ? (
            <p className="text-sm opacity-70">No newsletter issues yet. Create the first one using the form.</p>
          ) : (
            <ul className="space-y-3">
              {sortedIssues.map((issue) => (
                <li
                  key={issue.id}
                  className={`rounded-xl border p-4 transition ${
                    selectedId === issue.id ? 'border-burgundy/60 bg-white/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{issue.title}</p>
                      <p className="text-xs opacity-60">Created {formatCreatedAt(issue.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => populateForm(issue)}
                        className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(issue.id)}
                        className="rounded px-3 py-1 text-xs text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function AdminAscentPage() {
  return (
    <RoleGuard role={['admin', 'trainer']}>
      <AscentAdminInner />
    </RoleGuard>
  );
}
