import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useTranslation } from "react-i18next";

export default function LessonStep({
  step,
  currentCode,
  setCurrentCode,
  onPass,
  isLastStep,
  previousSteps = [],
  showPreview = true,
  enableRun = true,
}) {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState("html");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [output, setOutput] = useState("");

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!step) {
    return (
      <div className="p-4 bg-green-800 text-white rounded">
        {t("lessonStep.noStepData")}
      </div>
    );
  }

  const langs = Array.isArray(step.lesson_type)
    ? step.lesson_type
    : typeof step.lesson_type === "string"
    ? step.lesson_type.split(",")
    : ["html"];

  const mergedCode = { html: "", css: "", js: "" };
  previousSteps.forEach((s) => {
    mergedCode.html += s.html || "";
    mergedCode.css += s.css || "";
    mergedCode.js += s.js || "";
  });
  langs.forEach((l) => {
    mergedCode[l] += currentCode[l] || "";
  });

  const codeForStep = langs.reduce(
    (acc, l) => ({ ...acc, [l]: currentCode[l] || "" }),
    {}
  );

  const totalTabs = langs.length + 1;

  // Determine instruction text based on current language
  const instructionText =
    i18n.language === "yo"
      ? step.instruction_yo || step.instruction_en
      : step.instruction_en || step.instruction_yo;

  const handleCheck = () => {
    const failed = [];

    Object.keys(step.validation_rules || {}).forEach((lang) => {
      const code = currentCode[lang] || "";
      const langRules = step.validation_rules[lang] || [];

      langRules.forEach((rule) => {
        const msgs = [];

        switch (rule.type) {
          case "contains":
            if (!code.includes(rule.value))
              msgs.push(
                t("lessonStep.validation.mustContain", {
                  lang: lang.toUpperCase(),
                  value: rule.value,
                })
              );
            break;
          case "notContains":
            if (code.includes(rule.value))
              msgs.push(
                t("lessonStep.validation.mustNotContain", {
                  lang: lang.toUpperCase(),
                  value: rule.value,
                })
              );
            break;
          case "equals":
            if (code.trim() !== rule.value.trim())
              msgs.push(
                t("lessonStep.validation.mustEqual", {
                  lang: lang.toUpperCase(),
                  value: rule.value,
                })
              );
            break;
          case "regex":
            try {
              const regex = new RegExp(rule.value);
              if (!regex.test(code))
                msgs.push(
                  t("lessonStep.validation.regexMismatch", {
                    lang: lang.toUpperCase(),
                    value: rule.value,
                  })
                );
            } catch {
              msgs.push(
                t("lessonStep.validation.invalidRegex", {
                  lang: lang.toUpperCase(),
                })
              );
            }
            break;
          case "mustHaveIds":
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(code, "text/html");
              rule.value.forEach((id) => {
                if (!doc.getElementById(id))
                  msgs.push(t("lessonStep.validation.missingId", { id }));
              });
            } catch {
              msgs.push(t("lessonStep.validation.htmlParseError"));
            }
            break;
          case "rule":
            const cssRegex = new RegExp(
              `${rule.selector}\\s*\\{[^}]*${rule.property}\\s*:\\s*${rule.value}`,
              "i"
            );
            if (!cssRegex.test(code))
              msgs.push(
                t("lessonStep.validation.missingCSS", {
                  selector: rule.selector,
                  property: rule.property,
                  value: rule.value,
                })
              );
            break;
          default:
            msgs.push(
              t("lessonStep.validation.unknownRule", { type: rule.type })
            );
        }

        if (msgs.length) failed.push(msgs.join(" "));
      });
    });

    if (failed.length) setError(failed.join("\n"));
    else {
      setError(null);
      onPass();
    }
  };

  const renderEditor = (lang) => (
    <div className="space-y-2 flex-1 min-w-0">
      <div className="flex items-center justify-between bg-[#FFD700] text-[#0D1B2A] px-3 py-1 rounded-t font-bold">
        <span>{t("lessonStep.editor", { lang: lang.toUpperCase() })}</span>
      </div>
      <p className="text-sm text-gray-300">
        {i18n.language === "yo"
          ? step[`${lang}_instruction_yo`] || step[`${lang}_instruction`]
          : step[`${lang}_instruction`] || step[`${lang}_instruction_yo`]}
      </p>
      <Editor
        height="300px"
        defaultLanguage={
          lang === "js"
            ? "javascript"
            : lang === "python"
            ? "python"
            : lang === "php"
            ? "php"
            : lang
        }
        path={`${lang}-file-${step.id}`}
        value={codeForStep[lang] || ""}
        onChange={(v) =>
          setCurrentCode((prev) => ({ ...prev, [lang]: v || "" }))
        }
        theme="vs-dark"
        options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
      />
    </div>
  );

  const previewCode = `<html><head><style>${currentCode.css || ""}</style></head><body>${currentCode.html || ""}<script>try { (function(){ ${currentCode.js || ""} })(); } catch(e) { document.body.innerHTML += '<pre style="color:red">'+e+'</pre>'; }</script></body></html>`;

  const runCode = async (lang) => {
    setOutput(t("lessonStep.running"));
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, code: codeForStep[lang] || "" }),
      });
      const data = await res.json();
      setOutput(data.result || t("lessonStep.noOutput"));
    } catch (err) {
      setOutput(t("lessonStep.errorRunning", { message: err.message }));
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold text-[#FFD700] mb-2">
        {t("lessonStep.step", { stepNumber: step.step_number })}
      </h2>
      <p className="mb-4 text-gray-300">{instructionText}</p>

      {/* MOBILE TABS */}
      <div
        className={`md:hidden mb-4 flex ${
          totalTabs <= 3 ? "justify-center flex-wrap gap-2" : "flex-nowrap overflow-x-auto gap-2"
        }`}
      >
        {langs.map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveMobileTab(lang)}
            className={`px-4 py-2 whitespace-nowrap rounded-full ${
              activeMobileTab === lang ? "bg-[#FFD700] text-[#0D1B2A] font-bold" : "bg-[#1B263B] text-white"
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
        {showPreview && (
          <button
            onClick={() => setActiveMobileTab("preview")}
            className={`px-4 py-2 whitespace-nowrap rounded-full ${
              activeMobileTab === "preview" ? "bg-[#FFD700] text-[#0D1B2A] font-bold" : "bg-[#1B263B] text-white"
            }`}
          >
            👀 {t("lessonStep.livePreview")}
          </button>
        )}
      </div>

      {/* DESKTOP GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {langs.map((lang) => (
          <div key={lang} className="bg-[#0D1B2A] p-2 rounded-lg">
            {(activeMobileTab === lang || !isMobile) && renderEditor(lang)}

            {enableRun && ["php", "python"].includes(lang) && (activeMobileTab === lang || !isMobile) && (
              <div className="mt-2">
                <button
                  onClick={() => runCode(lang)}
                  className="px-4 py-2 bg-green-600 text-white rounded w-full"
                >
                  {t("lessonStep.run", { lang: lang.toUpperCase() })}
                </button>
                <pre className="mt-2 bg-gray-900 text-white p-2 rounded">{output}</pre>
              </div>
            )}
          </div>
        ))}

        {showPreview && (activeMobileTab === "preview" || !isMobile) && (
          <div className="bg-[#1B263B] p-4 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold mb-2 text-[#FFD700]">{t("lessonStep.livePreview")}</h3>
            <iframe
              key={JSON.stringify(mergedCode)}
              title="preview"
              className="w-full h-[300px] border rounded-lg bg-white"
              srcDoc={previewCode}
            />
          </div>
        )}
      </div>

      {error && (
        <pre className="mt-4 bg-red-900/50 border border-red-600 text-white p-4 rounded font-mono whitespace-pre-wrap">
          {error}
        </pre>
      )}

      <button
        onClick={handleCheck}
        className="mt-6 w-full px-6 py-4 bg-[#FFD700] text-[#0D1B2A] font-bold text-lg rounded-full hover:bg-yellow-400 transition"
      >
        {isLastStep ? t("lessonStep.submitPractical") : t("lessonStep.checkCode")}
      </button>
    </div>
  );
}
