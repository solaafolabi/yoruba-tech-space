import React from "react";

const contentTypes = [
  { value: "video", label: "Video" },
  { value: "html", label: "HTML Content" },
  { value: "scratch", label: "Scratch Code" },
  { value: "code", label: "Code Snippet (JS, etc)" },
];

export default function ContentBlock({
  content,
  index,
  updateContentBlock,
  removeContentBlock,
  uploadFile,
}) {
  return (
    <div className="mb-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <select
          value={content.type}
          onChange={(e) => updateContentBlock(index, "type", e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-700"
          aria-label={`Select content type for block ${index + 1}`}
        >
          {contentTypes.map((ct) => (
            <option key={ct.value} value={ct.value}>
              {ct.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => removeContentBlock(index)}
          className="text-red-600 font-bold"
          title="Remove Content Block"
          aria-label={`Remove content block ${index + 1}`}
        >
          ×
        </button>
      </div>

      {content.type === "video" ? (
        <>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files[0];
              updateContentBlock(index, "file", file);
              uploadFile(file, index);
            }}
            className="mb-2"
            aria-label="Upload video file"
          />
          {content.uploading && <p>Uploading video...</p>}
          {content.url && (
            <video controls width="100%" className="rounded">
              <source src={content.url} />
              Your browser does not support the video tag.
            </video>
          )}
        </>
      ) : (
        <textarea
          rows={6}
          placeholder="Enter content here"
          value={content.content}
          onChange={(e) => updateContentBlock(index, "content", e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700"
          aria-label={`Content for block ${index + 1}`}
        />
      )}
    </div>
  );
}
