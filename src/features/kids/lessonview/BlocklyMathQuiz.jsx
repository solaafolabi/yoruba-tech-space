// src/features/kids/blockly/BlocklyMathQuiz.jsx
import React, { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import { javascriptGenerator } from "blockly/javascript";

const BlocklyMathQuiz = ({
  initialXml,
  instructions,
  readOnly = false,
  onChange, // ✅ callback from parent (LessonViewKid)
}) => {
  const workspaceRef = useRef(null);
  const blocklyDivRef = useRef(null);

  useEffect(() => {
    if (!blocklyDivRef.current) return;

    // ✅ Inject Blockly workspace
    workspaceRef.current = Blockly.inject(blocklyDivRef.current, {
      toolbox: `
        <xml>
          <block type="controls_repeat_ext"></block>
          <block type="math_number"></block>
          <block type="math_arithmetic"></block>
          <block type="text_print"></block>
        </xml>
      `,
      readOnly,
      scrollbars: true,
    });

    // ✅ Load initial XML
    if (initialXml) {
      try {
        const xmlDom = Blockly.Xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
      } catch (err) {
        console.error("Error parsing Blockly XML:", err);
      }
    }

    // ✅ Listen for changes in workspace
    if (!readOnly) {
      workspaceRef.current.addChangeListener(() => {
        const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
        const xmlText = Blockly.Xml.domToText(xml);
        const code = javascriptGenerator.workspaceToCode(workspaceRef.current);

        if (onChange) {
          onChange({
            studentXml: xmlText,   // 🔑 expected by validation
            studentCode: code,     // 🔑 expected by validation
            language: "javascript" // optional, future-proof
          });
        }
      });
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
      }
    };
  }, [initialXml, readOnly, onChange]);

  // ✅ Safe Run Code button handler
  const runCode = () => {
    if (!workspaceRef.current) return;
    const code = javascriptGenerator.workspaceToCode(workspaceRef.current);

    try {
      // Use safer Function wrapper instead of raw eval
      const result = Function(`"use strict"; ${code}`)();
      if (result !== undefined) {
        alert("Output: " + result);
      }
    } catch (e) {
      alert("⚠️ Error running code: " + e.message);
    }
  };

  return (
    <div className="p-4 border rounded bg-white">
      {/* Instructions */}
      {instructions && (
        <div
          className="mb-4 p-2 bg-purple-100 border border-purple-300 rounded text-purple-800"
          dangerouslySetInnerHTML={{ __html: instructions }}
        />
      )}

      {/* Blockly Workspace */}
      <div
        ref={blocklyDivRef}
        style={{ height: "400px", width: "100%", border: "1px solid #ccc" }}
      />

      {/* Run button */}
      {!readOnly && (
        <button
          onClick={runCode}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Run Code
        </button>
      )}
    </div>
  );
};

export default BlocklyMathQuiz;
