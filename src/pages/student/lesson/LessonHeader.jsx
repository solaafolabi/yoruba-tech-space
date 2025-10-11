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
  const lessonRef = useRef();

  const description =
    i18n.language === "yo"
      ? lesson?.description_yo || lesson?.description_en
      : lesson?.description_en || lesson?.description_yo;

  // -------------------------
  // Sanitizer: allow fieldset/legend + proper attributes (use "class" not "className")
  // -------------------------
  const customSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      img: [...(defaultSchema.attributes?.img || []), "width", "height", "style"],
      ul: [...(defaultSchema.attributes?.ul || []), "type"],
      ol: [...(defaultSchema.attributes?.ol || []), "type"],
      dl: [...(defaultSchema.attributes?.dl || [])],
      dt: [...(defaultSchema.attributes?.dt || [])],
      dd: [...(defaultSchema.attributes?.dd || [])],

      form: ["action", "method", "class"],
      input: [
        "id",
        "type",
        "name",
        "value",
        "placeholder",
        "checked",
        "class",
        "autocomplete",
      ],
      textarea: ["id", "name", "rows", "cols", "placeholder", "class"],
      select: ["id", "name", "class"],
      option: ["value", "selected", "class"],
      button: ["type", "class"],
      label: ["for", "class"],

      // fieldset + legend allowed attributes
      fieldset: ["class", "role"],
      legend: ["class"],
    },
    tagNames: [
      ...(defaultSchema.tagNames || []),
      "form",
      "input",
      "textarea",
      "select",
      "option",
      "button",
      "label",
      "fieldset",
      "legend",
    ],
  };

  const getListClass = (tag, type) => {
    if (tag === "ul") {
      switch (type) {
        case "circle":
          return "list-[circle]";
        case "square":
          return "list-[square]";
        default:
          return "list-disc";
      }
    }
    if (tag === "ol") {
      switch (type) {
        case "a":
          return "list-[lower-alpha]";
        case "A":
          return "list-[upper-alpha]";
        case "i":
          return "list-[lower-roman]";
        case "I":
          return "list-[upper-roman]";
        default:
          return "list-decimal";
      }
    }
    return "";
  };

  // -------------------------
  // PDF export (unchanged)
  // -------------------------
  const handleDownload = () => {
    if (!lessonRef.current) return;

    const clone = lessonRef.current.cloneNode(true);

    clone.style.background = "white";
    clone.style.color = "black";
    clone.style.padding = "20px";
    clone.style.position = "relative";

    clone.querySelectorAll("*").forEach((el) => {
      el.style.color = "black";
    });

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
      <h1 className="text-3xl font-bold mb-4 text-yellow-500">
        📘{" "}
        {i18n.language === "yo"
          ? lesson?.title_yo || lesson?.title_en
          : lesson?.title_en || lesson?.title_yo}
      </h1>

      {description && (
        <>
          <div ref={lessonRef}>
            <div
              className="
                mb-8 text-lg max-w-full 
                prose prose-invert list-inside

                [&_p]:mb-6
                [&_form]:my-6
                [&_table]:my-6
                [&_ul]:mb-6
                [&_ol]:mb-6
                [&_pre]:my-6
                [&_blockquote]:my-6

                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-yellow-500
                [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-yellow-500
                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-yellow-500

                [&_table]:border [&_table]:border-gray-600 [&_table]:border-collapse [&_table]:w-full
                [&_th]:border [&_th]:border-gray-600 [&_th]:bg-[#1E293B] [&_th]:text-yellow-500 [&_th]:px-3 [&_th]:py-2
                [&_td]:border [&_td]:border-gray-600 [&_td]:px-3 [&_td]:py-2
                [&_tr:nth-child(odd)]:bg-[#0F172A] [&_tr:nth-child(even)]:bg-[#1E293B]

                [&_img]:rounded-lg [&_img]:shadow-lg

                /* fieldset / legend styling */
                [&_fieldset]:border [&_fieldset]:border-gray-600 [&_fieldset]:p-4 [&_fieldset]:rounded-lg [&_fieldset]:mt-4
                [&_legend]:block [&_legend]:font-semibold [&_legend]:text-yellow-500 [&_legend]:mb-3

                /* labels & inputs - ensure label is block and inputs are clickable */
                [&_label]:block [&_label]:mt-3 [&_label]:mb-1 [&_label]:text-gray-200
                [&_input]:bg-white [&_input]:text-black [&_input]:rounded [&_input]:px-3 [&_input]:py-2 [&_input]:w-full [&_input]:pointer-events-auto
                [&_textarea]:bg-white [&_textarea]:text-black [&_textarea]:rounded [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:w-full [&_textarea]:pointer-events-auto
                [&_select]:bg-white [&_select]:text-black [&_select]:rounded [&_select]:px-3 [&_select]:py-2 [&_select]:w-full [&_select]:pointer-events-auto
                [&_button]:bg-blue-600 [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-lg [&_button]:hover:bg-blue-500
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeRaw], [rehypeSanitize, customSchema]]}
                // custom component renderers to ensure proper classes + behavior for fieldset/legend
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
                            background: "#1E293B",
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

                  // keep list rendering
                  ul: ({ node, ...props }) => (
                    <ul {...props} className={`pl-6 ${getListClass("ul", props.type)}`} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol {...props} className={`pl-6 ${getListClass("ol", props.type)}`} />
                  ),
                  li: ({ node, ...props }) => <li {...props} className="pl-1" />,

                  // images
                  img: ({ node, ...props }) => (
                    <img {...props} className="max-w-full h-auto rounded-lg shadow-lg" />
                  ),

                  // definition lists
                  dl: ({ node, ...props }) => <dl {...props} className="my-4" />,
                  dt: ({ node, ...props }) => (
                    <dt {...props} className="font-bold mt-2 text-yellow-500" />
                  ),
                  dd: ({ node, ...props }) => <dd {...props} className="ml-6 mb-2 text-gray-300" />,

                  // FIELDSET + LEGEND: render with classes so legend spacing works
                  fieldset: ({ node, ...props }) => {
                    const { children, className, ...rest } = props;
                    return (
                      <fieldset {...rest} className={`border border-gray-600 p-4 rounded-lg mt-4 ${className || ""}`}>
                        {children}
                      </fieldset>
                    );
                  },
                  legend: ({ node, ...props }) => {
                    const { children, className, ...rest } = props;
                    return (
                      <legend {...rest} className={`block font-semibold text-yellow-500 mb-3 ${className || ""}`}>
                        {children}
                      </legend>
                    );
                  },

                  // ensure labels and inputs are passed through (so label->for works and input is focusable)
                  label: ({ node, ...props }) => {
                    const { children, className, ...rest } = props;
                    return (
                      <label {...rest} className={`block mt-3 mb-1 text-gray-200 ${className || ""}`}>
                        {children}
                      </label>
                    );
                  },

                  input: ({ node, ...props }) => {
                    // preserve incoming props (id, name, type, placeholder, etc.)
                    const { className, ...rest } = props;
                    return (
                      <input
                        {...rest}
                        className={`bg-white text-black rounded px-3 py-2 w-full ${className || ""}`}
                      />
                    );
                  },
                }}
              >
                {description}
              </ReactMarkdown>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400"
          >
            📥 {i18n.language === "yo" ? "Gba iwe ni PDF" : "Download as PDF"}
          </button>
        </>
      )}
    </>
  );

};

export default LessonHeader;
