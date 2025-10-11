// src/pages/student/components/LessonQuiz.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "../../../supabaseClient";
import confetti from "canvas-confetti";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const MarkdownRenderer = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="text-white leading-relaxed mb-2">{children}</p>,
      strong: ({ children }) => <strong className="text-yellow-300 font-semibold">{children}</strong>,
      em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
      ul: ({ children }) => <ul className="list-disc list-inside text-white">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside text-white">{children}</ol>,
      li: ({ children }) => <li className="ml-4">{children}</li>,
      code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        return !inline && match ? (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            showLineNumbers
            customStyle={{
              borderRadius: "0.5rem",
              padding: "1rem",
              background: "#1E293B",
              overflowX: "auto",
            }}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        ) : (
          <code
            {...props}
            style={{
              backgroundColor: "",
              color: "#FFD700",
              padding: "2px 5px",
              borderRadius: "4px",
              fontSize: "0.9em",
            }}
          >
            {children}
          </code>
        );
      },
    }}
  >
    {content}
  </ReactMarkdown>
);

const LessonQuiz = ({ quizzes = [], lessonSlug, lessonId }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lessonHasPractical, setLessonHasPractical] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      if (!currentUser) return navigate("/login");
      setUser(currentUser);

      if (!lessonId) return;

      const { data: quizData } = await supabase
        .from("user_quizzes")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (quizData) {
        setAnswers(quizData.answers || {});
        if (quizData.completed) {
          setQuizCompleted(true);
          const completedFeedback = {};
          quizzes.forEach((q) => (completedFeedback[q.id] = "correct"));
          setFeedback(completedFeedback);
          setShowToast(true);
        }
      }

      const { data: practicalSteps } = await supabase
        .from("practical_steps")
        .select("id")
        .eq("lesson_id", lessonId)
        .limit(1);

      setLessonHasPractical(practicalSteps?.length > 0);
    };

    fetchData();
  }, [lessonId, navigate, quizzes]);

  useEffect(() => {
    if (Object.values(feedback).every((val) => val === "correct") && Object.keys(feedback).length) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setShowToast(false), 4000);
    }
  }, [feedback]);

  const handleOptionChange = (qid, option) => {
    if (quizCompleted) return;
    setAnswers((prev) => ({ ...prev, [qid]: option }));
  };

  const handleSubmit = async () => {
    if (quizCompleted) return;
    if (Object.keys(answers).length < quizzes.length) {
      setShowModal(true);
      return;
    }

    const newFeedback = {};
    quizzes.forEach((q) => {
      const userAnswer = answers[q.id]?.trim().toLowerCase();
      const correctAnswer = (i18n.language === "yo" ? q.correct_answer_yo : q.correct_answer_en)
        .trim()
        .toLowerCase();
      newFeedback[q.id] = userAnswer === correctAnswer ? "correct" : "incorrect";
    });

    setFeedback(newFeedback);

    const allCorrect = Object.values(newFeedback).every((val) => val === "correct");
    if (allCorrect) setQuizCompleted(true);

    await supabase.from("user_quizzes").upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        answers,
        completed: allCorrect,
        updated_at: new Date(),
      },
      { onConflict: ["user_id", "lesson_id"] }
    );

    if (allCorrect) setShowToast(true);
  };

  if (!quizzes.length) {
    return <div className="text-white text-center mt-10">No quizzes available.</div>;
  }

  return (
    <div className="bg-[#1E293B] p-4 rounded shadow mt-10 max-w-full">
      <h2 className="text-xl font-semibold mb-4 text-[#FFD700]">📝 Quiz</h2>

      {quizzes.map((q, i) => (
        <div
          key={q.id}
          className="mb-8 bg-[#0F172A] rounded-lg shadow-md border border-[#FFD700]/20"
        >
          <div className="p-4 bg-[#0F172A] rounded-t-lg flex justify-between items-center">
            <h4 className="text-white font-bold text-base m-0 max-w-[90%]">
              {i + 1}. <MarkdownRenderer content={i18n.language === "yo" ? q.question_yo : q.question_en} />
            </h4>
          </div>

          <div className="space-y-4 p-5">
            {(i18n.language === "yo" ? q.options_yo : q.options_en)?.map((option, index) => (
              <label key={index} className="block text-base space-y-1">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={option}
                    checked={answers[q.id] === option}
                    disabled={quizCompleted}
                    onChange={() => handleOptionChange(q.id, option)}
                    className="w-6 h-6 accent-[#FFD700]"
                  />
                  <MarkdownRenderer content={option} />
                </div>
              </label>
            ))}

            {feedback[q.id] && (
              <div className="ml-9 mt-2 font-semibold text-lg">
                {feedback[q.id] === "correct" ? (
                  <span className="text-green-400">
                    ✔️ {i18n.language === "yo" ? "Ẹ Ṣe!" : "Correct!"}
                  </span>
                ) : (
                  <span className="text-red-400">
                    ❌{" "}
                    {i18n.language === "yo"
                      ? "Ko dara, gbiyanju lẹẹkansi"
                      : "Incorrect, try again"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {!quizCompleted && (
        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-white hover:bg-yellow-300 text-black font-bold py-3 rounded text-lg transition"
        >
          {i18n.language === "yo" ? "Ṣàfihàn Àbọ̀" : "Submit Answers"}
        </button>
      )}

      {quizCompleted && (
        <button
          onClick={async () => {
            if (!lessonHasPractical) {
              await supabase.from("practical_progress").upsert(
                {
                  user_id: user.id,
                  lesson_slug: lessonSlug,
                  current_step: 0,
                  completed: true,
                  code_state: {},
                },
                { onConflict: ["user_id", "lesson_slug"] }
              );
              navigate("/dashboard");
            } else {
              navigate(`/student/practical/${lessonSlug}`);
            }
          }}
          className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded text-lg transition"
        >
          🚀 {i18n.language === "yo" ? "Tẹ̀síwájú" : "Continue"}
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-[#1B263B] p-6 rounded-lg shadow-lg w-full max-w-md text-center">
            <p className="text-white text-lg font-semibold mb-4">
              {i18n.language === "yo"
                ? "Jọwọ dáhùn gbogbo ìbéèrè kí o tó fi ránṣẹ́ 🙏🏽"
                : "Please answer all questions before submitting 🙏🏽"}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-[#FFD700] hover:bg-yellow-400 text-black px-6 py-2 rounded font-bold"
            >
              {i18n.language === "yo" ? "Ó ye mi" : "Okay"}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl animate-bounce text-xl font-bold">
          🎉{" "}
          {i18n.language === "yo"
            ? "Ẹ ṣàṣeyọrí! O lè bá Practical lọ báyìí..."
            : "Success! You can now continue..."}
        </div>
      )}
    </div>
  );
};

export default LessonQuiz;
