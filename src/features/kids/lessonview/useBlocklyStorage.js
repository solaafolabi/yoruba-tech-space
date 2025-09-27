import { useEffect } from "react";

export const useBlocklyStorage = (blockId, workspaceRef) => {
  // Load XML from localStorage when lesson loads
  useEffect(() => {
    if (!workspaceRef.current) return;
    const xmlText = localStorage.getItem(`blockly_xml_${blockId}`);
    if (xmlText) {
      try {
        const xml = window.Blockly.Xml.textToDom(xmlText);
        window.Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
      } catch (err) {
        console.error("Failed to load Blockly XML:", err);
      }
    }
  }, [blockId, workspaceRef]);

  // Save XML + Code automatically on changes
  useEffect(() => {
    if (!workspaceRef.current) return;
    const workspace = workspaceRef.current;

    const save = () => {
      try {
        const xml = window.Blockly.Xml.workspaceToDom(workspace);
        const xmlText = window.Blockly.Xml.domToText(xml);
        const code = window.Blockly.JavaScript.workspaceToCode(workspace);

        localStorage.setItem(`blockly_xml_${blockId}`, xmlText);
        localStorage.setItem(`blockly_code_${blockId}`, code);
      } catch (err) {
        console.error("Failed to save Blockly XML:", err);
      }
    };

    workspace.addChangeListener(save);
    return () => workspace.removeChangeListener(save);
  }, [blockId, workspaceRef]);
};
