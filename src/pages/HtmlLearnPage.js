import React from "react";
import { useParams } from "react-router-dom";
import { htmlLessons } from "../data/htmlLessons";
import CourseDashboardLayout from "../layouts/CourseDashboardLayout";

export default function HtmlLearnPage() {
  const { lessonId } = useParams();
  const lesson = htmlLessons.find((l) => l.id === lessonId);

  if (!lesson) return <p className="text-red-500 p-6">Lesson not found</p>;

  const LessonComponent = lesson.component;

  return (
    <CourseDashboardLayout>
      <div className="w-full min-h-screen px-4 md:px-12 py-10 bg-[#0D1B2A] text-white flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#FFD700] mb-6 text-center">
          {lesson.title}
        </h1>

        {/* Dynamic lesson content (like WhatIsHtml) */}
        <div className="w-full max-w-5xl">
          <LessonComponent />
        </div>
      </div>
    </CourseDashboardLayout>
  );
}
