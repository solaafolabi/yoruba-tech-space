// src/pages/student/practical/services/supabaseService.js
import supabase from "../../../../supabaseClient";

export const fetchLessonData = async (lessonSlug) => {
  const { data: lessonData } = await supabase
    .from("lessons")
    .select("id, lesson_type")
    .eq("slug", lessonSlug)
    .single();

  if (!lessonData) {
    throw new Error("Lesson not found");
  }

  const { data: stepData } = await supabase
    .from("practical_steps")
    .select("*")
    .eq("lesson_id", lessonData.id)
    .order("step_number", { ascending: true });

  const { data: progressData } = await supabase
    .from("student_practical_progress")
    .select("*")
    .eq("student_id", supabase.auth.getUser()?.user?.id)
    .eq("lesson_id", lessonData.id)
    .single();

  return {
    lesson: lessonData,
    steps: stepData || [],
    progress: progressData || null,
  };
};

export const saveProgress = async (progressData) => {
  const { student_id, lesson_id, ...updates } = progressData;
  
  const { data } = await supabase
    .from("student_practical_progress")
    .update(updates)
    .eq("student_id", student_id)
    .eq("lesson_id", lesson_id);

  return data;
};
