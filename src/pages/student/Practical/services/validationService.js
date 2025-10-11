/**
 * Universal validation for multi-language code steps
 * Supports: HTML, CSS, JS, Python
 * Rules can include: contains, not_contains, regex, equals, rule (for CSS), mustHaveIds, mustHaveTags
 */

export function validateCodeByLang(codeObj = {}, validationRules = {}) {
  const errors = [];

  // Loop through each language rule
  for (const lang of Object.keys(validationRules || {})) {
    const code = (codeObj[lang] || "").trim();
    const rules = validationRules[lang] || [];

    if (!Array.isArray(rules)) {
      errors.push(`⚠️ Validation rules for ${lang} must be an array.`);
      continue;
    }

    for (const rule of rules) {
      const type = rule.type?.toLowerCase?.();
      const value = rule.value;

      switch (type) {
        // ✅ Must contain a string
        case "contains":
          if (!code.includes(value)) {
            errors.push(`❌ ${lang.toUpperCase()} must contain "${value}".`);
          }
          break;

        // ❌ Must NOT contain a string
        case "not_contains":
          if (code.includes(value)) {
            errors.push(`❌ ${lang.toUpperCase()} must NOT contain "${value}".`);
          }
          break;

        // ✅ HTML element ID check
        case "musthaveids":
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(code, "text/html");
            (Array.isArray(value) ? value : [value]).forEach((id) => {
              if (!doc.getElementById(id)) {
                errors.push(`❌ Missing element with id="${id}" in HTML.`);
              }
            });
          } catch (err) {
            errors.push(`⚠️ Failed to parse HTML for ID check.`);
          }
          break;

        // ✅ HTML must have specific tag(s)
        case "musthavetags":
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(code, "text/html");
            (Array.isArray(value) ? value : [value]).forEach((tag) => {
              if (!doc.getElementsByTagName(tag).length) {
                errors.push(`❌ Missing <${tag}> tag in HTML.`);
              }
            });
          } catch {
            errors.push(`⚠️ Failed to parse HTML for tag check.`);
          }
          break;

        // ✅ CSS: check selector/property/value
        case "rule":
          try {
            const selector = rule.selector || "";
            const property = rule.property || "";
            const val = rule.value || "";
            const regex = new RegExp(
              `${selector}\\s*\\{[^}]*${property}\\s*:\\s*${val}`,
              "i"
            );
            if (!regex.test(code)) {
              errors.push(
                `❌ Missing CSS rule: ${selector} { ${property}: ${val} }`
              );
            }
          } catch {
            errors.push(`⚠️ Invalid CSS rule format in validation rule.`);
          }
          break;

        // ✅ Regex pattern check
        case "regex":
          try {
            const reg = new RegExp(value, "i");
            if (!reg.test(code)) {
              errors.push(`❌ ${lang.toUpperCase()} must match regex: ${value}`);
            }
          } catch {
            errors.push(`⚠️ Invalid regex for ${lang.toUpperCase()}: ${value}`);
          }
          break;

        // ✅ Must exactly match a given value
        case "equals":
          if (code.trim() !== String(value).trim()) {
            errors.push(
              `❌ ${lang.toUpperCase()} must equal exactly:\n${value}`
            );
          }
          break;

        // ⚠️ Unknown rule type
        default:
          errors.push(`⚠️ Unknown rule type: ${rule.type}`);
      }
    }
  }

  return errors.length ? errors.join("\n") : null;
}
