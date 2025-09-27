// src/features/blockly/BlocklyBlock.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import * as BlocklyMsgEn from "blockly/msg/en";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";

import { validateBlocklySubmission } from "../../kids/lessonview/validation";

Blockly.setLocale(BlocklyMsgEn);

// ------------------- TOOLBOX MAP -------------------
const TOOLBOXES = {
  default: `<xml>
      <category name="✨ Logic" colour="#FF99CC">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
      </category>
      <category name="🎠 Loops" colour="#FFCC66">
        <block type="controls_repeat_ext"></block>
        <block type="controls_whileUntil"></block>
        <block type="controls_for"></block>
      </category>
      <category name="🧮 Math" colour="#99CCFF">
        <block type="math_number"></block>
        <block type="math_arithmetic"></block>
      </category>
      <category name="💬 Text" colour="#CC99FF">
        <block type="text"></block>
        <block type="text_print"></block>
      </category>
      <category name="📌 Variables" colour="#FF6961" custom="VARIABLE"></category>
      <category name="⚡ Functions" colour="#61C0BF" custom="PROCEDURE"></category>
    </xml>`,
};

// ------------------- CUSTOM BLOCKS -------------------
const defineCustomBlocks = () => {
  if (!Blockly.Blocks["html_block"]) {
    Blockly.Blocks["html_block"] = {
      init() {
        this.appendDummyInput()
          .appendField("Make HTML")
          .appendField(new Blockly.FieldTextInput("<p>Hello</p>"), "HTML_CONTENT");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour("#FF99CC");
      },
    };
    javascriptGenerator.forBlock["html_block"] = (block) => block.getFieldValue("HTML_CONTENT") + "\n";
    pythonGenerator.forBlock["html_block"] = (block) => `"""${block.getFieldValue("HTML_CONTENT")}"""\n`;
  }
};
defineCustomBlocks();

// ------------------- COMPONENT -------------------
const BlocklyBlock = ({ gameType = "default", initialXml = "<xml></xml>", instructions = "", readOnly = false, onChange, block }) => {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);
  const pyodideRef = useRef(null);

  const [code, setCode] = useState("// Your generated code will appear here...");
  const [output, setOutput] = useState("👉 Your program will run here...");
  const [mode, setMode] = useState("javascript");

  // ------------------- Load Pyodide for Python -------------------
  useEffect(() => {
    const loadPyodide = async () => {
      if (!pyodideRef.current && window.loadPyodide) {
        pyodideRef.current = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" });
        console.log("🐍 Pyodide ready!");
        pyodideRef.current.runPython(`
import sys
class Capturer:
    def __init__(self):
        self.data = ""
    def write(self, txt):
        self.data += txt
    def flush(self): pass
capturer = Capturer()
sys.stdout = capturer
        `);
      }
    };
    loadPyodide();
  }, []);

  // ------------------- Initialize Blockly -------------------
  useEffect(() => {
    if (!blocklyDiv.current) return;

    // Dispose previous workspace safely
    if (workspaceRef.current) {
      try {
        workspaceRef.current.dispose();
      } catch {}
      workspaceRef.current = null;
    }

    const workspace = Blockly.inject(blocklyDiv.current, {
      toolbox: TOOLBOXES[gameType] || TOOLBOXES.default,
      trashcan: true,
      scrollbars: true,
      renderer: "zelos",
      readOnly,
      theme: Blockly.Themes.Classic,
    });
    workspaceRef.current = workspace;

    // Load initial XML
    try {
      const xml = Blockly.Xml.textToDom(initialXml);
      Blockly.Xml.domToWorkspace(xml, workspace);
    } catch {
      setOutput("⚠️ Invalid initial XML.");
    }

    // ------------------- Handle Workspace Changes -------------------
    const handleChange = () => {
      try {
        const generator = mode === "javascript" ? javascriptGenerator : pythonGenerator;
        const newCode = generator.workspaceToCode(workspaceRef.current) || "// Empty program";
        setCode(newCode);

        const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
        const xmlText = Blockly.Xml.domToText(xml);

        if (onChange) {
          const result = block ? validateBlocklySubmission(block, xmlText, newCode) : { success: true, feedback: "" };
          onChange({ studentXml: xmlText, studentCode: newCode, executionOutput: output, mode, validationResult: result });
        }
      } catch (err) {
        setCode("// ⚠️ Code generation error: " + err.message);
      }
    };

    workspace.addChangeListener(handleChange);

    const handleResize = () => Blockly.svgResize(workspaceRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (workspaceRef.current) {
        try {
          workspaceRef.current.dispose();
        } catch {}
        workspaceRef.current = null;
      }
    };
  }, [initialXml, readOnly, mode, onChange, gameType, block, output]);

  // ------------------- Run Code -------------------
  const runCode = useCallback(async () => {
    if (!workspaceRef.current) return;

    const studentXml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));
    let executionOutput = "";
    const studentCode = code;

    if (mode === "javascript") {
      try {
        let captured = "";
        const originalLog = console.log;
        console.log = (...args) => {
          captured += args.join(" ") + "\n";
          originalLog(...args);
        };
        const result = eval(code);
        executionOutput = captured || (result ?? "Done!");
        console.log = originalLog;
      } catch (e) {
        executionOutput = "⚠️ JS Error: " + e.message;
      }
    } else if (mode === "python") {
      try {
        if (!pyodideRef.current) executionOutput = "⚠️ Python runtime not ready...";
        else {
          await pyodideRef.current.runPythonAsync(code);
          executionOutput = pyodideRef.current.runPython("capturer.data") || "Done!";
        }
      } catch (e) {
        executionOutput = "⚠️ Python Error: " + e.message;
      }
    }

    setOutput(executionOutput);
    if (onChange) onChange({ studentXml, studentCode, executionOutput, mode });
  }, [code, mode, onChange]);

  return (
    <div style={{ padding: 20, background: "#fdfdfd", borderRadius: 12 }}>
      {instructions && <p style={{ marginBottom: 10, fontWeight: "bold", color: "#444" }}>{instructions}</p>}

      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setMode("javascript")} style={{ background: mode === "javascript" ? "#FF99CC" : "#eee", marginRight: 5, padding: "6px 12px", borderRadius: 6 }}>
          ✨ JavaScript
        </button>
        <button onClick={() => setMode("python")} style={{ background: mode === "python" ? "#99CCFF" : "#eee", padding: "6px 12px", borderRadius: 6 }}>
          🐍 Python
        </button>
      </div>

      <div ref={blocklyDiv} style={{ height: "400px", width: "100%", border: "1px solid #ddd" }} />

      <div style={{ marginTop: 10 }}>
        <button onClick={runCode} style={{ padding: "8px 16px", background: "#61C0BF", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          🚀 Run
        </button>
      </div>

      <div style={{ display: "flex", marginTop: 15, gap: "10px", flexWrap: "wrap" }}>
        <pre style={{ flex: 1, minWidth: "280px", background: "#f4f4f4", padding: 10, borderRadius: 8 }}>{code}</pre>
        <pre style={{ flex: 1, minWidth: "280px", background: "#eef9f3", padding: 10, borderRadius: 8 }}>{output}</pre>
      </div>
    </div>
  );
};

export default BlocklyBlock;
