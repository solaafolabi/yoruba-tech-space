import { useState, useEffect } from "react";
import supabase from "../../../../supabaseClient";

export const usePracticalSteps = (lessonSlug, language = "en") => {
  const [steps, setSteps] = useState([]);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonSlug) return;

    const fetchSteps = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch lesson data
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .select("*")
          .eq("slug", lessonSlug)
          .single();

        if (lessonError || !lessonData) {
          setError("Lesson not found.");
          setLoading(false);
          return;
        }

        setLesson(lessonData);

        // Fetch practical steps
        const { data: stepsData, error: stepsError } = await supabase
          .from("practical_steps")
          .select(`
            id, 
            step_number, 
            lesson_type,
            instruction_en,
            instruction_yo,
            validation_rules,
            expected_output
          `)
          .eq("lesson_id", lessonData.id)
          .order("step_number", { ascending: true });

        if (stepsError) {
          setError("Failed to fetch practical steps.");
        } else {
          const updatedData = stepsData.map((step) => {
            // Safely handle lesson_type
            const lessonType = (step.lesson_type || "html").toString().toLowerCase();

            return {
              ...step,
              lesson_type: lessonType,
              instruction: step[`instruction_${language}`] || step.instruction_en,
            };
          });

          setSteps(updatedData);
        }
      } catch (err) {
        console.error("Unexpected fetch error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchSteps();
  }, [lessonSlug, language]);

  return { steps, lesson, error, loading };
};
