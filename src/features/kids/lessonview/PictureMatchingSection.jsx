// src/features/kids/lessonview/PictureMatchingBlock.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { RefreshCcw, Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";
import supabase from "../../../supabaseClient";

export default function PictureMatchingBlock({ pairs = [], userId = null, onComplete }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  const pairsMap = useMemo(() => {
    const m = {};
    pairs.forEach((p) => (m[String(p.id)] = p));
    return m;
  }, [pairs]);

  const [pictureOrder, setPictureOrder] = useState([]);
  const [nameOrder, setNameOrder] = useState([]);
  const [matched, setMatched] = useState({});
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [confettiMap, setConfettiMap] = useState({});
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

  const [level, setLevel] = useState("easy");
  const [lives, setLives] = useState(3);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [funFactsOn, setFunFactsOn] = useState(true);
  const [showCompletedOverlay, setShowCompletedOverlay] = useState(false);
  const [showGameOverOverlay, setShowGameOverOverlay] = useState(false);

  const STORAGE_KEY = `pm-game-v1-default`;
  const LEADERBOARD_KEY = `pm-leaderboard-default`;

  // --- responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  // --- reset game
  const resetGame = ({ preserveScore = false } = {}) => {
    const ids = pairs.map((p) => String(p.id));
    setPictureOrder(shuffle(ids));
    setNameOrder(shuffle(ids));
    setMatched({});
    setSelectedPicture(null);
    setConfettiMap({});
    setStartedAt(Date.now());
    setElapsedMs(0);
    setRunning(true);
    setHintsRemaining(level === "easy" ? 5 : level === "medium" ? 3 : 1);
    setLives(level === "easy" ? 5 : level === "medium" ? 3 : 2);
    if (!preserveScore) setScore(0);
    setShowCompletedOverlay(false);
    setShowGameOverOverlay(false);
  };

  // --- load progress
  useEffect(() => {
    if (!pairs?.length) return;

    const init = async () => {
      if (userId) {
        try {
         const { data: prog, error } = await supabase
  .from("pm_progress")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(1)
  .single();

if (error) {
  console.warn("[PM] Load progress error:", error.message);
}

if (prog) {
  setPictureOrder(prog.picture_order ?? shuffle(pairs.map((p) => String(p.id))));
  setNameOrder(prog.name_order ?? shuffle(pairs.map((p) => String(p.id))));
  setMatched(prog.matched ?? {});
  setStartedAt(prog.started_at ? new Date(prog.started_at).getTime() : Date.now());
  setElapsedMs(prog.elapsed_ms ?? 0);
  setRunning(prog.status === "inprogress");
  setLives(prog.lives ?? (level === "easy" ? 5 : level === "medium" ? 3 : 2));
  setHintsRemaining(prog.hints_remaining ?? (level === "easy" ? 5 : level === "medium" ? 3 : 1));
  setLevel(prog.level ?? "easy");
  setScore(prog.score ?? 0);

  if (prog.status === "completed") setShowCompletedOverlay(true);
  else if (prog.status === "gameover") setShowGameOverOverlay(true);

  const { data: lb } = await supabase
    .from("pm_leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(10);

  setLeaderboard(lb ?? []);
  return;
}

        } catch {}
      }

      // fallback to localStorage
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved && saved.pairsHash === JSON.stringify(pairs.map((p) => p.id))) {
          setPictureOrder(saved.pictureOrder ?? shuffle(pairs.map((p) => String(p.id))));
          setNameOrder(saved.nameOrder ?? shuffle(pairs.map((p) => String(p.id))));
          setMatched(saved.matched ?? {});
          setStartedAt(saved.startedAt ?? Date.now());
          setElapsedMs(saved.elapsedMs ?? 0);
          setRunning(saved.running ?? true);
          setLives(saved.lives ?? 3);
          setHintsRemaining(saved.hintsRemaining ?? 3);
          setLevel(saved.level ?? "easy");
          setScore(saved.score ?? 0);
          setLeaderboard(JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]"));
          return;
        }
      } catch {}
      resetGame();
    };

    init();
  }, [pairs, userId]);

  // --- timer
  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - (startedAt || Date.now())), 250);
    return () => clearInterval(timerRef.current);
  }, [running, startedAt]);

  // --- save progress helper
  const toSaveLocal = () => ({
    pairsHash: JSON.stringify(pairs.map((p) => p.id)),
    pictureOrder,
    nameOrder,
    matched,
    startedAt,
    elapsedMs,
    running,
    lives,
    hintsRemaining,
    level,
    score,
    status: showCompletedOverlay ? "completed" : showGameOverOverlay ? "gameover" : "inprogress",
  });
const saveProgress = async (status = null) => {
  console.log("[PM] saveProgress called, userId:", userId);

  const currentStatus =
    status ??
    (showCompletedOverlay ? "completed" : showGameOverOverlay ? "gameover" : "inprogress");

  const payload = {
    user_id: userId,
    score,
    elapsed_ms: elapsedMs,
    level,
    matched,
    picture_order: pictureOrder,
    name_order: nameOrder,
    lives,
    hints_remaining: hintsRemaining,
    started_at: new Date(startedAt || Date.now()).toISOString(),
    status: currentStatus,
  };

  if (userId) {
    try {
      const { data, error } = await supabase
        .from("pm_progress")
        .insert(payload);

      if (error) {
        console.error("[PM] Supabase save error:", error.message, error.details);
      } else {
        console.log("[PM] Progress saved to Supabase:", data);
      }
    } catch (e) {
      console.error("[PM] Unexpected save error:", e);
    }
  } else {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSaveLocal()));
      console.log("[PM] Progress saved locally");
    } catch (e) {
      console.error("[PM] Failed local save:", e);
    }
  }
};

  // --- confetti
  const triggerConfetti = (id, node) => {
    const r = node?.getBoundingClientRect?.();
    if (!r) return;
    const width = Math.min(400, r.width || 200);
    const height = Math.min(400, r.height || 200);
    let t = 0;
    const interval = setInterval(() => {
      t += 200;
      setConfettiMap((m) => ({ ...m, [id]: { show: true, w: width, h: height } }));
      if (t >= 1600) {
        clearInterval(interval);
        setConfettiMap((m) => ({ ...m, [id]: { show: false } }));
      }
    }, 200);
  };

  // --- evaluate match
  const evaluateMatch = (picId, targetId, node) => {
    if (picId === targetId) {
      if (!matched[picId]) {
        setMatched((m) => {
          const next = { ...m, [picId]: true };
          saveProgress();
          return next;
        });
        triggerConfetti(picId, node);
        const timeBonus = Math.max(0, 5000 - (Date.now() - (startedAt || Date.now())) / (Object.keys(matched).length + 1));
        setScore((s) => s + 100 + Math.round(timeBonus / 50));
      }
      setSelectedPicture(null);
    } else {
      setLives((l) => {
        const nl = l - 1;
        if (nl <= 0) {
          setRunning(false);
          setShowGameOverOverlay(true);
          saveProgress("gameover");
        }
        return nl;
      });

      node?.animate(
        [
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 260 }
      );
    }
  };

  // --- handle drag / pick / tap (same as before)
  const handleDragEnd = (picId, e, info) => {
    const x = (info?.point?.x ?? e.clientX ?? 0) - window.scrollX;
    const y = (info?.point?.y ?? e.clientY ?? 0) - window.scrollY;
    const el = e.target;
    el.style.pointerEvents = "none";
    const targetEl = document.elementFromPoint(x, y)?.closest(".pm-target");
    el.style.pointerEvents = "";
    if (targetEl) evaluateMatch(String(picId), targetEl.dataset.pairId, targetEl);
  };

  const handlePickPicture = (pid) => {
    if (matched[pid]) return;
    setSelectedPicture((prev) => (prev === pid ? null : pid));
  };

  const handleTapTarget = (tid, node) => {
    if (!selectedPicture) return;
    evaluateMatch(selectedPicture, tid, node);
  };

  // --- hints
  const hint = () => {
    if (hintsRemaining <= 0) return;
    const unmatched = Object.keys(pairsMap).filter((id) => !matched[id]);
    if (!unmatched.length) return;
    const pick = unmatched[Math.floor(Math.random() * unmatched.length)];
    const node = containerRef.current?.querySelector(`.pm-target[data-pair-id="${pick}"]`);
    node?.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 700 });
    setHintsRemaining((h) => h - 1);
  };

  // --- keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setSelectedPicture(null);
      if (/^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        const pid = pictureOrder[idx];
        if (pid) handlePickPicture(pid);
      }
      if (e.key === "h") hint();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pictureOrder, hintsRemaining, matched]);

  // --- completion detection
  useEffect(() => {
    if (Object.keys(pairsMap).length && Object.keys(pairsMap).every((id) => matched[id])) {
      setRunning(false);
      setShowCompletedOverlay(true);

      const timeTaken = Math.round((Date.now() - (startedAt || Date.now())) / 1000);
      const entry = { score: score + Math.max(0, 1000 - timeTaken), time: timeTaken, date: new Date().toISOString(), user_id: userId ?? null };

      setLeaderboard((lb) => [entry, ...(lb || [])].slice(0, 10));
      saveProgress("completed");

      (async () => {
        if (userId) {
          try {
            await supabase.from("pm_leaderboard").insert({ user_id: userId, score: entry.score, time: entry.time });
          } catch (e) {
            console.error("[PM] Supabase leaderboard save error:", e);
          }
        } else {
          const lbLocal = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
          const next = [entry, ...lbLocal].slice(0, 10);
          localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
        }
      })();

      onComplete?.("completed");
    }
  }, [matched]);

  // --- render continues same as your original JSX
  const progressCount = Object.keys(matched).length;
  const progress = Math.round((progressCount / (pairs.length || 1)) * 100);
  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };
  const maybeFunFact = (id) => (funFactsOn ? pairsMap[id]?.fact ?? null : null);


  return (
    <div ref={containerRef} className="relative min-h-[60vh] max-w-6xl mx-auto p-4 md:p-6 rounded-2xl shadow-lg bg-gradient-to-br from-pink-50 via-yellow-50 to-purple-50">
      {/* Header */}
      
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 mb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-extrabold text-purple-800 flex items-center gap-3">
            <span aria-hidden>🎨</span>
            <span>{t("pm.title")}</span>
            <span className="text-sm text-purple-600 ml-2">{progressCount}/{pairs.length}</span>
          </h2>
          <div className="text-sm text-gray-600">{t("pm.instruction")}</div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={hint} disabled={hintsRemaining <= 0} className="px-3 py-1 rounded-xl bg-yellow-200 text-purple-800 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> {t("pm.hint")} ({hintsRemaining})
          </button>

          <button onClick={() => resetGame({ preserveScore: true })} className="px-3 py-1 rounded-xl bg-white text-purple-800 flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" /> {t("pm.reset")}
          </button>
        </div>
      </div>

      {/* Level & stats */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4 items-start md:items-center">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-semibold text-purple-700">{t("pm.level")}:</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-lg px-2 py-1 border">
            <option value="easy">{t("pm.easy")}</option>
            <option value="medium">{t("pm.medium")}</option>
            <option value="hard">{t("pm.hard")}</option>
          </select>

          <label className="text-sm font-semibold text-purple-700 ml-4">{t("pm.funfacts")}:</label>
          <input type="checkbox" checked={funFactsOn} onChange={(e) => setFunFactsOn(e.target.checked)} aria-label={t("pm.funfacts")} className="ml-1" />
        </div>

        <div className="flex items-center gap-3 text-green-600">
          <div className="text-sm">{t("pm.lives")}: <strong>{lives}</strong></div>
          <div className="text-sm">{t("pm.time")}: <strong>{formatTime(elapsedMs)}</strong></div>
          <div className="text-sm">{t("pm.score")}: <strong>{score}</strong></div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 bg-white/60 h-4 md:h-5 rounded-full shadow-inner overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
        </div>
        <span className="ml-3 text-purple-700 font-bold">{progress}%</span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pictures */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-purple-800 font-bold text-lg mb-3">{t("pm.pictures")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pictureOrder.map((pid, idx) => {
              const p = pairsMap[pid];
              const isMatched = matched[pid];
              if (!p) return <div key={pid}>{t("pm.no_image")}</div>;
              const img = p.image ?? p.img ?? p.image_url ?? p.src;
              return (
                <motion.div key={pid} drag={!isMobile && !isMatched} dragElastic={0.12} whileTap={{ scale: 0.95 }} whileHover={{ scale: isMatched ? 1 : 1.03 }}
                  onDragEnd={(e, info) => handleDragEnd(pid, e, info)}
                  onClick={() => handlePickPicture(pid)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedPicture === pid}
                  aria-label={`${t("pm.picture")} ${idx + 1} ${p.label}`}
                  className={`relative rounded-lg p-2 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 shadow-md cursor-pointer focus:outline-none ${selectedPicture === pid ? "ring-4 ring-emerald-300" : ""}`}>
                  <div className="w-full aspect-square grid place-items-center">
                    {img ? <img src={img} alt={p.label} className="max-h-full max-w-full object-contain rounded-md select-none" draggable={false} /> : <div>{t("pm.no_image")}</div>}
                    {isMatched && <div className="absolute inset-0 grid place-items-center bg-white/70 rounded-md text-purple-600 text-sm font-bold">✅ {t("pm.matched")}</div>}
                  </div>
                  <div className="absolute left-2 top-2 text-xs text-gray-600 bg-white/60 rounded-full px-2 py-1">{idx + 1}</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Targets */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-purple-800 font-bold text-lg mb-3">{t("pm.nameboxes")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {nameOrder.map((nid) => {
              const tpair = pairsMap[nid];
              if (!tpair) return null;
              const isMatched = matched[nid];
              const img = tpair.image ?? tpair.img ?? tpair.image_url ?? tpair.src;
              return (
                <div key={nid} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-purple-800">{tpair.label}</span>
                    {tpair.emoji && <span className="text-2xl">{tpair.emoji}</span>}
                  </div>
                  <motion.div data-pair-id={nid} className={`pm-target relative rounded-lg p-3 aspect-square grid place-items-center ${isMatched ? "bg-emerald-50 border-emerald-300" : "bg-white border-dashed border-purple-200"}`}
                    onClick={(e) => handleTapTarget(nid, e.currentTarget)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t("pm.target_label")} ${tpair.label}`}>
                    {confettiMap[nid]?.show && <Confetti width={confettiMap[nid].w} height={confettiMap[nid].h} recycle={false} numberOfPieces={100} gravity={0.35} />}
                    {isMatched ? (img ? <img src={img} alt={tpair.label} className="max-h-full max-w-full object-contain rounded-md" /> : <div className="text-green-600 font-bold">✅</div>) : <div className="text-sm text-purple-600">{selectedPicture ? t("pm.drop_here") : t("pm.tap_to_select")}</div>}
                    {maybeFunFact(nid) && <div className="absolute bottom-2 left-2 right-2 text-xs text-gray-600">{maybeFunFact(nid)}</div>}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* overlays */}
      <AnimatePresence>
        {showGameOverOverlay && (
          <motion.div className="absolute inset-0 bg-red-50/90 flex items-center justify-center z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="text-5xl mb-3">😵</div>
              <h3 className="text-2xl font-extrabold text-red-600">{t("pm.game_over")}</h3>
              <p className="mt-2 text-purple-700 font-medium">{t("pm.lost_lives")}</p>
              <div className="mt-5 flex justify-center gap-3">
                <button onClick={() => { resetGame(); setShowGameOverOverlay(false); }} className="px-5 py-2 rounded-full bg-purple-700 text-white font-semibold shadow">{t("pm.play_again")}</button>
                <button onClick={() => { setShowGameOverOverlay(false); onComplete?.("done"); }} className="px-5 py-2 rounded-full bg-white border border-purple-200 text-purple-700 font-semibold shadow">{t("pm.done")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCompletedOverlay && (
          <motion.div className="absolute inset-0 bg-yellow-50/90 flex items-center justify-center z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <div className="text-6xl mb-3 animate-bounce">🎉</div>
              <h3 className="text-3xl font-extrabold text-emerald-600">{t("pm.completed")}</h3>
              <p className="mt-2 text-purple-700 font-medium">{t("pm.completed_message")}</p>
              <div className="mt-5 flex justify-center gap-3">
                <button onClick={() => { resetGame(); setShowCompletedOverlay(false); }} className="px-5 py-2 rounded-full bg-purple-700 text-white font-semibold shadow animate-pulse">{t("pm.play_again")}</button>
                <button onClick={() => { setShowCompletedOverlay(false); onComplete?.("done"); }} className="px-5 py-2 rounded-full bg-white border border-purple-200 text-purple-700 font-semibold shadow">{t("pm.done")}</button>
              </div>
              <div className="mt-4 text-left">
                <div className="font-semibold">{t("pm.leaderboard")}</div>
                <ol className="mt-2 text-sm text-gray-700">
                  {leaderboard.map((e, i) => (
                    <li key={i} className="py-1">{i + 1}. {e.score} pts — {e.time}s</li>
                  ))}
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
