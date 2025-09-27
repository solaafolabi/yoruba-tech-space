import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

// custom hook to track window size
function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

export default function LanguagePopup({ onClose }) {
  const { t, i18n } = useTranslation();
  const { width, height } = useWindowSize();

  const [selectedLang, setSelectedLang] = useState(
    localStorage.getItem("preferredLanguage") || i18n.language || "en"
  );
  const [showMessage, setShowMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const handleLanguageSelect = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setSelectedLang(lang);
    setShowMessage(
      lang === "yo"
        ? "O ti yan Yorùbá — gbadun ẹkọ rẹ! 🎉"
        : "You’ve selected English — enjoy your learning! 🎉"
    );
    setShowConfetti(true);

    // stop confetti after 3s
    setTimeout(() => setShowConfetti(false), 3000);
  };

  useEffect(() => {
    setShowMessage(
      selectedLang === "yo"
        ? "O ti yan Yorùbá  gbadun ẹkọ rẹ! 🎉"
        : "You’ve selected English enjoy your learning! 🎉"
    );
  }, [selectedLang]);

  return (
    <>
      {/* Confetti always at the very top layer */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={800}
          style={{
            zIndex: 9999,
            position: "fixed",
            top: 0,
            left: 0,
            pointerEvents: "none", // so it won't block clicks
          }}
        />
      )}

      <AnimatePresence>
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-[#0D1B2A]/90 backdrop-blur-sm flex items-center justify-center text-white z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#112240] border-2 border-[#FFD700] rounded-2xl p-8 shadow-2xl w-96 flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          >
            {/* Welcome Message */}
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-yellow-400 text-center">
              {i18n.language === "yo"
                ? "👋 Káàbọ̀ sí Yorùbá Tech Space"
                : "👋 Welcome to Yoruba Tech Space"}
            </h2>
            <p className="text-center text-gray-200 mb-6 text-sm md:text-base">
              {i18n.language === "yo"
                ? "Ákọ́kọ́ Ìkánnì ẹ̀kọ́ ìmọ̀ ẹ̀rọ tó jẹ́ ẹ̀dá méjì fún ọmoọdẹ́ àti Àgbàlagbà:  Yorùbá àti Gẹ̀ẹ́sì"
                : "The first bilingual Yoruba-English tech learning website for kids and adult."}
            </p>

            {/* Language Dropdown */}
            <div className="w-full mb-4">
              <label
                htmlFor="language"
                className="block text-gray-200 font-semibold mb-2 text-center"
              >
                {i18n.language === "yo"
                  ? "O ti yan Yorùbá, gbádùn ẹ̀kọ́ rẹẹ"
                  : "Choose Language"}
              </label>
              <select
                id="language"
                value={selectedLang}
                onChange={(e) => handleLanguageSelect(e.target.value)}
                className="w-full bg-[#0D1B2A] border border-[#FFD700] rounded-lg px-4 py-2 text-white font-semibold hover:bg-[#1E2A3C] transition cursor-pointer shadow-inner"
              >
                <option value="en">English</option>
                <option value="yo">Yorùbá</option>
              </select>
            </div>

            {/* Dynamic Message */}
            <AnimatePresence>
              {showMessage && (
                <motion.p
                  key={showMessage}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-center text-yellow-300 font-semibold mb-4 text-sm md:text-base"
                >
                  {showMessage}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Language Buttons */}
            <div className="flex gap-4 w-full justify-center mb-2">
              <button
                onClick={() => handleLanguageSelect("yo")}
                className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0D1B2A] px-4 py-3 rounded-lg font-semibold hover:from-yellow-300 hover:to-yellow-400 transition shadow-md ${
                  selectedLang === "yo" ? "ring-2 ring-yellow-300" : ""
                }`}
              >
                <img
                  src="https://flagcdn.com/w20/ng.png"
                  alt="Yoruba Flag"
                  className="w-6 h-4 rounded-sm shadow"
                />
                {t("yoruba") || "Yorùbá"}
              </button>
              <button
                onClick={() => handleLanguageSelect("en")}
                className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0D1B2A] px-4 py-3 rounded-lg font-semibold hover:from-yellow-300 hover:to-yellow-400 transition shadow-md ${
                  selectedLang === "en" ? "ring-2 ring-yellow-300" : ""
                }`}
              >
                <img
                  src="https://flagcdn.com/w20/gb.png"
                  alt="English Flag"
                  className="w-6 h-4 rounded-sm shadow"
                />
                {t("english") || "English"}
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="mt-2 text-sm text-gray-300 hover:text-white transition"
            >
              {i18n.language === "yo" ? "Gbekúrò" : "Close"}
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
