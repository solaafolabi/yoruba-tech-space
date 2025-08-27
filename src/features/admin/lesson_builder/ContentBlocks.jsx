import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const contentTypes = [
  { value: "video", label: "Video (YouTube or Upload)" },
  { value: "html", label: "HTML Content" },
  { value: "scratch", label: "Scratch Code" },
  { value: "code", label: "Code Snippet (JS, etc)" },
  { value: "image", label: "Image" },
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
              {(contents || []).map((content, index) => (
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

                          {/* Drag Handle */}
                          <span
                            {...provided.dragHandleProps}
                            className="cursor-move select-none p-1 text-gray-500 hover:text-gray-900"
                            title="Drag to reorder"
                          >
                            ☰
                          </span>
                        </div>
                      </div>

                      {/* Editors by type */}
                      {content.type === "video" ? (
                        <>
                          {/* English video */}
                          <input
                            type="text"
                            placeholder="Paste YouTube URL or leave empty for upload (English)"
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
                            Or Upload Video File (English):
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
                          {content.uploading_en && (
                            <p>Uploading video (English)...</p>
                          )}
                          {content.url_en && (
                            <video
                              controls
                              width="100%"
                              className="rounded"
                              src={content.url_en}
                            />
                          )}

                          {/* Yoruba video */}
                          <input
                            type="text"
                            placeholder="Paste YouTube URL or leave empty for upload (Yoruba)"
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
                            Or Upload Video File (Yoruba):
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
                          {content.uploading_yo && (
                            <p>Uploading video (Yoruba)...</p>
                          )}
                          {content.url_yo && (
                            <video
                              controls
                              width="100%"
                              className="rounded"
                              src={content.url_yo}
                            />
                          )}
                        </>
                      ) : content.type === "html" ? (
                        <>
                          <label className="block mb-1 font-semibold">
                            Content (English):
                          </label>
                          <ReactQuill
                            theme="snow"
                            value={content.content_en || ""}
                            onChange={(value) =>
                              updateContentBlock(index, "content_en", value)
                            }
                          />

                          <label className="block mt-4 mb-1 font-semibold">
                            Content (Yoruba):
                          </label>
                          <ReactQuill
                            theme="snow"
                            value={content.content_yo || ""}
                            onChange={(value) =>
                              updateContentBlock(index, "content_yo", value)
                            }
                          />
                        </>
                      ) : content.type === "image" ? (
                        <>
                          {/* English image */}
                          <label className="block mb-1 font-semibold">
                            Upload Image (English):
                          </label>
                          <input
                            type="file"
                            accept="image/*"
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
                          {content.uploading_en && (
                            <p>Uploading image (English)...</p>
                          )}
                          {content.url_en && (
                            <img
                              src={content.url_en}
                              alt="Uploaded English"
                              className="max-w-full rounded"
                            />
                          )}

                          {/* Yoruba image */}
                          <label className="block mb-1 font-semibold">
                            Upload Image (Yoruba):
                          </label>
                          <input
                            type="file"
                            accept="image/*"
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
                          {content.uploading_yo && (
                            <p>Uploading image (Yoruba)...</p>
                          )}
                          {content.url_yo && (
                            <img
                              src={content.url_yo}
                              alt="Uploaded Yoruba"
                              className="max-w-full rounded"
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <label className="block mb-1 font-semibold">
                            Content (English):
                          </label>
                          <textarea
                            rows={6}
                            placeholder={
                              content.type === "scratch"
                                ? "Enter Scratch JSON or code"
                                : "Enter code snippet"
                            }
                            value={content.content_en || ""}
                            onChange={(e) =>
                              updateContentBlock(
                                index,
                                "content_en",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                          />

                          <label className="block mt-4 mb-1 font-semibold">
                            Content (Yoruba):
                          </label>
                          <textarea
                            rows={6}
                            placeholder={
                              content.type === "scratch"
                                ? "Enter Scratch JSON or code"
                                : "Enter code snippet"
                            }
                            value={content.content_yo || ""}
                            onChange={(e) =>
                              updateContentBlock(
                                index,
                                "content_yo",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                          />
                        </>
                      )}
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
        onClick={addContentBlock}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Add Content Block
      </button>
    </div>
  );
}
