"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import type { Course, CourseModule, QuizQuestion } from "@/types/course";
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

/* ---------- types & builders ---------- */

type QuizQuestionState = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
};

type ModuleFormState = {
  id: string;
  title: string;
  url: string;
  description: string;
  quiz: QuizQuestionState[];
};

type CourseFormState = {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: Course["difficulty"] | "";
  thumbnail: string;
  requiredSelectionCount: number | "";
  modules: ModuleFormState[];
  quiz: QuizQuestionState[];
};

type FieldErrors = Partial<Record<keyof CourseFormState, string>> & {
  modules?: string;
};

const difficultyChoices: readonly Course["difficulty"][] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const emptyQuestion = (seed: string): QuizQuestionState => ({
  id: `${seed}-q-${crypto.randomUUID()}`,
  question: "",
  options: ["Option 1", "Option 2", "Option 3", "Option 4"],
  correctAnswer: 0,
});

const emptyModule = (seed: string): ModuleFormState => ({
  id: `${seed}-module-${crypto.randomUUID()}`,
  title: "",
  url: "",
  description: "",
  quiz: [],
});

const emptyCourseForm: CourseFormState = {
  id: "",
  title: "",
  description: "",
  category: "",
  duration: "",
  difficulty: "",
  thumbnail: "",
  requiredSelectionCount: "",
  modules: [],
  quiz: [],
};

/* ---------- normalization helpers ---------- */

function normalizeCourseToForm(course: Course): CourseFormState {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    duration: course.duration,
    difficulty: course.difficulty,
    thumbnail: course.thumbnail,
    requiredSelectionCount: course.requiredSelectionCount ?? "",
    modules: course.modules.map((courseItem) => ({
      id: courseItem.id,
      title: courseItem.title,
      url: courseItem.url,
      description: courseItem.description,
      quiz: (courseItem.quiz ?? []).map((question) => ({
        id: question.id,
        question: question.question,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
      })),
    })),
    quiz: course.quiz.map((question) => ({
      id: question.id,
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
    })),
  };
}

function sanitizeQuiz(
  quiz: QuizQuestionState[],
  prefix: string,
): QuizQuestion[] {
  return quiz.map((question, index) => {
    const trimmedOptions = question.options
      .map((option) => option.trim())
      .filter((option) => option.length > 0);

    const options =
      trimmedOptions.length >= 2 ? trimmedOptions : ["Option 1", "Option 2"];
    const correctAnswer =
      question.correctAnswer >= 0 && question.correctAnswer < options.length
        ? question.correctAnswer
        : 0;

    return {
      id: question.id.trim() || `${prefix}-q${index + 1}`,
      question: question.question.trim() || `Question ${index + 1}`,
      options,
      correctAnswer,
    } satisfies QuizQuestion;
  });
}

function sanitizeCourseForm(state: CourseFormState): Course {
  const normalizedModules: CourseModule[] = state.modules.map(
    (courseItem, courseIndex) => ({
      id: courseItem.id.trim() || `module-${courseIndex + 1}`,
      title: courseItem.title.trim() || `Module ${courseIndex + 1}`,
      url: courseItem.url.trim(),
      description: courseItem.description.trim() || "Details coming soon.",
      type: "pdf",
      ...(courseItem.quiz.length > 0
        ? {
            quiz: sanitizeQuiz(
              courseItem.quiz,
              courseItem.id || `module-${courseIndex + 1}`,
            ),
          }
        : {}),
    }),
  );

  const normalizedQuiz = sanitizeQuiz(state.quiz, state.id || "course");
  const selectionCount =
    typeof state.requiredSelectionCount === "number"
      ? Math.max(0, Math.floor(state.requiredSelectionCount))
      : undefined;

  return {
    id: state.id.trim(),
    title: state.title.trim(),
    description: state.description.trim(),
    category: state.category.trim() || "General",
    duration: state.duration.trim() || "Self-paced",
    difficulty: (state.difficulty || "Beginner") as Course["difficulty"],
    thumbnail: state.thumbnail.trim() || "/images/coming-soon.svg",
    modules: normalizedModules,
    quiz: normalizedQuiz,
    ...(selectionCount ? { requiredSelectionCount: selectionCount } : {}),
  };
}

function validateCourse(state: CourseFormState, isEditing: boolean): FieldErrors {
  const nextErrors: FieldErrors = {};

  if (!isEditing) {
    if (!state.id.trim()) {
      nextErrors.id = "Provide a unique course ID.";
    } else if (!/^[a-z0-9-]+$/i.test(state.id.trim())) {
      nextErrors.id = "Course ID may only contain letters, numbers, and dashes.";
    }
  }

  if (!state.title.trim()) nextErrors.title = "Title is required.";
  if (!state.description.trim()) nextErrors.description = "Description is required.";
  if (!state.difficulty) nextErrors.difficulty = "Select a difficulty level.";
  if (state.modules.length === 0) nextErrors.modules = "Add at least one module.";

  state.modules.forEach((courseItem, index) => {
    if (!courseItem.title.trim()) {
      nextErrors.modules = `Module ${index + 1} requires a title.`;
    }
  });

  return nextErrors;
}

/* ---------- main component ---------- */

export default function AdminLmsPage() {
  return (
    <RoleGuard role={["admin", "trainer"]}>
      <CourseManager />
    </RoleGuard>
  );
}

function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CourseFormState>(emptyCourseForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const coursesQuery = query(collection(db, "courses"), orderBy("title", "asc"));
    const unsubscribe = onSnapshot(
      coursesQuery,
      (snapshot) => {
        const nextCourses = snapshot.docs.map(
          (docSnapshot) =>
            ({
              id: docSnapshot.id,
              ...(docSnapshot.data() as Omit<Course, "id">),
            }) satisfies Course,
        );
        setCourses(nextCourses);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load courses:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.title.localeCompare(b.title)),
    [courses],
  );

  const resetForm = () => {
    setForm(emptyCourseForm);
    setErrors({});
    setStatus(null);
    setSelectedId(null);
  };

  const populateForm = (course: Course) => {
    setSelectedId(course.id);
    setForm(normalizeCourseToForm(course));
    setErrors({});
    setStatus(null);
  };

  const updateForm = <Key extends keyof CourseFormState>(
    key: Key,
    value: CourseFormState[Key],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const validation = validateCourse(form, Boolean(selectedId));
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const payload = sanitizeCourseForm({ ...form, id: selectedId ?? form.id });
    const documentId = selectedId ?? payload.id;

    try {
      setSubmitting(true);
      await setDoc(
        doc(db, "courses", documentId),
        {
          ...payload,
          updatedAt: serverTimestamp(),
          ...(selectedId ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true },
      );

      setStatus(selectedId ? "Course updated successfully." : "Course created successfully.");
      if (!selectedId) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save course:", error);
      setStatus("Failed to save course. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId: string, title: string) => {
    if (!window.confirm(`Delete course "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "courses", courseId));
      if (selectedId === courseId) {
        resetForm();
      }
      setStatus("Course deleted.");
    } catch (error) {
      console.error("Failed to delete course:", error);
      setStatus("Failed to delete course. Please try again.");
    }
  };

  const addModule = () => {
    setForm((previous) => ({
      ...previous,
      modules: [...previous.modules, emptyModule(previous.id || "course")],
    }));
  };

  const updateModule = (index: number, updatedModule: ModuleFormState) => {
    setForm((previous) => ({
      ...previous,
      modules: previous.modules.map((courseItem, courseIndex) =>
        courseIndex === index ? updatedModule : courseItem,
      ),
    }));
  };

  const removeModule = (index: number) => {
    setForm((previous) => ({
      ...previous,
      modules: previous.modules.filter((_, courseIndex) => courseIndex !== index),
    }));
  };

  const addCourseQuestion = () => {
    setForm((previous) => ({
      ...previous,
      quiz: [...previous.quiz, emptyQuestion(previous.id || "course")],
    }));
  };

  const updateCourseQuestion = (
    index: number,
    updatedQuestion: QuizQuestionState,
  ) => {
    setForm((previous) => ({
      ...previous,
      quiz: previous.quiz.map((question, questionIndex) =>
        questionIndex === index ? updatedQuestion : question,
      ),
    }));
  };

  const removeCourseQuestion = (index: number) => {
    setForm((previous) => ({
      ...previous,
      quiz: previous.quiz.filter((_, questionIndex) => questionIndex !== index),
    }));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="heading-serif text-3xl font-bold">LMS Course Administration</h1>
        <p className="text-sm opacity-70">
          Manage course catalogue, modules, and quizzes for the district LMS.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="glass rounded-2xl p-6 space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {selectedId ? "Edit Course" : "Create Course"}
            </h2>
            {selectedId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-burgundy hover:underline"
              >
                Start new course
              </button>
            )}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!selectedId && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Course ID</label>
                <input
                  value={form.id}
                  onChange={(event) => updateForm("id", event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  placeholder="e.g. beginner-course"
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
                  onChange={(event) => updateForm("title", event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Category</label>
                <input
                  value={form.category}
                  onChange={(event) => updateForm("category", event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Duration</label>
                <input
                  value={form.duration}
                  onChange={(event) => updateForm("duration", event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(event) =>
                    updateForm("difficulty", event.target.value as CourseFormState["difficulty"])
                  }
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                  aria-invalid={Boolean(errors.difficulty)}
                >
                  <option value="" disabled>
                    Select difficulty
                  </option>
                  {difficultyChoices.map((choice) => (
                    <option key={choice} value={choice} className="bg-black text-white">
                      {choice}
                    </option>
                  ))}
                </select>
                {errors.difficulty && (
                  <p className="text-sm text-red-400">{errors.difficulty}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Thumbnail URL</label>
              <input
                value={form.thumbnail}
                onChange={(event) => updateForm("thumbnail", event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Required module selection (optional)
              </label>
              <input
                type="number"
                min={0}
                value={form.requiredSelectionCount === "" ? "" : form.requiredSelectionCount}
                onChange={(event) => {
                  const { value } = event.target;
                  updateForm(
                    "requiredSelectionCount",
                    value === "" ? "" : Number(value),
                  );
                }}
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                placeholder="Leave blank if all modules are required"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                rows={4}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description && (
                <p className="text-sm text-red-400">{errors.description}</p>
              )}
            </div>

            <ModuleList
              modules={form.modules}
              errors={errors.modules}
              onAdd={addModule}
              onUpdate={updateModule}
              onRemove={removeModule}
            />

            <CourseQuizEditor
              quiz={form.quiz}
              onAdd={addCourseQuestion}
              onUpdate={updateCourseQuestion}
              onRemove={removeCourseQuestion}
            />

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-colors disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Saving…" : selectedId ? "Update course" : "Create course"}
              </button>
              {status && <span className="text-sm opacity-80">{status}</span>}
            </div>
          </form>
        </section>

        <ExistingCoursesPanel
          loading={loading}
          courses={sortedCourses}
          selectedId={selectedId}
          onEdit={populateForm}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function ModuleList({
  modules,
  errors,
  onAdd,
  onUpdate,
  onRemove,
}: {
  modules: ModuleFormState[];
  errors?: string;
  onAdd: () => void;
  onUpdate: (index: number, updatedModule: ModuleFormState) => void;
  onRemove: (index: number) => void;
}) {
  const [activeModule, setActiveModule] = useState<number>(modules.length > 0 ? 0 : -1);

  useEffect(() => {
    if (modules.length === 0) {
      setActiveModule(-1);
      return;
    }

    setActiveModule((previous) => {
      if (previous === -1) {
        return 0;
      }

      if (previous >= modules.length) {
        return modules.length - 1;
      }

      return previous;
    });
  }, [modules.length]);

  const handleAddModule = () => {
    onAdd();
    setActiveModule(modules.length);
  };

  const handleRemoveModule = (index: number) => {
    onRemove(index);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Modules</h3>
        <button
          type="button"
          onClick={handleAddModule}
          className="px-3 py-1 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 text-sm"
        >
          Add module
        </button>
      </div>
      {errors && <p className="text-sm text-red-400">{errors}</p>}

      {modules.length === 0 ? (
        <p className="text-sm opacity-70">No modules yet. Add your first module.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {modules.map((courseItem, courseIndex) => (
              <button
                type="button"
                key={courseItem.id || `module-pill-${courseIndex}`}
                onClick={() => setActiveModule(courseIndex)}
                className={`px-3 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                  activeModule === courseIndex
                    ? "bg-burgundy text-white shadow"
                    : "bg-white/10 hover:bg-white/20"
                }`}
                aria-pressed={activeModule === courseIndex}
              >
                {courseItem.title.trim() || `Module ${courseIndex + 1}`}
              </button>
            ))}
          </div>

          {modules.map((courseItem, courseIndex) => {
            const key = courseItem.id || `module-${courseIndex}`;

            if (courseIndex === activeModule) {
              return (
                <ModuleEditor
                  key={key}
                  moduleData={courseItem}
                  index={courseIndex}
                  onChange={(updatedModule) => onUpdate(courseIndex, updatedModule)}
                  onRemove={() => handleRemoveModule(courseIndex)}
                />
              );
            }

            const quizCount = courseItem.quiz.length;

            return (
              <div
                key={key}
                className="glass rounded-2xl border border-white/10 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide opacity-60">
                      Module {courseIndex + 1}
                    </p>
                    <h4 className="text-base font-semibold">
                      {courseItem.title.trim() || "Untitled module"}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModule(courseIndex)}
                      className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(courseIndex)}
                      className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm opacity-70">
                  <p>
                    {courseItem.description.trim()
                      ? courseItem.description.trim()
                      : "No description yet."}
                  </p>
                  <p className="text-xs uppercase tracking-wide">
                    {quizCount > 0
                      ? `${quizCount} quiz question${quizCount > 1 ? "s" : ""}`
                      : "No quiz questions yet"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModule(courseIndex)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Add contents or quiz
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CourseQuizEditor({
  quiz,
  onAdd,
  onUpdate,
  onRemove,
}: {
  quiz: QuizQuestionState[];
  onAdd: () => void;
  onUpdate: (index: number, question: QuizQuestionState) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Quiz (optional)</h3>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 text-sm"
        >
          Add question
        </button>
      </div>
      {quiz.length === 0 && (
        <p className="text-sm opacity-70">
          No overall quiz questions. Learners will complete modules only.
        </p>
      )}
      <div className="space-y-4">
        {quiz.map((question, questionIndex) => (
          <QuizQuestionEditor
            key={question.id}
            question={question}
            index={questionIndex}
            onChange={(updatedQuestion) => onUpdate(questionIndex, updatedQuestion)}
            onRemove={() => onRemove(questionIndex)}
          />
        ))}
      </div>
    </div>
  );
}

function ExistingCoursesPanel({
  loading,
  courses,
  selectedId,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  courses: Course[];
  selectedId: string | null;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string, title: string) => void;
}) {
  return (
    <section className="space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Existing Courses</h2>
        {loading && <LoadingSpinner size="sm" className="text-burgundy" />}
      </div>

      {courses.length === 0 && !loading && (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-sm opacity-70">
            No courses found. Create your first course using the form.
          </p>
        </div>
      )}

      <ul className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
        {courses.map((course) => (
          <li
            key={course.id}
            className={`glass rounded-xl border p-4 transition-colors ${
              selectedId === course.id ? "border-burgundy/60" : "border-white/10"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">{course.title}</h3>
                <p className="text-xs uppercase tracking-wide opacity-60">
                  {course.category} · {course.difficulty}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(course)}
                  className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(course.id, course.title)}
                  className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-1 text-xs opacity-70">
              <p>
                <strong>Modules:</strong> {course.modules.length}
              </p>
              {course.requiredSelectionCount ? (
                <p>
                  <strong>Selection rule:</strong> choose {course.requiredSelectionCount} module
                  {course.requiredSelectionCount > 1 ? "s" : ""}
                </p>
              ) : (
                <p>
                  <strong>Selection rule:</strong> all modules required
                </p>
              )}
              <p className="line-clamp-2">
                <strong>Description:</strong> {course.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ModuleEditor({
  moduleData,
  index,
  onChange,
  onRemove,
}: {
  moduleData: ModuleFormState;
  index: number;
  onChange: (nextModule: ModuleFormState) => void;
  onRemove: () => void;
}) {
  const addQuizQuestion = () => {
    onChange({
      ...moduleData,
      quiz: [
        ...moduleData.quiz,
        emptyQuestion(moduleData.id || `module-${index + 1}`),
      ],
    });
  };

  const updateQuizQuestion = (questionIndex: number, updatedQuestion: QuizQuestionState) => {
    onChange({
      ...moduleData,
      quiz: moduleData.quiz.map((question, idx) =>
        idx === questionIndex ? updatedQuestion : question,
      ),
    });
  };

  const removeQuizQuestion = (questionIndex: number) => {
    onChange({
      ...moduleData,
      quiz: moduleData.quiz.filter((_, idx) => idx !== questionIndex),
    });
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Module {index + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Module ID</label>
          <input
            value={moduleData.id}
            onChange={(event) => onChange({ ...moduleData, id: event.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
            placeholder={`module-${index + 1}`}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Module Title</label>
          <input
            value={moduleData.title}
            onChange={(event) => onChange({ ...moduleData, title: event.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">PDF URL</label>
        <input
          value={moduleData.url}
          onChange={(event) => onChange({ ...moduleData, url: event.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
          placeholder="https://example.com/course.pdf"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={moduleData.description}
          onChange={(event) => onChange({ ...moduleData, description: event.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold">Module Quiz (optional)</h5>
          <button
            type="button"
            onClick={addQuizQuestion}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            Add question
          </button>
        </div>

        {moduleData.quiz.length === 0 && (
          <p className="text-xs opacity-70">
            No recap questions configured for this module.
          </p>
        )}

        <div className="space-y-3">
          {moduleData.quiz.map((question, questionIndex) => (
            <QuizQuestionEditor
              key={question.id}
              question={question}
              index={questionIndex}
              onChange={(updatedQuestion) => updateQuizQuestion(questionIndex, updatedQuestion)}
              onRemove={() => removeQuizQuestion(questionIndex)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizQuestionEditor({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: QuizQuestionState;
  index: number;
  onChange: (question: QuizQuestionState) => void;
  onRemove: () => void;
}) {
  const updateOption = (optionIndex: number, value: string) => {
    const nextOptions = question.options.map((option, idx) =>
      idx === optionIndex ? value : option,
    );
    const correctedAnswer =
      question.correctAnswer >= nextOptions.length ? 0 : question.correctAnswer;
    onChange({
      ...question,
      options: nextOptions,
      correctAnswer: correctedAnswer,
    });
  };

  const addOption = () => {
    onChange({
      ...question,
      options: [...question.options, `Option ${question.options.length + 1}`],
    });
  };

  return (
    <div className="border border-white/10 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h6 className="text-sm font-semibold">Question {index + 1}</h6>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Remove
        </button>
      </div>

      <input
        value={question.question}
        onChange={(event) => onChange({ ...question, question: event.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
        placeholder="Quiz question"
      />

      <div className="space-y-2">
        <label className="block text-xs font-medium">Answer options</label>
        <div className="space-y-2">
          {question.options.map((option, optionIndex) => (
            <div
              className="flex items-center gap-2"
              key={`${question.id}-option-${optionIndex}`}
            >
              <input
                type="radio"
                name={`question-${index}-answer`}
                checked={question.correctAnswer === optionIndex}
                onChange={() => onChange({ ...question, correctAnswer: optionIndex })}
                aria-label="Mark as correct answer"
              />
              <input
                value={option}
                onChange={(event) => updateOption(optionIndex, event.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-burgundy/50"
                placeholder={`Option ${optionIndex + 1}`}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
        >
          Add option
        </button>
      </div>
    </div>
  );
}