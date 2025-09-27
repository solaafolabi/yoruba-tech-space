// src/components/PythonCourse.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaPython } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function PythonCourse() {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen bg-[#0D1B2A] text-white px-6 py-20 mt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex items-center gap-4"
        >
          <FaPython className="text-5xl text-[#4B8BBE]" />
          <h1 className="text-4xl font-bold text-yellow-500">
            {t("python.title")}
          </h1>
        </motion.div>

        {/* Topics */}
        <ul className="list-decimal list-inside text-gray-300 mb-6 space-y-2">
          <li>{t("python.topic1")}</li>
          <li>{t("python.topic2")}</li>
          <li>{t("python.topic3")}</li>
        </ul>

        {/* Code Example */}
        <div className="bg-[#1B263B] p-6 rounded-xl mb-8 border border-yellow-600 shadow-md">
          <h3 className="text-xl font-semibold text-yellow-500 mb-2">
            {t("python.codeExample")}
          </h3>
          <pre className="text-sm text-white overflow-x-auto">
{`import pandas as pd

data = {"${t("python.colName")}": ["Sola", "Grace"], "${t("python.colRole")}": ["Dev", "Designer"]}
df = pd.DataFrame(data)
print(df)`}
          </pre>
        </div>

        {/* Button */}
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="bg-yellow-600 text-[#0D1B2A] px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all">
            {t("python.startLesson")}
          </button>
        </a>
      </div>
    </section>
  );
}
