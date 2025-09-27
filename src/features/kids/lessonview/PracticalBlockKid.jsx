// src/features/kids/practical/PracticalBlockKid.jsx
import React, { useState, useEffect } from "react";
import supabase from "../../../supabaseClient";
import { useTranslation } from "react-i18next";

export default function PracticalBlockKid({ steps = [], language, lessonSlug, userId }) {
  const { t, i18n } = useTranslation();
  const lang = language || i18n.language;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  // ✅ Load saved progress from Supabase
  useEffect(() => {
    const load = async () => {
      if (!userId || !lessonSlug) return;
      setLoading(true);
      const { data } = await supabase
        .from("practical_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("lesson_slug", lessonSlug)
        .single();

      if (data) {
        setCurrentStepIndex(Math.min(data.current_step || 0, steps.length - 1));
        setProgress(data.code_state || {});
        setCompleted(data.completed || false);
      }
      setLoading(false);
    };
    load();
  }, [userId, lessonSlug, steps.length]);

  // ✅ Save progress
  const saveProgress = async (stepIndex, newProgress = progress) => {
    if (!userId || !lessonSlug) return;
    await supabase.from("practical_progress").upsert(
      {
        user_id: userId,
        lesson_slug: lessonSlug,
        current_step: stepIndex,
        code_state: newProgress,
        completed,
      },
      { onConflict: "user_id,lesson_slug" }
    );
  };

  const handleNext = async () => {
    const nextStep = currentStepIndex + 1;
    if (nextStep < steps.length) {
      setCurrentStepIndex(nextStep);
      await saveProgress(nextStep);
    } else {
      setCompleted(true);
      await supabase
        .from("practical_progress")
        .update({ completed: true })
        .eq("user_id", userId)
        .eq("lesson_slug", lessonSlug);
    }
  };

  if (loading) {
    return <p className="text-gray-300">⏳ {t("practical.loading")}</p>;
  }

  if (!steps || steps.length === 0) {
    return <p className="text-red-400">⚠️ {t("practical.noSteps") || "No steps available."}</p>;
  }

  return (
    <div className="p-6 bg-[#162447] rounded-2xl shadow-lg text-white">
      <h2 className="text-2xl font-bold mb-4">👶 {t("practical.kidsMode", "Kids Practical")}</h2>

      {completed ? (
        <div className="text-center">
          <p className="text-green-400 text-xl mb-4">🎉 {t("practical.allCompleted")}</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-lg">
              {lang === "yo"
                ? steps[currentStepIndex].instruction_yo
                : steps[currentStepIndex].instruction_en}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {t("practical.step", "Step")} {currentStepIndex + 1} / {steps.length}
            </span>
            <button
              onClick={handleNext}
              className="ml-auto bg-[#FFD700] text-[#0D1B2A] px-4 py-2 rounded-full font-bold hover:bg-yellow-500 transition"
            >
              {currentStepIndex + 1 === steps.length
                ? t("practical.completeLesson", "Complete Lesson")
                : t("practical.next", "Next ➡️")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
