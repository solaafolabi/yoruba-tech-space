import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import { Dialog, DialogHeader } from "../../components/ui/dialog";

const LessonsTable = ({ onEdit }) => {
  const [lessons, setLessons] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, video_url, module_id, modules(title, course_id, courses(name))")
        .order("id", { ascending: false });

      if (!error) setLessons(data);
    };
    fetchLessons();
  }, []);

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedLessons = filteredLessons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);

  const confirmDelete = (lesson) => {
    setSelectedLesson(lesson);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedLesson) return;
    await supabase.from("lessons").delete().eq("id", selectedLesson.id);
    setLessons(lessons.filter((l) => l.id !== selectedLesson.id));
    setIsDeleteModalOpen(false);
  };

  const handleEdit = async (lesson) => {
    const { data: fullLesson, error } = await supabase
      .from("lessons")
      .select("id, title, slug, content, video_url, module_id, modules(course_id), quizzes(question, options, correct_answer)")
      .eq("id", lesson.id)
      .single();

    if (error) {
      console.error("Error fetching full lesson:", error);
      return;
    }

    const quizzes = (fullLesson.quizzes || []).map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));

    onEdit({
      ...fullLesson,
      course_id: fullLesson.modules?.course_id,
      quizzes,
    });
  };

  return (
    <div className="mt-12 px-2">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 mb-4">
        <h3 className="text-xl font-bold">📋 Existing Lessons</h3>
        <input
          type="text"
          placeholder="Search lesson..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded border w-full sm:w-64 text-black"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded border border-yellow-500">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#1B263B] text-yellow-400">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Course</th>
              <th className="px-4 py-2 text-left">Module</th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">Video URL</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[#0D1B2A] text-white divide-y divide-gray-700">
            {paginatedLessons.map((lesson, index) => (
              <tr
                key={lesson.id}
                className={index % 2 === 0 ? "bg-[#0D1B2A]" : "bg-[#11283E]"}
              >
                <td className="px-4 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="px-4 py-2">{lesson.title}</td>
                <td className="px-4 py-2">{lesson.modules?.courses?.name || "-"}</td>
                <td className="px-4 py-2">{lesson.modules?.title || "-"}</td>
                <td className="px-4 py-2 hidden sm:table-cell max-w-xs truncate">{lesson.video_url}</td>
                <td className="px-4 py-2 flex flex-wrap gap-2">
                  <button
                    className="text-sm text-yellow-300 hover:underline"
                    onClick={() => handleEdit(lesson)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="text-sm text-red-400 hover:underline"
                    onClick={() => confirmDelete(lesson)}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-4">
        {paginatedLessons.map((lesson, index) => (
          <div key={lesson.id} className="border border-yellow-500 rounded p-3 bg-[#0D1B2A] text-white">
            <div className="text-sm font-semibold">#{(currentPage - 1) * itemsPerPage + index + 1}</div>
            <div><strong>Title:</strong> {lesson.title}</div>
            <div><strong>Course:</strong> {lesson.modules?.courses?.name || "-"}</div>
            <div><strong>Module:</strong> {lesson.modules?.title || "-"}</div>
            <div className="truncate"><strong>Video:</strong> {lesson.video_url}</div>
            <div className="flex gap-4 mt-2">
              <button
                className="text-sm text-yellow-300 hover:underline"
                onClick={() => handleEdit(lesson)}
              >
                ✏️ Edit
              </button>
              <button
                className="text-sm text-red-400 hover:underline"
                onClick={() => confirmDelete(lesson)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2 flex-wrap">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
          <button
            key={pg}
            onClick={() => setCurrentPage(pg)}
            className={`px-3 py-1 rounded-full font-bold text-sm ${
              pg === currentPage
                ? "bg-yellow-300 text-black shadow"
                : "bg-gray-700 text-yellow-300 hover:bg-gray-600"
            }`}
          >
            {pg}
          </button>
        ))}
      </div>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <DialogHeader
          title="⚠️ Confirm Deletion"
          onClose={() => setIsDeleteModalOpen(false)}
        />
        <div className="space-y-4 p-4">
          <p>Are you sure you want to delete this lesson?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-1 bg-gray-700 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-1 bg-red-600 rounded hover:bg-red-500"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default LessonsTable;
