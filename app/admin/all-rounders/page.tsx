'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { RoleGuard } from '@/components/role-guard';
import { LoadingSpinner } from '@/components/loading';
import { db } from '@/lib/firebase';
import type { AllRounder, MonthHighlight } from '@/types/all-rounder';

const MONTH_SEQUENCE = [
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
];

type AllRounderFormState = {
  id: string;
  name: string;
  photo: string;
  achievement: string;
  description: string;
  gallery: string[];
  galleryDir: string;
  newGalleryUrl: string;
};

type HighlightFormState = {
  month: string;
  year: string;
  allRounders: AllRounderFormState[];
};

type FieldErrors = Partial<Record<'month' | 'year', string>> & { allRounders?: string };

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const makeHighlightId = (month: string, year: string) => `${year}-${slugify(month)}`;

const emptyRounder = (seed: string): AllRounderFormState => ({
  id: `${seed}-${crypto.randomUUID()}`,
  name: '',
  photo: '',
  achievement: '',
  description: '',
  gallery: [],
  galleryDir: '',
  newGalleryUrl: '',
});

const emptyForm = (): HighlightFormState => ({
  month: MONTH_SEQUENCE[0],
  year: new Date().getFullYear().toString(),
  allRounders: [],
});

function normalizeHighlightToForm(highlight: MonthHighlight): HighlightFormState {
  return {
    month: highlight.month,
    year: highlight.year,
    allRounders: highlight.allRounders.map((leo) => ({
      id: leo.id,
      name: leo.name,
      photo: leo.photo,
      achievement: leo.achievement,
      description: leo.description,
      gallery: Array.isArray(leo.gallery) ? leo.gallery : [],
      galleryDir: leo.galleryDir ?? '',
      newGalleryUrl: '',
    })),
  };
}

function sanitizeRounder(seed: string, rounder: AllRounderFormState, index: number): AllRounder {
  const gallery = rounder.gallery.map((url) => url.trim()).filter((url) => url.length > 0);

  return {
    id: rounder.id || `${seed}-leo-${index + 1}`,
    name: rounder.name.trim() || 'Outstanding Leo',
    photo: rounder.photo.trim() || '/images/coming-soon.svg',
    achievement: rounder.achievement.trim() || 'Milestone achievement',
    description: rounder.description.trim() || 'Details coming soon.',
    gallery,
    galleryDir: rounder.galleryDir.trim() || null,
  };
}

function HighlightForm() {
  const [highlights, setHighlights] = useState<MonthHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<HighlightFormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeRounder, setActiveRounder] = useState<number>(-1);

  useEffect(() => {
    const highlightsQuery = query(collection(db, 'allRoundersHighlights'), orderBy('monthIndex', 'asc'));
    const unsubscribe = onSnapshot(
      highlightsQuery,
      (snapshot) => {
        const next = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as MonthHighlight;
          return {
            ...data,
            id: docSnapshot.id,
          } satisfies MonthHighlight;
        });
        setHighlights(next);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load All Rounders highlights:', err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (form.allRounders.length === 0) {
      setActiveRounder(-1);
    } else if (activeRounder >= form.allRounders.length) {
      setActiveRounder(form.allRounders.length - 1);
    } else if (activeRounder === -1) {
      setActiveRounder(0);
    }
  }, [form.allRounders.length, activeRounder]);

  const sortedHighlights = useMemo(
    () =>
      highlights.slice().sort((a, b) => {
        const yearDelta = Number(a.year) - Number(b.year);
        if (yearDelta !== 0) return yearDelta;
        const aIndex = a.monthIndex ?? MONTH_SEQUENCE.indexOf(a.month);
        const bIndex = b.monthIndex ?? MONTH_SEQUENCE.indexOf(b.month);
        return aIndex - bIndex;
      }),
    [highlights],
  );

  const statusIsError = status ? status.toLowerCase().includes('fail') : false;

  const resetForm = () => {
    setForm(emptyForm());
    setErrors({});
    setStatus(null);
    setSelectedId(null);
    setActiveRounder(-1);
  };

  const editHighlight = (highlight: MonthHighlight) => {
    setSelectedId(highlight.id);
    setForm(normalizeHighlightToForm(highlight));
    setErrors({});
    setStatus(null);
    setActiveRounder(0);
  };

  const updateForm = <K extends keyof HighlightFormState>(key: K, value: HighlightFormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateRounder = (index: number, updater: (rounder: AllRounderFormState) => AllRounderFormState) => {
    setForm((prev) => ({
      ...prev,
      allRounders: prev.allRounders.map((rounder, idx) => (idx === index ? updater(rounder) : rounder)),
    }));
  };

  const removeRounder = (index: number) => {
    setForm((prev) => ({
      ...prev,
      allRounders: prev.allRounders.filter((_, idx) => idx !== index),
    }));
  };

  const addRounder = () => {
    const seed = `${form.year}-${slugify(form.month)}`;
    setForm((prev) => ({
      ...prev,
      allRounders: [...prev.allRounders, emptyRounder(seed)],
    }));
    setActiveRounder(form.allRounders.length);
  };

  const addGalleryUrl = (index: number) => {
    const target = form.allRounders[index];
    const url = target?.newGalleryUrl.trim() ?? '';

    if (!target) return;
    if (!url) {
      setStatus('Enter a valid gallery URL before adding.');
      return;
    }
    if (target.gallery.includes(url)) {
      setStatus('This gallery URL has already been added.');
      return;
    }

    setStatus(null);
    setForm((prev) => ({
      ...prev,
      allRounders: prev.allRounders.map((rounder, idx) =>
        idx === index ? { ...rounder, gallery: [...rounder.gallery, url], newGalleryUrl: '' } : rounder,
      ),
    }));
  };

  const removeGalleryUrl = (index: number, url: string) => {
    setForm((prev) => ({
      ...prev,
      allRounders: prev.allRounders.map((rounder, idx) =>
        idx === index
          ? { ...rounder, gallery: rounder.gallery.filter((item) => item !== url) }
          : rounder,
      ),
    }));
  };

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (!form.month) nextErrors.month = 'Select a month';
    if (!form.year.trim()) nextErrors.year = 'Enter a year';
    if (form.allRounders.length === 0) nextErrors.allRounders = 'Add at least one all-rounder';
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const highlightId = selectedId ?? makeHighlightId(form.month, form.year);
    const monthIndex = MONTH_SEQUENCE.indexOf(form.month);
    const payload = {
      month: form.month,
      year: form.year,
      monthIndex: monthIndex >= 0 ? monthIndex : 0,
      allRounders: form.allRounders.map((rounder, index) => sanitizeRounder(highlightId, rounder, index)),
      updatedAt: serverTimestamp(),
      ...(selectedId ? {} : { createdAt: serverTimestamp() }),
    } satisfies Partial<MonthHighlight> & { allRounders: AllRounder[] };

    try {
      setSubmitting(true);
      await setDoc(doc(db, 'allRoundersHighlights', highlightId), payload, { merge: true });
      setStatus(selectedId ? 'Highlight updated successfully.' : 'Highlight created successfully.');
      if (!selectedId) {
        setSelectedId(highlightId);
      }
    } catch (err) {
      console.error('Failed to save highlight:', err);
      setStatus('Failed to save highlight. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (highlightId: string, label: string) => {
    if (!window.confirm(`Delete highlight for ${label}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'allRoundersHighlights', highlightId));
      if (selectedId === highlightId) {
        resetForm();
      }
      setStatus('Highlight deleted.');
    } catch (err) {
      console.error('Failed to delete highlight:', err);
      setStatus('Failed to delete highlight. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="heading-serif text-3xl font-bold">All-Rounders Administration</h1>
        <p className="text-sm opacity-70">Manage monthly highlights and featured all-rounder achievements for D7.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="glass rounded-2xl p-6 space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{selectedId ? 'Edit Highlight' : 'Create Highlight'}</h2>
            {selectedId && (
              <button type="button" onClick={resetForm} className="text-sm text-burgundy hover:underline">
                Start new highlight
              </button>
            )}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Month</label>
                <select
                  value={form.month}
                  onChange={(event) => updateForm('month', event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  aria-invalid={Boolean(errors.month)}
                >
                  {MONTH_SEQUENCE.map((month) => (
                    <option key={month} value={month} className="bg-black text-white">
                      {month}
                    </option>
                  ))}
                </select>
                {errors.month && <p className="text-sm text-red-400">{errors.month}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Year</label>
                <input
                  value={form.year}
                  onChange={(event) => updateForm('year', event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  aria-invalid={Boolean(errors.year)}
                  placeholder="e.g. 2025"
                />
                {errors.year && <p className="text-sm text-red-400">{errors.year}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">All-Rounders</h3>
                <button
                  type="button"
                  onClick={addRounder}
                  className="px-3 py-1 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 text-sm"
                >
                  Add all-rounder
                </button>
              </div>
              {errors.allRounders && <p className="text-sm text-red-400">{errors.allRounders}</p>}

              {form.allRounders.length === 0 ? (
                <p className="text-sm opacity-70">No all-rounders yet. Add the first entry.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {form.allRounders.map((rounder, index) => (
                      <button
                        type="button"
                        key={rounder.id}
                        onClick={() => setActiveRounder(index)}
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                          activeRounder === index ? 'bg-burgundy text-white shadow' : 'bg-white/10 hover:bg-white/20'
                        }`}
                        aria-pressed={activeRounder === index}
                      >
                        {rounder.name.trim() || `All-Rounder ${index + 1}`}
                      </button>
                    ))}
                  </div>

                  {form.allRounders.map((rounder, index) => {
                    if (index !== activeRounder) return null;

                    const { newGalleryUrl } = rounder;

                    return (
                      <div key={rounder.id} className="glass rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">All-Rounder {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeRounder(index)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium">Name</label>
                            <input
                              value={rounder.name}
                              onChange={(event) =>
                                updateRounder(index, (prev) => ({ ...prev, name: event.target.value }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium">Achievement</label>
                            <input
                              value={rounder.achievement}
                              onChange={(event) =>
                                updateRounder(index, (prev) => ({ ...prev, achievement: event.target.value }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium">Portrait / Cover URL</label>
                            <input
                              value={rounder.photo}
                              onChange={(event) =>
                                updateRounder(index, (prev) => ({ ...prev, photo: event.target.value }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                              placeholder="https://..."
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium">Description</label>
                            <textarea
                              value={rounder.description}
                              onChange={(event) =>
                                updateRounder(index, (prev) => ({ ...prev, description: event.target.value }))
                              }
                              className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium">Gallery URLs</label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                value={newGalleryUrl}
                                onChange={(event) =>
                                  updateRounder(index, (prev) => ({ ...prev, newGalleryUrl: event.target.value }))
                                }
                                className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                                placeholder="https://example.com/image.jpg"
                              />
                              <button
                                type="button"
                                onClick={() => addGalleryUrl(index)}
                                className="px-3 py-2 rounded-lg bg-burgundy text-white text-sm hover:bg-burgundy/80"
                              >
                                Add
                              </button>
                            </div>
                            {rounder.gallery.length > 0 ? (
                              <ul className="flex flex-wrap gap-2">
                                {rounder.gallery.map((url) => (
                                  <li key={url} className="group flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                                    <span className="text-xs break-all">{url}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeGalleryUrl(index, url)}
                                      className="text-xs text-red-300 hover:text-red-200"
                                      aria-label={`Remove ${url}`}
                                    >
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs opacity-60">No gallery images yet.</p>
                            )}
                            <p className="text-xs opacity-60">
                              Paste a URL and click Add for each gallery image. Order reflects display order.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium">Gallery Directory (optional)</label>
                            <input
                              value={rounder.galleryDir}
                              onChange={(event) =>
                                updateRounder(index, (prev) => ({ ...prev, galleryDir: event.target.value }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                              placeholder="/images/d7allrounders/..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {status && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    statusIsError ? 'border-red-400 bg-red-400/10 text-red-200' : 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
                  }`}
                >
                  {status}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving…' : selectedId ? 'Save highlight' : 'Create highlight'}
                </button>

                {selectedId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedId, `${form.month} ${form.year}`)}
                    className="px-4 py-2 rounded-lg border border-red-400/60 text-red-300 hover:bg-red-400/10"
                  >
                    Delete highlight
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>

        <section className="glass rounded-2xl p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Existing Highlights</h3>
            <span className="text-xs opacity-70">{loading ? 'Loading…' : `${sortedHighlights.length} total`}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner className="text-burgundy" />
            </div>
          ) : sortedHighlights.length === 0 ? (
            <p className="text-sm opacity-70">No highlights saved yet.</p>
          ) : (
            <ul className="space-y-3">
              {sortedHighlights.map((highlight) => {
                const label = `${highlight.month} ${highlight.year}`;
                const countLabel = `${highlight.allRounders.length} ${
                  highlight.allRounders.length === 1 ? 'all-rounder' : 'all-rounders'
                }`;

                return (
                  <li key={highlight.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3">
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs opacity-70">{countLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editHighlight(highlight)}
                        className="px-3 py-1 rounded-lg text-xs bg-white/10 hover:bg-white/20"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(highlight.id, label)}
                        className="px-3 py-1 rounded-lg text-xs text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function AdminAllRoundersPage() {
  return (
    <RoleGuard role={['admin', 'trainer']}>
      <HighlightForm />
    </RoleGuard>
  );
}