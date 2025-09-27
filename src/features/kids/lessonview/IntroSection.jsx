// src/features/kids/IntroSection.jsx
import React, { useMemo } from "react";
import {
  Chip,
  FloatCard,
  GradientTitle,
  SpeakButton,
  SoundButton,
  cx,
} from "./ui-utils";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import htmlLang from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

// register languages once
SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("html", htmlLang);
SyntaxHighlighter.registerLanguage("css", css);

const ContentBlock = ({ block, i, theme, language, targetAudience }) => {
  const safeLang = language;

  switch (block.type) {
    case "image": {
      const src = safeLang === "yo" ? block.url_yo : block.url_en;
      const caption =
        safeLang === "yo" ? block.caption_yo || block.caption : block.caption;
      return (
        <FloatCard className={cx(theme.shadow, theme.card, "border-4", theme.border)}>
          <div className="flex items-center justify-between mb-2">
            <Chip className={theme.chip}>🖼️ Image</Chip>
            <SpeakButton text={block.alt || "This is an image"} theme={theme} />
          </div>
          <img
            src={src}
            alt={`lesson-image-${i}`}
            className="my-2 rounded-2xl w-full object-cover max-h-[420px]"
          />
          {caption && (
            <p className={cx("mt-2 text-sm sm:text-base font-semibold", theme.text)}>{caption}</p>
          )}
        </FloatCard>
      );
    }

    case "video": {
      const videoUrl = safeLang === "yo" ? block.content_yo : block.content_en;
      let embedUrl = videoUrl;
      if (typeof videoUrl === "string" && videoUrl.includes("youtube.com/watch")) {
        try {
          const videoId = new URL(videoUrl).searchParams.get("v");
          if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0`;
        } catch {}
      }
      const caption =
        safeLang === "yo" ? block.caption_yo || block.caption : block.caption;

      return (
        <FloatCard className={cx(theme.shadow, theme.card, "border-4", theme.border)}>
          <div className="flex items-center justify-between mb-2">
            <Chip className={theme.chip}>🎬 Video</Chip>
            <SpeakButton text={block.title || "Lesson video"} theme={theme} />
          </div>
          <div className={cx("w-full rounded-2xl overflow-hidden border-2", theme.border)}>
            <iframe
              width="100%"
              height="420"
              src={embedUrl}
              title={`lesson-video-${i}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-2xl"
            />
          </div>
          {caption && (
            <p className={cx("mt-2 text-sm sm:text-base font-semibold", theme.text)}>{caption}</p>
          )}
        </FloatCard>
      );
    }

    case "text": {
      const text = safeLang === "yo" ? block.content_yo : block.content_en;
      return (
        <FloatCard className={cx(theme.shadow, theme.card, "border-4", theme.border)}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <Chip className={theme.chip}>📖 Text</Chip>
            <div className="flex gap-2">
              <SpeakButton text={text} theme={theme} />
              {block.audio_url && <SoundButton label="Play Audio" src={block.audio_url} />}
            </div>
          </div>
          <p className={cx("text-lg md:text-xl font-extrabold leading-relaxed", theme.text)}>{text}</p>
        </FloatCard>
      );
    }

    case "html": {
      const html = safeLang === "yo" ? block.content_yo : block.content_en;
      return (
        <FloatCard className={cx(theme.shadow, "bg-white", "border-4 border-gray-200")}>
          <div className="flex items-center justify-between mb-3">
            <Chip className="bg-purple-200 text-purple-900">🧩 HTML</Chip>
            {block.audio_url && <SoundButton label="Play Audio" src={block.audio_url} />}
          </div>
          <div
            className={cx(
              "bg-white text-black p-6 rounded-lg shadow-sm",
              targetAudience === "4-7" && "text-4xl",
              targetAudience === "8-10" && "text-xl",
              targetAudience === "11-12" && "text-lg",
              targetAudience === "13-15" && "text-base"
            )}
            style={{ lineHeight: "1.8" }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </FloatCard>
      );
    }

    case "code": {
      const code = safeLang === "yo" ? block.content_yo : block.content_en;
      const language = block.language || "javascript";
      return (
        <FloatCard className={cx(theme.shadow, theme.card, "border-4", theme.border)}>
          <div className="flex items-center justify-between mb-3">
            <Chip className={theme.chip}>💻 Code</Chip>
            {block.audio_url && <SoundButton label="Explain" src={block.audio_url} />}
          </div>
          <SyntaxHighlighter
            language={language}
            style={atomOneDark}
            className="rounded-2xl mb-4 shadow-inner p-4"
          >
            {code}
          </SyntaxHighlighter>
        </FloatCard>
      );
    }

    default:
      return null;
  }
};

export default function IntroSection({
  lesson,
  language,
  theme,
  targetAudience,
}) {
  const contentBlocks = useMemo(
    () => lesson?.content_blocks || [],
    [lesson?.content_blocks]
  );

  return (
    <>
      {/* Hero description card */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <FloatCard className={cx(theme.card, theme.shadow, "border-4", theme.border)}>
          <div className="flex items-start justify-between gap-4">
            <p className={cx("text-lg md:text-xl font-extrabold leading-relaxed", theme.text)}>
              {language === "yo" ? lesson?.description_yo : lesson?.description_en}
            </p>
            <div className="flex flex-col gap-2 shrink-0">
              <SpeakButton text={language === "yo" ? lesson?.description_yo : lesson?.description_en} theme={theme} />
              {lesson?.file_url_en && (
                <a
                  href={language === "yo" ? lesson?.file_url_yo || lesson?.file_url_en : lesson?.file_url_en}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white text-gray-900 border border-black/10 shadow-sm hover:shadow"
                >
                  📄 Open File
                </a>
              )}
            </div>
          </div>
        </FloatCard>
      </div>

      {/* Content Blocks */}
      <div className="mx-auto max-w-6xl px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contentBlocks.map((block, i) => (
            <ContentBlock
              key={`block-${i}-${block?.type || "unknown"}`}
              block={block}
              i={i}
              theme={theme}
              language={language}
              targetAudience={targetAudience}
            />
          ))}
        </div>
      </div>
    </>
  );
}
