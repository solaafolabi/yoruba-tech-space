import Blockly from "blockly/core";

export default function validateCodeStructure(rules, studentXml, studentCode) {
  let feedback = [];

  // Always normalize rules
  const mustUse = Array.isArray(rules?.must_use) ? rules.must_use : [];
  const forbidden = Array.isArray(rules?.forbidden) ? rules.forbidden : [];
  const maxBlocks = typeof rules?.max_blocks === "number" ? rules.max_blocks : null;

  // Parse XML → workspace
  let dom, workspace;
  try {
    dom = Blockly.Xml.textToDom(studentXml);
    workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(dom, workspace);
  } catch (e) {
    return { success: false, feedback: "⚠️ Invalid Blockly XML." };
  }

  const allBlocks = workspace.getAllBlocks(false).map((b) => b.type);

  // Must use certain blocks
  for (const required of mustUse) {
    if (!allBlocks.includes(required)) {
      feedback.push(`⚠️ Missing required block: ${required}`);
    }
  }

  // Forbidden blocks
  for (const bad of forbidden) {
    if (allBlocks.includes(bad)) {
      feedback.push(`❌ Forbidden block used: ${bad}`);
    }
  }

  // Max block limit
  if (maxBlocks && allBlocks.length > maxBlocks) {
    feedback.push(
      `⚠️ Too many blocks: used ${allBlocks.length}, max allowed is ${maxBlocks}`
    );
  }

  if (feedback.length === 0) {
    return { success: true, feedback: "✅ Code structure validated successfully." };
  }

  return { success: false, feedback: feedback.join("\n") };
}
