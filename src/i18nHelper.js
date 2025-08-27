// src/i18nHelper.js
import translations from "./i18n.json"; // your translation JSON file

export const t = (key, language = "en") => {
  // returns the translated string for the current language, or the key if missing
  return translations[language]?.[key] || key;
};
