// src/features/kids/ui-utils.js
import React, { useRef } from "react";
import supabase from "../../../supabaseClient";

/***************************
 * THEME & STYLE UTILITIES *
 ***************************/
export const AGE_UI = {
  "4-7": {
    bg: "bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100",
    card: "bg-amber-50",
    text: "text-amber-950",
    border: "border-amber-300",
    ring: "ring-amber-300",
    accent: "text-orange-600",
    chip: "bg-orange-200 text-orange-900",
    gradientTitle: "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500",
    shadow: "shadow-[0_10px_30px_rgba(253,186,116,0.45)]",
  },
  "8-10": {
    bg: "bg-gradient-to-br from-pink-100 via-rose-100 to-fuchsia-100",
    card: "bg-pink-50",
    text: "text-rose-950",
    border: "border-pink-300",
    ring: "ring-pink-300",
    accent: "text-fuchsia-600",
    chip: "bg-fuchsia-200 text-fuchsia-900",
    gradientTitle: "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500",
    shadow: "shadow-[0_10px_30px_rgba(244,114,182,0.45)]",
  },
  "11-12": {
    bg: "bg-gradient-to-br from-blue-100 via-sky-100 to-cyan-100",
    card: "bg-sky-50",
    text: "text-sky-950",
    border: "border-sky-300",
    ring: "ring-sky-300",
    accent: "text-cyan-600",
    chip: "bg-cyan-200 text-cyan-900",
    gradientTitle: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500",
    shadow: "shadow-[0_10px_30px_rgba(125,211,252,0.45)]",
  },
  "13-15": {
    bg: "bg-gradient-to-br from-purple-100 via-violet-100 to-indigo-100",
    card: "bg-violet-50",
    text: "text-indigo-950",
    border: "border-violet-300",
    ring: "ring-violet-300",
    accent: "text-indigo-600",
    chip: "bg-violet-200 text-violet-900",
    gradientTitle: "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500",
    shadow: "shadow-[0_10px_30px_rgba(196,181,253,0.45)]",
  },
};

export const cx = (...classes) => classes.filter(Boolean).join(" ");
export const getWindowSize = () => ({
  width: typeof window !== "undefined" ? window.innerWidth : 1024,
  height: typeof window !== "undefined" ? window.innerHeight : 768,
});

/************************
 * MINI UI SUBCOMPONENTS *
 ************************/
export const Chip = ({ children, className = "" }) => (
  <span
    className={cx(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold tracking-wide",
      className
    )}
  >
    {children}
  </span>
);

export const FloatCard = ({ children, className = "", borderClass = "", onClick }) => (
  <div
    onClick={onClick}
    className={cx(
      "relative p-4 sm:p-6 rounded-3xl transition-all duration-300 ease-out",
      "hover:shadow-xl hover:-translate-y-0.5",
      borderClass,
      className
    )}
    style={{ animation: "popIn 540ms ease-out both" }}
  >
    {children}
  </div>
);

export const GradientTitle = ({ text, gradientClass }) => (
  <h1
    className={cx(
      "text-3xl sm:text-4xl md:text-5xl font-black text-center leading-tight",
      "drop-shadow-md bg-clip-text text-transparent",
      gradientClass
    )}
    style={{ animation: "bounceIn 800ms ease-out both" }}
  >
    {text}
  </h1>
);

export const ProgressBar = ({ value = 0, theme }) => (
  <div
    className={cx(
      "w-full h-4 rounded-full overflow-hidden",
      theme.border,
      "border bg-white/70"
    )}
    aria-label="Lesson progress"
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(value)}
  >
    <div
      className={cx("h-full transition-all", theme.ring)}
      style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,.4) 0, transparent 50%, rgba(0,0,0,.1) 100%)",
        backgroundColor: "rgba(34,197,94,0.9)",
      }}
    />
  </div>
);

export const SoundButton = ({ label = "Play", src, onMissing }) => {
  const audioRef = useRef(null);
  const play = () => {
    try {
      if (!src) {
        onMissing?.();
        return;
      }
      if (!audioRef.current) audioRef.current = new Audio(src);
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } catch {}
  };
  return (
    <button
      onClick={play}
      className={cx(
        "px-3 py-1.5 rounded-xl text-xs font-bold",
        "bg-white text-gray-900 border border-black/10 shadow-sm hover:shadow",
        "active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-offset-2"
      )}
      title={label}
      aria-label={label}
      type="button"
    >
      🎵 {label}
    </button>
  );
};

export const SpeakButton = ({ text, theme }) => {
  const speak = () => {
    try {
      if (!window.speechSynthesis) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.lang = navigator.language?.startsWith("yo") ? "yo-NG" : "en-US";

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(v => v.lang === utter.lang) ||
        voices.find(v => v.lang.startsWith("en")) ||
        voices[0];
      if (preferred) utter.voice = preferred;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  return (
    <button
      onClick={speak}
      className={cx(
        "px-3 py-1.5 rounded-xl text-xs font-extrabold",
        theme.chip,
        "border border-black/10 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
      )}
      type="button"
      aria-label="Read aloud"
      title="Read aloud"
    >
      🗣️ Read Aloud
    </button>
  );
};

export const QuizOptionButton = ({ label, isSelected, isCorrect, locked, onClick }) => (
  <button
    onClick={onClick}
    disabled={locked}
    className={cx(
      "w-full text-left px-4 py-3 rounded-2xl font-bold transition-all border",
      locked
        ? "opacity-90 cursor-not-allowed"
        : "hover:-translate-y-[1px] hover:shadow-md",
      isSelected && !isCorrect && "bg-red-400 text-white border-red-500",
      isSelected && isCorrect && "bg-green-500 text-white border-green-600",
      !isSelected && "bg-white text-gray-900 border-black/10"
    )}
  >
    {label}
  </button>
);

/************************
 * BADGES / PROGRESS LOGIC
 ************************/

export async function recordAttempt(userId, lessonId, score, total) {
  try {
    const { error } = await supabase.from("lesson_attempts").insert([
      {
        user_id: userId,
        lesson_id: lessonId,
        score,
        total,
        attempted_at: new Date(),
      },
    ]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("recordAttempt error:", err);
    return false;
  }
}

export async function markLessonComplete(userId, lessonId) {
  try {
    const { error } = await supabase.from("lesson_progress").upsert([
      {
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date(),
      },
    ]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("markLessonComplete error:", err);
    return false;
  }
}

export async function awardBadge(userId, { lesson_id, score, total }) {
  try {
    const { error } = await supabase.from("badges").insert([
      {
        user_id: userId,
        lesson_id,
        score,
        total,
        awarded_at: new Date(),
      },
    ]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("awardBadge error:", err);
    return false;
  }
}

export async function fetchBadges(userId) {
  try {
    const { data, error } = await supabase
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("fetchBadges error:", err);
    return [];
  }
}

export async function fetchProgress(userId) {
  try {
    const { data, error } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("fetchProgress error:", err);
    return [];
  }
}
