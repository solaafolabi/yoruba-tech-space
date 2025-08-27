// src/pages/student/components/LessonHeader.jsx
import React from "react";
import { useTranslation } from "react-i18next";

const LessonHeader = ({ lesson }) => {
  const { i18n } = useTranslation();

  return (
    <>
      <h1 className="text-3xl font-bold mb-4 text-[#FFD700]">
        📘{" "}
        {i18n.language === "yo"
          ? lesson?.title_yo || lesson?.title_en
          : lesson?.title_en || lesson?.title_yo}
      </h1>

      {(lesson?.description_en || lesson?.description_yo) && (
        <p className="mb-8 text-lg max-w-full whitespace-pre-line">
          {i18n.language === "yo"
            ? lesson?.description_yo || lesson?.description_en
            : lesson?.description_en || lesson?.description_yo}
        </p>
      )}
    </>
  );
};

export default LessonHeader;
