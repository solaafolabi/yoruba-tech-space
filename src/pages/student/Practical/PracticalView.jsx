// src/pages/student/Practical/PracticalView.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TalkingDrumSpinner from "../../../components/TalkingDrumSpinner";
import { usePracticalSteps } from "./hooks/usePracticalSteps";
import ProgressBar from "./components/ProgressBar";
import LessonStep from "./components/LessonStep";
import StudentSidebar from "../studentsidebar/StudentSidebar";
import ProfileDropdown from "../../../components/ProfileDropdown";
import supabase from "../../../supabaseClient";
import { useTranslation } from "react-i18next";

export default function PracticalView() {
  const { t, i18n } = useTranslation();
  const { lessonSlug } = useParams();
  const navigate = useNavigate();
  const { lesson, steps, loading, error } = usePracticalSteps(lessonSlug);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCode, setCurrentCodeRaw] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  const lang = i18n.language;

  const lessonTitle = lesson
    ? lang === "yo"
      ? lesson.title_yo || lesson.title_en
      : lesson.title_en || lesson.title_yo
    : "";

  const isPractical = steps.length > 0;

  const saveProgress = async (codeMap, step) => {
    if (!user) return;
    await supabase.from("practical_progress").upsert(
      { user_id: user.id, lesson_slug: lessonSlug, current_step: step, code_state: codeMap },
      { onConflict: "user_id,lesson_slug" }
    );
  };

  const markLessonComplete = async () => {
    if (!user) return;
    setMarkingComplete(true);
    try {
      await supabase
        .from("practical_progress")
        .upsert({ user_id: user.id, lesson_slug: lessonSlug, completed: true }, { onConflict: "user_id,lesson_slug" });
      setShowCongratsModal(true);
    } catch (err) {
      console.error(err);
      alert(lang === "yo" ? "Aṣiṣe ṣẹlẹ̀ nigba títà" : "An error occurred while marking lesson complete");
    } finally {
      setMarkingComplete(false);
    }
  };

  const setCurrentCode = (update) => {
    setCurrentCodeRaw((prev) => {
      const prevForStep = prev[currentStepIndex] || { html: "", css: "", js: "" };
      const newForStep = typeof update === "function" ? update(prevForStep) : update;
      const newState = { ...prev, [currentStepIndex]: newForStep };
      saveProgress(newState, currentStepIndex);
      return newState;
    });
  };

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/login");
      setUser(user);

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profile);

      if (isPractical) {
        const { data: progress } = await supabase
          .from("practical_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("lesson_slug", lessonSlug)
          .single();

        if (progress) {
          const safeStep = Math.min(progress.current_step || 0, steps.length - 1);
          setCurrentStepIndex(safeStep);
          setCurrentCodeRaw(progress.code_state || {});
        }
      }
    };
    load();
  }, [steps.length, lessonSlug, navigate, isPractical]);

  const handleStepChange = async (index) => {
    await saveProgress(currentCode, index);
    setCurrentStepIndex(index);
  };

  const handlePass = async () => {
    const nextStep = currentStepIndex + 1;
    const safeNext = Math.min(nextStep, steps.length);

    setCurrentCodeRaw((prev) => {
      const newState = { ...prev, [safeNext]: prev[currentStepIndex] };
      saveProgress(newState, safeNext);
      return newState;
    });

    if (safeNext < steps.length) {
      setCurrentStepIndex(safeNext);
      setShowPassModal(true);
      setTimeout(() => setShowPassModal(false), 2000);
    } else {
      await supabase
        .from("practical_progress")
        .update({ completed: true })
        .eq("user_id", user.id)
        .eq("lesson_slug", lessonSlug);
      setShowCongratsModal(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <TalkingDrumSpinner size={80} message={t("practical.loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-red-500 text-lg bg-slate-900 min-h-screen">{error}</div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0D1B2A] text-white">
      {/* Sidebars */}
      {sidebarOpen && (
        <div className="md:hidden fixed top-0 left-0 w-64 h-full z-50">
          <StudentSidebar onLogout={handleLogout} closeSidebar={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="hidden md:block fixed left-0 top-0 w-64 h-full z-40">
        <StudentSidebar onLogout={handleLogout} closeSidebar={() => setSidebarOpen(false)} />
      </div>

      {/* Profile */}
      <div className="fixed top-2 right-4 md:top-3 md:right-6 z-50">
        <ProfileDropdown user={user} profile={profile} setProfile={setProfile} handleLogout={handleLogout} />
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64 mt-8 md:mt-4 p-4 md:p-8 overflow-auto">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-6">
          🚀 {t("practical.title")}: {lessonTitle}
        </h1>

        {isPractical ? (
          <>
            {/* Step buttons */}
            <div className="flex gap-2 mb-4">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === currentStepIndex
                      ? "bg-[#FFD700] text-[#0D1B2A]"
                      : index < currentStepIndex
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <ProgressBar currentStep={Math.min(currentStepIndex + 1, steps.length)} totalSteps={steps.length} />

            <LessonStep
              step={{
                ...steps[currentStepIndex],
                instruction: lang === "yo"
                  ? steps[currentStepIndex].instruction_yo
                  : steps[currentStepIndex].instruction_en
              }}
              currentCode={currentCode[currentStepIndex] || { html: "", css: "", js: "" }}
              setCurrentCode={setCurrentCode}
              onPass={handlePass}
              isLastStep={currentStepIndex === steps.length - 1}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20">
            <button
              onClick={markLessonComplete}
              disabled={markingComplete}
              className="px-8 py-4 text-xl font-bold bg-green-600 rounded-lg hover:bg-green-500 transition disabled:opacity-50"
            >
              ✅ {markingComplete ? (lang === "yo" ? "Ń fipamọ ..." : "Marking...") : (lang === "yo" ? "Parí Ẹ̀kọ́" : "Complete Lesson")}
            </button>
          </div>
        )}
      </div>

      {/* Step passed modal */}
      {showPassModal && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-700 text-white px-6 py-4 rounded-full shadow-lg z-50 transition">
          🎉 {t("practical.stepPassed")}
        </div>
      )}

      {/* All completed modal */}
      {showCongratsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-white text-black p-10 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-4">🎉 {t("practical.allCompleted")}</h2>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-[#FFD700] text-[#0D1B2A] px-6 py-3 rounded-full font-bold hover:bg-yellow-500 transition"
            >
              {t("practical.goDashboard")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
