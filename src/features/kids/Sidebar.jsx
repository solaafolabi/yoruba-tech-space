import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaChevronDown, FaChevronUp, FaLock, FaClock, FaInfinity } from "react-icons/fa";
import supabase from "../../supabaseClient";

export default function Sidebar({ sidebarOpen, setSidebarOpen, session }) {
  const { i18n, t } = useTranslation();
  const [targetAge, setTargetAge] = useState(null);
  const [childId, setChildId] = useState(null); // ✅ store current childId
  const [courses, setCourses] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [modules, setModules] = useState({});
  const [lessons, setLessons] = useState({});
  const [progress, setProgress] = useState({});
  const [control, setControl] = useState(null);
  const [parentLock, setParentLock] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);

  const userId = session?.user?.id;

  // 1️⃣ Get kid's target audience + childId
  useEffect(() => {
    if (!userId) return;
    console.log("🔄 Fetching child info for user:", userId);
    supabase
      .from("children")
      .select("id, age_range")
      .eq("user_id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("❌ Error fetching child:", error);
        } else if (data) {
          console.log("✅ Got child:", data);
          setTargetAge(data.age_range);
          setChildId(data.id); // ✅ save childId for later
        }
      });
  }, [userId]);

  // 2️⃣ Fetch child controls
  useEffect(() => {
    if (!childId) return;
    console.log("🔄 Fetching child controls for child:", childId);
    supabase
      .from("child_controls")
      .select("*")
      .eq("child_id", childId)
      .maybeSingle()
      .then(({ data: ctrl }) => {
        console.log("📋 Child controls fetched:", ctrl);
        if (ctrl) {
          setControl(ctrl);
          const now = new Date();
          let locked = ctrl.lessons_locked;
          if (!locked && ctrl.daily_limit_minutes > 0 && ctrl.time_start) {
            const elapsed = Math.floor((now - new Date(ctrl.time_start)) / 60000);
            if (elapsed >= ctrl.daily_limit_minutes) locked = true;
            setRemainingTime(Math.max(ctrl.daily_limit_minutes - elapsed, 0));
          } else {
            setRemainingTime(null);
          }
          setParentLock(locked);
        }
      });
  }, [childId]);

  // 3️⃣ Countdown timer
  useEffect(() => {
    if (!control) return;
    console.log("⏱ Starting countdown timer");
    const interval = setInterval(() => {
      if (control.daily_limit_minutes > 0 && control.time_start && !control.lessons_locked) {
        const now = new Date();
        const elapsed = Math.floor((now - new Date(control.time_start)) / 60000);
        const timeLeft = Math.max(control.daily_limit_minutes - elapsed, 0);
        console.log("⏳ Timer tick — timeLeft:", timeLeft);
        setRemainingTime(timeLeft);
        if (timeLeft <= 0) setParentLock(true);
      }
    }, 60000);
    return () => {
      console.log("🛑 Clearing countdown timer");
      clearInterval(interval);
    };
  }, [control]);

  
  // 4️⃣ Fetch courses
  useEffect(() => {
    if (!targetAge) return;
    console.log("🔄 Fetching courses for targetAge:", targetAge);
    supabase
      .from("courses")
      .select("id, slug, title_en, title_yo")
      .eq("target_audience", targetAge)
      .then(({ data, error }) => {
        if (error) {
          console.error("❌ Error fetching courses:", error);
        } else if (data) {
          console.log("✅ Courses fetched:", data);
          setCourses(data);
        }
      });
  }, [targetAge]);

  // 5️⃣ Handle course toggle
  const handleCourseToggle = async (courseId) => {
    if (parentLock) return;
    setExpandedCourse((prev) => (prev === courseId ? null : courseId));
    if (!modules[courseId] && targetAge) {
      console.log("🔄 Fetching modules for course:", courseId);
      const { data, error } = await supabase
        .from("modules")
        .select("id, slug, title_en, title_yo")
        .eq("course_id", courseId)
        .eq("target_audience", targetAge);
      if (error) {
        console.error("❌ Error fetching modules:", error);
      } else {
        setModules((prev) => ({ ...prev, [courseId]: data }));
      }
    }
  };

  // 6️⃣ Handle module toggle + fetch lessons + fetch progress
  const handleModuleToggle = async (moduleId) => {
    if (parentLock) return;
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));

    if (!lessons[moduleId] && targetAge) {
      console.log("🔄 Fetching lessons for module:", moduleId);
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("id, slug, title_en, title_yo")
        .eq("module_id", moduleId)
        .eq("target_audience", targetAge)
        .order("lesson_order");

      if (lessonError) {
        console.error("❌ Error fetching lessons:", lessonError);
      } else if (lessonData) {
        console.log("✅ Lessons fetched:", lessonData);
        setLessons((prev) => ({ ...prev, [moduleId]: lessonData }));

        // ✅ Build lessonIds
        const lessonIds = lessonData.map((l) => l.id);
        if (userId && childId && lessonIds.length > 0) {
          console.log("🔄 Fetching progress for lessons:", lessonIds);
          const { data: progressData, error: progressError } = await supabase
            .from("lesson_progress")
            .select("*")
            .in("lesson_id", lessonIds)
            .eq("child_id", childId)
            .eq("user_id", userId);

          if (progressError) {
            console.error("❌ Error fetching progress:", progressError);
          } else {
            console.log("✅ Progress fetched:", progressData);
            const progressMap = {};
            progressData.forEach((p) => {
              progressMap[p.lesson_id] = Boolean(p.completed);
            });
            setProgress((prev) => ({ ...prev, ...progressMap }));
          }
        }
      }
    }
  };

  // 7️⃣ Module progress
  const getModuleProgress = (moduleId) => {
    const moduleLessons = lessons[moduleId] || [];
    if (!moduleLessons.length) return "0/0";
    const completed = moduleLessons.filter((l) => progress[l.id]).length;
    return `${completed}/${moduleLessons.length}`;
  };

  // 8️⃣ Real-time lesson completion
// // ✅ Real-time lesson completion (save only once)
useEffect(() => {
  const handleLessonCompleted = async ({ detail }) => {
    const { lessonId } = detail;
    console.log("📢 EVENT RECEIVED:", detail);

    if (!lessonId || !userId || !childId) {
      console.warn("⚠️ Missing lessonId, userId, or childId:", { lessonId, userId, childId });
      return;
    }

    // ✅ Update local UI immediately
    console.log("✅ Marking progress locally for lesson:", lessonId);
    setProgress((prev) => ({ ...prev, [lessonId]: true }));

    try {
      // 1️⃣ Check if progress already exists
      console.log("🔍 Checking if already saved in Supabase…");
      const { data: existing, error: checkError } = await supabase
        .from("lesson_progress")
        .select("id")
        .eq("user_id", userId)
        .eq("child_id", childId)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (checkError) {
        console.error("❌ Supabase check error:", checkError);
        return;
      }

      if (existing) {
        console.log("ℹ️ Already exists in Supabase:", existing);
        return;
      }

      // 2️⃣ Fetch module_id + course_id from lessons → modules
      console.log("🔍 Fetching course_id and module_id from lessons…");
      const { data: lessonMeta, error: metaError } = await supabase
        .from("lessons")
        .select("id, module_id, modules(course_id)")
        .eq("id", lessonId)
        .single();

      if (metaError) {
        console.error("❌ Error fetching lesson metadata:", metaError);
        return;
      }

      const finalModuleId = lessonMeta?.module_id || null;
      const finalCourseId = lessonMeta?.modules?.course_id || null;

      // 3️⃣ Insert into lesson_progress
      console.log("📝 Inserting new progress row into Supabase…");
      const { error: insertError, data: insertData } = await supabase
        .from("lesson_progress")
        .insert([
          {
            user_id: userId,
            child_id: childId,
            course_id: finalCourseId,
            module_id: finalModuleId,
            lesson_id: lessonId,
            completed: true,
          },
        ])
        .select();

      if (insertError) {
        console.error("❌ Insert error:", insertError);
      } else {
        console.log("✅ Insert success:", insertData);
      }
    } catch (err) {
      console.error("💥 Unexpected error saving progress:", err);
    }
  };

  window.addEventListener("lessonCompleted", handleLessonCompleted);
  return () => window.removeEventListener("lessonCompleted", handleLessonCompleted);
}, [userId, childId]);

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

        {/* Parent Lock / Timer */}
        {control && (
          <div className="space-y-2 mb-4">
            {parentLock && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg flex items-center space-x-2 shadow">
                <FaLock />
                <span className="font-semibold">
                  {i18n.language === "yo" ? "Obi rẹ ti ti ẹ̀kọ́ re" : "Lessons locked by parent"}
                </span>
              </div>
            )}
            {!parentLock && control.daily_limit_minutes === 0 && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg flex items-center space-x-2 shadow">
                <FaInfinity />
                <span className="font-semibold">
                  {i18n.language === "yo" ? "Àkókò láìláàdá" : "Unlimited lessons"}
                </span>
              </div>
            )}
            {!parentLock && control.daily_limit_minutes > 0 && (
              <div className="bg-yellow-100 p-3 rounded-lg shadow flex items-center gap-2">
                <FaClock className="text-purple-700" />
                <span>
                  {i18n.language === "yo"
                    ? `Àkókò tó kù: ${remainingTime ?? control.daily_limit_minutes} ìṣẹ́jú`
                    : `Time left today: ${remainingTime ?? control.daily_limit_minutes} minutes`}
                </span>
              </div>
            )}
          </div>
        )}

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
                            <span className="text-sm font-bold text-purple-800">{getModuleProgress(mod.id)}</span>
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
                                {lessons[mod.id]?.map((lesson) => {
                                  const isDone = progress[lesson.id];
                                  console.log("👀 Rendering lesson:", lesson.id, "done?", isDone);
                                  return (
                                    <NavLink
                                      key={lesson.id}
                                      to={`/kids/lesson/${lesson.slug}`}
                                      className={`block p-2 rounded-lg flex justify-between items-center transition-all ${
                                        isDone
                                          ? "bg-yellow-200 text-purple-900 font-bold"
                                          : "bg-yellow-50 text-purple-800"
                                      } hover:bg-yellow-100`}
                                    >
                                      <span>{i18n.language === "yo" ? lesson.title_yo : lesson.title_en}</span>
                                      {isDone && <span>✔️</span>}
                                    </NavLink>
                                  );
                                })}
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
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-40 md:hidden z-40" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}
