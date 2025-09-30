// src/features/admin/CourseManager.jsx
import React, { useEffect, useState, useMemo } from "react";
import supabase from "../../supabaseClient";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable wrapper ---
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// ===============================
// 📚 Course Manager Component
// ===============================
export default function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // search + pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const sensors = useSensors(useSensor(PointerSensor));

  // fetch courses, modules, lessons
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data: courseRows, error: courseErr } = await supabase
          .from("courses")
          .select(
            "id, title_en, title_yo, requires_assignment, target_audience, course_order"
          )
          .order("course_order", { ascending: true });
        if (courseErr) throw courseErr;

        const coursesWithChildren = await Promise.all(
          (courseRows || []).map(async (c) => {
            const { data: moduleRows } = await supabase
              .from("modules")
              .select("id, title_en, title_yo, slug, module_order, course_id")
              .eq("course_id", c.id)
              .order("module_order", { ascending: true });

            const modulesWithLessons = await Promise.all(
              (moduleRows || []).map(async (m) => {
                const { data: lessonRows } = await supabase
                  .from("lessons")
                  .select("id, title_en, title_yo, slug, lesson_order, module_id")
                  .eq("module_id", m.id)
                  .order("lesson_order", { ascending: true });

                return { ...m, lessons: lessonRows || [] };
              })
            );

            return { ...c, modules: modulesWithLessons };
          })
        );

        if (mounted) setCourses(coursesWithChildren || []);
      } catch (err) {
        console.error("fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => (mounted = false);
  }, []);

  // persist order helper
  const persistOrder = async (table, items, orderCol) => {
    try {
      setSaving(true);
      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        await supabase.from(table).update({ [orderCol]: i + 1 }).eq("id", row.id);
      }
    } catch (err) {
      console.error("persist order error", err);
    } finally {
      setSaving(false);
    }
  };

  // CRUD: Add course/module/lesson
  const addCourse = async () => {
    const { data, error } = await supabase
      .from("courses")
      .insert([{ title_en: "New Course", course_order: courses.length + 1 }])
      .select()
      .single();
    if (!error && data) setCourses([...courses, { ...data, modules: [] }]);
  };

  const addModule = async (course) => {
    const { data, error } = await supabase
      .from("modules")
      .insert([
        {
          title_en: "New Module",
          course_id: course.id,
          module_order: course.modules.length + 1,
        },
      ])
      .select()
      .single();
    if (!error && data) {
      setCourses(
        courses.map((c) =>
          c.id === course.id
            ? { ...c, modules: [...c.modules, { ...data, lessons: [] }] }
            : c
        )
      );
    }
  };

  const addLesson = async (courseId, module) => {
    const { data, error } = await supabase
      .from("lessons")
      .insert([
        {
          title_en: "New Lesson",
          module_id: module.id,
          lesson_order: module.lessons.length + 1,
        },
      ])
      .select()
      .single();
    if (!error && data) {
      setCourses(
        courses.map((c) =>
          c.id === courseId
            ? {
                ...c,
                modules: c.modules.map((m) =>
                  m.id === module.id
                    ? { ...m, lessons: [...m.lessons, data] }
                    : m
                ),
              }
            : c
        )
      );
    }
  };

  // drag handlers
  const handleCourseDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = courses.findIndex((c) => String(c.id) === String(active.id));
    const newIndex = courses.findIndex((c) => String(c.id) === String(over.id));
    const newCourses = arrayMove(courses, oldIndex, newIndex);
    setCourses(newCourses);
    persistOrder("courses", newCourses, "course_order");
  };

  const handleModuleReorder = (courseId, newModules) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, modules: newModules } : c))
    );
    persistOrder("modules", newModules, "module_order");
  };

  const handleLessonReorder = (courseId, moduleId, newLessons) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? {
              ...c,
              modules: c.modules.map((m) =>
                m.id === moduleId ? { ...m, lessons: newLessons } : m
              ),
            }
          : c
      )
    );
    persistOrder("lessons", newLessons, "lesson_order");
  };

  // inline update helpers
  const updateCourseField = async (courseId, field, value) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, [field]: value } : c))
    );
    try {
      await supabase.from("courses").update({ [field]: value }).eq("id", courseId);
    } catch (err) {
      console.error(err);
    }
  };

  const updateModuleField = async (moduleId, field, value) => {
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        modules: c.modules.map((m) =>
          m.id === moduleId ? { ...m, [field]: value } : m
        ),
      }))
    );
    try {
      await supabase.from("modules").update({ [field]: value }).eq("id", moduleId);
    } catch (err) {
      console.error(err);
    }
  };

  const updateLessonField = async (lessonId, field, value) => {
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        modules: c.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) =>
            l.id === lessonId ? { ...l, [field]: value } : l
          ),
        })),
      }))
    );
    try {
      await supabase.from("lessons").update({ [field]: value }).eq("id", lessonId);
    } catch (err) {
      console.error(err);
    }
  };

  // filtered + paginated courses
  const filteredCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.title_en?.toLowerCase().includes(search.toLowerCase()) ||
        c.title_yo?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, courses]);

  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCourses.slice(start, start + pageSize);
  }, [page, filteredCourses]);

  const totalPages = Math.ceil(filteredCourses.length / pageSize);

  if (loading) return <div className="p-6">Loading courses...</div>;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-2xl font-bold">📚 Course Manager</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search courses..."
            className="border px-2 py-1 rounded text-black"
          />
          <button
            onClick={addCourse}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            ➕ Add Course
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-500 mb-4">
        {saving ? "Saving..." : "All changes saved"}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCourseDragEnd}
      >
        <SortableContext
          items={paginatedCourses.map((c) => String(c.id))}
          strategy={verticalListSortingStrategy}
        >
          {paginatedCourses.map((course) => (
            <SortableItem key={course.id} id={String(course.id)}>
              <div className="border rounded p-3 mb-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-full">
                    <InlineEdit
                      value={course.title_en}
                      onSave={(val) =>
                        updateCourseField(course.id, "title_en", val)
                      }
                      label="Course EN"
                    />
                    <InlineEdit
                      value={course.title_yo}
                      onSave={(val) =>
                        updateCourseField(course.id, "title_yo", val)
                      }
                      label="Course YO"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={course.requires_assignment || false}
                      onChange={(e) =>
                        updateCourseField(
                          course.id,
                          "requires_assignment",
                          e.target.checked
                        )
                      }
                    />
                    <span className="text-sm">Requires project</span>
                  </label>
                </div>

                <ModuleList
                  course={course}
                  onModuleReorder={handleModuleReorder}
                  onLessonReorder={handleLessonReorder}
                  onModuleFieldUpdate={updateModuleField}
                  onLessonFieldUpdate={updateLessonField}
                  onAddModule={addModule}
                  onAddLesson={addLesson}
                />
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            ◀ Prev
          </button>
          <span className="px-2 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}

// ===============================
// 📦 Module + Lesson Lists
// ===============================
function ModuleList({
  course,
  onModuleReorder,
  onLessonReorder,
  onModuleFieldUpdate,
  onLessonFieldUpdate,
  onAddModule,
  onAddLesson,
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleModuleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = course.modules.findIndex(
      (m) => String(m.id) === String(active.id)
    );
    const newIndex = course.modules.findIndex(
      (m) => String(m.id) === String(over.id)
    );
    const newModules = arrayMove(course.modules, oldIndex, newIndex);
    onModuleReorder(course.id, newModules);
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Modules</h3>
        <button
          onClick={() => onAddModule(course)}
          className="text-sm text-blue-600"
        >
          ➕ Add Module
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleModuleDragEnd}
      >
        <SortableContext
          items={course.modules.map((m) => String(m.id))}
          strategy={verticalListSortingStrategy}
        >
          {course.modules.map((module) => (
            <SortableItem key={module.id} id={String(module.id)}>
              <div className="border rounded p-2 mb-2 bg-white dark:bg-gray-700">
                <InlineEdit
                  value={module.title_en}
                  onSave={(val) => onModuleFieldUpdate(module.id, "title_en", val)}
                  label="Module EN"
                />
                <InlineEdit
                  value={module.title_yo}
                  onSave={(val) => onModuleFieldUpdate(module.id, "title_yo", val)}
                  label="Module YO"
                />

                <LessonList
                  courseId={course.id}
                  module={module}
                  onLessonReorder={onLessonReorder}
                  onLessonFieldUpdate={onLessonFieldUpdate}
                  onAddLesson={onAddLesson}
                />
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function LessonList({
  courseId,
  module,
  onLessonReorder,
  onLessonFieldUpdate,
  onAddLesson,
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleLessonDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = module.lessons.findIndex(
      (l) => String(l.id) === String(active.id)
    );
    const newIndex = module.lessons.findIndex(
      (l) => String(l.id) === String(over.id)
    );
    const newLessons = arrayMove(module.lessons, oldIndex, newIndex);
    onLessonReorder(courseId, module.id, newLessons);
  };

  return (
    <div className="mt-2 pl-4 border-l border-gray-200 dark:border-gray-600">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-medium">Lessons</h4>
        <button
          onClick={() => onAddLesson(courseId, module)}
          className="text-sm text-green-600"
        >
          ➕ Add Lesson
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleLessonDragEnd}
      >
        <SortableContext
          items={module.lessons.map((l) => String(l.id))}
          strategy={verticalListSortingStrategy}
        >
          {module.lessons.map((lesson) => (
            <SortableItem key={lesson.id} id={String(lesson.id)}>
              <div className="p-1 mb-1 border rounded bg-gray-50 dark:bg-gray-800">
                <InlineEdit
                  value={lesson.title_en}
                  onSave={(val) =>
                    onLessonFieldUpdate(lesson.id, "title_en", val)
                  }
                  label="Lesson EN"
                />
                <InlineEdit
                  value={lesson.title_yo}
                  onSave={(val) =>
                    onLessonFieldUpdate(lesson.id, "title_yo", val)
                  }
                  label="Lesson YO"
                />
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ===============================
// ✏️ InlineEdit Component
// ===============================
function InlineEdit({ value, onSave, label }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value || "");

  useEffect(() => setTemp(value || ""), [value]);

  const save = async () => {
    if (temp !== value) await onSave(temp);
    setEditing(false);
  };

  return (
    <div className="mb-1">
      <div className="text-xs text-gray-400">{label}</div>
      {editing ? (
        <input
          className="w-full p-1 border rounded bg-white text-black"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
        />
      ) : (
        <div className="cursor-pointer p-1" onClick={() => setEditing(true)}>
          {value || <span className="text-gray-400">(empty)</span>}
        </div>
      )}
    </div>
  );
}
