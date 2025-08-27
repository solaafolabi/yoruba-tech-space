import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

const validTags = ["div", "p", "h1", "h2", "h3", "ul", "ol", "li", "a", "span", "section", "article", "header", "footer", "nav", "main", "em", "strong", "code", "pre", "table", "tr", "td", "th"];

const PracticalSubmission = () => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [consoleMessages, setConsoleMessages] = useState([]);
  const previewRef = useRef(null);

  const instructions = `
📌 Instructions:
1. Write your full HTML code in the left panel.
2. Your submission must include at least one valid HTML tag like <div>, <p>, <h1>, <ul>, <a>, etc.
3. Preview your rendered HTML live on the right.
4. Click "Submit" to send your work.
`;

  // Validate input for presence of at least one valid HTML tag
  const validateInput = () => {
    const inputLower = input.toLowerCase();
    const hasValidTag = validTags.some(tag => inputLower.includes(`<${tag}`));
    if (!hasValidTag) {
      setError("⚠️ Please include at least one valid HTML tag in your submission.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = () => {
    if (validateInput()) {
      alert("✅ Submission successful!");
      setInput("");
      setConsoleMessages((msgs) => [...msgs, "Submission sent!"]);
    }
  };

  useEffect(() => {
    if (input.includes("<script")) {
      setConsoleMessages((msgs) => [...msgs, "⚠️ Script tags detected. They will be stripped in preview."]);
    }
  }, [input]);

  const sanitizedHTML = DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true }
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-[#1B263B] p-6 rounded shadow">
      <div className="md:w-1/2 bg-[#102030] p-4 rounded flex flex-col">
        <h3 className="text-yellow-400 font-bold mb-4">Practical Task Instructions</h3>
        <pre className="whitespace-pre-wrap text-white mb-4">{instructions}</pre>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your full HTML code here..."
          spellCheck={false}
          className="w-full flex-grow p-3 rounded bg-[#0F172A] text-white resize-none focus:outline-yellow-400 font-mono"
          rows={15}
        />
        {error && <p className="mt-2 text-red-400 font-semibold">{error}</p>}
        <button
          onClick={handleSubmit}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-[#0F172A] font-bold py-2 px-4 rounded w-full transition"
        >
          Submit Practical
        </button>
      </div>

      <div className="md:w-1/2 bg-[#102030] p-4 rounded flex flex-col">
        <h3 className="text-yellow-400 font-bold mb-4">Live Preview</h3>
        <div
          ref={previewRef}
          className="flex-grow p-3 bg-[#0F172A] rounded text-white overflow-auto min-h-[300px] border border-yellow-400"
          dangerouslySetInnerHTML={{ __html: sanitizedHTML || "<em class='text-gray-400'>Your preview will appear here...</em>" }}
        />
        <h3 className="text-yellow-400 font-bold mt-6 mb-2">Console</h3>
        <div className="bg-black p-3 rounded min-h-[80px] max-h-[120px] overflow-y-auto text-green-400 font-mono text-sm">
          {consoleMessages.length === 0 ? (
            <em className="text-gray-600">Console output will appear here...</em>
          ) : (
            consoleMessages.map((msg, i) => <div key={i}>{msg}</div>)
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticalSubmission;
