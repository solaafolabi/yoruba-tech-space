// src/pages/student/components/LessonQuiz.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "../../../supabaseClient";
import confetti from "canvas-confetti";

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

  // Fetch user, quiz, and practical existence
  useEffect(() => {
    const fetchUserQuizAndPractical = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData.user;
        if (!currentUser) return navigate("/login");
        setUser(currentUser);

        if (!lessonId) return;

        // Fetch quiz data
        const { data: quizData, error: quizError } = await supabase
          .from("user_quizzes")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("lesson_id", lessonId)
          .maybeSingle();

        if (quizError) console.error("Error fetching quiz:", quizError);

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

        // Check if practical exists
        const { data: practicalSteps, error: practicalError } = await supabase
          .from("practical_steps")
          .select("id")
          .eq("lesson_id", lessonId)
          .limit(1);

        if (practicalError) {
          console.error("Error fetching practical:", practicalError);
        } else {
          setLessonHasPractical(practicalSteps?.length > 0);
        }
      } catch (err) {
        console.error("Fetch user/quiz/practical error:", err);
      }
    };

    fetchUserQuizAndPractical();
  }, [lessonId, navigate, quizzes]);

  // Trigger confetti on all correct submission
  useEffect(() => {
    if (Object.values(feedback).every((val) => val === "correct") && Object.keys(feedback).length) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setShowToast(false), 4000);
    }
  }, [feedback]);

  const handleOptionChange = (qid, option) => {
    if (quizCompleted) return; // lock after passing
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

    try {
      const { error } = await supabase
        .from("user_quizzes")
        .upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            answers,
            completed: allCorrect,
            updated_at: new Date(),
          },
          { onConflict: ["user_id", "lesson_id"] }
        );

      if (error) console.error("Error saving quiz:", error);
      if (allCorrect) setShowToast(true);
    } catch (err) {
      console.error("Unexpected error saving quiz:", err);
    }
  };

  if (!quizzes.length) {
    return <div className="text-white text-center mt-10">No quizzes available.</div>;
  }

  return (
    <div className="bg-[#1B263B] p-4 rounded shadow mt-10 max-w-full">
      <h2 className="text-xl font-semibold mb-4 text-[#FFD700]">📝 Quiz</h2>

      {quizzes.map((q, i) => (
        <div
          key={q.id}
          className="mb-8 bg-[#102030] rounded-lg shadow-md border border-[#FFD700]/20"
        >
          <div className="p-4 bg-[#1E2A47] rounded-t-lg flex justify-between items-center">
            <h4 className="text-white font-bold text-base m-0 max-w-[90%]">
              {i + 1}. {i18n.language === "yo" ? q.question_yo : q.question_en}
            </h4>
            <span className="text-white text-lg ml-2">❓</span>
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
                  <span className="text-white">{option}</span>
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
                    ❌ {i18n.language === "yo" ? "Ko dara, gbiyanju lẹẹkansi" : "Incorrect, try again"}
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
        // Mark lesson as completed
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
