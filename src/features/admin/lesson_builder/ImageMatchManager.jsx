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
  // Drag and drop reorder
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(matches);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setMatches(reordered);
  };

  const handleFileUpload = (file, index, lang) => {
    if (!file) return;
    const pair = matches[index];
    updateMatch(index, `uploading_${lang}`, true);

    // call parent uploadFile function
    uploadFile(file, index, activeLessonId, lang, index); // pairIndex passed
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">🖼️ Image Match Game</h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="imageMatches">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {matches.map((pair, index) => (
                <Draggable key={index} draggableId={`pair-${index}`} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="p-4 border rounded bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Pair #{index + 1}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeMatch(index)}
                            className="text-red-600 font-bold"
                          >
                            ×
                          </button>
                          <span
                            {...provided.dragHandleProps}
                            className="cursor-move select-none text-gray-500 hover:text-gray-900"
                          >
                            ☰
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* English */}
                        <div>
                          <label className="block mb-1 font-semibold">English Image:</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files.length > 0) {
                                const file = e.target.files[0];
                                updateMatch(index, "file_en", file);
                                handleFileUpload(file, index, "en");
                              }
                            }}
                            className="mb-2"
                          />
                          {pair.uploading_en && <p>Uploading English image...</p>}
                          {pair.url_en && (
                            <img
                              src={pair.url_en}
                              alt="English"
                              className="max-w-full rounded mt-2"
                            />
                          )}
                        </div>

                        {/* Yoruba */}
                        <div>
                          <label className="block mb-1 font-semibold">Yoruba Image:</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files.length > 0) {
                                const file = e.target.files[0];
                                updateMatch(index, "file_yo", file);
                                handleFileUpload(file, index, "yo");
                              }
                            }}
                            className="mb-2"
                          />
                          {pair.uploading_yo && <p>Uploading Yoruba image...</p>}
                          {pair.url_yo && (
                            <img
                              src={pair.url_yo}
                              alt="Yoruba"
                              className="max-w-full rounded mt-2"
                            />
                          )}
                        </div>
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
        className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        + Add Image Pair
      </button>
    </div>
  );
}
