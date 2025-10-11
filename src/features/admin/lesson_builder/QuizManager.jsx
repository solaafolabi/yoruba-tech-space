import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

/**
 * QuizManager (bilingual + drag and drop)
 * Props:
 * - quizzes (array)
 * - addQuiz()
 * - updateQuiz(index, field, value)
 * - updateQuizOption(quizIndex, optionIndex, value, lang)
 * - setQuizToDelete({id, index})
 * - setIsModalOpen(bool)
 * - setQuizzes(newArray)  <-- needed for reordering
 */
export default function QuizManager({
  quizzes = [],
  addQuiz,
  updateQuiz,
  updateQuizOption,
  setQuizToDelete,
  setIsModalOpen,
  setQuizzes,
}) {
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(quizzes);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setQuizzes(reordered);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Quiz Questions (Drag to reorder)</h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="quizList">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
              {quizzes.map((quiz, i) => (
                <Draggable key={i} draggableId={`quiz-${i}`} index={i}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="p-4 border rounded bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <strong>Question {i + 1}</strong>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setQuizToDelete({ id: quiz.id, index: i });
                              setIsModalOpen(true);
                            }}
                            className="text-red-600 font-bold"
                          >
                            ×
                          </button>
                          <span
                            {...provided.dragHandleProps}
                            className="cursor-move select-none p-1 text-gray-500 hover:text-gray-900"
                            title="Drag to reorder"
                          >
                            ☰
                          </span>
                        </div>
                      </div>

                     {/* English Question + Options */}
<textarea
  placeholder={`Question ${i + 1} (English)`}
  value={quiz.question_en ?? ""}
  onChange={(e) => updateQuiz(i, "question_en", e.target.value)}
  className="w-full p-2 border rounded bg-white dark:bg-gray-700 mb-2 min-h-[100px]"
/>

<div className="grid grid-cols-2 gap-2 mb-2">
  {(quiz.options_en ?? ["", "", "", ""]).map((opt, j) => (
    <textarea
      key={j}
      placeholder={`Option ${j + 1} (English)`}
      value={opt}
      onChange={(e) => updateQuizOption(i, j, e.target.value, "en")}
      className="p-2 border rounded bg-white dark:bg-gray-700 min-h-[60px]"
    />
  ))}
</div>

<textarea
  placeholder="Correct Answer (English)"
  value={quiz.correct_answer_en ?? ""}
  onChange={(e) => updateQuiz(i, "correct_answer_en", e.target.value)}
  className="w-full p-2 border rounded bg-white dark:bg-gray-700 mb-4 min-h-[60px]"
/>

{/* Yoruba Question + Options */}
<textarea
  placeholder={`Question ${i + 1} (Yoruba)`}
  value={quiz.question_yo ?? ""}
  onChange={(e) => updateQuiz(i, "question_yo", e.target.value)}
  className="w-full p-2 border rounded bg-white dark:bg-gray-700 mb-2 min-h-[100px]"
/>

<div className="grid grid-cols-2 gap-2 mb-2">
  {(quiz.options_yo ?? ["", "", "", ""]).map((opt, j) => (
    <textarea
      key={j}
      placeholder={`Option ${j + 1} (Yoruba)`}
      value={opt}
      onChange={(e) => updateQuizOption(i, j, e.target.value, "yo")}
      className="p-2 border rounded bg-white dark:bg-gray-700 min-h-[60px]"
    />
  ))}
</div>

<textarea
  placeholder="Correct Answer (Yoruba)"
  value={quiz.correct_answer_yo ?? ""}
  onChange={(e) => updateQuiz(i, "correct_answer_yo", e.target.value)}
  className="w-full p-2 border rounded bg-white dark:bg-gray-700 min-h-[60px]"
/>

                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        type="button"
        onClick={addQuiz}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        + Add Quiz Question
      </button>
    </div>
  );
}
