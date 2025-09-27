// src/pages/children/ChildrenDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../../supabaseClient";
import { useTranslation } from "react-i18next";
import { cx, ProgressBar, Chip } from "./lessonview/ui-utils";
import Confetti from "react-confetti";

const comicFont = { fontFamily: "'Comic Neue', 'Comic Sans MS', cursive, sans-serif" };

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: "spring", stiffness: 120 },
  }),
  hover: { scale: 1.05, rotate: [0, 2, -2, 0], transition: { duration: 0.3 } },
};

const CARD_COLORS = ["bg-yellow-300", "bg-teal-300", "bg-purple-300"];

export default function ChildrenDashboard({ session }) {
  const { t, i18n } = useTranslation();
  const [lessons, setLessons] = useState([]);
  const [badges, setBadges] = useState([]);
  const [totalQuizScore, setTotalQuizScore] = useState({ correct: 0, total: 0 });
  const [modalData, setModalData] = useState(null);
  const [newBadge, setNewBadge] = useState(null); // for popup confetti

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        const userId = userData.user.id;

        // fetch child
        const { data: child } = await supabase
          .from("children")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (!child) return;

        // fetch completed lessons
        const { data: completedLessons } = await supabase
          .from("completed_lessons")
          .select(`lesson_id, lessons(title_en, title_yo, slug)`)
          .eq("child_id", child.id);

        const lessonIds = (completedLessons || []).map((l) => l.lesson_id);

        // fetch quizzes
        let quizzes = [];
        if (lessonIds.length > 0) {
          const { data: quizData } = await supabase.from("quizzes").select("*").in("lesson_id", lessonIds);
          quizzes = quizData || [];
        }

        // fetch first attempts
        const { data: firstAttempts } = await supabase.from("first_attempts").select("*").eq("child_id", child.id);
        const faMap = {};
        (firstAttempts || []).forEach((fa) => (faMap[fa.quiz_id] = fa));

        let totalCorrect = 0;
        let totalQuestions = 0;

        const lessonsWithScores = (completedLessons || []).map((l) => {
          const lessonQuizzes = quizzes.filter((q) => q.lesson_id === l.lesson_id);
          let correctCount = 0;
          lessonQuizzes.forEach((q) => {
            const fa = faMap[q.id];
            if (fa?.is_correct) correctCount++;
          });

          totalCorrect += correctCount;
          totalQuestions += lessonQuizzes.length;

          return {
            lesson_id: l.lesson_id,
            slug: l.lessons.slug,
            title: i18n.language.startsWith("yo") ? l.lessons.title_yo : l.lessons.title_en,
            quiz_score: correctCount,
            quiz_count: lessonQuizzes.length,
          };
        });

        if (mounted) setLessons(lessonsWithScores);
        setTotalQuizScore({ correct: totalCorrect, total: totalQuestions });

        // handle badges: award only for fully completed lessons
        for (const l of lessonsWithScores) {
          const lessonQuizzes = quizzes.filter((q) => q.lesson_id === l.lesson_id);
          const allCompleted = lessonQuizzes.every(q => faMap[q.id]); // all quizzes attempted
          if (allCompleted) {
            const { data: existing } = await supabase
              .from("achievements")
              .select("*")
              .eq("child_id", child.id)
              .eq("lesson_id", l.lesson_id);

            if (!existing || existing.length === 0) {
              // award new badge
              const badge = {
                child_id: child.id,
                lesson_id: l.lesson_id,
                title_en: `Completed ${l.title}`,
                title_yo: `Pari ${l.title}`,
                description_en: `You completed the ${l.title} lesson!`,
                description_yo: `O ti pari ẹkọ ${l.title}!`,
                icon_url: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
                key: `badge-${l.lesson_id}`,
              };
              const { data: inserted, error } = await supabase
  .from("achievements")
  .upsert(badge, { onConflict: "key" })
  .select()
  .single();

if (error) {
  console.error("❌ Error saving achievement:", error);
} else if (inserted) {
  console.log("🏅 New achievement awarded:", inserted);
  setNewBadge(inserted);
  setBadges(prev => [...prev, inserted]);
}

            }
          }
        }

        // fetch all existing badges
        const { data: earned } = await supabase.from("achievements").select("*").eq("child_id", child.id);
        if (mounted) setBadges(earned || []);

        // subscribe to real-time badge inserts
        const channel = supabase
          .channel('achievements')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'achievements', filter: `child_id=eq.${child.id}` }, payload => {
            setBadges(prev => [...prev, payload.new]);
            setNewBadge(payload.new);
          })
          .subscribe();

        return () => supabase.removeChannel(channel);

      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [session, i18n.language]);

  const cards = useMemo(
    () => [
      { key: "completedLessons", color: CARD_COLORS[0], count: lessons.length, label: t("childrenDashboard.lessons") },
      { key: "badges", color: CARD_COLORS[1], count: badges.length, label: t("childrenDashboard.badges") },
      { key: "quizScore", color: CARD_COLORS[2], count: `${totalQuizScore.correct}/${totalQuizScore.total || 0}`, label: t("childrenDashboard.quizScores") },
    ],
    [lessons, badges, totalQuizScore, t]
  );

  const handleCardClick = (type) => {
    if (type === "completedLessons") setModalData({ type: "lessons", data: lessons });
    if (type === "badges") setModalData({ type: "badges", data: badges });
    if (type === "quizScore") setModalData({ type: "quizScores", data: lessons });
  };

  return (
    <div
  className="min-h-screen bg-gradient-to-r from-pink-200 via-yellow-100 to-blue-200 text-gray-900 px-4 sm:px-6 pt-32 pb-12" 
  style={comicFont}
>
  {/* 🎉 Confetti only when new badge */}
  {newBadge && <Confetti recycle={false} numberOfPieces={150} />}

  {/* 🔝 Welcome Header */}
  <header className="text-center mb-8">
    <motion.h1
      className="text-4xl sm:text-5xl font-extrabold text-purple-800 drop-shadow-lg"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 120 }}
    >
      {t("childrenDashboard.welcome")}
    </motion.h1>
    <motion.p
      className="mt-4 text-lg sm:text-xl text-pink-700 font-semibold"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {t("childrenDashboard.subtitle")}
    </motion.p>
  </header>

  {/* 📊 Summary Cards */}
  <main className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-7xl mx-auto">
    {cards.map((card, index) => (
      <motion.div
        key={card.key}
        className={cx(
          "rounded-2xl p-6 shadow-xl border-2 border-white flex flex-col items-center text-center relative cursor-pointer hover:shadow-2xl transition-all duration-300",
          card.color
        )}
        custom={index}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        variants={cardVariants}
        onClick={() => handleCardClick(card.key)}
      >
        <h2 className="text-2xl font-bold mb-2">{card.label}</h2>

        {/* 🔔 Count Badge */}
        <span className="absolute top-3 right-3 bg-yellow-400 text-purple-900 font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
          {card.count}
        </span>
      </motion.div>
    ))}
  </main>


      {/* modal */}
      <AnimatePresence>
        {modalData && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[80vh]" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <h3 className="text-xl font-bold mb-4">
                {modalData.type === "lessons" && t("childrenDashboard.lessons")}
                {modalData.type === "badges" && t("childrenDashboard.badges")}
                {modalData.type === "quizScores" && t("childrenDashboard.quizScores")}
              </h3>
              <ul className="space-y-2">
                {modalData.data.map((item) => (
                  <li key={item.lesson_id || item.id || item.slug} className="p-3 bg-gradient-to-r from-yellow-100 to-pink-100 rounded-xl shadow-inner flex justify-between items-center">
                    <span>{item.title || item.title_en || item.title_yo}</span>
                    {modalData.type === "lessons" && <ProgressBar value={item.quiz_count ? (item.quiz_score / item.quiz_count) * 100 : 0} theme={{ border: "border-purple-300", ring: "bg-purple-400" }} />}
                    {modalData.type === "badges" && <Chip className="bg-green-200 text-green-900">🏅</Chip>}
                    {modalData.type === "quizScores" && <span className="font-bold text-purple-800">{item.quiz_count ? `${item.quiz_score}/${item.quiz_count}` : t("childrenDashboard.noQuiz")}</span>}
                  </li>
                ))}
              </ul>
              <button className="mt-4 bg-purple-500 text-white px-6 py-2 rounded-full font-bold hover:brightness-110 transition-all" onClick={() => setModalData(null)}>
                {t("childrenDashboard.close")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
