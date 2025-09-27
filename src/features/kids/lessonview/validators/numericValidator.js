export default function validateNumeric(rules, studentCode) {
  // Always coerce to string
  const codeStr =
    typeof studentCode === "string"
      ? studentCode
      : Array.isArray(studentCode)
      ? studentCode.join("\n")
      : String(studentCode ?? "");

  const expected = String(rules?.expected_answer ?? "").trim();

  // Extract first number from code (if any)
  const actual = (codeStr.match(/\d+/g) || [])[0] || "";

  if (!expected) {
    return { success: false, feedback: "⚠️ No expected numeric answer set." };
  }

  if (String(actual).trim() === expected) {
    return { success: true, feedback: "✅ Correct numeric result." };
  }

  return {
    success: false,
    feedback: `❌ Expected ${expected}, but got ${actual || "nothing"}.`,
  };
}
