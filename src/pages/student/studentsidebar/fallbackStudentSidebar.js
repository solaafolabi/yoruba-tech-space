// src/components/StudentSidebar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import supabase from "../../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import {
  FaTachometerAlt,
  FaChevronDown,
  FaUserCircle,
  FaSignOutAlt,
  FaHtml5,
  FaTimes,
} from "react-icons/fa";
import { BsCircle, BsCheckCircleFill } from "react-icons/bs";
import { useTranslation } from "react-i18next";

/**
 * StudentSidebar
 * Sidebar component for students displaying:
 * - Dashboard link
 * - User courses, modules, lessons
 * - Pick course modal
 * - Final project button
 * - Certificate & Discord links
 * Fully i18n-ready (English & Yoruba) using t("…")
 */
export default function StudentSidebar({ onLogout, closeSidebar }) {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useUser();

  const [openCourse, setOpenCourse] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const [availableCourses, setAvailableCourses] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalCourseId, setModalCourseId] = useState("");
  const [error, setError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if the current path matches (for active styling)
  const isActive = (path) => location.pathname === path;

  const toggleCourse = (courseId) =>
    setOpenCourse(openCourse === courseId ? null : courseId);
  const toggleModule = (moduleId) =>
    setOpenModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));

  // Fetch courses, user courses, and completed lessons
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch available courses
        const { data: courses, error: coursesError } = await supabase
          .from("courses")
          .select(
            `id, name, slug, title_en, title_yo, discord_link, target_audience, requires_assignment, modules (
              id, title, slug, title_en, title_yo,
              lessons (id, title, slug, title_en, title_yo, lesson_order)
            )`
          )
          .eq("target_audience", "25+");

        if (coursesError) throw coursesError;
        setAvailableCourses(courses || []);

        // Fetch user's courses
        const { data: uCourses, error: uCoursesError } = await supabase
          .from("user_courses")
          .select(
            `id, course_id, completed, completed_at, certificate_link,
            courses!inner(id, name, slug, title_en, title_yo, discord_link, requires_assignment, modules (
              id, title, slug, title_en, title_yo,
              lessons(id, title, slug, title_en, title_yo, lesson_order)
            ))`
          )
          .eq("user_id", user.id);

        if (uCoursesError) throw uCoursesError;
        setUserCourses(uCourses || []);

        // Fetch completed lessons
        const { data: completed, error: completedError } = await supabase
          .from("practical_progress")
          .select("lesson_slug")
          .eq("user_id", user.id)
          .eq("completed", true);

        if (completedError) throw completedError;
        setCompletedLessons(completed?.map((r) => r.lesson_slug) || []);
      } catch (err) {
        console.error(err.message || err);
        setError(t("errors.fetchData"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, t]);

  // Handle picking a new course
  const handlePickCourse = async () => {
    if (!modalCourseId || !user) return;

    const activeCourse = userCourses.find((c) => !c.completed);

    if (activeCourse) {
      setErrorMessage(
        t("sidebar.activeCourse", {
          course:
            activeCourse.courses.title_en ||
            activeCourse.courses.title_yo ||
            activeCourse.courses.name,
        })
      );
      setShowModal(false);
      setModalCourseId("");
      setShowErrorModal(true);
      return;
    }

    try {
      await supabase.from("user_courses").insert({
        user_id: user.id,
        course_id: modalCourseId,
      });

      setShowModal(false);
      setModalCourseId("");

      // Reload user courses
      const { data: uCourses } = await supabase
        .from("user_courses")
        .select(
          `id, course_id, completed, completed_at, certificate_link,
          courses!inner(id, name, slug, title_en, title_yo, discord_link, requires_assignment, modules (
            id, title, slug, title_en, title_yo,
            lessons(id, title, slug, title_en, title_yo, lesson_order)
          ))`
        )
        .eq("user_id", user.id);

      setUserCourses(uCourses || []);
    } catch (err) {
      console.error(err.message || err);
      setErrorMessage(t("errors.saveCourse"));
      setShowErrorModal(true);
    }
  };

  return (
    <div className="h-full w-64 bg-[#1B263B] text-white shadow-xl flex flex-col fixed z-40 top-0 left-0 md:relative">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#FFD700]/30">
        <div className="flex items-center gap-3">
          <FaUserCircle className="text-3xl text-[#FFD700]" />
          <h1 className="text-xl font-bold text-[#FFD700]">Yorùbá Tech</h1>
        </div>
        <button onClick={closeSidebar} className="md:hidden text-white">
          <FaTimes className="text-xl" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 gap-2 text-base scrollbar-thin scrollbar-thumb-[#FFD700]/40 scrollbar-track-transparent">
        {loading && <div className="p-3">{t("sidebar.loading")}</div>}
        {error && <div className="text-red-400 p-3">{error}</div>}

        {/* Dashboard Link */}
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[#FFD700]/10 transition ${
            isActive("/dashboard") ? "bg-[#FFD700]/10 border-l-4 border-[#FFD700]" : ""
          }`}
          onClick={closeSidebar}
        >
          <FaTachometerAlt /> {t("sidebar.dashboard")}
        </Link>

        {/* Pick Course Button */}
        {!loading && availableCourses.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FFD700]/10 transition w-full text-left mt-4"
          >
            <FaHtml5 className="text-[#FFD700]" />
            {t("sidebar.pickCourse")}
          </button>
        )}

        {/* User Courses */}
        {!loading &&
          userCourses.map((uc) => {
            const course = uc.courses;
            const allLessons = course.modules?.flatMap((mod) => mod.lessons || []) || [];
            const completedCount = allLessons.filter((l) => completedLessons.includes(l.slug)).length;
            const totalCount = allLessons.length;

            return (
              <div key={uc.id} className="mt-3">
                <button
                  onClick={() => !uc.completed && toggleCourse(uc.id)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FFD700]/10 transition w-full text-left text-lg"
                >
                  <div className="flex items-center gap-3">
                    <FaHtml5 className="text-[#e44d26]" />
                    <div className="flex flex-col">
                      <span>
                        {course.title_yo || course.title_en || course.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {course.modules?.length || 0} {t("sidebar.modules")},{" "}
                        {allLessons.length} {t("sidebar.lessons")}
                      </span>
                    </div>
                  </div>
                  {!uc.completed && (
                    <FaChevronDown
                      className={`transform transition-transform ${
                        openCourse === uc.id ? "rotate-180 text-[#FFD700]" : "rotate-0"
                      }`}
                    />
                  )}
                </button>

                {/* Final Project Button */}
                {course.requires_assignment && (
                  <button
                    onClick={() => {
                      if (completedCount === totalCount) {
                        window.location.href = `/student/final-project/${course.id}`;
                      } else {
                        alert(
                          t("sidebar.finalProject") +
                            ` (${completedCount}/${totalCount}) ${t("sidebar.lessons")}`
                        );
                      }
                    }}
                    className={`block mt-2 w-full px-4 py-2 rounded font-bold transition ${
                      completedCount === totalCount
                        ? "bg-yellow-500 text-white hover:bg-yellow-500"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    🚀 {t("sidebar.finalProject")} ({completedCount}/{totalCount})
                  </button>
                )}

                {/* Modules & Lessons */}
                {openCourse === uc.id &&
                  course.modules?.map((mod) => {
                    const lessonCount = mod.lessons?.length || 0;
                    const completedModCount =
                      mod.lessons?.filter((l) => completedLessons.includes(l.slug)).length || 0;
                    return (
                      <div key={mod.id} className="pl-4 flex flex-col gap-2 text-white text-base">
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="w-full flex items-center justify-between text-left font-medium text-base py-2 hover:text-[#FFD700] transition"
                        >
                          <span>{mod.title_yo || mod.title_en || mod.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#FFD700]">
                              {completedModCount}/{lessonCount}
                            </span>
                            <FaChevronDown
                              className={`transform transition-transform ${
                                openModules[mod.id] ? "rotate-180 text-[#FFD700]" : "rotate-0"
                              }`}
                            />
                          </div>
                        </button>

                        {openModules[mod.id] &&
                          mod.lessons?.map((lesson) => (
                            <Link
                              key={lesson.id}
                              to={`/dashboard/learn/${course.slug}/${lesson.slug}`}
                              onClick={closeSidebar}
                              className="flex items-center gap-2 pl-3 hover:text-white transition"
                            >
                              {completedLessons.includes(lesson.slug) ? (
                                <BsCheckCircleFill className="text-green-400" />
                              ) : (
                                <BsCircle className="text-gray-500" />
                              )}
                              <span>{lesson.title_yo || lesson.title_en || lesson.title}</span>
                            </Link>
                          ))}
                      </div>
                    );
                  })}

                {/* Certificate & Discord */}
                {uc.completed && uc.certificate_link && (
                  <a
                    href={uc.certificate_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-green-400 hover:text-green-200"
                  >
                    {t("sidebar.certificate")}
                  </a>
                )}
                {course.discord_link && (
                  <a
                    href={course.discord_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-blue-400 hover:text-blue-200"
                  >
                    {t("sidebar.joinDiscord")}
                  </a>
                )}
              </div>
            );
          })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[#FFD700]/20">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-base text-red-400 hover:text-white transition"
        >
          <FaSignOutAlt /> {t("profileDropdown.logout")}
        </button>
      </div>

      {/* Pick Course Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl">
            <h2 className="text-lg font-bold mb-4">{t("modals.pickCourseTitle")}</h2>
            <select
              className="w-full border rounded p-2 text-black"
              value={modalCourseId}
              onChange={(e) => setModalCourseId(e.target.value)}
            >
              <option value="">{t("sidebar.pickCourse")}</option>
              {availableCourses
                .filter((c) => !userCourses.some((uc) => uc.course_id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title_yo || c.title_en || c.name} ({c.target_audience || "All"})
                  </option>
                ))}
            </select>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 text-black hover:bg-gray-400 transition"
              >
                {t("sidebar.cancel")}
              </button>
              <button
                onClick={handlePickCourse}
                disabled={!modalCourseId}
                className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition disabled:opacity-50"
              >
                {t("sidebar.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl">
            <h2 className="text-lg font-bold text-red-600 mb-4">{t("modals.warning")}</h2>
            <p className="text-black">{errorMessage}</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
              >
                {t("modals.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
