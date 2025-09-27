// src/features/lesson/ContentBlocks.jsx
import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import BlocklyBlock from "../../kids/lessonview/BlocklyBlock";


const contentTypes = [
  { value: "video", label: "Video (YouTube or Upload)" },
  { value: "html", label: "HTML Content" },
  { value: "scratch", label: "Scratch Code" },
  { value: "code", label: "Code Snippet (JS, etc)" },
  { value: "image", label: "Image" },
  { value: "imagematch", label: "Image Match Game" },
  { value: "blockly", label: "Blockly (Drag & Drop Code)" },
  { value: "p5js", label: "p5.js Sketch" },
  { value: "kids_html_css", label: "Kids HTML + CSS" },
  { value: "fabric", label: "Fabric.js Canvas" },
];

export default function ContentBlocks({
  contents = [],
  setContents,
  addContentBlock,
  updateContentBlock,
  removeContentBlock,
  uploadFile,
  activeLessonId,
}) {
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(contents);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setContents(reordered);
  };

  const addPair = (contentIndex) => {
    const updatedPairs = [...(contents[contentIndex].pairs || []), {}];
    updateContentBlock(contentIndex, "pairs", updatedPairs);
  };

  const removePair = (contentIndex, pairIndex) => {
    const updatedPairs = [...(contents[contentIndex].pairs || [])].filter(
      (_, i) => i !== pairIndex
    );
    updateContentBlock(contentIndex, "pairs", updatedPairs);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">
        Content Blocks (Drag to reorder)
      </h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="contentBlocks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-6"
            >
              {contents.map((content, index) => (
                <Draggable
                  key={index}
                  draggableId={`content-${index}`}
                  index={index}
                >
                  {(provided) => (
                    <div
                      className="p-4 border rounded bg-gray-50 dark:bg-gray-800"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      {/* Header with type + controls */}
                      <div className="flex justify-between items-center mb-2">
                        <select
                          value={content.type}
                          onChange={(e) =>
                            updateContentBlock(index, "type", e.target.value)
                          }
                          className="p-2 border rounded bg-white dark:bg-gray-700"
                        >
                          {contentTypes.map((ct) => (
                            <option key={ct.value} value={ct.value}>
                              {ct.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => removeContentBlock(index)}
                            className="text-red-600 font-bold"
                            title="Remove block"
                          >
                            ×
                          </button>

                          <span
                            {...provided.dragHandleProps}
                            className="cursor-move select-none p-1 text-gray-500 hover:text-gray-900"
                            title="Drag to reorder"
                          >
                            ☰
                          </span>
                        </div>
                      </div>

                      {/* Content Editors */}
                      {/* Video */}
                      {content.type === "video" && (
                        <>
                          <input
                            type="text"
                            placeholder="YouTube URL (English)"
                            value={content.content_en || ""}
                            onChange={(e) =>
                              updateContentBlock(
                                index,
                                "content_en",
                                e.target.value
                              )
                            }
                            className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700"
                          />
                          <label className="block mb-1 font-semibold">
                            Or Upload Video (English)
                          </label>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              if (e.target.files.length > 0) {
                                updateContentBlock(
                                  index,
                                  "file_en",
                                  e.target.files[0]
                                );
                                uploadFile(
                                  e.target.files[0],
                                  index,
                                  activeLessonId,
                                  "en"
                                );
                              }
                            }}
                            className="mb-2"
                          />
                          {content.uploading_en && <p>Uploading video (English)...</p>}
                          {content.url_en && (
                            <video
                              controls
                              width="100%"
                              className="rounded"
                              src={content.url_en}
                            />
                          )}

                          <input
                            type="text"
                            placeholder="YouTube URL (Yoruba)"
                            value={content.content_yo || ""}
                            onChange={(e) =>
                              updateContentBlock(
                                index,
                                "content_yo",
                                e.target.value
                              )
                            }
                            className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700"
                          />
                          <label className="block mb-1 font-semibold">
                            Or Upload Video (Yoruba)
                          </label>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              if (e.target.files.length > 0) {
                                updateContentBlock(
                                  index,
                                  "file_yo",
                                  e.target.files[0]
                                );
                                uploadFile(
                                  e.target.files[0],
                                  index,
                                  activeLessonId,
                                  "yo"
                                );
                              }
                            }}
                            className="mb-2"
                          />
                          {content.uploading_yo && <p>Uploading video (Yoruba)...</p>}
                          {content.url_yo && (
                            <video
                              controls
                              width="100%"
                              className="rounded"
                              src={content.url_yo}
                            />
                          )}
                        </>
                      )}

                      {/* HTML */}
                      {content.type === "html" && (
                        <>
                          <label className="block mb-1 font-semibold">
                            Content (English)
                          </label>
                          <ReactQuill
                            theme="snow"
                            value={content.content_en || ""}
                            onChange={(value) =>
                              updateContentBlock(index, "content_en", value)
                            }
                          />
                          <label className="block mt-4 mb-1 font-semibold">
                            Content (Yoruba)
                          </label>
                          <ReactQuill
                            theme="snow"
                            value={content.content_yo || ""}
                            onChange={(value) =>
                              updateContentBlock(index, "content_yo", value)
                            }
                          />
                        </>
                      )}

                     {/* Image */}
{content.type === "image" && (
  <>
    <label className="block mb-1 font-semibold">
      Upload Image (English)
    </label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          updateContentBlock(index, "file_en", file);
          uploadFile(file, "en", index); // ✅ fixed
        }
      }}
      className="mb-2"
    />
    {content.uploading_en && <p>Uploading image (English)...</p>}
    {content.url_en && (
      <img
        src={content.url_en}
        alt="English"
        className="w-32 h-32 object-cover rounded mt-2"
      />
    )}

    <label className="block mb-1 font-semibold">
      Upload Image (Yoruba)
    </label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          updateContentBlock(index, "file_yo", file);
          uploadFile(file, "yo", index); // ✅ fixed
        }
      }}
      className="mb-2"
    />
    {content.uploading_yo && <p>Uploading image (Yoruba)...</p>}
    {content.url_yo && (
      <img
        src={content.url_yo}
        alt="Yoruba"
        className="w-32 h-32 object-cover rounded mt-2"
      />
    )}
  </>
)}


                   {/* Image Match */}
{content.type === "imagematch" && (
  <>
    <p className="font-semibold mb-2">
      Image Match Pairs (English ⇄ Yoruba)
    </p>
    {(content.pairs || []).map((pair, pIndex) => (
      <div
        key={pIndex}
        className="flex flex-col md:flex-row gap-6 items-start mb-6 p-3 border rounded-lg bg-white dark:bg-gray-700"
      >
        {/* English */}
        <div className="flex-1">
          <label className="block mb-1 font-semibold">
            English Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const updatedPairs = [...(content.pairs || [])];
                updatedPairs[pIndex] = {
                  ...updatedPairs[pIndex],
                  file_en: file,
                };
                updateContentBlock(index, "pairs", updatedPairs);
                uploadFile(file, "en", index, pIndex); // ✅ fixed
              }
            }}
          />
          {pair.url_en && (
            <img
              src={pair.url_en}
              alt="English"
              className="w-24 h-24 object-cover rounded mt-2"
            />
          )}
          <label className="block mt-2 font-semibold">
            English Label
          </label>
          <input
            type="text"
            value={pair.label_en || ""}
            onChange={(e) => {
              const updatedPairs = [...(content.pairs || [])];
              updatedPairs[pIndex] = {
                ...updatedPairs[pIndex],
                label_en: e.target.value,
              };
              updateContentBlock(index, "pairs", updatedPairs);
            }}
            placeholder="e.g. Keyboard"
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Yoruba */}
        <div className="flex-1">
          <label className="block mb-1 font-semibold">
            Yoruba Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const updatedPairs = [...(content.pairs || [])];
                updatedPairs[pIndex] = {
                  ...updatedPairs[pIndex],
                  file_yo: file,
                };
                updateContentBlock(index, "pairs", updatedPairs);
                uploadFile(file, "yo", index, pIndex); // ✅ fixed
              }
            }}
          />
          {pair.url_yo && (
            <img
              src={pair.url_yo}
              alt="Yoruba"
              className="w-24 h-24 object-cover rounded mt-2"
            />
          )}
          <label className="block mt-2 font-semibold">
            Yoruba Label
          </label>
          <input
            type="text"
            value={pair.label_yo || ""}
            onChange={(e) => {
              const updatedPairs = [...(content.pairs || [])];
              updatedPairs[pIndex] = {
                ...updatedPairs[pIndex],
                label_yo: e.target.value,
              };
              updateContentBlock(index, "pairs", updatedPairs);
            }}
            placeholder="e.g. Bọtini"
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="button"
          onClick={() => removePair(index, pIndex)}
          className="text-red-600 font-bold mt-2"
        >
          × Remove Pair
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={() => addPair(index)}
      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
    >
      + Add Pair
    </button>
  </>
)}
{/* Scratch / Code */}
{content.type === "scratch" && (
  <div className="p-3 border rounded bg-gray-50 dark:bg-gray-800">
    <p className="text-sm text-gray-600 dark:text-gray-300">
      This lesson will open the full Scratch editor for students. 
      No extra content is required here.
    </p>
  </div>
)}

{content.type === "blockly" && (
  <>
    {/* Game type dropdown */}
    <label className="block mt-4 mb-1 font-semibold">Blockly Game Type</label>
    <select
      value={content.gameType || ""}
      onChange={(e) => updateContentBlock(index, "gameType", e.target.value)}
      className="w-full p-2 border rounded bg-white dark:bg-gray-700"
    >
      <option value="">-- Select Game Type --</option>
      <option value="maze">Maze Game</option>
      <option value="mathquiz">Math Quiz</option>
      <option value="wordmatch">Word Match</option>
      <option value="memory">Memory Game</option>
      <option value="sorting">Sorting Game</option>
      <option value="pattern">Pattern Builder</option>
      <option value="counting">Counting Game</option>
      <option value="shapes">Shapes & Colors Match</option>
      <option value="sequence">Story Sequencing</option>
      <option value="spelling">Spelling Game</option>
      <option value="adventure">Coding Adventure</option>
      <option value="robot_graphics">Robot / Turtle Graphics</option>
      <option value="simulation">Simulation</option>
      <option value="puzzle">Puzzle / Logic</option>
      <option value="interactive">Event-driven Mini-game</option>
      <option value="ai_challenge">AI / Decision Making</option>
        <option value="music">Music Game</option>
  <option value="birds">Birds Game</option>
    </select>

    {/* Instructions */}
    <label className="block mt-4 mb-1 font-semibold">Instructions (English)</label>
    <textarea
      rows={3}
      placeholder="Explain what the student should do..."
      value={content.instructions_en || ""}
      onChange={(e) =>
        updateContentBlock(index, "instructions_en", e.target.value)
      }
      className="w-full p-2 border rounded bg-white dark:bg-gray-700"
    />

    <label className="block mt-2 mb-1 font-semibold">Instructions (Yoruba)</label>
    <textarea
      rows={3}
      placeholder="Ṣàlàyé ohun tí ọmọ yẹ kí ó ṣe..."
      value={content.instructions_yo || ""}
      onChange={(e) =>
        updateContentBlock(index, "instructions_yo", e.target.value)
      }
      className="w-full p-2 border rounded bg-white dark:bg-gray-700"
    />

    {/* Grading Rules */}
    <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <h3 className="font-bold mb-2">Grading Rules</h3>

      {/* Grading Type */}
      <label className="block mb-1">Grading Type</label>
      <select
        value={content.validation_rules?.grading_type || ""}
        onChange={(e) =>
          updateContentBlock(index, "validation_rules", {
            ...content.validation_rules,
            grading_type: e.target.value,
          })
        }
        className="w-full p-2 border rounded bg-white dark:bg-gray-700"
      >
        <option value="">-- Select Grading Type --</option>
        <option value="numeric">Numeric (e.g. 10, 20)</option>
        <option value="string">String (exact text)</option>
        <option value="boolean">True / False</option>
        <option value="behavior">Behavior (Maze, Movement, Loops)</option>
        <option value="code_structure">Code Structure (Variables, Loops, Functions)</option>
        <option value="logic">Logic (if, conditions)</option>
        <option value="math">Math (arithmetic, comparisons)</option>
        <option value="loops">Loops (repeat, while, for)</option>
        <option value="sequence">Sequence / Ordering</option>
        <option value="functions">Functions / Procedures</option>
        <option value="variables">Variables usage</option>
      </select>

      {/* Expected Answer(s) */}
      {["numeric", "string", "boolean"].includes(
        content.validation_rules?.grading_type
      ) && (
        <>
          <label className="block mt-4 mb-1">Expected Answer(s)</label>
          <input
            type="text"
            placeholder="e.g. 10, hello, true"
            value={content.validation_rules?.expected_answer || ""}
            onChange={(e) =>
              updateContentBlock(index, "validation_rules", {
                ...content.validation_rules,
                expected_answer: e.target.value,
              })
            }
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
          />
        </>
      )}

      {/* Behavior / Structure / Block Rules */}
      {[
        "behavior",
        "code_structure",
        "loops",
        "sequence",
        "logic",
        "math",
        "functions",
        "variables",
      ].includes(content.validation_rules?.grading_type) && (
        <>
          <label className="block mt-4 mb-1">Must Use Blocks</label>
          <input
            type="text"
            placeholder="e.g. controls_repeat_ext, math_arithmetic"
            value={content.validation_rules?.must_use || ""}
            onChange={(e) =>
              updateContentBlock(index, "validation_rules", {
                ...content.validation_rules,
                must_use: e.target.value,
              })
            }
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
          />

          <label className="block mt-4 mb-1">Forbidden Blocks</label>
          <input
            type="text"
            placeholder="e.g. variables_set, text_print"
            value={content.validation_rules?.forbidden || ""}
            onChange={(e) =>
              updateContentBlock(index, "validation_rules", {
                ...content.validation_rules,
                forbidden: e.target.value,
              })
            }
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
          />

          <label className="block mt-4 mb-1">Max Blocks Allowed</label>
          <input
            type="number"
            placeholder="e.g. 6"
            value={content.validation_rules?.max_blocks || ""}
            onChange={(e) =>
              updateContentBlock(index, "validation_rules", {
                ...content.validation_rules,
                max_blocks: e.target.value,
              })
            }
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
          />
        </>
      )}

      {/* 🔥 Extra fields for advanced games */}
      {["robot_graphics","pattern"].includes(content.gameType) && (
        <>
          <label className="block mt-4 mb-1 font-semibold">Canvas Target (optional)</label>
          <input
            type="text"
            placeholder="Target pattern or outcome ID"
            value={content.validation_rules?.canvas_target || ""}
            onChange={(e) =>
              updateContentBlock(index, "validation_rules", {
                ...content.validation_rules,
                canvas_target: e.target.value,
              })
            }
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
          />
        </>
      )}

      {["interactive","ai_challenge"].includes(content.gameType) && (
        <>
          <label className="block mt-4 mb-1 font-semibold">Event Rules (optional)</label>
          <textarea
            rows={3}
            placeholder="Define events or triggers..."
            value={content.validation_rules?.event_rules || ""}
            onChange={(e) =>
              updateContentBlock(index, "validation_rules", {
                ...content.validation_rules,
                event_rules: e.target.value,
              })
            }
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
          />
        </>
      )}
    </div>
  </>
)}


                      {/* p5.js */}
                      {content.type === "p5js" && (
                        <>
                          <label className="block mb-1 font-semibold">p5.js Code (English)</label>
                          <textarea
                            rows={8}
                            placeholder="// Write your p5.js sketch here"
                            value={content.code_en || ""}
                            onChange={(e) => updateContentBlock(index, "code_en", e.target.value)}
                            className="w-full p-2 border rounded bg-white dark:bg-gray-700 font-mono"
                          />
                          <label className="block mt-2 mb-1 font-semibold">p5.js Code (Yoruba)</label>
                          <textarea
                            rows={8}
                            placeholder="// Kọ àtẹ̀jáde p5.js rẹ nibi"
                            value={content.code_yo || ""}
                            onChange={(e) => updateContentBlock(index, "code_yo", e.target.value)}
                            className="w-full p-2 border rounded bg-white dark:bg-gray-700 font-mono"
                          />
                        </>
                      )}

                     {content.type === "kids_html_css" && (
  <div className="space-y-4">
    <p className="font-semibold">Kids HTML + CSS (Bilingual)</p>

    {/* Toggle visibility */}
    <div className="flex gap-4 items-center">
      <label className="flex items-center gap-2">
      <input
  type="checkbox"
  checked={!!content.show_html}
  onChange={(e) =>
    updateContentBlock(index, "show_html", e.target.checked)
  }
/>
Show HTML to students

      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={content.show_css !== false}
          onChange={(e) =>
            updateContentBlock(index, "show_css", e.target.checked)
          }
        />
        Show CSS to students
      </label>
    </div>

    {/* Editors */}
    <div className="grid md:grid-cols-2 gap-6">
      {/* English HTML */}
      <div>
        <label className="block text-sm font-semibold mb-1">HTML (English)</label>
        <textarea
          rows={6}
          value={content.html_en || ""}
          onChange={(e) => updateContentBlock(index, "html_en", e.target.value)}
          className="w-full p-2 border rounded font-mono bg-white dark:bg-gray-700"
          placeholder="<h1>Hello</h1>"
        />
      </div>

      {/* Yoruba HTML */}
      <div>
        <label className="block text-sm font-semibold mb-1">HTML (Yoruba)</label>
        <textarea
          rows={6}
          value={content.html_yo || ""}
          onChange={(e) => updateContentBlock(index, "html_yo", e.target.value)}
          className="w-full p-2 border rounded font-mono bg-white dark:bg-gray-700"
          placeholder="<h1>Bawo</h1>"
        />
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      {/* English CSS */}
      <div>
        <label className="block text-sm font-semibold mb-1">CSS (English)</label>
        <textarea
          rows={6}
          value={content.css_en || ""}
          onChange={(e) => updateContentBlock(index, "css_en", e.target.value)}
          className="w-full p-2 border rounded font-mono bg-white dark:bg-gray-700"
          placeholder="h1 { color: red; }"
        />
      </div>

      {/* Yoruba CSS */}
      <div>
        <label className="block text-sm font-semibold mb-1">CSS (Yoruba)</label>
        <textarea
          rows={6}
          value={content.css_yo || ""}
          onChange={(e) => updateContentBlock(index, "css_yo", e.target.value)}
          className="w-full p-2 border rounded font-mono bg-white dark:bg-gray-700"
          placeholder="h1 { color: blue; }"
        />
      </div>
    </div>

    {/* Live Preview */}
<div className="mt-4">
  <p className="font-semibold mb-2">Live Preview (Admin)</p>
<iframe
  className="w-full h-64 border rounded"
  style={{ backgroundColor: "#f9fafb", color: "#111827" }}
  srcDoc={`
    <html>
      <head>
        <style>
          body {
            background-color: #f9fafb;
            color: #111827;
            padding: 10px;
            font-family: sans-serif;
          }
          ${content.show_css !== false ? (content.css_en || "") + (content.css_yo || "") : ""}
        </style>
      </head>
      <body>
        ${content.show_html !== false ? (content.html_en || "") + (content.html_yo || "") : ""}
      </body>
    </html>
  `}
  title="Live Preview"
/>
</div>
  </div>
)}


                      {/* Fabric.js */}
                      {content.type === "fabric" && (
  <>
    <p className="mb-2 font-semibold">Fabric.js Canvas Block</p>
    <div className="border p-4 rounded mb-2 bg-white dark:bg-gray-700">
      [Canvas Placeholder]
    </div>

    {/* Validation Presets */}
    <label className="block mb-1 font-semibold">Validation Preset</label>
    <select
      value={content.validationPreset || ""}
      onChange={(e) => {
        const preset = e.target.value;
        let rules = {};

        if (preset === "circle") {
          rules = { requireCircle: true };
        } else if (preset === "red_circle") {
          rules = { requireCircle: true, requireColor: "red" };
        } else if (preset === "shapes") {
          rules = { requireCircle: true, requireRectangle: true };
        } else if (preset === "free_draw") {
          rules = {}; // no rules
        }

        updateContentBlock(index, "validationPreset", preset);
        updateContentBlock(index, "validation_rules", rules);
      }}
      className="w-full p-2 border rounded bg-white dark:bg-gray-700"
    >
      <option value="">-- Select Rule --</option>
      <option value="circle">Require a Circle</option>
      <option value="red_circle">Require a Red Circle</option>
      <option value="shapes">Require Circle + Rectangle</option>
      <option value="free_draw">Free Draw (no rules)</option>
    </select>

    {/* Show actual JSON for transparency */}
    <label className="block mt-2 font-semibold">Validation Rules (JSON)</label>
    <textarea
      rows={4}
      value={JSON.stringify(content.validation_rules || {}, null, 2)}
      onChange={(e) => {
        try {
          const parsed = JSON.parse(e.target.value);
          updateContentBlock(index, "validation_rules", parsed);
        } catch {
          // ignore invalid JSON
        }
      }}
      className="w-full p-2 border rounded font-mono bg-white dark:bg-gray-700"
    />
  </>
)}

                      {/* Common Instructions for all types */}
                      <label className="block mt-4 mb-1 font-semibold">Instructions (English)</label>
                      <ReactQuill
                        theme="snow"
                        value={content.instructions_en || ""}
                        onChange={(value) => updateContentBlock(index, "instructions_en", value)}
                      />
                      <label className="block mt-2 mb-1 font-semibold">Instructions (Yoruba)</label>
                      <ReactQuill
                        theme="snow"
                        value={content.instructions_yo || ""}
                        onChange={(value) => updateContentBlock(index, "instructions_yo", value)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        type="button"
        onClick={() => addContentBlock("html")}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Add Content Block
      </button>
    </div>
  );
}
