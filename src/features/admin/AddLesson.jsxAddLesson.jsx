import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const AddLesson = () => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [message, setMessage] = useState(null);
  const [status, setStatus] = useState(null);

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("*");
      if (error) console.error("Error loading courses:", error);
      else setCourses(data);
    };
    fetchCourses();
  }, []);

  // Fetch modules based on selected course
  useEffect(() => {
    const fetchModules = async () => {
      if (!selectedCourse) return;
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", selectedCourse);
      if (error) console.error("Error loading modules:", error);
      else setModules(data);
    };
    fetchModules();
  }, [selectedCourse]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.from("lessons").insert([
      {
        module_id: selectedModule,
        title,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        content,
        video_url: videoUrl,
      },
    ]);

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("success");
      setMessage("✅ Lesson added successfully!");
      setTitle("");
      setSlug("");
      setContent("");
      setVideoUrl("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border dark:border-gray-700">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">📖 Add Lesson</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedModule(""); // reset module
            }}
            required
            className="w-full mt-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-600"
          >
            <option value="">-- Select a Course --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Module Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Module</label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            required
            className="w-full mt-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-600"
          >
            <option value="">-- Select a Module --</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
        </div>

        {/* Lesson Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lesson Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
            }}
            placeholder="e.g. What is HTML?"
            required
            className="w-full mt-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-600"
          />
        </div>

        {/* Slug (readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
          <input
            type="text"
            value={slug}
            readOnly
            className="w-full mt-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lesson Content (optional)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            placeholder="Enter lesson text, HTML, or description"
            className="w-full mt-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-600"
          />
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Video URL (optional)</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            className="w-full mt-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-600"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:brightness-110 shadow-md hover:shadow-xl"
        >
          ➕ Add Lesson
        </button>

        {/* Status Message */}
        {message && (
          <div
            className={`mt-4 flex items-center space-x-2 text-sm px-4 py-3 rounded-lg ${
              status === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {status === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddLesson;
