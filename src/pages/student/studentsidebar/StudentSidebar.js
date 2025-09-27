import React, { useEffect, useState, lazy, Suspense } from "react";
import supabase from "../../../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { FaTachometerAlt, FaHtml5, FaSignOutAlt, FaTrash, FaBars } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import SidebarHeader from "./SidebarHeader";
import SidebarNavLink from "./SidebarNavLink";
import PickCourseModal from "./PickCourseModal";
import ErrorModal from "./ErrorModal";

const CourseList = lazy(() => import("./CourseList"));

export default function StudentSidebar({ onLogout }) {
  const { t } = useTranslation();
  const user = useUser();

  const [availableCourses, setAvailableCourses] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalCourseId, setModalCourseId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Mobile toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
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

        const { data: uCourses, error: uCoursesError } = await supabase
          .from("user_courses")
          .select(
            `id, course_id, status, completed, completed_at, certificate_link,
            courses!inner(id, name, slug, title_en, title_yo, discord_link, requires_assignment, modules (
              id, title, slug, title_en, title_yo,
              lessons(id, title, slug, title_en, title_yo, lesson_order)
            ))`
          )
          .eq("user_id", user.id);
        if (uCoursesError) throw uCoursesError;
        setUserCourses(uCourses || []);

        const { data: completed, error: completedError } = await supabase
          .from("practical_progress")
          .select("lesson_slug")
          .eq("user_id", user.id)
          .eq("completed", true);
        if (completedError) throw completedError;
        setCompletedLessons(completed?.map((r) => r.lesson_slug) || []);
      } catch (err) {
        console.error(err.message || err);
        setErrorMessage(t("errors.fetchData"));
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, t]);

  // Pick a course (add)
  const handlePickCourse = async () => {
    if (!modalCourseId || !user) return;

    try {
      await supabase.from("user_courses").insert({
        user_id: user.id,
        course_id: modalCourseId,
        status: "active",
        completed: false,
      });

      setShowModal(false);
      setModalCourseId("");

      const { data: uCourses } = await supabase
        .from("user_courses")
        .select(
          `id, course_id, status, completed, completed_at, certificate_link,
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

  // Remove a course
  const handleRemoveCourse = async (courseId) => {
    try {
      await supabase
        .from("user_courses")
        .delete()
        .eq("user_id", user.id)
        .eq("course_id", courseId);

      setUserCourses((prev) =>
        prev.map((c) =>
          c.course_id === courseId ? { ...c, removed: true } : c
        )
      );
    } catch (err) {
      console.error(err.message || err);
      setErrorMessage(t("errors.removeCourse"));
      setShowErrorModal(true);
    }
  };

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-yellow-600 text-[#0D1B2A] rounded-md md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FaBars />
      </button>

      {/* Sidebar */}
      <div
        className={`h-full w-64 bg-[#1B263B] text-white shadow-xl flex flex-col fixed z-40 top-0 left-0 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative`}
      >
        {/* Header */}
        <SidebarHeader closeSidebar={() => setSidebarOpen(false)} />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 gap-2 text-base scrollbar-thin scrollbar-thumb-[#FFD700]/40 scrollbar-track-transparent">
          {loading && <div className="p-3">{t("sidebar.loading")}</div>}

          <SidebarNavLink
            to="/dashboard"
            icon={FaTachometerAlt}
            translationKey="sidebar.dashboard"
          />

          {!loading && availableCourses.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-yellow- transition w-full text-left mt-4"
            >
              <FaHtml5 className="text-yellow-500" /> {t("sidebar.pickCourse")}
            </button>
          )}

          {!loading && userCourses.length > 0 && (
            <Suspense fallback={<div className="p-3">{t("sidebar.loading")}</div>}>
              {userCourses
                .filter((c) => !c.removed)
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center gap-2 p-3 mt-2  rounded-lg hover:text-yellow-600 transition"
                  >
                    <span>{c.courses.title_en || c.courses.title_yo || c.courses.name}</span>
                    <button
                      onClick={() => handleRemoveCourse(c.course_id)}
                      className="text-red-400 hover:text-red-600"
                      title={t("sidebar.removeCourse")}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}

              <CourseList
                userCourses={userCourses.filter((c) => !c.removed)}
                completedLessons={completedLessons}
                selectedCourseId={selectedCourseId}
                setSelectedCourseId={setSelectedCourseId}
              />
            </Suspense>
          )}
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

        {/* Modals */}
        {showModal && (
          <PickCourseModal
            availableCourses={availableCourses}
            userCourses={userCourses}
            modalCourseId={modalCourseId}
            setModalCourseId={setModalCourseId}
            handlePickCourse={handlePickCourse}
            closeModal={() => setShowModal(false)}
          />
        )}

        {showErrorModal && (
          <ErrorModal
            message={errorMessage}
            closeModal={() => setShowErrorModal(false)}
          />
        )}
      </div>
    </>
  );
}
