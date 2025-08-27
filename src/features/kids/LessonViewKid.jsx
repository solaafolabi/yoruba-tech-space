// src/features/kids/LessonViewKid.jsx
// FULL REWRITE — "MAD" kid-friendly lesson view with:
// - Per-question confetti (positioned over each quiz card)
// - Submit ➜ mark lesson completed in DB + local UI tick ➜ award badge ➜ redirect to dashboard
// - Sidebar tick support via completed_lessons + localStorage + a window event
// - Badge modal feedback after each submission
// - No new npm deps beyond your stack (react-confetti, syntax highlighter, supabase, i18n)
// - Careful ARIA + mobile-friendly tweaks

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import ChildrenDashboardLayout from "./ChildrenDashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import htmlLang from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useTranslation } from "react-i18next";
import Confetti from "react-confetti";

// Register syntax highlighter languages
SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("html", htmlLang);
SyntaxHighlighter.registerLanguage("css", css);

/***************************
 * THEME & STYLE UTILITIES *
 ***************************/
const AGE_UI = {
  "4-7": {
    bg: "bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100",
    card: "bg-amber-50",
    text: "text-amber-950",
    border: "border-amber-300",
    ring: "ring-amber-300",
    accent: "text-orange-600",
    chip: "bg-orange-200 text-orange-900",
    gradientTitle:
      "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500",
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
    gradientTitle:
      "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500",
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
    gradientTitle:
      "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500",
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
    gradientTitle:
      "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500",
    shadow: "shadow-[0_10px_30px_rgba(196,181,253,0.45)]",
  },
};

const cx = (...classes) => classes.filter(Boolean).join(" ");
const getWindowSize = () => ({
  width: typeof window !== "undefined" ? window.innerWidth : 1024,
  height: typeof window !== "undefined" ? window.innerHeight : 768,
});

/************************
 * MINI UI SUBCOMPONENTS *
 ************************/
const Chip = ({ children, className = "" }) => (
  <span
    className={cx(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold tracking-wide",
      className
    )}
  >
    {children}
  </span>
);

const FloatCard = ({ children, className = "", borderClass = "", onClick }) => (
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

const GradientTitle = ({ text, gradientClass }) => (
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

const ProgressBar = ({ value = 0, theme }) => (
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

const SoundButton = ({ label = "Play", src, onMissing }) => {
  const audioRef = useRef(null);
  const play = () => {
    if (!src) {
      onMissing?.();
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    }
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } catch (e) {}
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

const SpeakButton = ({ text, theme }) => {
  const speak = () => {
    try {
      if (!window.speechSynthesis) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.lang = navigator.language?.startsWith("yo") ? "yo-NG" : "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {}
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

const QuizOptionButton = ({ label, isSelected, isCorrect, locked, onClick }) => (
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

/*************************
 * MAIN LESSON COMPONENT *
 *************************/

const LessonViewKid = () => {
  const { lessonSlug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [lesson, setLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [targetAudience, setTargetAudience] = useState("4-7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [firstAttempts, setFirstAttempts] = useState({});


  // Auth + child
  const userIdRef = useRef(null);
  const childIdRef = useRef(null);

  const language = i18n.language?.startsWith("yo") ? "yo" : "en";
  const theme = AGE_UI[targetAudience] || AGE_UI["4-7"];

  // Confetti overlays per-question
  // Map of quizId -> { rect: {left, top, width, height}, show: boolean }
  const [confettiMap, setConfettiMap] = useState({});
  const quizRefs = useRef({}); // quizId -> ref

  const [viewport, setViewport] = useState(getWindowSize());
  useEffect(() => {
    const onResize = () => setViewport(getWindowSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Measure quiz card rects after render
  const measureQuizRects = useCallback(() => {
    const next = {};
    quizzes.forEach((q) => {
      const el = quizRefs.current[q.id];
      if (el) {
        const r = el.getBoundingClientRect();
        next[q.id] = {
          rect: { left: r.left, top: r.top, width: r.width, height: r.height },
          show: false,
        };
      }
    });
    setConfettiMap((old) => ({ ...old, ...next }));
  }, [quizzes]);

  useLayoutEffect(() => {
    measureQuizRects();
  }, [measureQuizRects, viewport.width, viewport.height]);

  // Fetch lesson + quizzes + child
 useEffect(() => {
  const fetchLesson = async () => {
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Get the logged-in user
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) console.warn("auth.getUser error", userErr);
      if (!userData?.user) {
        setError("Please sign in to view this lesson.");
        setLoading(false);
        return;
      }
      const userId = userData.user.id;
      userIdRef.current = userId;

        // Load child for age range + id
        const { data: child, error: childErr } = await supabase
          .from("children")
          .select("id, age_range")
          .eq("user_id", userId)
          .maybeSingle();

        if (childErr) console.warn("children select error", childErr);
        if (child?.age_range) setTargetAudience(child.age_range);
        if (child?.id) childIdRef.current = child.id;

        if (!lessonSlug) {
          setError("No lesson selected. Go back and choose a lesson.");
          setLoading(false);
          return;
        }

        const { data: lessonData, error: lessonErr } = await supabase
          .from("lessons")
          .select(
            "id, title_en, title_yo, description_en, description_yo, content_blocks, file_url_en, file_url_yo"
          )
          .eq("slug", lessonSlug)
          .maybeSingle();

        if (lessonErr || !lessonData) {
          setError("We couldn't find this lesson. Try another one.");
          setLoading(false);
          return;
        }

        const contentBlocks =
          typeof lessonData.content_blocks === "string"
            ? JSON.parse(lessonData.content_blocks)
            : lessonData.content_blocks || [];

        setLesson({ ...lessonData, content_blocks: contentBlocks });

        // Load quizzes
        const { data: quizData, error: quizErr } = await supabase
          .from("quizzes")
          .select("*")
          .eq("lesson_id", lessonData.id);
        if (quizErr) console.warn("quizzes error", quizErr);

        const localized = (quizData || []).map((q) => ({
          ...q,
          question: language === "yo" ? q.question_yo : q.question_en,
          options: language === "yo" ? q.options_yo : q.options_en,
          correct_answer:
            language === "yo" ? q.correct_answer_yo : q.correct_answer_en,
        }));
        setQuizzes(localized);
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading this lesson.");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonSlug, language]);

// 1️⃣ Define triggerConfettiOnQuiz first
const triggerConfettiOnQuiz = useCallback((quizId, ms = 1500) => {
  setConfettiMap((prev) => {
    const next = { ...prev };
    if (!next[quizId] || !next[quizId].rect) return prev; // not measured yet
    next[quizId] = { ...next[quizId], show: true };
    return next;
  });
  setTimeout(() => {
    setConfettiMap((prev) => {
      if (!prev[quizId]) return prev;
      return { ...prev, [quizId]: { ...prev[quizId], show: false } };
    });
  }, ms);
}, []);

// 2️⃣ Then define handleAnswer after it
const handleAnswer = useCallback(
  async (quizId, selected) => {
    setAnswers(prev => ({ ...prev, [quizId]: selected }));

    const childId = childIdRef.current;
    if (!childId) return;

    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const correctAnswer = (i18n.language.startsWith("yo")
      ? (quiz.correct_answer_yo || "").trim().toLowerCase()
      : (quiz.correct_answer_en || "").trim().toLowerCase()
    );
    const isCorrect = (selected || "").trim().toLowerCase() === correctAnswer;

    try {
      const { data: existing } = await supabase
        .from("first_attempts")
        .select("*")
        .eq("child_id", childId)
        .eq("quiz_id", quizId)
        .limit(1)
        .single();

      if (!existing) {
        await supabase.from("first_attempts").insert([{
          child_id: childId,
          quiz_id: quizId,
          selected_answer: selected,
          is_correct: isCorrect,
          created_at: new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.error("Error saving first attempt:", err);
    }

    setFeedback(prev => ({ ...prev, [quizId]: isCorrect ? "correct" : "incorrect" }));
    if (isCorrect) triggerConfettiOnQuiz(quizId, 1200);

    const soundPath = (type) =>
      i18n.language.startsWith("yo")
        ? `/sounds/${type}-yo.mp3`
        : `/sounds/${type}-en.mp3`;
    try { new Audio(soundPath(isCorrect ? "correct" : "wrong")).play(); } catch {}
  },
  [quizzes, i18n.language, triggerConfettiOnQuiz]
);

useEffect(() => {
  const loadFirstAttempts = async () => {
    const childId = childIdRef.current;
    if (!childId || quizzes.length === 0) return;

    const { data: attempts } = await supabase
      .from("first_attempts")
      .select("*")
      .eq("child_id", childId)
      .in("quiz_id", quizzes.map(q => q.id));

    if (attempts) {
      const map = {};
      attempts.forEach(a => { map[a.quiz_id] = a; });
      setFirstAttempts(map);
    }
  };
  loadFirstAttempts();
}, [quizzes]);


  // Submit: validate ➜ mark completed ➜ award badge ➜ redirect
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeInfo, setBadgeInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

 const handleSubmit = useCallback(async () => {
  if (submitting) return;
  if (quizzes.length === 0) return;

  const total = quizzes.length;
  const answeredCount = quizzes.filter(q => answers[q.id] != null).length;

  if (answeredCount < total) {
    setShowIncompleteModal(true);
    return;
  }

  setSubmitting(true);
  try {
    // Burst confetti on all correctly-answered cards (current selection)
    quizzes.forEach(q => {
      const selected = answers[q.id];
      const correctAnswer = (i18n.language.startsWith("yo")
        ? (q.correct_answer_yo || "").trim().toLowerCase()
        : (q.correct_answer_en || "").trim().toLowerCase()
      );
      if ((selected || "").trim().toLowerCase() === correctAnswer) {
        triggerConfettiOnQuiz(q.id, 1500);
      }
    });

    // Compute correct count based on current selections
    const correctCount = quizzes.reduce((acc, q) => {
      const selected = answers[q.id];
      if (!selected) return acc;

      const correctAnswer = (i18n.language.startsWith("yo")
        ? (q.correct_answer_yo || "").trim().toLowerCase()
        : (q.correct_answer_en || "").trim().toLowerCase()
      );

      const isCorrect = (selected || "").trim().toLowerCase() === correctAnswer;
      return acc + (isCorrect ? 1 : 0);
    }, 0);

    const lessonId = lesson?.id;
    const childId = childIdRef.current;

    // Mark lesson as completed in DB
    if (childId && lessonId) {
      await supabase.from("completed_lessons").upsert(
        [{
          child_id: childId,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
          slug: lessonSlug,
        }],
        { onConflict: "child_id,lesson_id" }
      );
    }

    // Local progress for instant Sidebar tick
    localStorage.setItem(`${lessonSlug}_completed`, "true");
    window.dispatchEvent(
      new CustomEvent("lessonCompleted", { detail: { lessonId: String(lessonId), slug: lessonSlug } })
    );

    // Award badge
    const earnedBadge = {
      title_en: "Lesson Champion",
      title_yo: "Akin Ẹkọ",
      description_en: "Completed a lesson quiz!",
      description_yo: "Pari idanwo ẹkọ kan!",
      icon_url: "/badges/lesson-champion.png",
    };
    if (childId) await awardBadgeIfNeeded(childId, lessonId, earnedBadge);

    setBadgeInfo({ ...earnedBadge, score: correctCount, total });
    setShowBadgeModal(true);

    // Redirect after celebration
    setTimeout(() => navigate("/kids/dashboard"), 2000);
  } catch (err) {
    console.error(err);
    setError("We couldn't submit your answers. Please try again.");
  } finally {
    setSubmitting(false);
  }
}, [answers, quizzes, lesson?.id, lessonSlug, navigate, triggerConfettiOnQuiz, submitting]);


  // Helper to award badge if not already awarded for this lesson
  const awardBadgeIfNeeded = useCallback(
    async (childId, lessonId, badge) => {
      try {
        // try read if you maintain link via achievements table keyed by (child_id, lesson_id, key)
        const key = `lesson_${lessonId || "na"}_submission`;
        // If your schema has a dedicated badges table, adapt accordingly.

        // Attempt: see if an achievement with this key exists
        const { data: existing, error: selErr } = await supabase
          .from("achievements")
          .select("id")
          .eq("child_id", childId)
          .eq("key", key)
          .limit(1);
        if (!selErr && existing && existing.length > 0) return; // already awarded

        const payload = {
          child_id: childId,
          lesson_id: lessonId,
          key, // ensure you add a unique index on (child_id, key) if possible
          title_en: badge.title_en,
          title_yo: badge.title_yo,
          description_en: badge.description_en,
          description_yo: badge.description_yo,
          icon_url: badge.icon_url,
          earned_at: new Date().toISOString(),
        };

        const { error: insErr } = await supabase.from("achievements").insert(payload);
        if (insErr) console.warn("achievements insert error", insErr);
      } catch (e) {
        console.warn("awardBadgeIfNeeded error", e);
      }
    },
    []
  );


  const hasFirstAttempt = useMemo(() => {
    
  // Returns true if at least one quiz has a recorded first attempt
  return quizzes.some((q) => firstAttempts[q.id] != null);
}, [quizzes, firstAttempts]);

  const quizProgress = useMemo(() => {
  if (!quizzes?.length) return 0;

  const answered = quizzes.filter(q => answers[q.id] != null).length;

  return Math.min(100, Math.round((answered / quizzes.length) * 100));
}, [quizzes, answers]);


  // Render blocks
  const renderBlock = useCallback(
    (block, i) => {
      const key = `block-${i}-${block?.type || "unknown"}`;
      const safeLang = language;

      switch (block.type) {
        case "image": {
          const src = safeLang === "yo" ? block.url_yo : block.url_en;
          const alt = `lesson-image-${i}`;
          return (
            <FloatCard key={key} className={cx(theme.shadow, theme.card, "border-4", theme.border)}>
              <div className="flex items-center justify-between mb-2">
                <Chip className={theme.chip}>🖼️ Image</Chip>
                <SpeakButton text={block.alt || "This is an image"} theme={theme} />
              </div>
              <img
                src={src}
                alt={alt}
                className="my-2 rounded-2xl w-full object-cover max-h-[420px]"
              />
              {block.caption && (
                <p className={cx("mt-2 text-sm sm:text-base font-semibold", theme.text)}>
                  {safeLang === "yo" ? block.caption_yo || block.caption : block.caption}
                </p>
              )}
            </FloatCard>
          );
        }

        case "video": {
          const videoUrl = safeLang === "yo" ? block.content_yo : block.content_en;
          let embedUrl = videoUrl;
          if (typeof videoUrl === "string" && videoUrl.includes("youtube.com/watch")) {
            try {
              const videoId = new URL(videoUrl).searchParams.get("v");
              if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0`;
            } catch {}
          }
          return (
            <FloatCard key={key} className={cx(theme.shadow, theme.card, "border-4", theme.border)}>
              <div className="flex items-center justify-between mb-2">
                <Chip className={theme.chip}>🎬 Video</Chip>
                <SpeakButton text={block.title || "Lesson video"} theme={theme} />
              </div>
              <div className={cx("w-full rounded-2xl overflow-hidden border-2", theme.border)}>
                <iframe
                  width="100%"
                  height="420"
                  src={embedUrl}
                  title={`lesson-video-${i}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-2xl"
                />
              </div>
              {block.caption && (
                <p className={cx("mt-2 text-sm sm:text-base font-semibold", theme.text)}>
                  {safeLang === "yo" ? block.caption_yo || block.caption : block.caption}
                </p>
              )}
            </FloatCard>
          );
        }

        case "text": {
          const text = safeLang === "yo" ? block.content_yo : block.content_en;
          return (
            <FloatCard key={key} className={cx(theme.shadow, theme.card, "border-4", theme.border)}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <Chip className={theme.chip}>📖 Text</Chip>
                <div className="flex gap-2">
                  <SpeakButton text={text} theme={theme} />
                  {block.audio_url && <SoundButton label="Play Audio" src={block.audio_url} />}
                </div>
              </div>
              <p className={cx("text-lg md:text-xl font-extrabold leading-relaxed", theme.text)}>{text}</p>
            </FloatCard>
          );
        }

        case "html": {
          const html = safeLang === "yo" ? block.content_yo : block.content_en;
          return (
            <FloatCard key={key} className={cx(theme.shadow, "bg-white", "border-4 border-gray-200")}>
              <div className="flex items-center justify-between mb-3">
                <Chip className="bg-purple-200 text-purple-900">🧩 HTML</Chip>
                {block.audio_url && <SoundButton label="Play Audio" src={block.audio_url} />}
              </div>
              <div
                className={cx(
                  "bg-white text-black p-6 rounded-lg shadow-sm",
                  targetAudience === "4-7" && "text-4xl",
                  targetAudience === "8-10" && "text-xl",
                  targetAudience === "11-12" && "text-lg",
                  targetAudience === "13-15" && "text-base"
                )}
                style={{ lineHeight: "1.8" }}
                dangerouslySetInnerHTML={{ __html: html }}
              ></div>
            </FloatCard>
          );
        }

        case "code": {
          const code = safeLang === "yo" ? block.content_yo : block.content_en;
          const language = block.language || "javascript";
          return (
            <FloatCard key={key} className={cx(theme.shadow, theme.card, "border-4", theme.border)}>
              <div className="flex items-center justify-between mb-3">
                <Chip className={theme.chip}>💻 Code</Chip>
                {block.audio_url && <SoundButton label="Explain" src={block.audio_url} />}
              </div>
              <SyntaxHighlighter language={language} style={atomOneDark} className="rounded-2xl mb-4 shadow-inner p-4">
                {code}
              </SyntaxHighlighter>
            </FloatCard>
          );
        }

        default:
          return null;
      }
    },
    [language, targetAudience, theme]
  );

  // RENDER STATE: loading
  if (loading) {
    return (
      <ChildrenDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[75vh] bg-gradient-to-br from-white to-gray-50">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400" />
          <p className="mt-4 text-purple-800 font-extrabold text-xl">Loading your awesome lesson… 🎨</p>
        </div>
      </ChildrenDashboardLayout>
    );
  }

  // RENDER STATE: error
  if (error) {
    return (
      <ChildrenDashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-red-700 font-black text-2xl mb-2">Oops! {error}</p>
          <button onClick={() => window.history.back()} className="px-5 py-2 rounded-2xl bg-red-500 text-white font-bold shadow hover:shadow-md">
            Go Back
          </button>
        </div>
      </ChildrenDashboardLayout>
    );
  }

  const { content_blocks = [] } = lesson || {};

  return (
    <ChildrenDashboardLayout>
      <div className={cx("relative", theme.bg)}>
        {/* Sticky header with progress */}
        <div className="sticky top-0 z-30 backdrop-blur bg-white/40 border-b border-white/60">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <GradientTitle
                text={(language === "yo" ? lesson?.title_yo : lesson?.title_en) + " ✨"}
                gradientClass={theme.gradientTitle}
              />
            </div>
            <div className="flex items-center gap-3">
              <Chip className={theme.chip}>🎯 Quiz Progress</Chip>
              <div className="flex-1">
                <ProgressBar value={quizProgress} theme={theme} />
              </div>
              <Chip className={theme.chip}>{quizProgress}%</Chip>
            </div>
          </div>
        </div>

        {/* Hero description card */}
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <FloatCard className={cx(theme.card, theme.shadow, "border-4", theme.border)}>
            <div className="flex items-start justify-between gap-4">
              <p className={cx("text-lg md:text-xl font-extrabold leading-relaxed", theme.text)}>
                {language === "yo" ? lesson?.description_yo : lesson?.description_en}
              </p>
              <div className="flex flex-col gap-2 shrink-0">
                <SpeakButton text={language === "yo" ? lesson?.description_yo : lesson?.description_en} theme={theme} />
                {lesson?.file_url_en && (
                  <a
                    href={language === "yo" ? lesson?.file_url_yo || lesson?.file_url_en : lesson?.file_url_en}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white text-gray-900 border border-black/10 shadow-sm hover:shadow"
                  >
                    📄 Open File
                  </a>
                )}
              </div>
            </div>
          </FloatCard>
        </div>

        {/* Content Blocks */}
        <div className="mx-auto max-w-6xl px-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{content_blocks.map((block, i) => renderBlock(block, i))}</div>
        </div>

        {/* Quiz Section */}
      {quizzes.length > 0 && (
  <div className="mx-auto max-w-6xl px-4 pb-10">
    <FloatCard className={cx(theme.card, theme.shadow, "border-4", theme.border)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <p className="text-lg sm:text-xl font-bold text-pink-700">
            {language === "yo"
              ? "Àwọn idahun ni a gba ni ìgbìmọ̀ àkọ́kọ́"
              : "Answers are collected on first attempt"} ❤️
          </p>
          <GradientTitle
            text={language === "yo" ? "Ìdánwò" : "Quiz"}
            gradientClass={theme.gradientTitle}
          />
        </div>

        {/* Bilingual Think & Tap Chip */}
        <Chip className={theme.chip}>
          {language === "yo" ? "Ronu & Tẹ" : "Think & Tap"}
        </Chip>
      </div>

<div className="space-y-5">
  {quizzes.map((q) => {
    const first = firstAttempts[q.id];
    const selected = first ? first.selected_answer : answers[q.id];
    const state = first ? (first.is_correct ? "correct" : "incorrect") : feedback[q.id];

    // Lock if already attempted
    const locked = !!first || state === "correct";

    const readableQuestion = q.question || (language === "yo" ? q.question_yo : q.question_en) || "";

    return (
      <div
        key={q.id}
        ref={(el) => (quizRefs.current[q.id] = el)}
        className={cx("relative p-4 rounded-3xl border-2", theme.border, theme.card)}
      >
        {/* First attempt badge bilingual */}
        {first && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 text-white font-extrabold px-3 py-1 rounded-full text-sm shadow-lg animate-bounce">
            {language === "yo" ? "Ìbẹrẹ́ Àkọ́kọ́" : "First Attempt"}
          </span>
        )}

        <div className="flex items-start justify-between gap-3 mb-3">
          <p className={cx("font-black text-lg md:text-2xl leading-snug", theme.text)}>
            {readableQuestion}
          </p>
          <div className="flex gap-2 shrink-0">
            <Chip className={theme.chip}>
              {language === "yo" ? "Rò & Tẹ" : "Think & Tap"}
            </Chip>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(q.options || []).map((opt, idx) => (
            <QuizOptionButton
              key={`${q.id}-opt-${idx}`}
              label={opt}
              isSelected={selected === opt}
              isCorrect={q.correct_answer === opt}
              locked={locked}
              onClick={() => handleAnswer(q.id, opt)}
            />
          ))}
        </div>

        {state && (
          <div className="mt-2 text-center">
            {state === "correct" ? (
              <p className="text-green-700 font-black text-lg md:text-xl">
                ✔️ {language === "yo" ? "Ẹ Ṣe!" : "Well done!"}
              </p>
            ) : (
              <p className="text-red-700 font-black text-lg md:text-xl">
                ❌ {language === "yo" ? "Ko dara" : "Incorrect"}
              </p>
            )}
          </div>
        )}
      </div>
    );
  })}

</div>
<div className="mt-6">
  <button
    onClick={handleSubmit}
    disabled={submitting || hasFirstAttempt} // disable if already attempted
    className={cx(
      "w-full py-3 rounded-2xl text-white font-black text-lg",
      hasFirstAttempt
        ? "bg-gray-400 cursor-not-allowed" // show disabled
        : "bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500",
      "shadow-lg hover:shadow-xl active:translate-y-[1px]",
      submitting && "opacity-70 cursor-not-allowed"
    )}
  >
    {hasFirstAttempt
      ? language === "yo"
        ? "Ṣe Àkọ́kọ́"
        : "Attempted"
      : submitting
      ? language === "yo"
        ? "Ìfiránṣẹ́ ń lọ…"
        : "Submitting…"
      : language === "yo"
      ? "Ṣàfihàn Àbọ̀"
      : "Submit Answers"}
  </button>
</div>

            </FloatCard>
          </div>
        )}

        {/* Incomplete Modal */}
        {showIncompleteModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-yellow-300">
              <div className="text-5xl mb-3">🤔</div>
              <p className="text-black text-lg font-extrabold mb-4">
                {language === "yo"
                  ? "Jọwọ dáhùn gbogbo ìbéèrè kí o tó fi ránṣẹ́ 🙏🏽"
                  : "Please answer all questions before submitting 🙏🏽"}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowIncompleteModal(false)}
                  className="px-5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold shadow"
                >
                  {language === "yo" ? "Ó ye mi" : "Okay"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Badge Modal */}
        {showBadgeModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border-4 border-green-300 text-center">
              <div className="text-6xl mb-2">🏅</div>
              <h3 className="text-2xl font-black mb-2">
                {language === "yo" ? badgeInfo?.title_yo || "Aami Aṣeyọri" : badgeInfo?.title_en || "Achievement Badge"}
              </h3>
              <p className="text-gray-700 font-bold mb-3">
                {language === "yo" ? badgeInfo?.description_yo : badgeInfo?.description_en}
              </p>
              {typeof badgeInfo?.score === "number" && (
                <p className="text-sm text-gray-600 mb-4">
                  {language === "yo"
                    ? `Ọkan ṣoṣo: ${badgeInfo.score}/${badgeInfo.total}`
                    : `Score: ${badgeInfo.score}/${badgeInfo.total}`}
                </p>
              )}
              {badgeInfo?.icon_url && (
                <img src={badgeInfo.icon_url} alt="badge icon" className="mx-auto w-24 h-24 object-contain mb-3" />
              )}
              <button
                onClick={() => setShowBadgeModal(false)}
                className="px-5 py-2 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-extrabold shadow"
              >
                {language === "yo" ? "O ṣeun!" : "Nice!"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: translateY(10px) scale(.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: translateY(-6px) scale(.98); }
          60% { opacity: 1; transform: translateY(2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ChildrenDashboardLayout>
  );
};

export default LessonViewKid;
