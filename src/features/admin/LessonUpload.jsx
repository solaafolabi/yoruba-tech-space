import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import slugify from "slugify";
import AdminLayout from "../../features/admin/layout/AdminLayout";
import LessonsTable from "./LessonsTable";

const LessonUpload = () => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [quizFields, setQuizFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("id, name");
      if (error) console.error(error);
      else setCourses(data);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchModules = async () => {
      if (!selectedCourse) return;
      const { data, error } = await supabase
        .from("modules")
        .select("id, title")
        .eq("course_id", selectedCourse);
      if (error) console.error(error);
      else setModules(data);
    };
    fetchModules();
  }, [selectedCourse]);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!selectedModule) return;
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title")
        .eq("module_id", selectedModule);
      if (error) console.error(error);
      else setLessons(data);
    };
    fetchLessons();
  }, [selectedModule]);

  const handleQuizChange = (index, field, value) => {
    const updated = [...quizFields];
    updated[index][field] = value;
    setQuizFields(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...quizFields];
    updated[qIndex].options[optIndex] = value;
    setQuizFields(updated);
  };

  const addQuizField = () => {
    setQuizFields([...quizFields, { question: "", options: ["", "", "", ""], correct_answer: "" }]);
  };

  const removeQuizField = (index) => {
    setQuizFields(quizFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      let lessonId = selectedLesson;

      if (selectedLesson) {
        const { error: updateError } = await supabase
          .from("lessons")
          .update({ content, video_url: videoUrl })
          .eq("id", selectedLesson);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from("quizzes")
          .delete()
          .eq("lesson_id", selectedLesson);
        if (deleteError) throw deleteError;
      } else {
        const slug = slugify(title, { lower: true });
        const { data, error: insertError } = await supabase
          .from("lessons")
          .insert([
            {
              title,
              slug,
              content,
              video_url: videoUrl,
              module_id: selectedModule,
            },
          ])
          .select();
        if (insertError) throw insertError;

        lessonId = data[0].id;
      }

      for (const quiz of quizFields) {
        const { error: quizError } = await supabase.from("quizzes").insert([
          {
            lesson_id: lessonId,
            question: quiz.question,
            options: JSON.stringify(quiz.options),
            correct_answer: quiz.correct_answer,
          },
        ]);
        if (quizError) throw quizError;
      }

      setSuccess("✅ Lesson and quizzes saved successfully!");
      setTitle("");
      setContent("");
      setVideoUrl("");
      setSelectedLesson("");
      setQuizFields([]);
    } catch (err) {
      console.error(err);
      setError("❌ Upload failed: " + err.message);
    }

    setLoading(false);
  };

  const handleEdit = (lesson) => {
    setSelectedCourse(lesson.course_id);
    setSelectedModule(lesson.module_id);
    setSelectedLesson(lesson.id);
    setTitle(lesson.title);
    setContent(lesson.content);
    setVideoUrl(lesson.video_url);
    setQuizFields(lesson.quizzes || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">📚 Upload or Update Lesson + Quiz</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              required
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedModule("");
                setSelectedLesson("");
              }}
              className="p-2 border rounded bg-white dark:bg-gray-800"
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>

            <select
              required
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setSelectedLesson("");
              }}
              className="p-2 border rounded bg-white dark:bg-gray-800"
            >
              <option value="">Select Module</option>
              {modules.map((mod) => (
                <option key={mod.id} value={mod.id}>{mod.title}</option>
              ))}
            </select>

            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-800"
            >
              <option value="">(Optional) Select Lesson to Update</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-gray-100 dark:bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-semibold">📝 Lesson Content</h3>

              {!selectedLesson && (
                <input
                  type="text"
                  placeholder="New Lesson Title"
                  required
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              )}

              <textarea
                placeholder="Lesson Content"
                rows="6"
                className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <input
                type="url"
                placeholder="Video URL"
                className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-4 bg-gray-100 dark:bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-semibold">🧠 Quiz Questions</h3>

              {quizFields.map((quiz, index) => (
                <div key={index} className="mb-4 border p-3 rounded bg-white dark:bg-gray-700">
                  <input
                    type="text"
                    placeholder={`Question ${index + 1}`}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                    value={quiz.question}
                    onChange={(e) => handleQuizChange(index, "question", e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {quiz.options.map((opt, i) => (
                      <input
                        key={i}
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                        value={opt}
                        onChange={(e) => handleOptionChange(index, i, e.target.value)}
                      />
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Correct Answer"
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                    value={quiz.correct_answer}
                    onChange={(e) => handleQuizChange(index, "correct_answer", e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => removeQuizField(index)}
                    className="text-red-500 mt-2 text-sm"
                  >
                    ❌ Remove Question
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addQuizField}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                ➕ Add Quiz Question
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-black font-bold py-2 rounded"
          >
            {loading ? "Saving..." : selectedLesson ? "Update Lesson" : "Upload Lesson"}
          </button>

          {success && <p className="text-green-400">{success}</p>}
          {error && <p className="text-red-400">{error}</p>}
        </form>
      </div>

      <LessonsTable onEdit={handleEdit} />
    </AdminLayout>
  );
};

export default LessonUpload;
