import { useEffect, useState } from "react";
import supabase from "../../../../supabaseClient";

export function usePracticalSteps(lessonSlug) {
  const [steps, setSteps] = useState([]);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSteps = async () => {
      setLoading(true);

      // 1️⃣ Get the lesson by slug
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("*")
        .eq("slug", lessonSlug)
        .single();

      if (lessonError) {
        console.error("❌ Lesson fetch error:", lessonError);
        setError("Lesson not found.");
        setLoading(false);
        return;
      }

      setLesson(lessonData);

      // 2️⃣ Get practical_steps by lesson_id
      const { data: stepsData, error: stepsError } = await supabase
        .from("practical_steps")
        .select("*")
        .eq("lesson_id", lessonData.id)
        .order("step_number", { ascending: true });

      if (stepsError) {
        console.error("❌ Steps fetch error:", stepsError);
        setError("Failed to load practical steps.");
        setLoading(false);
        return;
      }

      setSteps(stepsData);
      setError(null);
      setLoading(false);
    };

    if (lessonSlug) fetchSteps();
  }, [lessonSlug]);

  return { lesson, steps, loading, error };
}
