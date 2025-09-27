// src/features/kids/QuizSection.jsx
import React, { useMemo, useEffect } from "react";
import {
  Chip,
  FloatCard,
  QuizOptionButton,
  cx,
} from "./ui-utils";

export default function QuizSection({
  quizzes,
  answers,
  feedback,
  firstAttempts,
  handleAnswer,
  quizRefs,
  theme,
  language,
  currentLessonId,   // ✅ pass these from lesson page
  currentModuleId,
  currentCourseId,
}) {
  // ✅ compute total attempts and score
  const { allAnswered, score } = useMemo(() => {
    const total = quizzes.length;
    const answered = Object.keys(firstAttempts).length;
    let correct = 0;

    quizzes.forEach((q) => {
      const attempt = firstAttempts[q.id];
      if (attempt?.is_correct) correct++;
    });

    return {
      allAnswered: answered === total && total > 0,
      score: { correct, total },
    };
  }, [quizzes, firstAttempts]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10">
      <FloatCard className={cx(theme.card, theme.shadow, "border-4", theme.border)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <p className="text-lg sm:text-xl font-bold text-pink-700">
              {language === "yo"
                ? "Àwọn ìdáhùn ni a gba lẹ́ẹ̀kan ṣoṣo"
                : "Answers are collected on first attempt"} ❤️
            </p>
            <h2 className="sr-only">Quiz</h2>
          </div>
          <Chip className={theme.chip}>
            {language === "yo" ? "Ronu & Tẹ" : "Think & Tap"}
          </Chip>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {quizzes.map((q) => {
            const first = firstAttempts[q.id];
            const selected = first ? first.selected_answer : answers[q.id];
            const state = first ? (first.is_correct ? "correct" : "incorrect") : feedback[q.id];
            const locked = !!first || state === "correct";
            const readableQuestion =
              q.question || (language === "yo" ? q.question_yo : q.question_en) || "";

            return (
              <div
                key={q.id}
                ref={(el) => (quizRefs.current[q.id] = el)}
                className={cx("relative p-4 rounded-3xl border-2", theme.border, theme.card)}
              >
                {first && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 text-white font-extrabold px-3 py-1 rounded-full text-sm shadow-lg animate-bounce">
                    {language === "yo" ? "Ìdánwò Àkọ́kọ́" : "First Attempt"}
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
                  <div className="mt-2 text-center" aria-live="polite">
                    {state === "correct" ? (
                      <p className="text-green-700 font-black text-lg md:text-xl">
                        ✔️ {language === "yo" ? "Ẹ ṣeun!" : "Well done!"}
                      </p>
                    ) : (
                      <p className="text-red-700 font-black text-lg md:text-xl">
                        ❌ {language === "yo" ? "Kò tọ́" : "Incorrect"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ✅ Final result */}
        {allAnswered && (
          <div className="mt-8 p-6 rounded-3xl border-4 border-green-400 bg-green-50 text-center shadow-xl">
            <h3 className="text-2xl font-black text-green-700 mb-2">
              {language === "yo" ? "Ìparí Ìdánwò 🎉" : "Quiz Completed 🎉"}
            </h3>
            <p className="text-xl font-bold text-gray-800">
              {language === "yo"
                ? `O ní ${score.correct} lára ${score.total}`
                : `You scored ${score.correct} out of ${score.total}`}
            </p>
            {score.correct === score.total ? (
              <p className="text-green-600 font-bold mt-2">
                {language === "yo" ? "O dáa gan-an! ⭐" : "Perfect Score! ⭐"}
              </p>
            ) : (
              <p className="text-blue-600 font-bold mt-2">
                {language === "yo"
                  ? "Tẹ̀síwájú, ìlera òde òní ní í jẹ́ ìlera ọ̀la!"
                  : "Keep practicing, you’ll improve!"}
              </p>
            )}
          </div>
        )}
      </FloatCard>
    </div>
  );
}
