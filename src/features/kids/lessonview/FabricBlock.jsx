// src/features/kids/lessonview/FabricBlock.jsx
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import supabase from "../../../supabaseClient";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";

const FabricBlock = ({
  block,
  language,
  theme,
  userId,
  blockId,
  instructions = "",
  validationRules = {},
  backgroundColor = "#fff",
}) => {
  const { t } = useTranslation();

  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const containerRef = useRef(null);
  const colorTestCtx = useRef(null);

  const presetColors = [
    "#ff3b30", // red
    "#ff9500", // orange
    "#ffcc00", // yellow
    "#34c759", // green
    "#0a84ff", // blue
    "#5856d6", // purple
    "#000000", // black
    "#ffffff", // white
  ];
// Friendly color name → hex mapping (matches presetColors)
const colorMap = {
  red: "#ff3b30",
  orange: "#ff9500",
  yellow: "#ffcc00",
  green: "#34c759",
  blue: "#0a84ff",
  purple: "#5856d6",
  black: "#000000",
  white: "#ffffff",
};

  const [brushColor, setBrushColor] = useState(presetColors[0]);
  const [brushWidth, setBrushWidth] = useState(6);
  const [brushType, setBrushType] = useState("Pencil");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCongrats, setShowCongrats] = useState(false);
  const [score, setScore] = useState(null);

  const undoStack = useRef([]);
  const redoStack = useRef([]);

  // Utility: normalize colors using canvas context so "red", "#ff0000", "rgb(...)" compare equal
  const ensureColorContext = () => {
    if (colorTestCtx.current) return colorTestCtx.current;
    const cvs = document.createElement("canvas");
    colorTestCtx.current = cvs.getContext("2d");
    return colorTestCtx.current;
  };

const normalizeColor = (color) => {
  if (!color) return null;
  try {
    const ctx = ensureColorContext();
    ctx.fillStyle = "#000"; // reset
    ctx.fillStyle = color;
    // Always convert to hex for consistency
    const computed = ctx.fillStyle.toLowerCase();

    // Force rgb → hex
    const d = document.createElement("div");
    d.style.color = computed;
    document.body.appendChild(d);
    const rgb = getComputedStyle(d).color;
    document.body.removeChild(d);

    // convert "rgb(255, 0, 0)" → "#ff0000"
    const match = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, "0");
      const g = parseInt(match[2]).toString(16).padStart(2, "0");
      const b = parseInt(match[3]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
    return computed;
  } catch (e) {
    console.warn("normalizeColor failed:", color, e);
    return null;
  }
};


  // ========= Resize =========
  const resizeCanvas = () => {
    if (!fabricRef.current || !canvasRef.current) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    fabricRef.current.setWidth(containerRect.width - 16);
    fabricRef.current.setHeight(window.innerHeight - 180);
    fabricRef.current.renderAll();
  };


  // ========= Init Canvas =========
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || !(canvasEl instanceof HTMLCanvasElement)) return;

    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }

    const canvas = new fabric.Canvas(canvasEl, {
      backgroundColor: backgroundColor,
      isDrawingMode: true,
      selection: false,
    });
    fabricRef.current = canvas;

    // set default brush
    const pencil = new fabric.PencilBrush(canvas);
    pencil.width = brushWidth;
    pencil.color = brushColor;
    canvas.freeDrawingBrush = pencil;

    // draw event -> save state snapshot (JSON) for undo
    const onPathCreated = () => {
      setHasDrawn(true);
      try {
        undoStack.current.push(canvas.toJSON());
        redoStack.current = [];
      } catch (e) {
        // ignore
      }
    };
    canvas.on("path:created", onPathCreated);

    resizeCanvas();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => resizeCanvas(), 120);
    };

    window.addEventListener("resize", handleResize);

    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    setStartTime(Date.now());

    // load saved drawing if exists on block
    (async () => {
      try {
        if (block && block.savedDrawing) {
          canvas.loadFromJSON(block.savedDrawing, () => canvas.renderAll());
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      canvas.off("path:created", onPathCreated);
      ro.disconnect();
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [block, userId, blockId]);

  // ========= Brush Updates =========
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    // reset any mouse handlers
    canvas.off("mouse:down");

    if (brushType === "Rainbow") {
      // rainbow: pencil brush that cycles hue each time mouse is pressed
      let hue = 0;
      const rainbow = new fabric.PencilBrush(canvas);
      rainbow.width = brushWidth;
      rainbow.color = `hsl(${hue}, 100%, 50%)`;
      canvas.freeDrawingBrush = rainbow;

      canvas.on("mouse:down", () => {
        hue = (hue + 40) % 360;
        try {
          canvas.freeDrawingBrush.color = `hsl(${hue}, 100%, 50%)`;
        } catch (e) {}
      });
    } else if (brushType === "Spray") {
      const spray = new fabric.SprayBrush(canvas);
      spray.width = brushWidth;
      spray.color = brushColor;
      canvas.freeDrawingBrush = spray;
    } else {
      // Pencil or default
      const pencil = new fabric.PencilBrush(canvas);
      pencil.width = brushWidth;
      pencil.color = brushColor;
      canvas.freeDrawingBrush = pencil;
    }
  }, [brushColor, brushWidth, brushType]);

  // ========= Undo/Redo using JSON snapshots =========
  const handleUndo = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!undoStack.current.length) return;
    try {
      const current = canvas.toJSON();
      redoStack.current.push(current);
      const prev = undoStack.current.pop();
      canvas.loadFromJSON(prev, () => canvas.renderAll());
    } catch (e) {
      // fallback: clear
      console.warn(e);
    }
  };

  const handleRedo = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!redoStack.current.length) return;
    try {
      const next = redoStack.current.pop();
      undoStack.current.push(canvas.toJSON());
      canvas.loadFromJSON(next, () => canvas.renderAll());
    } catch (e) {
      console.warn(e);
    }
  };

  // ========= Clear =========
  const handleClear = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach((obj) => canvas.remove(obj));
    canvas.backgroundColor = backgroundColor;
    canvas.renderAll();
    setHasDrawn(false);
    setStartTime(Date.now());
    undoStack.current = [];
    redoStack.current = [];
  };

  // ========= Shape Tools =========
  const addCircle = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const circle = new fabric.Circle({
      radius: 50,
      fill: brushColor,
      left: 100,
      top: 100,
      selectable: true,
    });
    canvas.add(circle);
    undoStack.current.push(canvas.toJSON());
    redoStack.current = [];
    setHasDrawn(true);
  };

  const addRectangle = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const rect = new fabric.Rect({
      width: 100,
      height: 60,
      fill: brushColor,
      left: 100,
      top: 100,
      selectable: true,
    });
    canvas.add(rect);
    undoStack.current.push(canvas.toJSON());
    redoStack.current = [];
    setHasDrawn(true);
  };

  const addLine = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const line = new fabric.Line([50, 50, 150, 150], {
      stroke: brushColor,
      strokeWidth: brushWidth,
      selectable: true,
    });
    canvas.add(line);
    undoStack.current.push(canvas.toJSON());
    redoStack.current = [];
    setHasDrawn(true);
  };

  // ========= Validation =========
  // ========= Validation =========
const toolMap = {
  circle: (o) => o.type === "circle",
  rectangle: (o) => o.type === "rect",
  line: (o) => o.type === "line",
  pencil: (o) => o.type === "path" && !String(o.stroke || "").includes("hsl("),
  rainbow: (o) => o.type === "path" && String(o.stroke || "").includes("hsl("),
  spray: (o) => o.type === "path" && (o.path?.length || 0) > 5,
};

const validateDrawing = (canvas) => {
  const objects = canvas.getObjects();
  const rules = block?.validation_rules || validationRules || {};
  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  let reasons = [];
  let score = 0;

  if (objects.length === 0) return { valid: false, score: 0, reasons: ["empty"] };
  score += 10;

  // Normalize shape(s)
  if (rules.requireShape) {
    const requiredShapes = Array.isArray(rules.requireShape)
      ? rules.requireShape.map((s) => String(s).toLowerCase())
      : [String(rules.requireShape).toLowerCase()];

    requiredShapes.forEach((shape) => {
      const checkFn = toolMap[shape];
      if (checkFn) {
        const hasShape = objects.some(checkFn);
        if (hasShape) score += 20;
        else reasons.push(`missing_${shape}`);
      } else {
        console.warn("Unknown shape rule:", shape);
      }
    });
  }
console.log("RULE requireColor =", rules.requireColor);
objects.forEach((o, i) => {
  console.log("Object", i, {
    stroke: o.stroke,
    fill: o.fill,
    type: o.type,
  });
});

  // Normalize color
// ========= Color Validation =========
if (rules.requireColor) {
  const requiredName = rules.requireColor.toLowerCase();
  const requiredHex = colorMap[requiredName] || normalizeColor(rules.requireColor);

  let hasColor = false;
  objects.forEach((o) => {
    const stroke = (o.stroke || "").toLowerCase();
    const fill = (o.fill || "").toLowerCase();
    if (stroke === requiredHex || fill === requiredHex) {
      hasColor = true;
    }
  });

  if (hasColor) score += 20;
  else reasons.push(`missing_color_${rules.requireColor}`);
}


  // Time
  if (rules.minSeconds && elapsed >= rules.minSeconds) score += 20;
  else if (rules.minSeconds) reasons.push("too_fast");

  // Strokes
  if (rules.maxStrokes && objects.length > rules.maxStrokes) {
    reasons.push("too_many_strokes");
    score -= 10;
  }
  if (rules.minStrokes && objects.length < rules.minStrokes) {
    reasons.push("too_few_strokes");
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));
  const valid = reasons.length === 0 && score >= (rules.passMark || 70);

  console.log("Validation:", { rules, reasons, score, valid, objects });

  return { valid, score, reasons };
};


  // ========= Save =========
  const handleSave = async () => {
    setErrorMsg("");
    setScore(null);
    if (!userId) return setErrorMsg(t("drawing.error_user"));
    if (!blockId) return setErrorMsg(t("drawing.error_block"));
    if (!fabricRef.current) return setErrorMsg(t("drawing.error_canvas"));

    const validation = validateDrawing(fabricRef.current);
    setScore(validation.score);
    if (!validation.valid) {
      return setErrorMsg(`Your score is ${validation.score}/100. Try again!`);
    }

    setSaving(true);
    try {
      const data = JSON.stringify(fabricRef.current.toJSON());
      const { error: drawError } = await supabase.from("kid_drawings").upsert({
        user_id: userId,
        block_id: blockId,
        drawing: data,
        score: validation.score,
        updated_at: new Date().toISOString(),
      });
      if (drawError) setErrorMsg(t("drawing.error_save"));
      else {
        setSaved(true);
        try {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
        setShowCongrats(true);
        setTimeout(() => setShowCongrats(false), 4000);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ========= Download =========
  const handleDownload = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: "png" });
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${t("drawing.download_name")}.png`;
    link.click();
  };

  // Helpful: quick button to set brush to an easy-to-tap style
  const handlePickPreset = (c) => {
    setBrushColor(c);
    setBrushType("Pencil");
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full h-full px-2 relative">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t("drawing.heading")}</h2>
      {instructions ? (
        <div
          className="bg-yellow-100 p-4 rounded-md w-full text-base sm:text-lg md:text-xl text-gray-800 shadow-sm mb-2"
          dangerouslySetInnerHTML={{ __html: instructions }}
        />
      ) : (
        <p className="text-gray-500 italic mb-2">
          {language === "yo" ? "Kọ́ ẹ̀kọ́ yìí gẹ́gẹ́ bí olùkọ́ ṣe sọ." : "Follow the teacher’s instructions."}
        </p>
      )}

      <canvas ref={canvasRef} className="border border-gray-300 shadow-sm w-full rounded-md" style={{ display: "block", maxWidth: "100%", flex: "1 1 auto", touchAction: 'none' }} />

      {/* Kid-friendly palette */}
      <div className="flex items-center justify-center gap-3 mt-3 mb-2 flex-wrap">
        {presetColors.map((c) => (
          <button
            key={c}
            onClick={() => handlePickPreset(c)}
            title={c}
            className={`w-12 h-12 rounded-full shadow-lg transform transition-all duration-150 focus:outline-none flex items-center justify-center ${brushColor === c ? 'scale-110 ring-4 ring-offset-2 ring-yellow-300' : ''}`}
            style={{ backgroundColor: c }}
          >
            {/* show a smiley on the selected color for kids */}
            {brushColor === c ? <span className="text-sm font-bold">✓</span> : null}
          </button>
        ))}

        <button
          onClick={() => setBrushType("Rainbow")}
          className="px-3 py-2 rounded-lg font-bold shadow-lg bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 text-white transform hover:-translate-y-0.5"
        >
          🌈
        </button>

        <button
          onClick={() => setBrushType("Spray")}
          className={`px-3 py-2 rounded-lg font-bold shadow-lg border-2 ${brushType === 'Spray' ? 'border-black' : 'border-transparent'}`}
        >
          ✨ Spray
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-2 mb-2">
        <label className="flex items-center space-x-1">
          <span>{t("drawing.size")}</span>
          <input
            aria-label="brush size"
            type="range"
            min="1"
            max="40"
            value={brushWidth}
            onChange={(e) => setBrushWidth(parseInt(e.target.value))}
          />
        </label>

        <label className="flex items-center space-x-1">
          <span>{t("drawing.type")}</span>
          <select value={brushType} onChange={(e) => setBrushType(e.target.value)}>
            <option value="Pencil">{t("drawing.type_pencil")}</option>
            <option value="Spray">{t("drawing.type_spray")}</option>
            <option value="Rainbow">{t("drawing.type_rainbow")}</option>
          </select>
        </label>

        {/* Shape buttons */}
        <button className="px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600" onClick={addCircle}>
          {t("drawing.add_circle")}
        </button>
        <button className="px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600" onClick={addRectangle}>
          {t("drawing.add_rectangle")}
        </button>
        <button className="px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600" onClick={addLine}>
          {t("drawing.add_line")}
        </button>

        <button className="px-3 py-1 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600" onClick={handleUndo}>
          {t("drawing.undo")}
        </button>
        <button className="px-3 py-1 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600" onClick={handleRedo}>
          {t("drawing.redo")}
        </button>
        <button className="px-3 py-1 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600" onClick={handleClear}>
          {t("drawing.clear")}
        </button>
        <button className="px-3 py-1 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600" onClick={handleSave} disabled={saving || !hasDrawn}>
          {saving ? t("drawing.saving") : t("drawing.save")}
        </button>
        <button className="px-3 py-1 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600" onClick={handleDownload}>
          {t("drawing.download")}
        </button>
      </div>

      {score !== null && (
        <p className={`mt-1 font-bold ${score >= (validationRules.passMark || 70) ? "text-green-600" : "text-red-600"}`}>
          {t("drawing.score")}: {score}/100
        </p>
      )}
      {errorMsg && <p className="text-red-600 mt-1">{errorMsg}</p>}
      {saved && <p className="text-green-600 mt-1">{t("drawing.saved")}</p>}
      {showCongrats && (
        <div className="absolute top-1/4 bg-white border-4 border-green-400 shadow-xl p-6 rounded-2xl text-center animate-bounce z-50">
          <h3 className="text-2xl font-extrabold text-green-600">🎉 {t("drawing.save_success")}</h3>
        </div>
      )}
    </div>
  );
};

export default FabricBlock;
