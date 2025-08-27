// src/components/Hero.jsx
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
      ? "https://www.youtube.com/embed/_gJ9MOIaW4s"
      : "https://www.youtube.com/embed/-Tz0KH6Kauc";

  return (
    <section
      id="hero-section"
      className="relative bg-gradient-to-r from-[#0D1B2A] to-[#1B263B] text-white min-h-screen overflow-hidden px-6 md:px-16 flex items-center justify-center pt-28"
    >
      {/* Subtle gold glow */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#FFD700] opacity-5 rounded-full blur-3xl z-0"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto">
        {/* Left Text */}
        <motion.div
          initial={{ x: -150, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="text-center md:text-left"
        >
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            {t("hero.welcome")}{" "}
            <span className="text-blue-400">{t("hero.brandName")}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-4 max-w-xl mx-auto md:mx-0 leading-relaxed">
            {t("hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            {/* Primary CTA: Donate / Start Learning */}
            <a
              href="#courses"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:scale-110 hover:bg-blue-700 transition-all shadow-md"
            >
              {t("hero.startLearning")}
            </a>
            {/* Secondary CTA: See How It Works */}
            <a
              href="#how-it-works"
              className="border border-[#FFD700] px-6 py-3 rounded-lg text-[#FFD700] hover:bg-[#FFD700] hover:text-[#0D1B2A] transition-all"
            >
              {t("hero.seeHowItWorks")}
            </a>
          </div>
        </motion.div>

        {/* Right: Intro Video */}
        <motion.div
          initial={{ x: 100, scale: 0.8, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2, type: "spring" }}
          className="flex justify-center"
        >
          <div className="w-full max-w-xl rounded-2xl overflow-hidden border-2 border-blue-400 shadow-2xl">
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
