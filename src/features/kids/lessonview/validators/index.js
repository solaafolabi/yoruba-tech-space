import validateNumeric from "./numericValidator";
import validateString from "./stringValidator";
import validateBoolean from "./booleanValidator";
import validateBehavior from "./behaviorValidator";
import validateCodeStructure from "./codeStructureValidator";

export function validateBlocklySubmission(block, studentXml, studentCode) {
  // Ensure validation_rules is always usable
  let rules = block?.validation_rules ?? {};

  // 🔍 Debug raw rules
  console.log("👉 Raw rules from block:", rules);

  // Parse if stored as JSON string
  if (typeof rules === "string") {
    try {
      rules = JSON.parse(rules);
      console.log("✅ Parsed rules:", rules);
    } catch (e) {
      console.warn("⚠️ Failed to parse rules:", e.message);
      rules = {};
    }
  }

  // ✅ Normalize to always be arrays
  if (rules.must_use && !Array.isArray(rules.must_use)) {
    rules.must_use = [rules.must_use];
  }
  if (rules.forbidden && !Array.isArray(rules.forbidden)) {
    rules.forbidden = [rules.forbidden];
  }

  console.log("🛠️ Final normalized rules:", rules);

  const gradingType = rules.grading_type || block.grading_type || null;
  console.log("📌 Grading type:", gradingType);

  // ✅ Always coerce studentCode into a string
  const safeCode =
    typeof studentCode === "string"
      ? studentCode
      : Array.isArray(studentCode)
      ? studentCode.join("\n")
      : String(studentCode ?? "");

  console.log("💻 Student code:\n", safeCode);

  switch (gradingType) {
    case "numeric":
      return validateNumeric(rules, safeCode);
    case "string":
      return validateString(rules, safeCode);
    case "boolean":
      return validateBoolean(rules, safeCode);
    case "behavior":
      return validateBehavior(rules, studentXml, safeCode);
    case "code_structure":
      return validateCodeStructure(rules, studentXml, safeCode); // ✅ now passes safeCode
    default:
      return {
        success: false,
        feedback: "⚠️ No grading type defined or rules invalid.",
      };
  }
}
