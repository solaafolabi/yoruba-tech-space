// src/pages/admin/AdminCourseManagement.jsx
import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import AdminLayout from "../../features/admin/layout/AdminLayout";
import slugify from "slugify";
import ManualUpload from "../admin/ManualUpload";
import UploadCsv from "../admin/UploadCsv";

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showModuleDeleteConfirm, setShowModuleDeleteConfirm] = useState(null);
  const [showLessonDeleteConfirm, setShowLessonDeleteConfirm] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);

  const pageSize = 10;

 const fetchCourses = async () => {
  const { data: courseData, error: courseErr } = await supabase
    .from("courses")
    .select("*");

  const { data: moduleData, error: moduleErr } = await supabase
    .from("modules")
    .select("*");

  const { data: lessonData, error: lessonErr } = await supabase
    .from("lessons")
    .select("*");

  if (courseErr || moduleErr || lessonErr) {
    console.error("❌ Error fetching data:", { courseErr, moduleErr, lessonErr });
    return;
  }

  console.log("✅ Courses fetched:", courseData);
  console.log("✅ Modules fetched:", moduleData);
  console.log("✅ Lessons fetched:", lessonData);

  const coursesWithModules = courseData.map(course => {
    const relatedModules = moduleData
      .filter(mod => mod.course_id === course.id)
      .map(mod => {
        const relatedLessons = lessonData.filter(les => les.module_id === mod.id);
        return {
          ...mod,
          lessons: relatedLessons.length ? relatedLessons : [],
        };
      });

    return {
      ...course,
      modules: relatedModules.length ? relatedModules : [],
    };
  });

  setCourses(coursesWithModules);
};


  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async (courseId) => {
    setShowDeleteConfirm(null);
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (error) {
      console.error("Delete error:", error);
    } else {
      fetchCourses();
    }
  };
const handleSave = async () => {
  setSaving(true);

  try {
    // 1. Update course
    const { error: courseError } = await supabase
      .from("courses")
      .update({
        title_en: editingCourse.title_en,
        title_yo: editingCourse.title_yo,
        description_en: editingCourse.description_en,
        description_yo: editingCourse.description_yo,
      })
      .eq("id", editingCourse.id);

    if (courseError) throw courseError;

    // 2. Loop through modules
    for (const mod of editingCourse.modules || []) {
      if (mod._deleted) {
        await supabase.from("modules").delete().eq("id", mod.id);
        continue;
      }

      await supabase
        .from("modules")
        .update({
          title_en: mod.title_en,
          title_yo: mod.title_yo,
        })
        .eq("id", mod.id);

      // 3. Loop through lessons inside this module
      for (const lesson of mod.lessons || []) {
        if (lesson._deleted) {
          await supabase.from("lessons").delete().eq("id", lesson.id);
          continue;
        }

        await supabase
          .from("lessons")
          .update({
            title_en: lesson.title_en,
            title_yo: lesson.title_yo,
          })
          .eq("id", lesson.id);
      }
    }

    // Refresh UI
    fetchCourses(); 
    setEditingCourse(null);
  } catch (error) {
    console.error("Save failed:", error.message);
  }

  setSaving(false);
};

  const filteredCourses = courses.filter(
    (c) =>
      (c.name_en || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.name_yo || "").toLowerCase().includes(search.toLowerCase())
  );

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredCourses.length / pageSize);

  const ConfirmModal = ({ message, onCancel, onConfirm }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">
        <p className="text-black dark:text-white">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="bg-gray-400 px-3 py-1 rounded" onClick={onCancel}>Cancel</button>
          <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      {/* Header & Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold text-yellow-400">📚 Manage Courses</h1>
        <div className="space-x-2">
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded"
            onClick={() => setShowManualModal(true)}
          >
            ✍️ Manual Upload
          </button>
          {showManualModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
              <ManualUpload onClose={() => { setShowManualModal(false); fetchCourses(); }} />
            </div>
          )}
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded"
            onClick={() => setShowCSVModal(true)}
          >
            📤 Upload CSV
          </button>
          {showCSVModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
              <UploadCsv onClose={() => { setShowCSVModal(false); fetchCourses(); }} />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full p-2 rounded bg-white/10 text-white"
      />

      {/* Courses Table */}
      <table className="w-full text-left border-collapse text-sm md:text-base">
        <thead className="bg-[#1B263B] text-yellow-400">
          <tr>
            <th className="p-2">Course</th>
            <th className="p-2">Modules</th>
            <th className="p-2">Lessons</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCourses.map((course, idx) => (
            <tr key={course.id} className={idx % 2 === 0 ? "bg-[#0f172a]" : "bg-[#1B263B]"}>
             <td className="p-2">{course.title_en} / {course.title_yo}</td>
              <td className="p-2">{(course.modules || [])
  .map((m) => `${m.title_en} / ${m.title_yo}`)
  .join(", ")}
</td>
              <td className="p-2">
               {(course.modules || [])
  .flatMap((m) =>
    (m.lessons || []).map((l) => `${l.title_en} / ${l.title_yo}`)
  )
  .join(", ")}

              </td>
              <td className="p-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="bg-blue-500 px-2 py-1 rounded"
                    onClick={() => {
                      const cloned = {
                        ...course,
                        modules: (course.modules || []).map((mod) => ({
                          ...mod,
                          _deleted: false,
                          lessons: (mod.lessons || []).map((les) => ({
                            ...les,
                            _deleted: false,
                          })),
                        })),
                      };
                      setEditingCourse(cloned);
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="bg-red-500 px-2 py-1 rounded"
                    onClick={() => setShowDeleteConfirm(course)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded ${page === currentPage ? "bg-yellow-500 text-black" : "bg-[#1B263B] text-white"}`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Edit Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-2">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl w-full max-w-3xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">✏️ Edit Course</h2>
            <input
              value={editingCourse.name_en || ""}
              placeholder="Course Name (English)"
              onChange={(e) => setEditingCourse({ ...editingCourse, name_en: e.target.value })}
              className="w-full p-2 rounded mb-2 bg-white/10"
            />
           <input
  value={editingCourse.title_en || ""}
  placeholder="Course Title (English)"
  onChange={(e) => setEditingCourse({ ...editingCourse, title_en: e.target.value })}
  className="w-full p-2 rounded mb-2 bg-white/10"
/>

<input
  value={editingCourse.title_yo || ""}
  placeholder="Orukọ Kọ́ọ̀sì (Yoruba)"
  onChange={(e) => setEditingCourse({ ...editingCourse, title_yo: e.target.value })}
  className="w-full p-2 rounded mb-2 bg-white/10"
/>

<textarea
  value={editingCourse.description_en || ""}
  placeholder="Description (English)"
  onChange={(e) => setEditingCourse({ ...editingCourse, description_en: e.target.value })}
  className="w-full p-2 rounded mb-2 bg-white/10"
/>

<textarea
  value={editingCourse.description_yo || ""}
  placeholder="Apejuwe (Yoruba)"
  onChange={(e) => setEditingCourse({ ...editingCourse, description_yo: e.target.value })}
  className="w-full p-2 rounded mb-4 bg-white/10"
/>


            {(editingCourse.modules || []).map((mod, modIdx) => (
              !mod._deleted && (
                <div key={mod.id} className="mb-6 border p-2 rounded">
                  <input
                    value={mod.title_en || ""}
                    placeholder="Module Title (English)"
                    onChange={(e) => {
                      const updated = [...editingCourse.modules];
                      updated[modIdx].title_en = e.target.value;
                      setEditingCourse({ ...editingCourse, modules: updated });
                    }}
                    className="w-full p-2 rounded mb-1 bg-white/10"
                  />
                  <input
                    value={mod.title_yo || ""}
                    placeholder="Akori (Yoruba)"
                    onChange={(e) => {
                      const updated = [...editingCourse.modules];
                      updated[modIdx].title_yo = e.target.value;
                      setEditingCourse({ ...editingCourse, modules: updated });
                    }}
                    className="w-full p-2 rounded mb-2 bg-white/10"
                  />
                  <button
                    className="text-red-500"
                    onClick={() => setShowModuleDeleteConfirm({ moduleIdx: modIdx, moduleId: mod.id })}
                  >🗑️</button>

                  {(mod.lessons || []).map((les, lesIdx) => (
                    !les._deleted && (
                      <div key={les.id} className="flex flex-col gap-1 ml-4">
                        <input
                          value={les.title_en || ""}
                          placeholder="Lesson Title (English)"
                          onChange={(e) => {
                            const updated = [...editingCourse.modules];
                            updated[modIdx].lessons[lesIdx].title_en = e.target.value;
                            setEditingCourse({ ...editingCourse, modules: updated });
                          }}
                          className="w-full p-2 rounded bg-white/5"
                        />
                        <input
                          value={les.title_yo || ""}
                          placeholder="Ẹ̀kọ́ (Yoruba)"
                          onChange={(e) => {
                            const updated = [...editingCourse.modules];
                            updated[modIdx].lessons[lesIdx].title_yo = e.target.value;
                            setEditingCourse({ ...editingCourse, modules: updated });
                          }}
                          className="w-full p-2 rounded bg-white/5"
                        />
                        <button
                          className="text-red-400 ml-2"
                          onClick={() => setShowLessonDeleteConfirm({ moduleIdx: modIdx, lessonIdx: lesIdx, lessonId: les.id })}
                        >🗑️</button>
                      </div>
                    )
                  ))}
                </div>
              )
            ))}

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingCourse(null)} className="bg-gray-600 px-4 py-2 rounded text-white">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-yellow-500 text-black px-4 py-2 rounded font-bold">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmations */}
      {showDeleteConfirm && (
        <ConfirmModal
          message="Are you sure you want to delete this course?"
          onCancel={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDelete(showDeleteConfirm.id)}
        />
      )}

      {showModuleDeleteConfirm && (
        <ConfirmModal
          message="Are you sure you want to delete this module?"
          onCancel={() => setShowModuleDeleteConfirm(null)}
          onConfirm={() => {
            const updated = [...editingCourse.modules];
            updated[showModuleDeleteConfirm.moduleIdx]._deleted = true;
            setEditingCourse({ ...editingCourse, modules: updated });
            setShowModuleDeleteConfirm(null);
          }}
        />
      )}

      {showLessonDeleteConfirm && (
        <ConfirmModal
          message="Are you sure you want to delete this lesson?"
          onCancel={() => setShowLessonDeleteConfirm(null)}
          onConfirm={() => {
            const updated = [...editingCourse.modules];
            updated[showLessonDeleteConfirm.moduleIdx].lessons[
              showLessonDeleteConfirm.lessonIdx
            ]._deleted = true;
            setEditingCourse({ ...editingCourse, modules: updated });
            setShowLessonDeleteConfirm(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
