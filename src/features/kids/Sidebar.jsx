import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import supabase from "../../supabaseClient";

export default function Sidebar({ sidebarOpen, setSidebarOpen, session }) {
  const { i18n, t } = useTranslation();
  const [targetAge, setTargetAge] = useState(null);
  const [courses, setCourses] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [modules, setModules] = useState({});
  const [lessons, setLessons] = useState({});
  const [progress, setProgress] = useState({});
  const userId = session?.user?.id;

  // 1️⃣ Get kid's target audience from profile
  useEffect(() => {
    const fetchChildAgeRange = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("children")
        .select("age_range")
        .eq("user_id", userId)
        .single();
      if (!error && data) setTargetAge(data.age_range);
    };
    fetchChildAgeRange();
  }, [userId]);

  // 2️⃣ Fetch courses for this kid's age
  useEffect(() => {
    if (!targetAge) return;
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, title_en, title_yo")
        .eq("target_audience", targetAge);
      if (!error && data) setCourses(data);
    };
    fetchCourses();
  }, [targetAge]);

  // 3️⃣ Fetch modules for a course
  const handleCourseToggle = async (courseId) => {
    setExpandedCourse((prev) => (prev === courseId ? null : courseId));
    if (!modules[courseId] && targetAge) {
      const { data, error } = await supabase
        .from("modules")
        .select("id, slug, title_en, title_yo")
        .eq("course_id", courseId)
        .eq("target_audience", targetAge);
      if (!error && data) setModules((prev) => ({ ...prev, [courseId]: data }));
    }
  };

  // 4️⃣ Fetch lessons + progress for a module
  const handleModuleToggle = async (moduleId) => {
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));

    if (!lessons[moduleId] && targetAge) {
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("id, slug, title_en, title_yo")
        .eq("module_id", moduleId)
        .eq("target_audience", targetAge)
        .order("lesson_order");

      if (!lessonError && lessonData) {
        setLessons((prev) => ({ ...prev, [moduleId]: lessonData }));

        if (userId) {
          const { data: progressData, error: progressError } = await supabase
            .from("lesson_progress")
            .select("lesson_id, completed")
            .eq("user_id", userId)
            .in("lesson_id", lessonData.map((l) => l.id));

          if (!progressError && progressData) {
            const progressMap = {};
            progressData.forEach((p) => {
              progressMap[String(p.lesson_id)] = Boolean(p.completed);
            });
            setProgress((prev) => ({ ...prev, ...progressMap }));
          }
        }
      }
    }
  };

  // 5️⃣ Module progress counter
  const getModuleProgress = (moduleId) => {
    const moduleLessons = lessons[moduleId] || [];
    if (!moduleLessons.length) return "0/0";
    const completed = moduleLessons.filter((l) => progress[l.id]).length;
    return `${completed}/${moduleLessons.length}`;
  };

  // 6️⃣ Listen for lesson completion from LessonViewKid
  useEffect(() => {
    const handleLessonCompleted = ({ detail }) => {
      const { lessonId, slug } = detail;
      setProgress((prev) => {
        const key = String(lessonId);
        if (prev[key]) return prev;
        return { ...prev, [key]: true };
      });
      if (slug) localStorage.setItem(`${slug}_completed`, "true");
    };

    window.addEventListener("lessonCompleted", handleLessonCompleted);

    // Restore completed lessons from localStorage
    courses.forEach((course) => {
      modules[course.id]?.forEach((mod) => {
        lessons[mod.id]?.forEach((lesson) => {
          const completed = localStorage.getItem(`${lesson.slug}_completed`);
          if (completed) setProgress((prev) => ({ ...prev, [String(lesson.id)]: true }));
        });
      });
    });

    return () => window.removeEventListener("lessonCompleted", handleLessonCompleted);
  }, [courses, modules, lessons]);

  return (
    <>
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-gradient-to-b from-yellow-100 via-pink-100 to-purple-100 shadow-xl p-4 rounded-r-3xl border-r-4 border-yellow-300 transform
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out z-50 overflow-y-auto`}
      >
        {/* Mobile Close */}
        <div className="flex justify-between items-center mb-2 md:hidden">
          <h2 className="text-base font-bold text-purple-800">
            🌟 {t("childrenDashboard.sidebar.title")}
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-purple-900 text-lg font-bold hover:text-red-600"
          >
            ✖
          </button>
        </div>

        {/* Desktop Title */}
        <div className="text-center mb-4 hidden md:block">
          <h2 className="text-lg font-bold text-purple-800">
            🌟 {t("childrenDashboard.sidebar.title")}
          </h2>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <NavLink
            to="/kids/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `block p-3 rounded-lg text-base font-bold hover:bg-yellow-200 transition-all ${
                isActive ? "bg-yellow-400 text-purple-900 shadow" : "text-purple-800"
              }`
            }
          >
            🏠 {i18n.language === "yo" ? "Ìbẹ̀rẹ̀" : "Dashboard"}
          </NavLink>

          {courses.map((course) => {
            const isExpandedCourse = expandedCourse === course.id;
            return (
              <div key={course.id} className="bg-yellow-50 rounded-lg">
                {/* Course */}
                <button
                  onClick={() => handleCourseToggle(course.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-purple-800 font-bold text-lg hover:bg-yellow-300 transition-all duration-300"
                >
                  <span className="flex items-center space-x-3">
                    💻
                    <span>{i18n.language === "yo" ? course.title_yo : course.title_en}</span>
                  </span>
                  {isExpandedCourse ? <FaChevronUp size={18} /> : <FaChevronDown size={18} />}
                </button>

                {/* Modules */}
                <AnimatePresence>
                  {isExpandedCourse &&
                    modules[course.id]?.map((mod) => {
                      const isExpandedModule = expandedModule === mod.id;
                      return (
                        <div key={mod.id} className="rounded-lg">
                          <button
                            onClick={() => handleModuleToggle(mod.id)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-yellow-100 transition-all bg-yellow-50"
                          >
                            <span className="font-semibold text-purple-800">
                              {i18n.language === "yo" ? mod.title_yo : mod.title_en}
                            </span>
                            <span className="text-sm font-bold text-purple-800">
                              {getModuleProgress(mod.id)}
                            </span>
                          </button>

                          <AnimatePresence>
                            {isExpandedModule && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="pl-4 space-y-1"
                              >
                                {lessons[mod.id]?.map((lesson) => (
                                  <NavLink
                                    key={lesson.id}
                                    to={`/kids/lesson/${lesson.slug}`}
                                    className={`block p-2 rounded-lg flex justify-between items-center transition-all ${
                                      progress[lesson.id]
                                        ? "bg-yellow-200 text-purple-900 font-bold"
                                        : "bg-yellow-50 text-purple-800"
                                    } hover:bg-yellow-100`}
                                  >
                                    <span>{i18n.language === "yo" ? lesson.title_yo : lesson.title_en}</span>
                                    {progress[lesson.id] && <span>✔️</span>}
                                  </NavLink>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 md:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
