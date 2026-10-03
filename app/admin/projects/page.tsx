"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "../../../components/role-guard";
import { LoadingSpinner } from "../../../components/loading";
import { db } from "../../../lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { Project, ProjectCategory } from "@/types/project";

const categoryOptions: readonly { value: ProjectCategory; label: string }[] = [
  { value: "meetings", label: "Meetings" },
  { value: "orientations", label: "Orientations" },
  { value: "youth", label: "Youth" },
  { value: "religious", label: "Religious" },
  { value: "service", label: "Service Projects" },
  { value: "upcoming", label: "Upcoming / Coming Soon" },
];

type ProjectFormState = {
  id: string;
  title: string;
  category: ProjectCategory | "";
  description: string;
  image: string;
  date: string;
  venue: string;
  impact: string;
  gallery: string[];
  newGalleryUrl: string;
};

type FieldErrors = Partial<Record<keyof ProjectFormState | "gallery", string>>;

const emptyForm: ProjectFormState = {
  id: "",
  title: "",
  category: "",
  description: "",
  image: "",
  date: "",
  venue: "",
  impact: "",
  gallery: [],
  newGalleryUrl: "",
};

function normalizeProject(project: Partial<Project> & { id: string }): Project {
  const gallery = Array.isArray(project.gallery)
    ? project.gallery.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];

  const image =
    typeof project.image === "string" && project.image.trim().length > 0
      ? project.image.trim()
      : gallery[0] ?? "/images/coming-soon.svg";

  const isoDate =
    typeof project.date === "string" && project.date.length > 0
      ? project.date
      : new Date().toISOString();

  return {
    id: project.id,
    title:
      typeof project.title === "string" && project.title.trim().length > 0
        ? project.title.trim()
        : "Untitled Project",
    category: (project.category as ProjectCategory) ?? "service",
    description:
      typeof project.description === "string" && project.description.trim().length > 0
        ? project.description.trim()
        : "Description coming soon.",
    image,
    date: isoDate,
    venue:
      typeof project.venue === "string" && project.venue.trim().length > 0
        ? project.venue.trim()
        : "To be announced",
    impact:
      typeof project.impact === "string" && project.impact.trim().length > 0
        ? project.impact.trim()
        : "Impact details coming soon.",
    gallery: gallery.length > 0 ? gallery : [image],
  };
}

function formatDateForInput(date: string): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date.slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

function formatDateForDisplay(date: string): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminProjectsPage() {
  return (
    <RoleGuard role={["admin", "trainer"]}>
      <ProjectsManager />
    </RoleGuard>
  );
}

function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProjectFormState>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const projectsQuery = query(collection(db, "projects"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const next = snapshot.docs.map((docSnapshot) =>
          normalizeProject({
            id: docSnapshot.id,
            ...(docSnapshot.data() as Partial<Project>),
          }),
        );
        setProjects(next);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load projects:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [projects],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setSelectedId(null);
    setStatus(null);
  };

  const populateForm = (project: Project) => {
    setSelectedId(project.id);
    setForm({
      id: project.id,
      title: project.title,
      category: project.category,
      description: project.description,
      image: project.image,
      date: formatDateForInput(project.date),
      venue: project.venue,
      impact: project.impact,
      gallery: project.gallery,
      newGalleryUrl: "",
    });
    setErrors({});
    setStatus(null);
  };

  const validate = (state: ProjectFormState): boolean => {
    const nextErrors: FieldErrors = {};
    const slugPattern = /^[a-z0-9-]+$/i;

    if (!selectedId && !state.id.trim()) {
      nextErrors.id = "Provide a unique project ID (letters, numbers, dashes).";
    } else if (!selectedId && !slugPattern.test(state.id.trim())) {
      nextErrors.id = "ID may only contain letters, numbers, and dashes.";
    }

    if (!state.title.trim()) nextErrors.title = "Title is required.";
    if (!state.category) nextErrors.category = "Select a category.";
    if (!state.description.trim()) nextErrors.description = "Description is required.";
    if (!state.date) nextErrors.date = "Pick a date.";
    if (!state.venue.trim()) nextErrors.venue = "Venue is required.";
    if (!state.impact.trim()) nextErrors.impact = "Impact summary is required.";

    const gallery = state.gallery.filter((url) => url.trim());
    if (gallery.length === 0) {
      nextErrors.gallery = "Add at least one gallery image URL.";
    }

    if (!state.image.trim()) {
      nextErrors.image = "Cover image URL is required (can be one of the gallery URLs).";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const sanitizeProjectPayload = (state: ProjectFormState): Project => {
    const gallery = state.gallery
      .map((url) => url.trim())
      .filter((url, index, self) => url && self.indexOf(url) === index);

    const isoDate = state.date
      ? new Date(`${state.date}T00:00:00Z`).toISOString()
      : new Date().toISOString();

    const coverImage = state.image.trim() || gallery[0] || "/images/coming-soon.svg";

    return {
      id: state.id.trim() || selectedId || "",
      title: state.title.trim(),
      category: (state.category || "service") as ProjectCategory,
      description: state.description.trim(),
      image: coverImage,
      date: isoDate,
      venue: state.venue.trim(),
      impact: state.impact.trim(),
      gallery: gallery.length > 0 ? gallery : [coverImage],
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const draft = {
      ...form,
      id: selectedId ?? form.id,
    };

    if (!validate(draft)) return;

    const payload = sanitizeProjectPayload(draft);
    const docId = selectedId ?? payload.id;

    try {
      setSubmitting(true);
      await setDoc(
        doc(db, "projects", docId),
        {
          ...payload,
          updatedAt: serverTimestamp(),
          ...(selectedId ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true },
      );

      setStatus(selectedId ? "Project updated successfully." : "Project created successfully.");
      if (!selectedId) {
        setForm(emptyForm);
      }
    } catch (error) {
      console.error("Failed to save project:", error);
      setStatus("Failed to save project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = projects.find((project) => project.id === id);
    if (!target) return;

    const confirmed = window.confirm(
      `Delete project "${target.title}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "projects", id));
      if (selectedId === id) {
        resetForm();
      }
      setStatus("Project deleted.");
    } catch (error) {
      console.error("Failed to delete project:", error);
      setStatus("Failed to delete project. Please try again.");
    }
  };

  const addGalleryItem = () => {
    const url = form.newGalleryUrl.trim();
    if (!url) return;
    if (form.gallery.includes(url)) {
      setErrors((prev) => ({ ...prev, gallery: "This URL is already in the gallery." }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      gallery: [...prev.gallery, url],
      newGalleryUrl: "",
    }));
    setErrors((prev) => ({ ...prev, gallery: undefined }));
  };

  const removeGalleryItem = (url: string) => {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((item) => item !== url),
    }));
  };

  const isEditMode = Boolean(selectedId);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="heading-serif text-3xl font-bold">Projects Admin</h1>
        <p className="text-sm opacity-70">
          Create, update, and curate the district project showcase.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="glass rounded-2xl p-6 space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isEditMode ? "Edit Project" : "Create Project"}
            </h2>
            {isEditMode && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-burgundy hover:underline"
              >
                Clear selection
              </button>
            )}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isEditMode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Project ID</label>
                <input
                  value={form.id}
                  onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  placeholder="e.g. first-board-meeting"
                  aria-invalid={Boolean(errors.id)}
                />
                {errors.id && <p className="text-sm text-red-400">{errors.id}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Title</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      category: event.target.value as ProjectCategory,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  aria-invalid={Boolean(errors.category)}
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-sm text-red-400">{errors.category}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  aria-invalid={Boolean(errors.date)}
                />
                {errors.date && <p className="text-sm text-red-400">{errors.date}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Venue</label>
                <input
                  value={form.venue}
                  onChange={(event) => setForm((prev) => ({ ...prev, venue: event.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  aria-invalid={Boolean(errors.venue)}
                />
                {errors.venue && <p className="text-sm text-red-400">{errors.venue}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                rows={4}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description && <p className="text-sm text-red-400">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Impact Summary</label>
              <textarea
                value={form.impact}
                onChange={(event) => setForm((prev) => ({ ...prev, impact: event.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                rows={3}
                aria-invalid={Boolean(errors.impact)}
              />
              {errors.impact && <p className="text-sm text-red-400">{errors.impact}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Cover Image URL</label>
              <input
                value={form.image}
                onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                placeholder="https://example.com/image.jpg"
                aria-invalid={Boolean(errors.image)}
              />
              {errors.image && <p className="text-sm text-red-400">{errors.image}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Gallery URLs</label>
                {errors.gallery && <span className="text-sm text-red-400">{errors.gallery}</span>}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={form.newGalleryUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, newGalleryUrl: event.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  placeholder="https://example.com/gallery-image.jpg"
                />
                <button
                  type="button"
                  onClick={addGalleryItem}
                  className="px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-colors"
                >
                  Add URL
                </button>
              </div>

              {form.gallery.length > 0 && (
                <ul className="space-y-2">
                  {form.gallery.map((url) => (
                    <li
                      key={url}
                      className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
                    >
                      <span className="truncate flex-1 pr-3" title={url}>
                        {url}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(url)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-colors disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Saving…" : isEditMode ? "Update Project" : "Create Project"}
              </button>
              {status && <span className="text-sm opacity-80">{status}</span>}
            </div>
          </form>
        </section>

        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Existing Projects</h2>
            {loading && <LoadingSpinner size="sm" className="text-burgundy" />}
          </div>

          {sortedProjects.length === 0 && !loading && (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-sm opacity-70">
                No projects found yet. Start by creating one using the form.
              </p>
            </div>
          )}

          <ul className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {sortedProjects.map((project) => (
              <li
                key={project.id}
                className={`glass rounded-xl border p-4 transition-colors ${
                  selectedId === project.id ? "border-burgundy/60" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">{project.title}</h3>
                    <p className="text-xs uppercase tracking-wide opacity-60">{project.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => populateForm(project)}
                      className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id)}
                      className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-xs opacity-70">
                  <p>
                    <strong>Date:</strong> {formatDateForDisplay(project.date)}
                  </p>
                  <p>
                    <strong>Venue:</strong> {project.venue}
                  </p>
                  <p className="line-clamp-2">
                    <strong>Impact:</strong> {project.impact}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}