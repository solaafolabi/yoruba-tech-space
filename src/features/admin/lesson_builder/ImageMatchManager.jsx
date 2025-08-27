// components/admin/lesson/ImageMatchManager.jsx
import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ImageMatchManager({
  matches = [],
  setMatches,
  addMatch,
  updateMatch,
  removeMatch,
  uploadFile,
  activeLessonId,
}) {
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(matches);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setMatches(reordered);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Image Match Blocks</h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="imageMatches">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
              {matches.map((match, index) => (
                <Draggable key={index} draggableId={`match-${index}`} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="p-4 border rounded bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          {...provided.dragHandleProps}
                          className="cursor-move select-none p-1 text-gray-500 hover:text-gray-900"
                          title="Drag to reorder"
                        >
                          ☰
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMatch(index)}
                          className="text-red-600 font-bold"
                          title="Remove match"
                        >
                          ×
                        </button>
                      </div>

                      <div className="mb-2">
                        <label className="block mb-1 font-semibold">Label (English)</label>
                        <input
                          type="text"
                          value={match.label_en || ""}
                          onChange={(e) => updateMatch(index, "label_en", e.target.value)}
                          className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                          placeholder="Enter label in English"
                        />
                      </div>

                      <div className="mb-2">
                        <label className="block mb-1 font-semibold">Label (Yoruba)</label>
                        <input
                          type="text"
                          value={match.label_yo || ""}
                          onChange={(e) => updateMatch(index, "label_yo", e.target.value)}
                          className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                          placeholder="Enter label in Yoruba"
                        />
                      </div>

                      <div className="mb-2">
                        <label className="block mb-1 font-semibold">Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files.length > 0) {
                              updateMatch(index, "file", e.target.files[0]);
                              uploadFile(e.target.files[0], index, activeLessonId, "match");
                            }
                          }}
                          className="mb-2"
                        />
                        {match.uploading && <p>Uploading image...</p>}
                        {match.url && (
                          <img src={match.url} alt="Match" className="max-w-full rounded mt-1" />
                        )}
                      </div>
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
        onClick={addMatch}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Add Image Match
      </button>
    </div>
  );
}
