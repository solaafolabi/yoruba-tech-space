// src/pages/parents/Progress.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import supabase from "../../../supabaseClient";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Confetti from "react-confetti";



const COLORS = {
  primary: "#112240",
  primaryLight: "#0A192F",
  primaryDark: "#1B263B",
  accentBlue: "#3B82F6",
  accentYellow: "#FACC15",
  accentGreen: "#22C55E",
  accentPurple: "#A78BFA",
  bgStart: "#0A192F",
  bgEnd: "#1B263B",
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
        background: `${accentHex}10`,
        color: "#fff",
      }}
    >
      <div className="font-bold">{value}</div>
      <div className="opacity-90 text-xs">{label}</div>
    </div>
  );
}

function EmptyState({ text = "No data" }) {
  return (
    <div className="w-full h-[120px] grid place-items-center rounded-xl border border-dashed text-gray-300/90">
      {text}
    </div>
  );
}

export default function ParentProgress() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [childrenProgress, setChildrenProgress] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [query, setQuery] = useState("");
  const [quickRange, setQuickRange] = useState("30"); // "7" | "30" | "all"
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalChild, setModalChild] = useState(null);
  const [confettiOn, setConfettiOn] = useState(false);

  // Lazy loading
  const [pageSize] = useState(6);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const loaderRef = useRef(null);

  // Fetch the data (parent-specific)
  useEffect(() => {
    let mounted = true;
    async function fetchProgress() {
      try {
        setLoading(true);

        // get current user (parent)
        const { data: userRes } = await supabase.auth.getUser();
        const parentId = userRes?.user?.id || null;

        // children for this parent (fallback to all if parentId not present)
        let childQuery = supabase.from("children").select("*");
        if (parentId) childQuery = childQuery.eq("parent_id", parentId);
        const { data: childrenRaw, error: childrenErr } = await childQuery;
        if (childrenErr) throw childrenErr;
        const children = childrenRaw ?? [];

        // completed lessons (or lesson_progress)
        const { data: completedLessonsRaw } = await supabase.from("completed_lessons").select("*");
        const completedLessons = completedLessonsRaw ?? [];

        // quizzes and first attempts (for pass calc)
        const { data: quizzesRaw } = await supabase.from("quizzes").select("*");
        const quizzes = quizzesRaw ?? [];
        const { data: firstAttemptsRaw } = await supabase.from("first_attempts").select("*");
        const firstAttempts = firstAttemptsRaw ?? [];

        // badges
        const { data: badgesRaw } = await supabase.from("achievements").select("*");
        const badges = badgesRaw ?? [];

        // map first attempts by quiz_id
        const firstAttemptMap = {};
        firstAttempts.forEach((fa) => {
          if (fa?.quiz_id) firstAttemptMap[fa.quiz_id] = fa;
        });

        // aggregate per child
        const aggregated = children.map((child) => {
          const childLessons = completedLessons.filter((l) => l.child_id === child.id);

          // quizzes relevant to this child's completed lessons
          const childQuizzes = quizzes.filter((q) =>
            childLessons.some((cl) => cl.lesson_id === q.lesson_id)
          );

          const childBadges = badges.filter((b) => b.child_id === child.id);

          // recent 5 lessons with ratio of correct first-attempt answers (0..1)
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
              name: `L${idx + 1}`,
              completed: ratio,
              completed_at: l.completed_at || l.completedAt || l.completed_on || null,
            };
          });

          return {
            id: child.id,
            avatarUrl: child.avatar_url || null,
            name: child.full_name || child.username || t("progress.unnamedChild", "Unnamed"),
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

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((v) => Math.min(childrenProgress.length, v + pageSize));
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [childrenProgress.length, pageSize]);

  // compute date range from quickRange if custom not set
  useEffect(() => {
    if (quickRange === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const days = Number(quickRange || 30);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    // only set when user hasn't typed custom values
    setDateFrom((prev) => (prev ? prev : from.toISOString().slice(0, 10)));
    setDateTo((prev) => (prev ? prev : to.toISOString().slice(0, 10)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickRange]);

  // filtered by query + date range
  const filtered = useMemo(() => {
    let arr = [...childrenProgress];

    // search
    if (query?.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter((c) => (c.name || "").toLowerCase().includes(q));
    }

    // date range: include child if any recent lesson is within range
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

  // helper for opening modal with confetti
  const openModal = (child) => {
    setModalChild(child);
    setConfettiOn(true);
    // stop confetti after a while, keep it if parent clicks Make it rain
    setTimeout(() => setConfettiOn(false), 3000);
  };

  return (
    <div
        className="min-h-screen p-6 md:p-10 space-y-6"
  style={{
    background: `linear-gradient(180deg, ${COLORS.primaryLight}, ${COLORS.primary})`,
  }}
    >
      {/* Header & controls */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
       <div>
  <h1
    className="text-3xl md:text-4xl font-extrabold"
    style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.45)", lineHeight: "1.3" }}
  >
    {t("progress.title")}
  </h1>
<p
  className="text-sm mt-1"
  style={{ lineHeight: "1.8", color: "#FFD700" }}
>
  {t("progress.subtitle", "Search, filter by date, and click a child for details.")}
</p>

</div>
        <div className="flex gap-3 items-center">
          <input
            type="search"
            aria-label={t("progress.searchAria", "Search child name")}
            placeholder={t("progress.searchPlaceholder", "Search child name...")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(pageSize);
            }}
            className="px-4 py-2 rounded-xl border bg-white/6 text-black placeholder:text-gray-300"
            style={{ borderColor: `${COLORS.primaryDark}55` }}
          />

          {/* Quick date buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setQuickRange("7");
                setVisibleCount(pageSize);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                quickRange === "7" ? "text-white" : "text-gray-200/80"
              }`}
              style={{
                background: quickRange === "7" ? COLORS.accentBlue : "transparent",
                boxShadow: quickRange === "7" ? `0 6px 18px ${COLORS.accentBlue}33` : undefined,
              }}
            >
              {t("progress.last7", "7d")}
            </button>
            <button
              onClick={() => {
                setQuickRange("30");
                setVisibleCount(pageSize);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                quickRange === "30" ? "text-white" : "text-gray-200/80"
              }`}
              style={{
                background: quickRange === "30" ? COLORS.accentBlue : "transparent",
                boxShadow: quickRange === "30" ? `0 6px 18px ${COLORS.accentBlue}33` : undefined,
              }}
            >
              {t("progress.last30", "30d")}
            </button>
            <button
              onClick={() => {
                setQuickRange("all");
                setDateFrom("");
                setDateTo("");
                setVisibleCount(pageSize);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                quickRange === "all" ? "text-white" : "text-gray-200/80"
              }`}
              style={{
                background: quickRange === "all" ? COLORS.accentBlue : "transparent",
                boxShadow: quickRange === "all" ? `0 6px 18px ${COLORS.accentBlue}33` : undefined,
              }}
            >
              {t("progress.all", "All")}
            </button>
          </div>

          {/* Custom date pickers */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setQuickRange("custom");
              setVisibleCount(pageSize);
            }}
            className="px-3 py-2 rounded-xl border bg-white/6 text-white text-sm"
            title={t("progress.dateFrom", "From")}
            style={{ borderColor: `${COLORS.primaryDark}55` }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setQuickRange("custom");
              setVisibleCount(pageSize);
            }}
            className="px-3 py-2 rounded-xl border bg-white/6 text-white text-sm"
            title={t("progress.dateTo", "To")}
            style={{ borderColor: `${COLORS.primaryDark}55` }}
          />

          <button
            onClick={() => {
              setQuery("");
              setQuickRange("30");
              setDateFrom("");
              setDateTo("");
              setVisibleCount(pageSize);
            }}
            className="px-4 py-2 rounded-xl font-semibold"
            style={{
              background: `linear-gradient(90deg, ${COLORS.accentPurple}, ${COLORS.accentBlue})`,
              color: "#fff",
            }}
          >
            {t("progress.reset", "Reset")}
          </button>
        </div>
      </header>

      {/* Totals */}
     <div className="flex gap-3 flex-wrap">
  <div
    className="px-4 py-2 rounded-xl shadow-strong"
    style={{ background: "#FFD700", color: "#112240" }}
  >
    <span className="font-bold">{totalSummary.lessons}</span>{" "}
    {t("progress.lessons", "lessons")}
  </div>
  <div
    className="px-4 py-2 rounded-xl shadow-strong"
    style={{ background: "#FFD700", color: "#112240" }}
  >
    <span className="font-bold">{totalSummary.quizzes.passed}</span>/
    {totalSummary.quizzes.total} {t("progress.quizzes", "quizzes passed")}
  </div>
  <div
    className="px-4 py-2 rounded-xl shadow-strong"
    style={{ background: "#FFD700", color: "#112240" }}
  >
    <span className="font-bold">{totalSummary.badges}</span> {t("progress.badges", "badges")}
  </div>
</div>


      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl" style={{ background: `${COLORS.primaryLight}22` }} />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && visibleList.length === 0 && (
        <div className="text-gray-300 mt-6">{t("progress.noMatches", "No children match your filters.")}</div>
      )}

      {/* Children grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {visibleList.map((child, idx) => {
          const expanded = expandedId === child.id;
          const quizRate = child.quizzes.total ? Math.round((child.quizzes.passed / child.quizzes.total) * 100) : 0;

          return (
            <motion.div
              key={child.id}
              initial="hidden"
              animate="visible"
              custom={idx}
              variants={cardVariants}
              whileHover="hover"
              className="rounded-2xl overflow-hidden border"
              style={{
                borderColor: `${COLORS.primaryDark}55`,
                background: `linear-gradient(135deg, ${COLORS.accentPurple}22, ${COLORS.accentBlue}10)`,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              }}
            >
              <button
                className="w-full p-5 text-left flex gap-4 items-start"
                onClick={() => setExpandedId((p) => (p === child.id ? null : child.id))}
                aria-expanded={expanded}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{
                    background: `${COLORS.accentBlue}`,
                    color: "white",
                    boxShadow: `0 6px 18px ${COLORS.accentBlue}33`,
                  }}
                >
                  {child.name?.slice(0, 1)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold" style={{ color: "#fff" }}>
                      {child.name}
                    </h3>
                    <div
  className="px-3 py-1 text-sm rounded-full font-semibold"
  style={{
    background: "#FFD70022",
    color: "#FFD700",        
    border: `1px solid ${COLORS.primaryDark}33`,
  }}
>
  {expanded ? t("progress.hide", "Hide") : t("progress.view", "View")}
</div>

                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <StatPill label={t("progress.lessonsShort", "Lessons")} value={child.lessons.total} accentHex={COLORS.accentBlue} />
                    <StatPill label={t("progress.quizzesShort", "Quizzes")} value={`${child.quizzes.passed}/${child.quizzes.total}`} accentHex={COLORS.accentGreen} />
                    <StatPill label={t("progress.badgesShort", "Badges")} value={child.badges.total} accentHex={COLORS.accentYellow} />
                  </div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "tween", duration: 0.22 }}
                    className="p-4 border-t"
                    style={{ borderColor: `${COLORS.primaryDark}10`, background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lessons Chart */}
                      <div className="rounded-lg bg-white/95 p-3">
                        <h4 className="font-semibold mb-2" style={{ color: COLORS.primaryDark }}>
                          {t("progress.recentLessons", "Recent Lessons")}
                        </h4>
                        {child.lessons.recent.length ? (
                          <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={child.lessons.recent}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis hide domain={[0, 1]} />
                              <Tooltip formatter={(v) => `${Math.round((v || 0) * 100)}%`} />
                              <Bar dataKey="completed" radius={[6, 6, 0, 0]} fill={COLORS.accentGreen} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState text={t("progress.noRecentLessons", "No recent lessons")} />
                        )}
                      </div>

                      {/* Quizzes & badges */}
                      <div className="space-y-3">
                        <div className="rounded-lg p-3" style={{ background: `${COLORS.primaryLight}10` }}>
                         <h4 className="font-semibold mb-2" style={{ color: "#FFD700" }}>
  {t("progress.quizzes", "Quizzes")}
</h4>

                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="h-3 rounded-full bg-primaryDark/40 overflow-hidden">
                                <div
                                  className="h-3"
                                  style={{
                                    width: `${quizRate}%`,
                                    background: COLORS.accentGreen,
                                    transition: "width 600ms ease",
                                  }}
                                />
                              </div>
                              <p className="text-sm mt-2 text-gray-300">
                                {t("progress.passRate", "Pass rate")}: <strong>{quizRate}%</strong>
                              </p>
                            </div>
                            <div className="px-3 py-2 rounded-lg bg-primaryDark/60 text-white text-sm">
                              <strong>{child.quizzes.passed}</strong> / {child.quizzes.total}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg p-3" style={{ background: `${COLORS.primaryLight}10` }}>
                         <h4 className="font-semibold mb-2" style={{ color: "#FFD700" }}>
  {t("progress.badges", "Badges")}
</h4>

                          {child.badges.recent.length ? (
                            <div className="flex gap-2 flex-wrap">
                              {child.badges.recent.map((b, i) => (
                                <motion.div
                                  key={`${b.id || i}-${child.id}`}
                                  whileHover={{ y: -6 }}
                                  className="w-12 h-12 rounded-full bg-white grid place-items-center overflow-hidden border"
                                  style={{ borderColor: `${COLORS.primaryDark}20` }}
                                  title={b.title_en || b.title_yo || t("progress.badge", "Badge")}
                                >
                                  {b.icon_url ? (
                                    <img src={b.icon_url} alt={b.title_en || "badge"} className="w-full h-full object-cover" />
                                  ) : (
                                    <span style={{ fontSize: 18 }}>🏅</span>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <EmptyState text={t("progress.noBadges", "No badges yet")} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => openModal(child)}
                        className="px-4 py-2 rounded-full font-bold"
                        style={{
                          background: `linear-gradient(90deg, ${COLORS.accentPurple}, ${COLORS.accentBlue})`,
                          color: "#fff",
                        }}
                      >
                        {t("progress.openDetail", "Open detailed view")}
                      </button>

                      <button
                        onClick={() => {
                          setConfettiOn(true);
                          setTimeout(() => setConfettiOn(false), 1500);
                        }}
                        className="px-4 py-2 rounded-full"
                        style={{
                          background: `${COLORS.primaryDark}30`,
                          color: "#fff",
                        }}
                      >
                        {t("progress.makeItRain", "Make it rain")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* loader sentinel for infinite scroll */}
      <div ref={loaderRef} className="h-8" />

      {/* load more fallback button */}
      {!loading && visibleCount < filteredLength(childrenProgress, query, dateFrom, dateTo) && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setVisibleCount((v) => Math.min(childrenProgress.length, v + pageSize))}
            className="px-6 py-2 rounded-full font-bold"
            style={{ background: COLORS.accentBlue, color: "#fff" }}
          >
            {t("progress.loadMore", "Load more")}
          </button>
        </div>
      )}

      {/* modal detailed child view with confetti rain */}
      <AnimatePresence>
        {modalChild && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setModalChild(null);
              setConfettiOn(false);
            }}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {confettiOn && (
                <Confetti
                  width={window.innerWidth}
                  height={window.innerHeight}
                  recycle={true}
                  numberOfPieces={120}
                  gravity={0.6}
                  colors={[COLORS.accentYellow, COLORS.accentGreen, COLORS.accentBlue, COLORS.accentPurple]}
                />
              )}

              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{modalChild.name}</h2>
                  <p className="text-sm text-gray-500">{t("progress.detailedProgress", "Detailed progress")}</p>
                </div>
                <button
                  onClick={() => {
                    setModalChild(null);
                    setConfettiOn(false);
                  }}
                  className="px-3 py-1 rounded-full bg-primaryDark/10 text-primaryDark"
                >
                  {t("progress.close", "Close")}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-3 bg-gray-50">
                  <h4 className="font-semibold mb-2">{t("progress.lessonsLast", "Lessons (recent)")}</h4>
                  {modalChild.lessons.recent.length ? (
                    <ul className="space-y-2">
                      {modalChild.lessons.recent.map((r, i) => (
                        <li key={i} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                          <span>{r.name}</span>
                          <span className="text-sm text-gray-600">{Math.round((r.completed || 0) * 100)}%</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState text={t("progress.noRecentLessons", "No recent lessons")} />
                  )}
                </div>

                <div className="rounded-xl p-3 bg-gray-50">
                  <h4 className="font-semibold mb-2">{t("progress.quizzesBadges", "Quizzes & Badges")}</h4>
                  <p className="mb-2">
                    {t("progress.quizzesPassed", "Quizzes passed")}:
                    <strong> {modalChild.quizzes.passed}</strong> / {modalChild.quizzes.total}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {modalChild.badges.recent.length ? (
                      modalChild.badges.recent.map((b, i) => (
                        <div key={i} className="w-12 h-12 rounded-full overflow-hidden border">
                          {b.icon_url ? (
                            <img src={b.icon_url} alt={b.title_en || "badge"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="grid place-items-center h-full">🏅</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <EmptyState text={t("progress.noBadgesYet", "No badges yet")} />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* helpers */
function filteredLength(childrenProgress, query, dateFrom, dateTo) {
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
  return arr.length;
}
