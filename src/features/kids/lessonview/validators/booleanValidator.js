export default function validateBoolean(rules, studentCode) {
  const expected = String(rules.expected_answer ?? "").toLowerCase();
  const actual = studentCode.toLowerCase();

  if (!expected) {
    return { success: false, feedback: "No expected boolean answer set." };
  }

  if (["true", "false"].includes(actual) && actual === expected) {
    return { success: true, feedback: "✅ Correct true/false answer." };
  }

  return {
    success: false,
    feedback: `❌ Expected ${expected}, but got ${actual || "nothing"}.`,
  };
}
