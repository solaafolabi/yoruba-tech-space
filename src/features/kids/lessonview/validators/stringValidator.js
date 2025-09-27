export default function validateString(rules, studentCode) {
  const expected = String(rules.expected_answer ?? "").toLowerCase().trim();
  const actual = studentCode.toLowerCase().trim();

  if (!expected) {
    return { success: false, feedback: "No expected string answer set." };
  }

  if (actual.includes(expected)) {
    return { success: true, feedback: "✅ Correct string answer." };
  }

  return {
    success: false,
    feedback: `❌ Expected "${expected}", but got "${actual}".`,
  };
}
