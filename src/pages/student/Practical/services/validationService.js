export function validateCodeByLang(codeObj = {}, validationRules = {}) {
  const errors = [];

  // Loop through each language in validation rules
  Object.keys(validationRules).forEach((lang) => {
    const code = (codeObj[lang] || "").trim();
    const rules = validationRules[lang];

    rules.forEach((rule) => {
      switch (rule.type) {
        // 🔹 Contains (string must exist)
        case "contains":
          if (!code.includes(rule.value)) {
            errors.push(`❌ ${lang.toUpperCase()} must contain "${rule.value}"`);
          }
          break;

        // 🔹 HTML: must have element IDs
        case "mustHaveIds":
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(code, "text/html");
            rule.value.forEach((id) => {
              if (!doc.getElementById(id)) {
                errors.push(`❌ Missing element with id="${id}"`);
              }
            });
          } catch {
            errors.push("❌ Error parsing HTML for ID checks.");
          }
          break;

        // 🔹 CSS: must include a specific selector/property/value
        case "rule":
          const regex = new RegExp(
            `${rule.selector}\\s*\\{[^}]*${rule.property}\\s*:\\s*${rule.value}`,
            "i"
          );
          if (!regex.test(code)) {
            errors.push(
              `❌ Missing CSS: ${rule.selector} { ${rule.property}: ${rule.value} }`
            );
          }
          break;

        // 🔹 Regex match (general use)
        case "regex":
          try {
            const reg = new RegExp(rule.value, "i");
            if (!reg.test(code)) {
              errors.push(`❌ ${lang.toUpperCase()} must match regex: ${rule.value}`);
            }
          } catch {
            errors.push(`⚠️ Invalid regex provided: ${rule.value}`);
          }
          break;

        // 🔹 Exact match (for strict answers)
        case "equals":
          if (code !== rule.value) {
            errors.push(
              `❌ ${lang.toUpperCase()} must equal exactly:\n${rule.value}`
            );
          }
          break;

        // 🔹 If unknown type
        default:
          errors.push(`⚠️ Unknown rule type: ${rule.type}`);
      }
    });
  });

  return errors.length > 0 ? errors.join("\n") : null;
}
