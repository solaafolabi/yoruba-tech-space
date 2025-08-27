// src/components/dashboard/PresentCourseCard.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function PresentCourseCard({ presentCourse, continueLesson }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  if (!presentCourse) return <div className="text-gray-300">{t("dashboard.noPresentCourse")}</div>;

  const presentCourseTitle =
    i18n.language === "yo" && presentCourse.title_yo
      ? presentCourse.title_yo
      : presentCourse.title_en || presentCourse.name;

  const continueHref =
    continueLesson ? `/dashboard/learn/${presentCourse.slug}/${continueLesson.slug}` : null;

  return (
    <div className="flex-1 bg-[#1B263B] p-6 rounded-xl shadow-xl">
      <h3 className="text-[#FFD700] font-semibold mb-4">{t("dashboard.presentCourse")}</h3>
      <p className="font-semibold text-white mb-2">📘 {presentCourseTitle}</p>
      {continueLesson ? (
        <>
          <div className="text-sm text-gray-300 mb-2">
            {t("dashboard.nextLesson")}:{" "}
            <span className="text-white font-medium">
              {i18n.language === "yo" && continueLesson.title_yo
                ? continueLesson.title_yo
                : continueLesson.title_en || continueLesson.title}
            </span>
          </div>
          <button
            onClick={() => navigate(continueHref)}
            className="mt-1 px-4 py-2 bg-[#FFD700] text-[#0D1B2A] rounded font-bold w-full"
          >
            {t("dashboard.continue")}
          </button>
        </>
      ) : (
        <div className="text-gray-300">{t("dashboard.allCompleted")}</div>
      )}
    </div>
  );
}
