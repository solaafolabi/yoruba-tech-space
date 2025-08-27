// LessonStep.jsx
import Editor from "@monaco-editor/react";
import { useState } from "react";

export default function LessonStep({
  step,
  currentCode,
  setCurrentCode,
  onPass,
}) {
  const [error, setError] = useState(null);

  const handleCheck = () => {
    const rules = step.validation_rules || [];
    let allPassed = true;
    let messages = [];

    rules.forEach((rule) => {
      const code = currentCode[rule.language] || "";
      if (rule.type === "contains" && !code.includes(rule.value)) {
        allPassed = false;
        messages.push(`❌ Missing: ${rule.value} in ${rule.language}`);
      }
    });

    if (allPassed) {
      setError(null);
      onPass();
    } else {
      setError(messages.join("\n"));
    }
  };

  const lessonTypes = step.lesson_type?.split(",") || ["html"];

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-bold mb-2">Step {step.step_number}</h2>
      <p className="mb-4">{step.instruction}</p>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Editors */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-w-0">
          {lessonTypes.includes("html") && (
            <div className="flex-1 min-w-[250px]">
              <Editor
                height="300px"
                defaultLanguage="html"
                value={currentCode.html}
                onChange={(v) => setCurrentCode((c) => ({ ...c, html: v }))}
              />
            </div>
          )}
          {lessonTypes.includes("css") && (
            <div className="flex-1 min-w-[250px]">
              <Editor
                height="300px"
                defaultLanguage="css"
                value={currentCode.css}
                onChange={(v) => setCurrentCode((c) => ({ ...c, css: v }))}
              />
            </div>
          )}
          {lessonTypes.includes("js") && (
            <div className="flex-1 min-w-[250px]">
              <Editor
                height="300px"
                defaultLanguage="javascript"
                value={currentCode.js}
                onChange={(v) => setCurrentCode((c) => ({ ...c, js: v }))}
              />
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex-[0_0_500px] flex-shrink-0 bg-gray-50 p-2 rounded border">
          <h3 className="text-lg font-semibold mb-2">Live Preview 👇</h3>
          <iframe
            title="preview"
            className="w-full h-[400px] border rounded"
            srcDoc={`
              <html>
                <head><style>${currentCode.css || ""}</style></head>
                <body>${currentCode.html || ""}<script>${currentCode.js || ""}<\/script></body>
              </html>
            `}
          ></iframe>
        </div>
      </div>

      <button
        onClick={handleCheck}
        className="mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition"
      >
        Check Code ✅
      </button>

      {error && (
        <pre className="text-red-600 mt-2 whitespace-pre-wrap font-mono">
          {error}
        </pre>
      )}
    </div>
  );
}
