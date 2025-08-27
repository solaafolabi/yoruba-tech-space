// src/hooks/useDashboardData.js
import { useState, useEffect, useMemo } from "react";
import supabase from "../supabaseClient";

export function useDashboardData(navigate, i18n) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState("25+");
  const [courseTree, setCourseTree] = useState([]);
  const [completedLessonSlugs, setCompletedLessonSlugs] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) return navigate("/login");
        setUser(user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;
        setProfile(profileData);
        if (!profileData?.has_completed_admission) setShowAdmissionModal(true);
        setAudience(profileData?.target_audience || "25+");

        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select(`id, name, slug, title_en, title_yo, modules (
            id, title, slug, lessons (
              id, title, slug, title_en, title_yo, lesson_order, target_audience
            )
          )`);
        if (coursesError) throw coursesError;

        const filteredCourses = (coursesData || []).map(course => {
          const modules = (course.modules || []).map(mod => ({
            ...mod,
            lessons: (mod.lessons || [])
              .filter(lesson => lesson.target_audience === (profileData?.target_audience || "25+"))
              .sort((a, b) => a.lesson_order - b.lesson_order)
          })).filter(mod => mod.lessons.length > 0);
          return { ...course, modules };
        }).filter(course => course.modules.length > 0);

        setCourseTree(filteredCourses);

        const { data: progress, error: progressError } = await supabase
          .from("practical_progress")
          .select("lesson_slug, completed, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });
        if (progressError) throw progressError;

        setProgressRows(progress || []);
        setCompletedLessonSlugs((progress || []).filter(r => r.completed).map(r => r.lesson_slug));

        const { data: certData } = await supabase
          .from("certificates")
          .select("*")
          .eq("user_id", user.id);
        setCertificates(certData || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err?.message || err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  const allCoursesDerived = useMemo(() => {
    const lessonBySlug = new Map();
    const courseProgress = [];

    (courseTree || []).forEach(course => {
      let totalLessons = 0, completedCount = 0;
      (course.modules || []).forEach(mod => {
        (mod.lessons || []).forEach(lesson => {
          totalLessons++;
          lessonBySlug.set(lesson.slug, { course, mod, lesson });
          if (completedLessonSlugs.includes(lesson.slug)) completedCount++;
        });
      });
      courseProgress.push({
        id: course.id,
        slug: course.slug,
        title: i18n.language === "yo" && course.title_yo ? course.title_yo : course.title_en || course.name,
        totalLessons,
        completedCount,
        progress: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
      });
    });

    return { courseProgress, lessonBySlug };
  }, [courseTree, completedLessonSlugs, i18n.language]);

  return {
    user, profile, showAdmissionModal, setShowAdmissionModal, loading,
    audience, courseTree, completedLessonSlugs, progressRows, certificates,
    allCoursesDerived
  };
}
