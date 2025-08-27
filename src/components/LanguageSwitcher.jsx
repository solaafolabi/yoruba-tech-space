// src/components/LanguageSwitcher.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "yo" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("appLanguage", newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center w-full px-4 py-2 text-sm bg-[#0D1B2A] rounded border border-[#FFD700] hover:bg-[#FFD700]/10 mb-2"
    >
      <FaGlobe className="mr-2 text-blue-400" />
      {i18n.language === "en" ? "Switch to Yorùbá" : "Switch to English"}
    </button>
  );
}
