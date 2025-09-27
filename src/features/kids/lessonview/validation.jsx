export function validateBlocklySubmission(block, studentCode) {
  if (!block || !block.validation_rules) {
    return { success: false, feedback: "⚠️ No validation rules set." };
  }

  const rules = {
    grading_type: block.validation_rules.grading_type || null,
    expected_answer: block.validation_rules.expected_answer || "",
    must_use: Array.isArray(block.validation_rules.must_use)
      ? block.validation_rules.must_use
      : (block.validation_rules.must_use || "").split(",").map(s => s.trim()).filter(Boolean),
    forbidden: Array.isArray(block.validation_rules.forbidden)
      ? block.validation_rules.forbidden
      : (block.validation_rules.forbidden || "").split(",").map(s => s.trim()).filter(Boolean),
    max_blocks: block.validation_rules.max_blocks || null,
  };

  if (!rules.grading_type) {
    return { success: false, feedback: "⚠️ No grading type provided." };
  }

  try {
    let expected = rules.expected_answer?.toString().trim() || "";
    let actual = studentCode ? studentCode.trim() : "";

    // ✅ Capture printed output
    let capturedOutput = "";
    const fakeConsole = {
      log: (...args) => {
        capturedOutput += args.join(" ") + "\n";
      }
    };

    try {
      const func = new Function("console", actual);
      func(fakeConsole);
    } catch (err) {
      return { success: false, feedback: "⚠️ Could not execute student code." };
    }

    // --- Prefer last printed value ---
    if (capturedOutput.trim()) {
      const lines = capturedOutput.trim().split("\n");
      actual = lines[lines.length - 1]; // take last printed line
    } else {
      try {
        actual = eval(actual)?.toString() || "";
      } catch {
        actual = "";
      }
    }

    // --- Grading checks ---
    if (["numeric", "string", "boolean"].includes(rules.grading_type)) {
      if (!expected) {
        return { success: false, feedback: "⚠️ No expected answer provided." };
      }

      try {
        if (rules.grading_type === "numeric") {
          expected = Number(expected);
          actual = Number(actual.trim());
        } else if (rules.grading_type === "boolean") {
          expected = expected.toLowerCase() === "true";
          actual = actual.toLowerCase() === "true";
        }
      } catch {
        return { success: false, feedback: "⚠️ Could not process student answer." };
      }

      if (expected === actual) {
        return { success: true, feedback: "✅ Correct answer!" };
      }
      return { success: false, feedback: `❌ Expected ${expected}, but got ${actual}` };
    }

    // --- Must use specific keywords ---
    for (let keyword of rules.must_use) {
      if (!studentCode.includes(keyword)) {
        return { success: false, feedback: `⚠️ You must use: ${keyword}` };
      }
    }

    // --- Forbidden keywords ---
    for (let keyword of rules.forbidden) {
      if (studentCode.includes(keyword)) {
        return { success: false, feedback: `🚫 Forbidden keyword used: ${keyword}` };
      }
    }

    // --- Special grading types ---
    switch (rules.grading_type) {
      case "loops":
        if (!studentCode.includes("for") && !studentCode.includes("while")) {
          return { success: false, feedback: "⚠️ You must use a loop." };
        }
        break;
      case "sequence":
        if ((studentCode.match(/;/g) || []).length < 3) {
          return { success: false, feedback: "⚠️ Build a sequence with at least 3 steps." };
        }
        break;
      case "math":
        if (!studentCode.match(/[0-9\+\-\*\/]/)) {
          return { success: false, feedback: "⚠️ You must use a math expression." };
        }
        break;
      case "logic":
        if (!studentCode.includes("if")) {
          return { success: false, feedback: "⚠️ You must use a logic statement." };
        }
        break;
      case "variables":
        if (!studentCode.includes("var") && !studentCode.includes("let") && !studentCode.includes("const")) {
          return { success: false, feedback: "⚠️ You must use a variable." };
        }
        break;
      case "functions":
        if (!studentCode.includes("function")) {
          return { success: false, feedback: "⚠️ You must use a function." };
        }
        break;
    }

    return { success: true, feedback: "🎉 Great job! All rules satisfied." };

  } catch (err) {
    console.error("❌ Validation crashed:", err);
    return { success: false, feedback: "⚠️ Validation failed." };
  }
}
