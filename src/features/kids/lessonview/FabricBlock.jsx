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
  const [drawMode, setDrawMode] = useState(null); // "circle" | "rect" | "line" | "triangle" | "star" | "heart" | "arrow" | null
  const [hasDrawn, setHasDrawn] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCongrats, setShowCongrats] = useState(false);
  const [score, setScore] = useState(null);

  const undoStack = useRef([]);
  const redoStack = useRef([]);

  // ======= Color normalization =======
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
      ctx.fillStyle = "#000";
      ctx.fillStyle = color;
      const computed = ctx.fillStyle.toLowerCase();

      // Force rgb -> hex via DOM computed style (works cross-browser)
      const d = document.createElement("div");
      d.style.color = computed;
      document.body.appendChild(d);
      const rgb = getComputedStyle(d).color;
      document.body.removeChild(d);

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

  // ======= Snapshot helpers =======
  const pushSnapshot = (cap = 50) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      const json = canvas.toJSON();
      undoStack.current.push(json);
      if (undoStack.current.length > cap) undoStack.current.shift();
      // when pushing a new snapshot, clear redo
      redoStack.current = [];
    } catch (e) {
      console.warn("pushSnapshot failed", e);
    }
  };

  // ======= Resize =======
  const resizeCanvas = () => {
    if (!fabricRef.current || !canvasRef.current) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    fabricRef.current.setWidth(containerRect.width - 16);
    fabricRef.current.setHeight(window.innerHeight - 180);
    fabricRef.current.renderAll();
  };

  // ======= Init Canvas =======
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || !(canvasEl instanceof HTMLCanvasElement)) return;

    // dispose previous if any
    if (fabricRef.current) {
      try {
        fabricRef.current.dispose();
      } catch (e) {}
      fabricRef.current = null;
    }

    const canvas = new fabric.Canvas(canvasEl, {
      backgroundColor: backgroundColor,
      isDrawingMode: true,
      selection: true,
    });
    fabricRef.current = canvas;

    // default free drawing brush
    const pencil = new fabric.PencilBrush(canvas);
    pencil.width = brushWidth;
    pencil.color = brushColor;
    canvas.freeDrawingBrush = pencil;

    // snapshot when objects change (keeps undo/redo consistent)
    const handleChange = () => {
      try {
        // push snapshot only when object added/modified/removed by user (not internal)
        pushSnapshot();
        setHasDrawn(true);
      } catch (e) {}
    };
    canvas.on("object:added", handleChange);
    canvas.on("object:modified", handleChange);
    canvas.on("object:removed", handleChange);

    // also snapshot when free drawing paths are created
    const onPathCreated = () => {
      setHasDrawn(true);
      pushSnapshot();
    };
    canvas.on("path:created", onPathCreated);

    // initial sizing and listeners
    resizeCanvas();
    let resizeTimeout = null;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 120);
    };
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    setStartTime(Date.now());

    // load saved drawing if provided
    (async () => {
      try {
        if (block && block.savedDrawing) {
          canvas.loadFromJSON(block.savedDrawing, () => {
            canvas.renderAll();
            // after load, record initial snapshot
            pushSnapshot();
          });
        } else {
          // push blank initial snapshot
          pushSnapshot();
        }
      } catch (e) {
        console.warn("loadFromJSON failed", e);
      }
    })();

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      canvas.off("object:added", handleChange);
      canvas.off("object:modified", handleChange);
      canvas.off("object:removed", handleChange);
      canvas.off("path:created", onPathCreated);
      try {
        ro.disconnect();
      } catch (e) {}
      try {
        canvas.dispose();
      } catch (e) {}
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block, userId, blockId]);

  // ======= Brush updates (free drawing) =======
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // If drawMode is active we want to disable free drawing
    canvas.isDrawingMode = !drawMode;

    // remove any previous mouse:down handler the brush set earlier
    canvas.off("mouse:down:brush"); // custom event name not actually used by fabric, safe but harmless

    if (brushType === "Rainbow") {
      let hue = 0;
      const rainbow = new fabric.PencilBrush(canvas);
      rainbow.width = brushWidth;
      rainbow.color = `hsl(${hue}, 100%, 50%)`;
      canvas.freeDrawingBrush = rainbow;

      // cycle hue on mouse down
      const cycleHue = () => {
        hue = (hue + 40) % 360;
        try {
          canvas.freeDrawingBrush.color = `hsl(${hue}, 100%, 50%)`;
        } catch (e) {}
      };
      // attach generic mouse down to canvas (not interfering with shape handlers)
      canvas.on("mouse:down", cycleHue);
      return () => canvas.off("mouse:down", cycleHue);
    } else if (brushType === "Spray") {
      const spray = new fabric.SprayBrush(canvas);
      spray.width = brushWidth;
      spray.color = brushColor;
      canvas.freeDrawingBrush = spray;
    } else {
      const pencil = new fabric.PencilBrush(canvas);
      pencil.width = brushWidth;
      pencil.color = brushColor;
      canvas.freeDrawingBrush = pencil;
    }
  }, [brushColor, brushWidth, brushType, drawMode]);

  // ======= Shape drawing mode (drag to draw) =======
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    let shape = null;
    let startX = 0;
    let startY = 0;

    const createStarPath = () =>
      // 5-point star centered at origin; we'll scale with scaleX/scaleY
      "M 0 -50 L 14 -15 H 47 L 23 7 L 29 40 L 0 25 L -29 40 L -23 7 L -47 -15 H -14 Z";

    const createHeartPath = () =>
      "M 0 -30 C -30 -60, -60 -10, 0 40 C 60 -10, 30 -60, 0 -30 Z";

    const createArrowPath = () =>
      // simple arrow to the right; scale to change size
      "M 0 0 L 80 0 L 80 -10 L 100 10 L 80 30 L 80 20 L 0 20 Z";

const handleMouseDown = (opt) => {
  if (!drawMode) return;
  const pointer = canvas.getPointer(opt.e);
  startX = pointer.x;
  startY = pointer.y;

  if (drawMode === "circle") {
    shape = new fabric.Circle({
      left: startX,
      top: startY,
      radius: 1,
      fill: brushColor,
      originX: "center",
      originY: "center",
      selectable: false,
    });
    shape.customType = "circle";
  } else if (drawMode === "rect") {
    shape = new fabric.Rect({
      left: startX,
      top: startY,
      width: 1,
      height: 1,
      fill: brushColor,
      originX: "left",
      originY: "top",
      selectable: false,
    });
    shape.customType = "rect";
  } else if (drawMode === "line") {
    shape = new fabric.Line([startX, startY, startX, startY], {
      stroke: brushColor,
      strokeWidth: brushWidth,
      selectable: false,
    });
    shape.customType = "line";
  } else if (drawMode === "triangle") {
    shape = new fabric.Triangle({
      left: startX,
      top: startY,
      width: 1,
      height: 1,
      fill: brushColor,
      originX: "left",
      originY: "top",
      selectable: false,
    });
    shape.customType = "triangle";
  } else if (drawMode === "star") {
    shape = new fabric.Path(createStarPath(), {
      left: startX,
      top: startY,
      originX: "center",
      originY: "center",
      fill: brushColor,
      selectable: false,
    });
    shape.customType = "star";
  } else if (drawMode === "heart") {
    shape = new fabric.Path(createHeartPath(), {
      left: startX,
      top: startY,
      originX: "center",
      originY: "center",
      fill: brushColor,
      selectable: false,
    });
    shape.customType = "heart";
  } else if (drawMode === "arrow") {
    shape = new fabric.Path(createArrowPath(), {
      left: startX,
      top: startY,
      originX: "center",
      originY: "center",
      fill: brushColor,
      selectable: false,
    });
    shape.customType = "arrow";
  } else if (drawMode === "diamond") {
    shape = new fabric.Polygon(
      [
        { x: 0, y: -40 },
        { x: 40, y: 0 },
        { x: 0, y: 40 },
        { x: -40, y: 0 },
      ],
      {
        left: startX,
        top: startY,
        originX: "center",
        originY: "center",
        fill: brushColor,
        selectable: false,
      }
    );
    shape.customType = "diamond";
  } else if (drawMode === "hexagon") {
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i;
      return { x: 40 * Math.cos(angle), y: 40 * Math.sin(angle) };
    });
    shape = new fabric.Polygon(points, {
      left: startX,
      top: startY,
      originX: "center",
      originY: "center",
      fill: brushColor,
      selectable: false,
    });
    shape.customType = "hexagon";
  } else if (drawMode === "cloud") {
    shape = new fabric.Path(
      "M 30 20 C 30 10, 50 10, 50 20 C 60 10, 80 20, 70 30 C 90 30, 90 50, 70 50 C 70 60, 50 60, 50 50 C 30 60, 10 50, 30 40 Z",
      {
        left: startX,
        top: startY,
        originX: "center",
        originY: "center",
        fill: brushColor,
        selectable: false,
      }
    );
    shape.customType = "cloud";
  }

  // ✅ Add shape to canvas if created
  if (shape) {
    canvas.add(shape);
  }
};
    const handleMouseMove = (opt) => {
      if (!shape || !drawMode) return;
      const pointer = canvas.getPointer(opt.e);
      const dx = pointer.x - startX;
      const dy = pointer.y - startY;

      if (drawMode === "circle") {
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;
        shape.set({ radius: Math.abs(radius) });
        // keep center at start; nothing else needed
      } else if (drawMode === "rect" || drawMode === "triangle") {
        // rectangle/triangle calculation: accommodate dragging in any direction
        const left = Math.min(startX, pointer.x);
        const top = Math.min(startY, pointer.y);
        const width = Math.abs(pointer.x - startX) || 1;
        const height = Math.abs(pointer.y - startY) || 1;
        shape.set({ left, top, width, height });
      } else if (drawMode === "line") {
        shape.set({ x2: pointer.x, y2: pointer.y });
      } else if (["star", "heart", "arrow"].includes(drawMode)) {
        // scale path by distance from center (use average)
        const scale = Math.max(0.01, Math.max(Math.abs(dx), Math.abs(dy)) / 50);
        shape.set({ scaleX: scale, scaleY: scale });
      }

      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (shape) {
        // finalize: make selectable and record customType stays
        shape.set({ selectable: true });
        // ensure object coordinates are clean
        shape.setCoords();
        pushSnapshot();
        setHasDrawn(true);
      }
      shape = null;
      // exit draw mode after one shape
      setDrawMode(null);
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [drawMode, brushColor, brushWidth]);

  // ======= Undo / Redo / Clear / Download =======
  const handleUndo = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // need at least 2 states: initial + current
    if (undoStack.current.length <= 1) return;
    try {
      const current = undoStack.current.pop();
      redoStack.current.push(current);
      const prev = undoStack.current[undoStack.current.length - 1];
      canvas.loadFromJSON(prev, () => {
        canvas.renderAll();
      });
    } catch (e) {
      console.warn("undo failed", e);
    }
  };

  const handleRedo = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!redoStack.current.length) return;
    try {
      const state = redoStack.current.pop();
      undoStack.current.push(state);
      canvas.loadFromJSON(state, () => {
        canvas.renderAll();
      });
    } catch (e) {
      console.warn("redo failed", e);
    }
  };

  const handleClear = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // snapshot current so user can undo clear
    pushSnapshot();
    canvas.getObjects().forEach((o) => canvas.remove(o));
    canvas.backgroundColor = backgroundColor;
    canvas.requestRenderAll();
    setHasDrawn(false);
    setStartTime(Date.now());
  };

  const handleDownload = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // force render to ensure everything up-to-date
    canvas.renderAll();
    const dataURL = canvas.toDataURL({ format: "png" });
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${t("drawing.download_name") || "drawing"}.png`;
    link.click();
  };

  // ======= Validation helpers / toolMap =======
  const toolMap = {
    circle: (o) => o.customType === "circle" || o.type === "circle",
    rectangle: (o) => o.customType === "rect" || o.type === "rect",
    line: (o) => o.customType === "line" || o.type === "line",
    triangle: (o) => o.customType === "triangle" || o.type === "triangle",
    star: (o) => o.customType === "star" || (o.type === "path" && o.path && String(o.path).includes("L") && (o.customType === "star" || false)),
    heart: (o) => o.customType === "heart" || (o.type === "path" && o.path && o.customType === "heart"),
    arrow: (o) => o.customType === "arrow" || (o.type === "path" && o.path && o.customType === "arrow"),
    pencil: (o) => o.type === "path" && !String(o.stroke || "").includes("hsl(") && !o.customType,
    rainbow: (o) => o.type === "path" && String(o.stroke || "").includes("hsl("),
    spray: (o) => o.type === "path" && (o.path?.length || 0) > 5,
    diamond: (o) => o.customType === "diamond" || o.type === "polygon",
hexagon: (o) => o.customType === "hexagon" || o.type === "polygon",
cloud: (o) => o.customType === "cloud" || (o.type === "path" && o.customType === "cloud"),

  };

  const validateDrawing = (canvas) => {
    const objects = canvas.getObjects();
    const rules = block?.validation_rules || validationRules || {};
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    let reasons = [];
    let score = 0;

    if (objects.length === 0) return { valid: false, score: 0, reasons: ["empty"] };
    score += 10;

    // Shapes required
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

    // Color required
    if (rules.requireColor) {
      const requiredName = String(rules.requireColor).toLowerCase();
      const requiredHex = colorMap[requiredName] || normalizeColor(rules.requireColor);

      let hasColor = false;
      objects.forEach((o) => {
        // some objects use stroke, some fill
        const stroke = normalizeColor(o.stroke);
        const fill = normalizeColor(o.fill);
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

  // Save to local storage
const saveToLocal = (json) => {
  if (!userId || !blockId) return;
  localStorage.setItem(`drawing_${userId}_${blockId}`, json);
};

// Load from local storage
const loadFromLocal = () => {
  if (!userId || !blockId) return null;
  return localStorage.getItem(`drawing_${userId}_${blockId}`);
};


  // ======= Save (unchanged semantics) =======
  const handleSave = async () => { setErrorMsg(""); setScore(null); if (!userId) return setErrorMsg(t("drawing.error_user")); if (!blockId) return setErrorMsg(t("drawing.error_block")); if (!fabricRef.current) return setErrorMsg(t("drawing.error_canvas")); const validation = validateDrawing(fabricRef.current); setScore(validation.score); if (!validation.valid) { return setErrorMsg(`Your score is ${validation.score}/100. Try again!`); } setSaving(true); try { const data = JSON.stringify(fabricRef.current.toJSON()); const { error: drawError } = await supabase.from("kid_drawings").upsert({ user_id: userId, block_id: blockId, drawing: data, score: validation.score, updated_at: new Date().toISOString(), }); if (drawError) { setErrorMsg(t("drawing.error_save")); } else { setSaved(true); try { confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }); } catch (e) {} setShowCongrats(true); setTimeout(() => setShowCongrats(false), 4000); setTimeout(() => setSaved(false), 2000); } } catch (err) { setErrorMsg(err.message); } finally { setSaving(false); } }; // ======= Load (when component mounts) ======= useEffect(() => { const loadDrawing = async () => { if (!userId || !blockId || !fabricRef.current) return; const { data, error } = await supabase .from("kid_drawings") .select("drawing, score") .eq("user_id", userId) .eq("block_id", blockId) .single(); if (error) { console.warn("No saved drawing:", error.message); return; } if (data?.drawing) { try { fabricRef.current.loadFromJSON(data.drawing, () => { fabricRef.current.renderAll(); }); } catch (e) { console.error("Error loading drawing JSON:", e); } } if (data?.score !== null) { setScore(data.score); } }; loadDrawing(); }, [userId, blockId]);
  // Helpful preset picker
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

      <canvas
        ref={canvasRef}
        className="border border-gray-300 shadow-sm w-full rounded-md"
        style={{ display: "block", maxWidth: "100%", flex: "1 1 auto", touchAction: "none" }}
      />

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
        </button>\
        <button
  className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "diamond" ? "ring-2 ring-yellow-300" : ""}`}
  onClick={() => setDrawMode("diamond")}
>
  ♦️
</button>
<button
  className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "hexagon" ? "ring-2 ring-yellow-300" : ""}`}
  onClick={() => setDrawMode("hexagon")}
>
  ⬡
</button>
<button
  className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "cloud" ? "ring-2 ring-yellow-300" : ""}`}
  onClick={() => setDrawMode("cloud")}
>
  ☁️
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

        {/* Shape buttons -> now set drawMode so kids drag to draw */}
        <button
          className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "circle" ? "ring-2 ring-yellow-300" : ""}`}
          onClick={() => setDrawMode("circle")}
        >
          {t("drawing.add_circle") || "Circle"}
        </button>
        <button
          className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "rect" ? "ring-2 ring-yellow-300" : ""}`}
          onClick={() => setDrawMode("rect")}
        >
          {t("drawing.add_rectangle") || "Rectangle"}
        </button>
        <button
          className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "line" ? "ring-2 ring-yellow-300" : ""}`}
          onClick={() => setDrawMode("line")}
        >
          {t("drawing.add_line") || "Line"}
        </button>
        <button
          className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "triangle" ? "ring-2 ring-yellow-300" : ""}`}
          onClick={() => setDrawMode("triangle")}
        >
          🔺
        </button>
        <button
          className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "star" ? "ring-2 ring-yellow-300" : ""}`}
          onClick={() => setDrawMode("star")}
        >
          ⭐
        </button>
        <button
          className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "heart" ? "ring-2 ring-yellow-300" : ""}`}
          onClick={() => setDrawMode("heart")}
        >
          ❤️
        </button>
        <button
          className={`px-3 py-1 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 ${drawMode === "arrow" ? "ring-2 ring-yellow-300" : ""}`}
          onClick={() => setDrawMode("arrow")}
        >
          ➡️
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
