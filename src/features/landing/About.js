// src/pages/About.jsx
import React from "react";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { FaBullseye, FaRocket, FaUsers, FaLightbulb } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t, i18n } = useTranslation();


  return (
    <section className="min-h-screen bg-[#0D1B2A] text-white pt-28 pb-28 px-4 md:px-20 relative overflow-hidden">
      {/* Subtle blue glow */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-blue-500 opacity-5 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#FFD700] opacity-5 blur-3xl rounded-full"></div>

      {/* TITLE */}
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold text-center text-yellow-500 mb-16"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {t("about.title")}
      </motion.h1>

      {/* LAYOUT */}
      <div className="flex flex-col-reverse md:flex-row items-center gap-12 max-w-6xl mx-auto relative z-10">
        {/* IMAGE */}
        <motion.div
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="flex-1 flex justify-center"
        >
          <img
            src="/yoruba-coder.png"
            alt={t("about.imageAlt")}
            className="rounded-xl w-full max-w-[280px] md:max-w-[320px] border-4 border-yellow-600 shadow-lg shadow-blue-500/30 hover:scale-105 transition-all duration-300"
          />
        </motion.div>

        {/* TEXT */}
        <motion.div
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="flex-1 text-lg leading-loose space-y-5"
        >
       <div className="text-blue-400 text-xl md:text-2xl font-medium">
        <TypeAnimation
          key={i18n.language} // force re-render on language change
          sequence={[t("about.intro")]}
          wrapper="span"
          speed={60}
          repeat={0}
        />
      </div>

          <p>{t("about.description1")}</p>
          <p>{t("about.description2")}</p>
          <p>{t("about.description3")}</p>
        </motion.div>
      </div>

      {/* VISION & MISSION */}
      <div className="max-w-6xl mx-auto mt-20 space-y-16 relative z-10">
        {/* Vision */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="bg-[#1B263B] p-10 rounded-xl shadow-xl hover:shadow-yellow-600/20 transition border border-transparent hover:border-yellow-600"
        >
          <h2 className="text-3xl font-bold text-yellow-500 mb-6">
            🌟 {t("about.vision.title")}
          </h2>
          <p className="text-gray-300 text-lg leading-loose">{t("about.vision.text")}</p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="bg-[#1B263B] p-10 rounded-xl shadow-xl space-y-6 border border-transparent hover:border-yellow-500 hover:shadow-yellow-600/20 transition"
        >
          <h2 className="text-3xl font-bold text-yellow-500 mb-6">
            🎯 {t("about.mission.title")}
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              "mission.educate1Million",
              "mission.grassrootsCampaign",
              "mission.buildTechTribe",
              "mission.culturallyRooted",
            ].map((key, index) => {
              const item = t(key, { returnObjects: true });
              return (
                <div
                  key={index}
                  className="flex gap-4 items-start bg-[#0D1B2A] p-6 rounded-lg shadow hover:shadow-yellow-600/20 transition border border-transparent hover:border-yellow-500"
                >
                  <div className="text-yellow-500 text-3xl mt-1">{item.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <p className="text-gray-300">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
