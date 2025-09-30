import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import html2pdf from "html2pdf.js";

const LessonHeader = ({ lesson }) => {
  const { i18n } = useTranslation();
  const lessonRef = useRef(); // ✅ only lesson content

  const description =
    i18n.language === "yo"
      ? lesson?.description_yo || lesson?.description_en
      : lesson?.description_en || lesson?.description_yo;

  // ✅ Extend schema: allow width, height, style on <img>
  const customSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      img: [
        ...(defaultSchema.attributes?.img || []),
        "width",
        "height",
        "style",
      ],
    },
  };

  // ✅ Download handler (PDF-only styles)
  const handleDownload = () => {
    if (!lessonRef.current) return;

    const clone = lessonRef.current.cloneNode(true);

    // PDF-only styles
    clone.style.background = "white";
    clone.style.color = "black";
    clone.style.padding = "20px";
    clone.style.position = "relative";

    // ✅ Add watermark
    const watermark = document.createElement("div");
    watermark.innerText = "Yoruba Tech";
    Object.assign(watermark.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "60px",
      fontWeight: "bold",
      color: "rgba(0,0,0,0.1)",
      pointerEvents: "none",
      whiteSpace: "nowrap",
    });
    clone.appendChild(watermark);

    const opt = {
      margin: 0.5,
      filename: `${lesson?.title_en || "lesson"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(clone).save();
  };

  return (
    <>
      {/* Lesson Title */}
      <h1 className="text-3xl font-bold mb-4 text-[#FFD700]">
        📘{" "}
        {i18n.language === "yo"
          ? lesson?.title_yo || lesson?.title_en
          : lesson?.title_en || lesson?.title_yo}
      </h1>

      {/* Lesson Description */}
      {description && (
        <>
          <div ref={lessonRef}>
            <div
              className="
                mb-8 text-lg max-w-full 
                prose prose-invert list-inside
                text-justify 
                [&>*:first-child]:mt-0  

                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-[#FFD700]
                [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#FFD700]
                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#FFD700]
                [&_h4]:text-lg [&_h4]:font-medium [&_h4]:text-[#FFD700]
                [&_h5]:text-base [&_h5]:font-medium [&_h5]:text-[#FFD700]
                [&_h6]:text-sm [&_h6]:font-medium [&_h6]:text-[#FFD700]

                [&_ul]:list-disc [&_ol]:list-decimal 
                [&_li]:marker:text-[#FFD700] 

                [&_table]:border [&_table]:border-gray-600 [&_table]:border-collapse [&_table]:w-full 
                [&_th]:border [&_th]:border-gray-600 [&_th]:bg-[#1E293B] [&_th]:text-[#FFD700] [&_th]:px-3 [&_th]:py-2 
                [&_td]:border [&_td]:border-gray-600 [&_td]:px-3 [&_td]:py-2 
                [&_tr:nth-child(odd)]:bg-[#0F172A] [&_tr:nth-child(even)]:bg-[#1E293B] 

                [&_img]:rounded-lg [&_img]:shadow-lg
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeRaw], [rehypeSanitize, customSchema]]}
                components={{
                  code({ inline, className, children }) {
                    const match = /language-(\w+)/.exec(className || "");
                    if (!inline && match) {
                      return (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: "0.5rem",
                            padding: "1rem",
                          }}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      );
                    }
                    return (
                      <code className="bg-gray-800 text-yellow-300 px-1 rounded">
                        {children}
                      </code>
                    );
                  },
                  img({ node, ...props }) {
                    return <img {...props} />;
                  },
                }}
              >
                {description}
              </ReactMarkdown>
            </div>
          </div>

          {/* ✅ Button OUTSIDE lessonRef (won't be in PDF) */}
          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400"
          >
            📥{" "}
            {i18n.language === "yo"
              ? "Gba iwe ni PDF"
              : "Download as PDF"}
          </button>
        </>
      )}
    </>
  );
};

export default LessonHeader;
