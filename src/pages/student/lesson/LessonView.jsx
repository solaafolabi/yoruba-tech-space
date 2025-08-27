// src/pages/student/LessonView.jsx
import React, { useEffect, useState, Suspense, lazy } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../../supabaseClient";
import StudentSidebar from "../studentsidebar/StudentSidebar";
import ProfileDropdown from "../../../components/ProfileDropdown";
import { useTranslation } from "react-i18next";
import TalkingDrumSpinner from "../../../components/TalkingDrumSpinner";

// 🔹 Lazy loaded parts
const LessonHeader = lazy(() => import("./LessonHeader"));
const LessonContent = lazy(() => import("./LessonContent"));
const LessonQuiz = lazy(() => import("./LessonQuiz"));

const LessonView = () => {
  const { lessonSlug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [lesson, setLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // ===== Fetch lesson =====
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const { data, error } = await supabase
          .from("lessons")
          .select(
            `id, title_en, title_yo, description_en, description_yo, content_blocks`
          )
          .eq("slug", lessonSlug)
          .single();

        if (error) throw error;

        let contentBlocks = [];
        if (data?.content_blocks) {
          contentBlocks =
            typeof data.content_blocks === "string"
              ? JSON.parse(data.content_blocks || "[]")
              : data.content_blocks;
        }
        setLesson({ ...data, content_blocks: contentBlocks });
      } catch (error) {
        console.error("Error fetching lesson:", error);
      }
    };
    fetchLesson();
  }, [lessonSlug]);

  // ===== Fetch quizzes =====
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!lesson?.id) return;
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select(
            "id, question_en, question_yo, options_en, options_yo, correct_answer_en, correct_answer_yo"
          )
          .eq("lesson_id", lesson.id);

        if (error) throw error;

        setQuizzes(data || []);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    };
    fetchQuizzes();
  }, [lesson, i18n.language]);

  // ===== Fetch profile =====
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return navigate("/login");
        setUser(user);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error) setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen h-screen w-full bg-[#0F172A] text-white relative overflow-hidden">
      {/* Sidebar toggle for mobile */}
      {!showSidebar && (
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setShowSidebar(true)}
            className="text-white bg-[#1B263B] p-2 rounded"
          >
            ☰
          </button>
        </div>
      )}

      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 w-64 h-full bg-[#1E293B] transform transition-transform duration-300 md:sticky md:top-0 md:z-20
        ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <StudentSidebar
          closeSidebar={() => setShowSidebar(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* Profile Dropdown */}
      <div className="hidden md:block fixed top-4 right-6 z-50">
        <ProfileDropdown
          user={user}
          profile={profile}
          setProfile={setProfile}
          handleLogout={handleLogout}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-12 md:pt-20 max-w-full">
        <div className="md:hidden relative z-50 mb-6 flex justify-end">
          <ProfileDropdown
            user={user}
            profile={profile}
            setProfile={setProfile}
            handleLogout={handleLogout}
          />
        </div>

        {/* 🔹 Lazy load lesson parts */}
        <Suspense fallback={<TalkingDrumSpinner />}>
          {lesson && <LessonHeader lesson={lesson} />}
        </Suspense>

        <Suspense fallback={<TalkingDrumSpinner />}>
          {lesson && <LessonContent lesson={lesson} />}
        </Suspense>

        <Suspense fallback={<TalkingDrumSpinner />}>
          {lesson && quizzes.length > 0 && (
            <LessonQuiz
              lessonSlug={lessonSlug}
              quizzes={quizzes}
              lessonId={lesson.id} // ✅ Pass lessonId
            />
          )}
        </Suspense>
      </main>
    </div>
  );
};

export default LessonView;
