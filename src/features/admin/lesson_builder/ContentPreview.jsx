import React from "react";

/**
 * ContentPreview
 * Props:
 * - titleEn, descriptionEn
 * - contents (array)
 * - quizzes (array)
 * - onClose()
 */
function isValidYouTubeUrl(url) {
  if (!url) return false;
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&.+)?$/;
  return regex.test(url);
}

export default function ContentPreview({ titleEn, descriptionEn, contents = [], quizzes = [], onClose }) {
  const renderContentPreview = (content, idx) => {
    const contentValue = content.content_en ?? content.content ?? "";
    switch (content.type) {
      case "html":
        return <div key={idx} className="prose max-w-full" dangerouslySetInnerHTML={{ __html: contentValue }} />;
      case "video":
        if (content.url_en) {
          return (
            <video key={idx} controls width="100%" className="rounded">
              <source src={content.url_en} />
            </video>
          );
        }
        if (contentValue && isValidYouTubeUrl(contentValue)) {
          const videoId = contentValue.split("v=")[1] || contentValue.split("youtu.be/")[1];
          const cleanId = videoId ? videoId.split("&")[0] : null;
          if (!cleanId) return null;
          return (
            <iframe
              key={idx}
              width="100%"
              height="360"
              src={`https://www.youtube.com/embed/${cleanId}`}
              title="YouTube video player"
              frameBorder="0"
              allowFullScreen
            />
          );
        }
        return <p key={idx}>Invalid video URL</p>;
      case "image":
        return <img key={idx} src={content.url_en || content.url} alt="Lesson visual" className="max-w-full rounded" />;
      case "scratch":
      case "code":
        return (
          <pre key={idx} className="bg-gray-900 text-green-400 p-4 rounded overflow-auto whitespace-pre-wrap">
            {contentValue}
          </pre>
        );
      default:
        return <p key={idx}>{contentValue}</p>;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-start overflow-auto p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded p-6 max-w-3xl w-full max-h-[90vh] overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">{titleEn || "Untitled Lesson"}</h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">{descriptionEn}</p>

        <div className="space-y-6">
          {(!contents || contents.length === 0) && <p>No content blocks added yet.</p>}
          {contents.map((content, idx) => renderContentPreview(content, idx))}
        </div>

        <hr className="my-6" />

        <div>
          <h3 className="text-xl font-semibold mb-4">Quizzes</h3>
          {(!quizzes || quizzes.length === 0) && <p>No quizzes added yet.</p>}
          {quizzes.map((quiz, i) => (
            <div key={i} className="mb-4">
              <p className="font-semibold">{quiz.question_en}</p>
              <ul className="list-disc list-inside">
                {(quiz.options_en || []).map((opt, j) => (
                  <li key={j}>{opt}</li>
                ))}
              </ul>
              <p className="italic">Correct Answer: {quiz.correct_answer_en}</p>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Close Preview
        </button>
      </div>
    </div>
  );
}
