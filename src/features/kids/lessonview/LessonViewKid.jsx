

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../../supabaseClient";
import { useTranslation } from "react-i18next";
import Confetti from "react-confetti";

import ChildrenDashboardLayout from "../ChildrenDashboardLayout";
import BlocklyPlayground from "../lessonview/BlocklyBlock";
import PracticalBlockKid from "./PracticalBlockKid";




import { validateBlocklySubmission } from "./validation";

import IntroSection from "./IntroSection";
import QuizSection from "./QuizSection";
import Modals from "./Modals";
import PictureMatchingSection from "./PictureMatchingSection";
import  ScratchFull from "./ScratchFull";
import P5Block from "./P5Block";
import HTMLCSSBlock from "./HTMLCSSBlock";
import BlocklyBlock from "./BlocklyBlock";
import FabricBlock from "./FabricBlock";



import {
  AGE_UI,
  Chip,
  GradientTitle,
  ProgressBar,
  cx,
  getWindowSize,
} from "./ui-utils";

const LessonViewKid = () => {
  const { lessonSlug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  // core state
  const [lesson, setLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [firstAttempts, setFirstAttempts] = useState({});
  const [targetAudience, setTargetAudience] = useState("4-7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blocklyProgress, setBlocklyProgress] = useState({});
  const [incompleteItems, setIncompleteItems] = useState([]);


  // auth / child
  const userIdRef = useRef(null);
  const childIdRef = useRef(null);

  // theme / lang
  const language = i18n.language?.startsWith("yo") ? "yo" : "en";
  const theme = AGE_UI[targetAudience] || AGE_UI["4-7"];

  // confetti per-question
  const [confettiMap, setConfettiMap] = useState({}); // { quizId: { rect, show } }
  const quizRefs = useRef({}); // quizId -> element

  // viewport (for measuring overlays)
  const [viewport, setViewport] = useState(getWindowSize());
  useEffect(() => {
    const onResize = () => setViewport(getWindowSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // measure quiz card rects after render
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureQuizRects, viewport.width, viewport.height]);

  /*********************
   * DATA LOADING FLOW *
   *********************/
  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError("");

      try {
        // 1) Auth
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) console.warn("auth.getUser error", userErr);
        if (!userData?.user) {
          setError("Please sign in to view this lesson.");
          setLoading(false);
          return;
        }
        const userId = userData.user.id;
        userIdRef.current = userId;

        // 2) Child (age_range + id)
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

        // 3) Lesson
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

        // 4) Quizzes (localized)
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

  /******************
   * CONFETTI UTILS *
   ******************/
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

  /*******************
   * ANSWER HANDLING *
   *******************/
  const handleAnswer = useCallback(
    async (quizId, selected) => {
      setAnswers((prev) => ({ ...prev, [quizId]: selected }));

      const childId = childIdRef.current;
      if (!childId) return;

      const quiz = quizzes.find((q) => q.id === quizId);
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
          await supabase.from("first_attempts").insert([
            {
              child_id: childId,
              quiz_id: quizId,
              selected_answer: selected,
              is_correct: isCorrect,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error("Error saving first attempt:", err);
      }

      setFeedback((prev) => ({
        ...prev,
        [quizId]: isCorrect ? "correct" : "incorrect",
      }));
      if (isCorrect) triggerConfettiOnQuiz(quizId, 1200);

      const soundPath = (type) =>
        i18n.language.startsWith("yo")
          ? `/sounds/${type}-yo.mp3`
          : `/sounds/${type}-en.mp3`;
      try {
        new Audio(soundPath(isCorrect ? "correct" : "wrong")).play();
      } catch {}
    },
    [quizzes, i18n.language, triggerConfettiOnQuiz]
  );

  // load first attempts for all quizzes (locks UI where applicable)
  useEffect(() => {
    const loadFirstAttempts = async () => {
      const childId = childIdRef.current;
      if (!childId || quizzes.length === 0) return;

      const { data: attempts } = await supabase
        .from("first_attempts")
        .select("*")
        .eq("child_id", childId)
        .in("quiz_id", quizzes.map((q) => q.id));

      if (attempts) {
        const map = {};
        attempts.forEach((a) => {
          map[a.quiz_id] = a;
        });
        setFirstAttempts(map);
      }
    };
    loadFirstAttempts();
  }, [quizzes]);

  /****************
   * SUBMIT FLOW  *
   ****************/
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeInfo, setBadgeInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const awardBadgeIfNeeded = useCallback(async (childId, lessonId, badge) => {
    try {
      const key = `lesson_${lessonId || "na"}_submission`;

      const { data: existing, error: selErr } = await supabase
        .from("achievements")
        .select("id")
        .eq("child_id", childId)
        .eq("key", key)
        .limit(1);

      if (!selErr && existing && existing.length > 0) return;

      const payload = {
        child_id: childId,
        lesson_id: lessonId,
        key,
        title_en: badge.title_en,
        title_yo: badge.title_yo,
        description_en: badge.description_en,
        description_yo: badge.description_yo,
        icon_url: badge.icon_url,
        earned_at: new Date().toISOString(),
      };

      const { error: insErr } = await supabase
        .from("achievements")
        .insert(payload);
      if (insErr) console.warn("achievements insert error", insErr);
    } catch (e) {
      console.warn("awardBadgeIfNeeded error", e);
    }
  }, []);



const handleSubmit = useCallback(async () => {
  if (submitting) return;

  const totalQuizzes = quizzes.length;
  const answeredQuizzes = quizzes.filter((q) => answers[q.id] != null).length;

  const blocklyIds = Object.keys(blocklyProgress || {});
  const totalBlockly = blocklyIds.length;
  const completedBlockly = blocklyIds.filter(
    (id) => blocklyProgress[id]?.mode === "completed"
  ).length;

  // ✅ Build friendly labels for incomplete items
  const missing = [];

  quizzes.forEach((q, idx) => {
    if (!answers[q.id]) {
      missing.push(
        language === "yo" ? `Ìbéèrè ${idx + 1}` : `Quiz ${idx + 1}`
      );
    }
  });

  blocklyIds.forEach((id) => {
    if (blocklyProgress[id]?.mode !== "completed") {
      // find the block from lesson content to grab its gameType
      const block = lesson?.content_blocks?.find((b) => b.id === id);
      const label =
        block?.gameType
          ? `Blockly – ${block.gameType}`
          : language === "yo"
          ? "Ìṣẹ́ Blockly"
          : "Blockly Task";

      missing.push(label);
    }
  });

  setIncompleteItems(missing);

  // if lesson has quizzes and/or blockly, make sure each required type is complete
  const requiresQuizzes = totalQuizzes > 0;
  const requiresBlockly = totalBlockly > 0;

  const allQuizzesDone = !requiresQuizzes || answeredQuizzes === totalQuizzes;
  const allBlocklyDone = !requiresBlockly || completedBlockly === totalBlockly;

  if (!allQuizzesDone || !allBlocklyDone) {
    setShowIncompleteModal(true);
    return;
  }

  setSubmitting(true);
  try {
    // ✅ score quizzes
    const correctCount = quizzes.reduce((acc, q) => {
      const selected = answers[q.id];
      if (!selected) return acc;
      const correctAnswer = (i18n.language.startsWith("yo")
        ? (q.correct_answer_yo || "").trim().toLowerCase()
        : (q.correct_answer_en || "").trim().toLowerCase());
      return acc + ((selected || "").trim().toLowerCase() === correctAnswer ? 1 : 0);
    }, 0);

    // ✅ blockly score
    const blocklyScore = completedBlockly;

    const total = totalQuizzes + totalBlockly;
    const finalScore = correctCount + blocklyScore;

    // 🎉 Confetti
    quizzes.forEach((q) => {
      const selected = answers[q.id];
      const correctAnswer = (i18n.language.startsWith("yo")
        ? (q.correct_answer_yo || "").trim().toLowerCase()
        : (q.correct_answer_en || "").trim().toLowerCase());
      if ((selected || "").trim().toLowerCase() === correctAnswer) {
        triggerConfettiOnQuiz(q.id, 1500);
      }
    });

    blocklyIds.forEach((id) => {
      if (blocklyProgress[id]?.mode === "completed") {
        triggerConfettiOnQuiz(id, 1500);
      }
    });

    // ✅ Save completion
    const lessonId = lesson?.id;
    const childId = childIdRef.current;
    if (childId && lessonId) {
      await supabase.from("completed_lessons").upsert(
        [
          {
            child_id: childId,
            lesson_id: lessonId,
            completed_at: new Date().toISOString(),
            slug: lessonSlug,
          },
        ],
        { onConflict: "child_id,lesson_id" }
      );
    }

    // ✅ Badge
    const earnedBadge = {
      title_en: "Lesson Champion",
      title_yo: "Akin Ẹkọ",
      description_en: "Completed a lesson quiz and Blockly tasks!",
      description_yo: "Pari idanwo ẹkọ àti iṣẹ́ Blockly!",
      icon_url: "/badges/lesson-champion.png",
    };
    if (childId) await awardBadgeIfNeeded(childId, lessonId, earnedBadge);

    setBadgeInfo({ ...earnedBadge, score: finalScore, total });
    setShowBadgeModal(true);

    setTimeout(() => navigate("/kids/dashboard"), 2000);
  } catch (err) {
    console.error(err);
    setError("We couldn't submit your answers. Please try again.");
  } finally {
    setSubmitting(false);
  }
}, [
  submitting,
  quizzes,
  answers,
  blocklyProgress,
  i18n.language,
  lesson?.id,
  lesson?.content_blocks,
  lessonSlug,
  awardBadgeIfNeeded,
  navigate,
  triggerConfettiOnQuiz,
  language,
]);

// Single images only
const singleImages = useMemo(() => {
  if (!lesson?.content_blocks) return [];
  return lesson.content_blocks
    .filter((block) => block.type === "image")
    .map((block, idx) => ({
      id: `image-${idx}`,
      image: language === "yo" ? block.url_yo : block.url_en,
      label: language === "yo" ? block.content_yo : block.content_en,
    }));
}, [lesson, language]);

// Image match pairs only
const imageMatches = useMemo(() => {
  if (!lesson?.content_blocks) return [];
  return lesson.content_blocks
    .filter((block) => block.type === "imagematch")
    .flatMap((block, idx) =>
      (block.pairs || []).map((pair, pIdx) => ({
        id: `match-${idx}-${pIdx}`,
        image: language === "yo" ? pair.url_yo : pair.url_en,
        label: language === "yo" ? pair.label_yo || "" : pair.label_en || "",
      }))
    );
}, [lesson, language]);


// ✅ Listen for lessonCompleted (from QuizSection or local submit)
useEffect(() => {
  const handleLessonCompleted = async (e) => {
    const { lesson_id, module_id, course_id, child_id } = e.detail;
    console.log("🎯 lessonCompleted fired with:", e.detail);

    const { data, error } = await supabase
      .from("lesson_progress")
      .insert([
        {
          child_id,
          course_id,
          module_id,
          lesson_id,
          completed: true,
        },
      ]);

    if (error) {
      console.error("❌ Error inserting lesson_progress:", error);
    } else {
      console.log("✅ Lesson progress inserted:", data);
    }
  };

  window.addEventListener("lessonCompleted", handleLessonCompleted);
  return () => window.removeEventListener("lessonCompleted", handleLessonCompleted);
}, []);

  /*********************
   * DERIVED / HELPERS *
   *********************/
  const hasFirstAttempt = useMemo(() => {
    return quizzes.some((q) => firstAttempts[q.id] != null);
  }, [quizzes, firstAttempts]);

  const quizProgress = useMemo(() => {
    if (!quizzes?.length) return 0;
    const answered = quizzes.filter((q) => answers[q.id] != null).length;
    return Math.min(100, Math.round((answered / quizzes.length) * 100));
  }, [quizzes, answers]);

  /***************
   * RENDER FLOW *
   ***************/
  if (loading) {
    return (
      <ChildrenDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[75vh] bg-gradient-to-br from-white to-gray-50">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400" />
          <p className="mt-4 text-purple-800 font-extrabold text-xl">
            Loading your awesome lesson… 🎨
          </p>
        </div>
      </ChildrenDashboardLayout>
    );
  }

  if (error) {
    return (
      <ChildrenDashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white">
          <div className="text-6xl mb-4" aria-hidden>😕</div>
          <p className="text-red-700 font-black text-2xl mb-2">
            Oops! {error}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2 rounded-2xl bg-red-500 text-white font-bold shadow hover:shadow-md"
          >
            Go Back
          </button>
        </div>
      </ChildrenDashboardLayout>
    );
  }

  return (
    <ChildrenDashboardLayout>
      <div className={cx("relative", theme.bg)}>
        {/* Sticky header with progress */}
        <div className="sticky top-0 z-30 backdrop-blur bg-white/40 border-b border-white/60">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <GradientTitle
                text={
                  (language === "yo" ? lesson?.title_yo : lesson?.title_en) + " ✨"
                }
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

        {/* Intro / Content */}
        <IntroSection
          lesson={lesson}
          language={language}
          theme={theme}
          targetAudience={targetAudience}
        />

{imageMatches.length > 0 && (
  <PictureMatchingSection
    pairs={imageMatches}
    theme={theme}
    language={language}
    onComplete={() => console.log("✅ Practice Matching Complete")}
  />
)}
{lesson.content_blocks?.map((block, idx) => {
  const commonProps = {
    key: block.id || idx,
    block,
    language,
    theme,
    userId: childIdRef.current,
    blockId: block.id
  };

  // Pick the right instruction text
  const instructionText =
    language === "yo"
      ? block.instructions_yo || ""
      : block.instructions_en || "";

  return (
    <div key={block.id || idx} className="mb-8">


      {/* Render block based on type */}
      {(() => {
        switch (block.type) {
          case "practical":
            return (
              <PracticalBlockKid
                steps={block.lesson_steps || []}
                language={language}
              />
            );

         case "scratch": {
  const instructions =
    language === "yo"
      ? block.instructions_yo || ""
      : block.instructions_en || "";

  return (
    <ScratchFull
      {...commonProps}
      instructions={instructions}  // 👈 pass instructions
    />
  );
}

          case "p5js":
            return <P5Block {...commonProps} />;

          case "kids_html_css":
            return (
              <HTMLCSSBlock
                {...commonProps}
                initialHtml={language === "yo" ? block.html_yo || "" : block.html_en || ""}
                initialCss={language === "yo" ? block.css_yo || "" : block.css_en || ""}
                showHtml={block.show_html ?? true}
                showCss={block.show_css ?? true}
                lessonSteps={block.lesson_steps || block.lessonSteps || []}
              />
            );

          case "blockly": {
            const initialXml = language === "yo" ? block.xml_yo || "" : block.xml_en || "";
            const instructions = language === "yo" ? block.instructions_yo || "" : block.instructions_en || "";

            const handleChange = ({ studentXml, studentCode, executionOutput, mode }) => {
              const result = validateBlocklySubmission(block, studentXml, studentCode);
              setBlocklyProgress((prev) => {
                const prevState = prev[block.id] || {};
                let progressMode, feedback;
                if (result.success) {
                  progressMode = "completed";
                  feedback = result.feedback;
                } else {
                  progressMode = prevState.mode === "completed" ? "completed" : "in-progress";
                  feedback = result.feedback;
                }
                return {
                  ...prev,
                  [block.id]: { studentXml, studentCode, executionOutput, mode, progressMode, feedback }
                };
              });
            };

            return (
              <BlocklyBlock
                key={`${block.id}-${initialXml?.slice(0, 20)}`}
                initialXml={initialXml}
                instructions={instructions}
                readOnly={block.readOnly ?? false}
                onChange={handleChange}
                gameType={block.gameType}
                block={block}
              />
            );
          }

          case "fabric":
            return (
              <FabricBlock
                {...commonProps}
                instructions={instructionText}
                validationRules={block.validation_rules || {}}
                backgroundColor={block.backgroundColor || "#fff"}
              />
            );

          default:
            return null;
        }
      })()}
    </div>
  );
})}



        {/* Quiz Section */}
        {quizzes.length > 0 && (
          <>
            <QuizSection
              quizzes={quizzes}
              answers={answers}
              feedback={feedback}
              firstAttempts={firstAttempts}
              handleAnswer={handleAnswer}
              quizRefs={quizRefs}
              theme={theme}
              language={language}
               lessonId={lesson.id}
  moduleId={lesson.module_id}
  courseId={lesson.course_id}
   childId={childIdRef.current}   // 👈 use ref value here
            />

           {/* Submit */}
<div className="mx-auto max-w-6xl px-4 pb-10 -mt-2">
  <button
    onClick={handleSubmit}
    disabled={submitting || hasFirstAttempt}
    className={cx(
      "w-full py-3 rounded-2xl text-white font-black text-lg",
      hasFirstAttempt
        ? "bg-gray-400 cursor-not-allowed"
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

{/* Incomplete Modal */}
{showIncompleteModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white p-6 rounded-2xl max-w-md w-full">
      <h2 className="text-xl font-bold mb-3 text-red-600">
        {language === "yo" ? "Kò tíì pé!" : "Incomplete!"}
      </h2>
      <p className="mb-4 text-gray-700">
        {language === "yo"
          ? "O ní àwọn iṣẹ́ tí o kò tíì pari:"
          : "You still have unfinished tasks:"}
      </p>
      <ul className="list-disc pl-5 space-y-1 text-gray-800">
        {incompleteItems.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
      <button
        onClick={() => setShowIncompleteModal(false)}
        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        {language === "yo" ? "Ó Dàra" : "Okay"}
      </button>
    </div>
  </div>
)}

{/* Badge Modal */}
{showBadgeModal && badgeInfo && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white p-6 rounded-2xl max-w-md w-full text-center">
      <img
        src={badgeInfo.icon_url}
        alt="badge"
        className="w-20 h-20 mx-auto mb-4"
      />
      <h2 className="text-xl font-bold text-green-600">
        {language === "yo" ? badgeInfo.title_yo : badgeInfo.title_en}
      </h2>
      <p className="mt-2 text-gray-700">
        {language === "yo" ? badgeInfo.description_yo : badgeInfo.description_en}
      </p>
      <p className="mt-2 font-semibold">
        {language === "yo"
          ? `Àbájáde: ${badgeInfo.score}/${badgeInfo.total}`
          : `Score: ${badgeInfo.score}/${badgeInfo.total}`}
      </p>
      <button
        onClick={() => setShowBadgeModal(false)}
        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg"
      >
        {language === "yo" ? "Ó Dàra" : "Great!"}
      </button>
    </div>
  </div>
)}
          </>
        )}

        {/* Modals */}
        <Modals
          showIncompleteModal={showIncompleteModal}
          setShowIncompleteModal={setShowIncompleteModal}
          showBadgeModal={showBadgeModal}
          setShowBadgeModal={setShowBadgeModal}
          badgeInfo={badgeInfo}
          language={language}
          theme={theme}
        />
      {/* Picture Matching Section */}

        {/* Confetti overlays rendered last so they sit above all */}
        {Object.entries(confettiMap).map(([quizId, entry]) => {
          const { rect, show } = entry || {};
          if (!show || !rect) return null;
          return (
            <Confetti
              key={`confetti-${quizId}`}
              width={rect.width}
              height={rect.height}
              numberOfPieces={120}
              recycle={false}
              style={{
                position: "absolute",
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                pointerEvents: "none",
                zIndex: 50,
              }}
            />
          );
        })}

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
      </div>
    </ChildrenDashboardLayout>
  );
};

export default LessonViewKid;


