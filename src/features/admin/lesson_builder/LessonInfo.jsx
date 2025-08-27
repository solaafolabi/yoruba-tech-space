import React from "react";

/**
 * LessonInfo
 * Props:
 * - titleEn, setTitleEn
 * - titleYo, setTitleYo
 * - descriptionEn, setDescriptionEn
 * - descriptionYo, setDescriptionYo
 * - ageGroup, setAgeGroup, ageGroups
 * - category, setCategory
 * - activeLessonId
 */
export default function LessonInfo({
  titleEn,
  setTitleEn,
  titleYo,
  setTitleYo,
  descriptionEn,
  setDescriptionEn,
  descriptionYo,
  setDescriptionYo,
  ageGroup,
  setAgeGroup,
  ageGroups = [],
  category,
  setCategory,
  activeLessonId,
}) {
  return (
    <>
      <div>
        <label className="block font-semibold mb-1">Lesson Title (English) *</label>
        <input
          type="text"
          required={!activeLessonId}
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800"
          placeholder="Enter lesson title in English"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Lesson Title (Yoruba) *</label>
        <input
          type="text"
          required={!activeLessonId}
          value={titleYo}
          onChange={(e) => setTitleYo(e.target.value)}
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800"
          placeholder="Enter lesson title in Yoruba"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Age Group</label>
        <select
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          disabled={!activeLessonId}
          className={`w-full p-2 border rounded ${
            !activeLessonId ? "bg-gray-200 cursor-not-allowed" : "bg-gray-100 dark:bg-gray-800"
          }`}
        >
          <option value="">Select age group</option>
          {ageGroups.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1">Description (English)</label>
        <textarea
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800"
          placeholder="Short lesson description in English"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Description (Yoruba)</label>
        <textarea
          value={descriptionYo}
          onChange={(e) => setDescriptionYo(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800"
          placeholder="Short lesson description in Yoruba"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Category / Lesson Type</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., html, video, scratch"
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800"
        />
      </div>
    </>
  );
}
