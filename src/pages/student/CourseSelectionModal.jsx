// src/components/StudentSidebar.js
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import supabase from "../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { FaTachometerAlt, FaChevronDown, FaUserCircle, FaSignOutAlt, FaHtml5, FaTimes } from "react-icons/fa";
import { BsCircle, BsCheckCircleFill } from "react-icons/bs";

export default function StudentSidebar({ onLogout, closeSidebar, language = "en" }) {
  const location = useLocation();
  const user = useUser();

  const [openCourse, setOpenCourse] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const [courseModules, setCourseModules] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalCourseId, setModalCourseId] = useState(""); // for dropdown in modal

  const isActive = (path) => location.pathname === path;
  const toggleCourse = (courseId) => setOpenCourse(openCourse === courseId ? null : courseId);
  const toggleModule = (moduleId) => setOpenModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));

  // Fetch profile, courses, modules, lessons
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get selected course from profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("selected_course, target_audience")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;

        if (!profile?.selected_course) {
          setSelectedCourse(null);

          // Get courses for user's target audience
          const { data: courses } = await supabase
            .from("courses")
            .select("id, title_en, title_yo, name, slug, discord_link, target_audience")
            .eq("target_audience", profile.target_audience);

          setAvailableCourses(courses || []);
          return;
        }

        // User has selected course
        setSelectedCourse(profile.selected_course);

        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select(`
            id, name, slug, title_en, title_yo, discord_link,
            modules (
              id, title, slug, title_en, title_yo,
              lessons (id, title, slug, title_en, title_yo, lesson_order)
            )
          `)
          .eq("id", profile.selected_course)
          .single();
        if (courseError) throw courseError;

        setCourseModules(course ? [course] : []);
      } catch (err) {
        console.error("Sidebar fetch error:", err.message);
      }
    };

    const fetchCompleted = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("practical_progress")
          .select("lesson_slug")
          .eq("user_id", user.id)
          .eq("completed", true);
        if (error) throw error;
        setCompletedLessons(data?.map((row) => row.lesson_slug) || []);
        setLoadingCompleted(false);
      } catch (err) {
        console.error("Completed lessons fetch error:", err.message);
      }
    };

    fetchData();
    fetchCompleted();
  }, [user]);

  // Handle picking course from modal dropdown
  const handlePickCourse = async () => {
    if (!modalCourseId || !user) return;
    try {
      await supabase.from("profiles").update({ selected_course: modalCourseId }).eq("id", user.id);
      setSelectedCourse(modalCourseId);
      setShowModal(false);

      const { data: course } = await supabase
        .from("courses")
        .select(`
          id, name, slug, title_en, title_yo, discord_link,
          modules (
            id, title, slug, title_en, title_yo,
            lessons (id, title, slug, title_en, title_yo, lesson_order)
          )
        `)
        .eq("id", modalCourseId)
        .single();

      setCourseModules(course ? [course] : []);
      setModalCourseId("");
    } catch (err) {
      console.error("Pick course error:", err.message);
    }
  };

  return (
    <div className="h-full w-64 bg-[#1B263B] text-white shadow-xl flex flex-col fixed z-50 top-0 left-0 md:relative">
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
        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[#FFD700]/10 transition ${isActive("/dashboard") ? "bg-[#FFD700]/10 border-l-4 border-[#FFD700]" : ""}`}
          onClick={closeSidebar}
        >
          <FaTachometerAlt /> {language === "yo" ? "Àkọ́kọ́ Dashboard" : "Dashboard"}
        </Link>

        {/* Pick Course Button */}
        {!selectedCourse && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FFD700]/10 transition w-full text-left"
          >
            <FaHtml5 className="text-[#FFD700]" />
            {language === "yo" ? "Yan Ẹ̀kọ́ Rẹ" : "Pick Your Course"}
          </button>
        )}

        {/* Show Selected Course */}
        {selectedCourse &&
          (loadingCompleted ? (
            <div className="p-4 text-gray-400 animate-pulse">Loading lessons...</div>
          ) : (
            courseModules.map((course) => (
              <div key={course.id}>
                <button
                  onClick={() => toggleCourse(course.id)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FFD700]/10 transition w-full text-left text-lg"
                >
                  <div className="flex items-center gap-3">
                    <FaHtml5 className="text-[#e44d26]" />
                    <div className="flex flex-col">
                      <span>{language === "yo" && course.title_yo ? course.title_yo : course.title_en || course.name}</span>
                      <span className="text-xs text-gray-400">
                        {course.modules?.length || 0} Modules, {course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0)} Lessons
                      </span>
                    </div>
                  </div>
                  <FaChevronDown className={`transform transition-transform ${openCourse === course.id ? "rotate-180 text-[#FFD700]" : "rotate-0"}`} />
                </button>

                {openCourse === course.id && course.modules && (
                  <div className="pl-4 flex flex-col gap-2 text-white text-base">
                    {course.modules.map((mod) => {
                      const lessonCount = mod.lessons?.length || 0;
                      const completedCount = mod.lessons?.filter((lesson) => completedLessons.includes(lesson.slug)).length || 0;

                      return (
                        <div key={mod.id} className="mb-1">
                          <button
                            onClick={() => toggleModule(mod.id)}
                            className="w-full flex items-center justify-between text-left font-medium text-base py-2 hover:text-[#FFD700] transition"
                          >
                            <span>{language === "yo" && mod.title_yo ? mod.title_yo : mod.title_en || mod.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#FFD700]">{completedCount}/{lessonCount}</span>
                              <FaChevronDown className={`transform transition-transform ${openModules[mod.id] ? "rotate-180 text-[#FFD700]" : "rotate-0"}`} />
                            </div>
                          </button>

                          {openModules[mod.id] && mod.lessons && (
                            <div className="flex flex-col gap-1 pl-3 mt-1 text-gray-300 text-base">
                              {mod.lessons.map((lesson) => (
                                <Link
                                  key={lesson.id}
                                  to={`/dashboard/learn/${course.slug}/${lesson.slug}`}
                                  onClick={closeSidebar}
                                  className="flex items-center gap-2 hover:text-white transition"
                                >
                                  {completedLessons.includes(lesson.slug) ? <BsCheckCircleFill className="text-green-400" /> : <BsCircle className="text-gray-500" />}
                                  <span>{language === "yo" && lesson.title_yo ? lesson.title_yo : lesson.title_en || lesson.title}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ))}

        {/* Discord Button */}
        {courseModules.length > 0 && courseModules[0].discord_link && (
          <a href={courseModules[0].discord_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-[#5865F2] text-white hover:bg-[#4752C4] transition mt-4">
            Join Discord
          </a>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[#FFD700]/20">
        <button onClick={onLogout} className="flex items-center gap-3 text-base text-red-400 hover:text-white transition">
          <FaSignOutAlt /> {language === "yo" ? "Jáde (Logout)" : "Logout"}
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">{language === "yo" ? "Yan Ẹ̀kọ́ Kan" : "Choose a Course"}</h2>
            <select
              className="w-full p-2 border rounded mb-4"
              value={modalCourseId}
              onChange={(e) => setModalCourseId(e.target.value)}
            >
              <option value="">{language === "yo" ? "Yan Ẹ̀kọ́" : "Select Course"}</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>{language === "yo" && c.title_yo ? c.title_yo : c.title_en || c.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border hover:bg-gray-200">{language === "yo" ? "Fagilé" : "Cancel"}</button>
              <button onClick={handlePickCourse} disabled={!modalCourseId} className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 font-semibold">{language === "yo" ? "Fipamọ" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
