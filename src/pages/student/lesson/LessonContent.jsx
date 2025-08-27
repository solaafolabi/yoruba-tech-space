// src/pages/student/components/LessonContent.jsx
import React from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import htmlLang from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useTranslation } from "react-i18next";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("html", htmlLang);
SyntaxHighlighter.registerLanguage("css", css);

const LessonContent = ({ lesson }) => {
  const { i18n } = useTranslation();

  const renderBlock = (block, i) => {
    const lang = i18n.language;
    switch (block.type) {
      case "image":
        return (
          <img
            key={i}
            src={lang === "yo" ? block.url_yo : block.url_en}
            alt={`lesson-block-${i}`}
            className="my-4 max-w-full rounded shadow"
          />
        );
      case "text":
        return (
          <p key={i} className="mb-4 text-lg whitespace-pre-line">
            {lang === "yo" ? block.content_yo : block.content_en}
          </p>
        );
      case "code":
        return (
          <div
            key={i}
            className="mb-6 overflow-x-auto bg-[#1E293B] p-4 rounded-lg shadow-inner"
          >
            <SyntaxHighlighter
              language={block.language || "javascript"}
              style={atomOneDark}
              customStyle={{ margin: 0, padding: 0, background: "transparent" }}
              wrapLongLines
            >
              {lang === "yo" ? block.content_yo : block.content_en}
            </SyntaxHighlighter>
          </div>
        );
      case "html":
        return (
          <div
            key={i}
            className="mb-6 prose prose-invert max-w-full overflow-auto"
            dangerouslySetInnerHTML={{
              __html: lang === "yo" ? block.content_yo : block.content_en,
            }}
          />
        );
      case "scratch":
        const scratchUrl = lang === "yo" ? block.content_yo : block.content_en;
        if (!scratchUrl) return null;
        return (
          <div
            key={i}
            className="mb-6 rounded shadow overflow-hidden"
            style={{ aspectRatio: "4 / 3", maxWidth: "100%" }}
          >
            <iframe
              title={`scratch-project-${i}`}
              src={scratchUrl}
              frameBorder="0"
              allowFullScreen
              width="100%"
              height="480"
              className="rounded"
            />
          </div>
        );
      case "video":
        const videoUrl = lang === "yo" ? block.content_yo : block.content_en;
        if (!videoUrl) return null;
        let youtubeId = null;
        const ytMatch = videoUrl.match(
          /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/
        );
        if (ytMatch) youtubeId = ytMatch[1];
        return (
          <div
            key={i}
            className="mb-6 aspect-w-16 aspect-h-9 max-w-full rounded overflow-hidden shadow-lg"
          >
            {youtubeId ? (
              <iframe
                title={`youtube-video-${i}`}
                width="100%"
                height="360"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                frameBorder="0"
                allowFullScreen
              />
            ) : (
              <video
                controls
                src={videoUrl}
                className="w-full rounded"
                preload="metadata"
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-10 max-w-full prose prose-invert">
      {lesson?.content_blocks?.map((block, i) => renderBlock(block, i))}
    </div>
  );
};

export default LessonContent;
