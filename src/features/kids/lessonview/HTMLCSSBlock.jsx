// src/features/lesson/HTMLCSSBlock.jsx
import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import Confetti from "react-confetti";
import { useTranslation } from "react-i18next";

// ---------------- Helpers ----------------
const cleanText = (str) => {
  if (!str) return "";
  return str.replace(/<\/?p>/g, "").trim();
};

const parseLessonSteps = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  if (typeof raw === "object") {
    if (Array.isArray(raw.lessonSteps)) return raw.lessonSteps;
    if (Array.isArray(raw.lesson_steps)) return raw.lesson_steps;
  }

  return [];
};

// ✅ Strip JSON-like text from instructions
const extractInstructions = (block, lang) => {
  const raw =
    block[`instructions_${lang}`] ||
    block.instructions_en ||
    "";

  if (typeof raw === "string" && raw.trim().startsWith("{")) {
    return "";
  }
  return cleanText(raw);
};

// ---------------- Component ----------------
export default function HTMLCSSBlock(props) {
  const {
    block = {},
    language = "en",
    userId = null,
    blockId = null,
  } = props;

  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(block.showHtml ? "html" : "css");
  const [html, setHtml] = useState(block.initialHtml || block.html_en || "");
  const [css, setCss] = useState(block.initialCss || block.css_en || "");
  const [feedback, setFeedback] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // ---------------- Data Prep ----------------
  const lessonSteps = parseLessonSteps(block.lessonSteps || block.lesson_steps);
  const validationRules =
    typeof block.validation_rules === "string"
      ? JSON.parse(block.validation_rules)
      : block.validation_rules || {};
  const instructions = extractInstructions(block, language);

  // ---------------- Validation ----------------
  const validateStep = () => {
    const step = lessonSteps[currentStep];
    const rule = step?.validation || validationRules;
    if (!rule) return false;

    if (rule.type === "contains") {
      return (html + css).includes(rule.target);
    }
    if (rule.type === "cssProperty") {
      const regex = new RegExp(
        `${rule.selector}\\s*{[^}]*${rule.property}\\s*:\\s*${rule.value}`,
        "i"
      );
      return regex.test(css);
    }
    return false;
  };

  const runCode = () => {
    if (!lessonSteps[currentStep] && !validationRules) return;
    if (validateStep()) {
      setFeedback(t("lesson.success", "✅ Great job!"));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      if (currentStep < lessonSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      setFeedback(t("lesson.tryAgain", "❌ Not quite, try again!"));
    }
  };

  const resetEditors = () => {
    setHtml(block.initialHtml || "");
    setCss(block.initialCss || "");
    setFeedback(t("lesson.feedbackReset", "🧹 All cleaned up! Try again!"));
    setCurrentStep(0);
  };

  // ---------------- Render ----------------
  return (
    <div className="mb-8 p-6 rounded-3xl border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 via-pink-50 to-green-100 shadow-2xl relative font-[Comic_Sans_MS]">
      {showConfetti && <Confetti numberOfPieces={180} recycle={false} />}

      {/* 🔹 Top-level instruction */}
      {instructions && (
        <div className="mb-4 p-3 bg-yellow-100 border-2 border-yellow-400 rounded-xl">
          <h3 className="font-bold text-lg text-yellow-700">
            📝 {instructions}
          </h3>
        </div>
      )}

      {/* 🔹 Step-by-step */}
      {lessonSteps.length > 0 && (
        <div className="mb-4 p-3 bg-purple-100 border-2 border-purple-400 rounded-xl">
          <h3 className="font-bold text-lg text-purple-700 mb-2">
            📝 Step {currentStep + 1}
          </h3>
          <p>
            {lessonSteps[currentStep][`instruction_${language}`] ||
              lessonSteps[currentStep].instruction_en ||
              "No instruction"}
          </p>
          {lessonSteps[currentStep].hint && (
            <p className="text-sm text-gray-600 italic">
              💡 {lessonSteps[currentStep].hint}
            </p>
          )}
        </div>
      )}

      {/* 🔹 Editors + Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editors */}
        <div className="flex flex-col">
          <div className="flex mb-3">
            {block.showHtml && (
              <button
                onClick={() => setActiveTab("html")}
                className={`flex-1 py-3 rounded-t-2xl font-bold text-lg ${
                  activeTab === "html"
                    ? "bg-blue-500 text-white scale-105 shadow-lg"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                📝 {t("lesson.html", "HTML")}
              </button>
            )}
            {block.showCss && (
              <button
                onClick={() => setActiveTab("css")}
                className={`flex-1 py-3 rounded-t-2xl font-bold text-lg ${
                  activeTab === "css"
                    ? "bg-green-500 text-white scale-105 shadow-lg"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                🎀 {t("lesson.css", "CSS")}
              </button>
            )}
          </div>

          <div className="rounded-b-2xl border-4 border-t-0 bg-gradient-to-br from-white to-yellow-50 shadow-inner overflow-hidden">
            {activeTab === "html" && (
              <CodeMirror
                value={html}
                height="280px"
                extensions={[htmlLang()]}
                theme="light"
                onChange={setHtml}
              />
            )}
            {activeTab === "css" && (
              <CodeMirror
                value={css}
                height="280px"
                extensions={[cssLang()]}
                theme="light"
                onChange={setCss}
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={resetEditors}
              className="px-5 py-2 bg-red-400 hover:bg-red-500 text-white rounded-2xl shadow-md font-bold"
            >
              🔄 {t("lesson.reset", "Reset")}
            </button>
            <button
              onClick={runCode}
              className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-md font-bold"
            >
              ▶️ {t("lesson.run", "Run")}
            </button>
          </div>

          {feedback && (
            <div className="mt-4 p-3 rounded-2xl text-center font-bold bg-gradient-to-r from-pink-200 to-purple-200 text-purple-700 border-2 border-purple-400 animate-pulse">
              {feedback}
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="flex flex-col">
          <p className="font-bold text-purple-700 mb-2 text-center text-lg">
            👀 {t("lesson.preview", "Magic Preview Area")}
          </p>
          <div className="border-4 border-purple-500 rounded-3xl bg-gradient-to-br from-white to-purple-50 shadow-xl overflow-hidden w-full h-[450px]">
            <iframe
              title="Live Preview"
              className="w-full h-full bg-white"
              sandbox="allow-same-origin allow-scripts"
              srcDoc={`<html>
                <head>${block.showCss ? `<style>${css}</style>` : ""}</head>
                <body>${block.showHtml ? html : ""}</body>
              </html>`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
