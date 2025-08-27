// src/components/MonacoEditor.jsx

import React from "react";
import Editor from "@monaco-editor/react";

const MonacoEditor = ({ language, code, setCode, editorRef }) => {
  const handleEditorDidMount = (editor, monaco) => {
    if (editorRef) editorRef.current = editor;

    editor.updateOptions({
      autoClosingBrackets: "always",
      autoClosingQuotes: "always",
      autoSurround: "languageDefined",
      tabSize: 2,
      formatOnType: true,
      minimap: { enabled: false },
    });

    if (language === "html") {
      monaco.languages.html.htmlDefaults.setOptions({
        autoClosingTags: true,
        format: { enable: true },
      });
    }

    if (language === "css") {
      monaco.languages.css.cssDefaults.setOptions({
        format: { enable: true },
      });
    }

    if (language === "javascript") {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES6,
        allowNonTsExtensions: true,
      });
    }
  };

  return (
    <Editor
      height="400px"
      theme="vs-dark"
      language={language}
      value={code}
      onChange={(value) => setCode(value)}
      onMount={handleEditorDidMount}
    />
  );
};

export default MonacoEditor;
