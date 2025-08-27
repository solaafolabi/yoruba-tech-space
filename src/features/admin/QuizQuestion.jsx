import React from "react";

export default function QuizQuestion({
  quiz,
  index,
  updateQuiz,
  updateQuizOption,
  removeQuiz,
}) {
  return (
    <div className="mb-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <input
        type="text"
        placeholder={`Question ${index + 1}`}
        value={quiz.question}
        onChange={(e) => updateQuiz(index, "question", e.target.value)}
        className="w-full p-2 border rounded bg-white dark:bg-gray-700 mb-2"
        aria-label={`Quiz question ${index + 1}`}
      />

      <div className="grid grid-cols-2 gap-2 mb-2">
        {quiz.options.map((opt, j) => (
          <input
            key={j}
            type="text"
            placeholder={`Option ${j + 1}`}
            value={opt}
            onChange={(e) => updateQuizOption(index, j, e.target.value)}
            className="p-2 border rounded bg-white dark:bg-gray-700"
            aria-label={`Option ${j + 1} for question ${index + 1}`}
          />
        ))}
      </div>

      <input
        type="text"
        placeholder="Correct Answer"
        value={quiz.correct_answer}
        onChange={(e) => updateQuiz(index, "correct_answer", e.target.value)}
        className="w-full p-2 border rounded bg-white dark:bg-gray-700"
        aria-label={`Correct answer for question ${index + 1}`}
      />

      <button
        type="button"
        onClick={() => removeQuiz(index)}
        className="mt-2 text-red-600 font-bold"
        aria-label={`Remove quiz question ${index + 1}`}
      >
        Remove Question
      </button>
    </div>
  );
}
