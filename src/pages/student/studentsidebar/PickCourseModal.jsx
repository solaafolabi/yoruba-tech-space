// src/components/PickCourseModal.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function PickCourseModal({
  availableCourses,
  userCourses,
  modalCourseId,
  setModalCourseId,
  handlePickCourse,
  closeModal,
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl">
        <h2 className="text-lg font-bold mb-4">{t("modals.pickCourseTitle")}</h2>
        <select
          className="w-full border rounded p-2 text-black"
          value={modalCourseId}
          onChange={(e) => setModalCourseId(e.target.value)}
        >
          <option value="">{t("sidebar.pickCourse")}</option>
          {availableCourses
            .filter((c) => !userCourses.some((uc) => uc.course_id === c.id))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.title_yo || c.title_en || c.name} ({c.target_audience || "All"})
              </option>
            ))}
        </select>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-lg bg-gray-300 text-black hover:bg-gray-400 transition"
          >
            {t("sidebar.cancel")}
          </button>
          <button
            onClick={handlePickCourse}
            disabled={!modalCourseId}
            className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {t("sidebar.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
