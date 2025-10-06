import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Hero() {
  const { t, i18n } = useTranslation();
  const [loadVideo, setLoadVideo] = useState(false);

  const floatingSymbols = ["</>", "⚙️", "HTML", "JS", "AI", "React"];

  useEffect(() => {
    const handleScroll = () => {
      const hero = document.getElementById("hero-section");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
          setLoadVideo(true);
          window.removeEventListener("scroll", handleScroll);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const videoUrl =
    i18n.language === "yo"
      ? "https://www.youtube.com/embed/ypMW46vQdmQ"
      : "https://www.youtube.com/embed/u7hDpCF4LGk";


  return (
    <section
      id="hero-section"
      className="relative bg-gradient-to-r from-[#0D1B2A] to-[#1B263B] text-white min-h-screen overflow-hidden px-6 md:px-16 flex items-center justify-center pt-28"
    >
      {/* Subtle gold glow */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#FFD700] opacity-5 rounded-full blur-3xl z-0"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto">

        {/* Right: Intro Video with heading outside the frame */}
        <motion.div
          initial={{ x: 100, scale: 0.8, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2, type: "spring" }}
          className="flex flex-col items-center w-full"
        >
          {/* 🆕 Heading above video */}
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-white mb-8">
  {t("hero.videoHeading")}
</h2>

          <div className="w-full max-w-3xl rounded-2xl overflow-hidden border-2 border-blue-400 shadow-2xl">
            <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-lg">
              {loadVideo && (
                <iframe
                  src={videoUrl}
                  title="Yorùbá Tech Intro Video"
                  loading="lazy"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* Left Text */}
        <motion.div
          initial={{ x: -150, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="text-center md:text-left"
        >
          {/* Highlight Badge */}
          <div className="inline-block bg-yellow-600 text-[#0D1B2A] px-5 py-2 rounded-full text-sm md:text-base font-bold mb-5 shadow-lg">
            {t("hero.no1Bilingual")}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 max-w-2xl mx-auto md:mx-0">
            {t("hero.headline").split("\n").map((line, i) => (
              <span key={i} className="block leading-[1.2]">{line}</span>
            ))}
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-2xl mx-auto md:mx-0 leading-[1.6]">
            {t("hero.description")}
          </p>

          {/* Who It's For */}
          <ul className="text-gray-200 text-base md:text-lg space-y-3 mb-8 max-w-2xl mx-auto md:mx-0 leading-relaxed">
            <li>👧 <strong>{t("hero.kids.title")}:</strong> {t("hero.kids.text")}</li>
            <li>👦 <strong>{t("hero.teens.title")}:</strong> {t("hero.teens.text")}</li>
            <li>👩‍🎓 <strong>{t("hero.adults.title")}:</strong> {t("hero.adults.text")}</li>
            <li>👨‍👩‍👧 <strong>{t("hero.parents.title")}:</strong> {t("hero.parents.text")}</li>
          </ul>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a
              href="#courses"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:scale-110 hover:bg-blue-700 transition-all shadow-md"
            >
              {t("hero.startLearning")}
            </a>
            <a
              href="#how-it-works"
              className="border border-yellow-600 px-6 py-3 rounded-lg text-white hover:bg-yellow-600 hover:text-[#0D1B2A] transition-all"
            >
              {t("hero.seeHowItWorks")}
            </a>
          </div>
        </motion.div>
      </div>

      {/* Floating Symbols (subtle gold) */}
      {floatingSymbols.map((symbol, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * 600 - 300,
            y: Math.random() * 600 - 300,
            scale: 0.5 + Math.random(),
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          animate={{
            x: Math.random() * 600 - 300,
            y: Math.random() * 600 - 300,
            opacity: 0.05 + Math.random() * 0.2,
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 12 + Math.random() * 10,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "linear",
          }}
          className="absolute text-[#FFD700] text-5xl md:text-7xl font-extrabold pointer-events-none"
        >
          {symbol}
        </motion.div>
      ))}
    </section>
  );
}
