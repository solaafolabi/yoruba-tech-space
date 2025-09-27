// src/components/HtmlCourse.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaHtml5 } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function HtmlCourse() {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen bg-[#0D1B2A] text-white px-6 py-20 mt-24 w-full">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex items-center gap-4"
        >
          <FaHtml5 className="text-5xl text-[#e44d26]" />
          <h1 className="text-4xl font-bold text-yellow-500">
            {t("htmlcss.title")}
          </h1>
        </motion.div>

        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          {t("htmlcss.description")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* HTML Block */}
          <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-600 shadow-lg">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d]">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <pre className="p-4 text-sm font-mono text-[#d4d4d4] overflow-x-auto">
{`<!DOCTYPE html>
<html>
  <head>
    <title>${t("htmlcss.exampleTitle")}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>${t("htmlcss.exampleHeading")}</h1>
    <p>${t("htmlcss.exampleParagraph")}</p>
  </body>
</html>`}
            </pre>
          </div>

          {/* CSS Block */}
          <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-600 shadow-lg">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d]">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <pre className="p-4 text-sm font-mono text-[#d4d4d4] overflow-x-auto">
{`body {
  background-color: #0D1B2A;
  color: white;
  font-family: sans-serif;
  text-align: center;
}

h1 {
  color: #FFD700;
}`}
            </pre>
          </div>
        </div>

        <button className="bg-yellow-600 text-[#0D1B2A] px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all">
          {t("htmlcss.startLesson")}
        </button>
      </div>
    </section>
  );
}
