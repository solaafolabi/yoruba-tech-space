import React from "react";

/**
 * LessonSelector
 * Props:
 * - language: "English" | "Yoruba"
 * - courses, modules, lessons (arrays)
 * - selectedCourse, setSelectedCourse
 * - selectedModule, setSelectedModule
 * - selectedLesson, setSelectedLesson
 * - clearOtherLanguage (function)
 */
export default function LessonSelector({
  language,
  courses = [],
  modules = [],
  lessons = [],
  selectedCourse,
  setSelectedCourse,
  selectedModule,
  setSelectedModule,
  selectedLesson,
  setSelectedLesson,
  clearOtherLanguage,
}) {
  const isEnglish = language === "English" || language === "en";

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block font-semibold mb-1">
          Select {isEnglish ? "English" : "Yoruba"} Course
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800"
        >
          <option value="">{`-- Select ${isEnglish ? "English" : "Yoruba"} Course --`}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {isEnglish ? c.title_en : c.title_yo}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1">
          Select {isEnglish ? "English" : "Yoruba"} Module
        </label>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          disabled={!selectedCourse}
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800"
        >
          <option value="">{`-- Select ${isEnglish ? "English" : "Yoruba"} Module --`}</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {isEnglish ? m.title_en : m.title_yo}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1">
          Select {isEnglish ? "English" : "Yoruba"} Lesson (Edit)
        </label>
        <select
          value={selectedLesson}
          onChange={(e) => {
            setSelectedLesson(e.target.value);
            if (clearOtherLanguage) clearOtherLanguage();
          }}
          disabled={!selectedModule}
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800"
        >
          <option value="">{`-- New ${isEnglish ? "English" : "Yoruba"} Lesson --`}</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {isEnglish ? l.title_en : l.title_yo}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
