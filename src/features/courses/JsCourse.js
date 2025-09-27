// src/components/JsCourse.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function JsCourse() {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen bg-[#0D1B2A] text-white px-6 py-20 mt-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex items-center gap-4"
        >
          <FaFire className="text-5xl text-yellow-500" />
          <h1 className="text-4xl font-bold text-yellow-500">
            {t("javascript.title")}
          </h1>
        </motion.div>

        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          {t("javascript.description")}
        </p>

        <div className="bg-[#1B263B] p-6 rounded-xl mb-8 border border-yellow-500 shadow-md">
          <h3 className="text-xl font-semibold text-yellow-500 mb-2">
            {t("javascript.codeExample")}
          </h3>
          <pre className="text-sm text-white overflow-x-auto">
{`const name = "${t("javascript.exampleName")}";
function greet() {
  console.log("${t("javascript.exampleGreeting")}" + name);
}

greet();`}
          </pre>
        </div>

        <button className="bg-yellow-600 text-[#0D1B2A] px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all">
          {t("javascript.startLesson")}
        </button>
      </div>
    </section>
  );
}
