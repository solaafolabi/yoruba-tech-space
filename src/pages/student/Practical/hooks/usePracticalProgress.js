// src/pages/student/Practical/hooks/usePracticalProgress.js
import { useState, useEffect } from "react";
import supabase from "../../../../supabaseClient";
import { t } from "../../../../i18nHelper";

export function usePracticalProgress(userId, lessonSlug, language = "en") {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !lessonSlug) return;

    const loadProgress = async () => {
      const { data, error } = await supabase
        .from("practical_progress")
        .select("current_step")
        .eq("user_id", userId)
        .eq("lesson_slug", lessonSlug)
        .single();

      if (error) {
        console.log(t("noSavedProgress", language));
        setCurrentStep(0);
      } else {
        setCurrentStep(data?.current_step ?? 0);
      }
      setLoading(false);
    };

    loadProgress();
  }, [userId, lessonSlug, language]);

  const saveProgress = async (step) => {
    if (!userId || !lessonSlug) return;

    const { error } = await supabase
      .from("practical_progress")
      .upsert({
        user_id: userId,
        lesson_slug: lessonSlug,
        current_step: step,
      });

    if (error) {
      console.error(t("errorSavingProgress", language), error);
    } else {
      console.log(`${t("progressSaved", language)} ${step}`);
      setCurrentStep(step);
    }
  };

  return { currentStep, saveProgress, loading };
}
