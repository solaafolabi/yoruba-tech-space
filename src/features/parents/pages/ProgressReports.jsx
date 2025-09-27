// src/pages/parents/Progress.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import supabase from "../../../supabaseClient";

const COLORS = {
  primary: "#112240",
  primaryLight: "#0A192F",
  primaryDark: "#1B263B",
  accentBlue: "#3B82F6",
  accentYellow: "#FACC15",
  accentGreen: "#22C55E",
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, type: "spring", stiffness: 140, damping: 16 },
  }),
  hover: { scale: 1.02 },
};

function StatPill({ label, value, accentHex }) {
  return (
    <div
      className="px-3 py-2 rounded-xl border text-center shadow-inner text-sm"
      style={{
        borderColor: `${accentHex}33`,
        background: `${accentHex}20`,
        color: "#fff",
      }}
    >
      <div className="font-bold">{value}</div>
      <div className="opacity-90 text-xs">{label}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="w-full h-[120px] grid place-items-center rounded-xl border border-dashed text-gray-400">
      {text}
    </div>
  );
}

export default function ParentProgress() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [childrenProgress, setChildrenProgress] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize] = useState(6);
  const [visibleCount] = useState(pageSize);
  const loaderRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function fetchProgress() {
      try {
        setLoading(true);
        const { data: userRes } = await supabase.auth.getUser();
        const parentId = userRes?.user?.id || null;

        let childQuery = supabase.from("children").select("*");
        if (parentId) childQuery = childQuery.eq("parent_id", parentId);
        const { data: childrenRaw, error: childrenErr } = await childQuery;
        if (childrenErr) throw childrenErr;
        const children = childrenRaw ?? [];

        const { data: completedLessonsRaw } = await supabase.from("completed_lessons").select("*");
        const completedLessons = completedLessonsRaw ?? [];

        const { data: quizzesRaw } = await supabase.from("quizzes").select("*");
        const quizzes = quizzesRaw ?? [];

        const { data: firstAttemptsRaw } = await supabase.from("first_attempts").select("*");
        const firstAttempts = firstAttemptsRaw ?? [];

        const { data: badgesRaw } = await supabase.from("achievements").select("*");
        const badges = badgesRaw ?? [];

        const firstAttemptMap = {};
        firstAttempts.forEach((fa) => {
          if (fa?.quiz_id) firstAttemptMap[fa.quiz_id] = fa;
        });

        const aggregated = children.map((child) => {
          const childLessons = completedLessons.filter((l) => l.child_id === child.id);
          const childQuizzes = quizzes.filter((q) =>
            childLessons.some((cl) => cl.lesson_id === q.lesson_id)
          );
          const childBadges = badges.filter((b) => b.child_id === child.id);

          let totalPassed = 0;
          const recent = childLessons.slice(-10).map((l, idx) => {
            const lessonQuizzes = childQuizzes.filter((q) => q.lesson_id === l.lesson_id);
            let correctCount = 0;
            lessonQuizzes.forEach((q) => {
              const fa = firstAttemptMap[q.id];
              const sel = fa?.selected_answer?.trim()?.toLowerCase();
              const correct = q?.correct_answer_en?.trim()?.toLowerCase();
              if (sel && correct && sel === correct) correctCount++;
            });
            totalPassed += correctCount;
            const ratio = lessonQuizzes.length ? correctCount / lessonQuizzes.length : 0;
            return {
              name: `${t("progress.lesson")} ${idx + 1}`,
              completed: ratio,
              completed_at: l.completed_at || null,
            };
          });

          return {
            id: child.id,
            avatarUrl: child.avatar_url || null,
            name: child.full_name || child.username || t("progress.unnamedChild"),
            lessons: { total: childLessons.length, recent },
            quizzes: { total: childQuizzes.length, passed: totalPassed },
            badges: { total: childBadges.length, recent: childBadges.slice(-6) },
          };
        });

        if (!mounted) return;
        setChildrenProgress(aggregated);
      } catch (err) {
        console.error("Parent Progress fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProgress();
    return () => {
      mounted = false;
    };
  }, [t]);

  const filtered = useMemo(() => {
    let arr = [...childrenProgress];
    if (query?.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter((c) => (c.name || "").toLowerCase().includes(q));
    }
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      arr = arr.filter((c) => {
        if (!c.lessons?.recent?.length) return false;
        return c.lessons.recent.some((r) => {
          if (!r.completed_at) return false;
          const dt = new Date(r.completed_at);
          if (from && dt < from) return false;
          if (to && dt > to) return false;
          return true;
        });
      });
    }
    return arr;
  }, [childrenProgress, query, dateFrom, dateTo]);

  const visibleList = filtered.slice(0, visibleCount);

  const totalSummary = useMemo(() => {
    return filtered.reduce(
      (acc, c) => {
        acc.lessons += c.lessons.total;
        acc.quizzes.total += c.quizzes.total;
        acc.quizzes.passed += c.quizzes.passed;
        acc.badges += c.badges.total;
        return acc;
      },
      { lessons: 0, quizzes: { total: 0, passed: 0 }, badges: 0 }
    );
  }, [filtered]);

  return (
<div className="min-h-screen p-4 md:p-8 space-y-6 bg-gradient-to-b from-[#112240] to-[#0B1C3D]">
  <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
    <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            {t("progress.title")}
          </h1>
          <p className="text-sm mt-1 text-yellow-400">{t("progress.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="search"
            placeholder={t("progress.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-3 py-2 rounded-xl border bg-white/90 text-black placeholder:text-gray-500"
          />
        </div>
      </header>

      <div className="flex gap-3 flex-wrap">
        <StatPill label={t("progress.lessonsShort")} value={totalSummary.lessons} accentHex={COLORS.accentBlue} />
        <StatPill label={t("progress.quizzesShort")} value={`${totalSummary.quizzes.passed}/${totalSummary.quizzes.total}`} accentHex={COLORS.accentGreen} />
        <StatPill label={t("progress.badgesShort")} value={totalSummary.badges} accentHex={COLORS.accentYellow} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {visibleList.map((child, idx) => {
          const expanded = expandedId === child.id;

          return (
            <motion.div
              key={child.id}
              initial="hidden"
              animate="visible"
              custom={idx}
              variants={cardVariants}
              whileHover="hover"
              className="rounded-2xl overflow-hidden border bg-primaryLight border-primaryDark/50"
            >
              <button
                className="w-full p-4 flex gap-3 items-center text-left"
                onClick={() => setExpandedId(expanded ? null : child.id)}
              >
                {child.avatarUrl ? (
                  <img
                    src={child.avatarUrl}
                    alt={child.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {child.name?.slice(0, 1)}
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-white font-bold">{child.name}</h3>
                  <div className="flex gap-2 mt-1 text-xs text-gray-300">
                    <span>{t("progress.lessons")}: {child.lessons.total}</span>
                    <span>{t("progress.quizzes")}: {child.quizzes.passed}/{child.quizzes.total}</span>
                    <span>{t("progress.badges")}: {child.badges.total}</span>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3 border-t border-gray-700 bg-gray-900"
                  >
                    {/* Tabs */}
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {["lessons", "quizzes", "badges"].map((tab) => (
                        <button
                          key={tab}
                          className={`px-3 py-1 rounded-full text-sm ${
                            activeTab[child.id] === tab ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                          }`}
                          onClick={() => setActiveTab((p) => ({ ...p, [child.id]: tab }))}
                        >
                          {t(`progress.${tab}`)}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div>
                      {activeTab[child.id] === "lessons" && (
                        <div className="space-y-2">
                          {child.lessons.recent.length ? (
                            child.lessons.recent.map((l, i) => (
                              <div key={i} className="flex justify-between bg-gray-800 p-2 rounded text-white">
                                <span>{l.name}</span>
                                <span>{Math.round((l.completed || 0) * 100)}%</span>
                              </div>
                            ))
                          ) : (
                            <EmptyState text={t("progress.noLessons")} />
                          )}
                        </div>
                      )}
                      {activeTab[child.id] === "quizzes" && (
                        <div className="space-y-2">
                          {child.quizzes.total ? (
                            <div className="flex justify-between bg-gray-800 p-2 rounded text-white">
                              <span>{t("progress.totalQuizzes")}</span>
                              <span>{child.quizzes.passed}/{child.quizzes.total}</span>
                            </div>
                          ) : (
                            <EmptyState text={t("progress.noQuizzes")} />
                          )}
                        </div>
                      )}
                      {activeTab[child.id] === "badges" && (
                        <div className="flex flex-wrap gap-2">
                          {child.badges.recent.length ? (
                            child.badges.recent.map((b, i) => (
                              <div
                                key={i}
                                className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold"
                                title={b.title || t("progress.badge")}
                              >
                                {b.title?.slice(0, 2)}
                              </div>
                            ))
                          ) : (
                            <EmptyState text={t("progress.noBadges")} />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
