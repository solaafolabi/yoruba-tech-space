import React, { useRef, useEffect, useState } from "react";
import p5 from "p5";
import { useTranslation } from "react-i18next";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

export default function P5Block({ code: initialCode = "", onUpdate }) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef();
  const [code, setCode] = useState(
    initialCode ||
      `// Hello! Try changing the background color.
function s(p) {
  p.setup = () => {
    p.createCanvas(300, 250);
    p.background(200, 150, 250);
  };
  p.draw = () => {};
}`
  );
  const [error, setError] = useState(null);
  const [runKey, setRunKey] = useState(0);

  // Resize state
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const isResizing = useRef(false);

  const starterCode = `// Hello! Try changing the background color.
function s(p) {
  p.setup = () => {
    p.createCanvas(300, 250);
    p.background(200, 150, 250);
  };
  p.draw = () => {};
}`;

  const safeUpdate = typeof onUpdate === "function" ? onUpdate : () => {};

  useEffect(() => {
    if (!containerRef.current) return;
    let instance;

    // Clear old canvas before creating new
    containerRef.current.innerHTML = "";

    const sketch = (p) => {
      try {
        setError(null);
        const userFunc = new Function("p", `
          ${code}
          if (typeof s === "function") {
            s(p);
          }
        `);
        userFunc(p);
      } catch (e) {
        console.error("P5 code error:", e);
        setError(
          i18n.language.startsWith("yo")
            ? `Aṣiṣe kan wà nínú kóòdù rẹ: ${e.message}`
            : `There’s an error in your code: ${e.message}`
        );
      }
    };

    instance = new p5(sketch, containerRef.current);

    return () => {
      if (instance) instance.remove();
    };
  }, [runKey]);

  // Mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const parent = e.target.closest(".p5-playground");
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setEditorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="mb-4 p-4 rounded-2xl border-2 border-purple-400 bg-purple-50 shadow-md">
      {/* Instruction */}
      <div className="mb-3 p-2 bg-purple-200 rounded-lg text-purple-900 font-semibold text-sm shadow-sm">
        {i18n.language.startsWith("yo")
          ? t("p5_instructions_yo", "Ẹ jẹ́ kí a ṣe ìṣàwárí p5! Fọwọ́rọ̀ kóòdù rẹ̀ nibi.")
          : t("p5_instructions_en", "Let's explore p5! Type your code below.")}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-3 p-2 bg-red-100 border-l-4 border-red-500 text-red-800 rounded text-sm font-medium">
          {error}
        </div>
      )}

      {/* Side by side layout with resizer */}
      <div className="p5-playground flex flex-col lg:flex-row w-full relative">
        {/* Code editor */}
        <div
          className="min-w-[20%] max-w-[80%]"
          style={{ flexBasis: `${editorWidth}%` }}
        >
          <CodeMirror
            value={code}
            height="400px"
            extensions={[javascript()]}
            basicSetup={{ lineNumbers: true }}
            onChange={(value) => {
              setCode(value);
              safeUpdate("code", value);
            }}
            theme="dark"
            className="rounded-lg border-2 border-purple-300 shadow-sm"
          />

          {/* Action buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setRunKey((k) => k + 1)}
              className="px-4 py-2 bg-purple-500 text-white rounded-xl shadow hover:bg-purple-600"
            >
              {i18n.language.startsWith("yo") ? "Ṣe kóòdù" : "Run Code"}
            </button>
            <button
              onClick={() => {
                setCode(starterCode);
                setError(null);
                setRunKey((k) => k + 1);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-xl shadow hover:bg-gray-400"
            >
              {i18n.language.startsWith("yo") ? "Tun bẹrẹ" : "Reset"}
            </button>
          </div>
        </div>

        {/* Resizer handle */}
        <div
          onMouseDown={() => (isResizing.current = true)}
          className="hidden lg:block w-2 cursor-col-resize bg-purple-300 hover:bg-purple-500 transition-colors"
        />

        {/* P5 Canvas */}
        <div
          key={runKey}
          ref={containerRef}
          className="flex-1 border-4 border-purple-300 rounded-lg overflow-hidden bg-white min-h-[400px]"
        />
      </div>
    </div>
  );
}

