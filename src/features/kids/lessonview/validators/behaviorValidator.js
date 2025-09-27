import Blockly from "blockly/core";

export default function validateBehavior(rules, studentXml, studentCode) {
  let feedback = [];

  // Parse XML → workspace
  let dom, workspace;
  try {
    dom = Blockly.Xml.textToDom(studentXml);
    workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(dom, workspace);
  } catch (e) {
    return { success: false, feedback: "⚠️ Invalid Blockly XML." };
  }

  const allBlocks = workspace.getAllBlocks(false).map(b => b.type);

  // Must use certain blocks
  if (Array.isArray(rules.must_use)) {
    for (let required of rules.must_use) {
      if (!allBlocks.includes(required)) {
        feedback.push(`⚠️ Missing required block: ${required}`);
      }
    }
  }

  // Forbidden blocks
  if (Array.isArray(rules.forbidden)) {
    for (let forbidden of rules.forbidden) {
      if (allBlocks.includes(forbidden)) {
        feedback.push(`❌ Forbidden block used: ${forbidden}`);
      }
    }
  }

  // Max block limit
  if (rules.max_blocks && allBlocks.length > rules.max_blocks) {
    feedback.push(
      `⚠️ Too many blocks: used ${allBlocks.length}, max allowed is ${rules.max_blocks}`
    );
  }

  if (feedback.length === 0) {
    return { success: true, feedback: "✅ Behavior validated successfully." };
  }

  return { success: false, feedback: feedback.join("\n") };
}
