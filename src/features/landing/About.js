// src/pages/About.jsx
import React from "react";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { FaBullseye, FaRocket, FaUsers, FaLightbulb } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function About() {
  const { i18n } = useTranslation();
  const isYoruba = i18n.language === "yo";

  return (
   <section className="min-h-screen bg-[#0D1B2A] text-white pt-28 pb-28 px-4 md:px-20 relative overflow-hidden">
      {/* Subtle blue glow */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-blue-500 opacity-5 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#FFD700] opacity-5 blur-3xl rounded-full"></div>

      {/* TITLE */}
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold text-center text-blue-400 mb-16"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {isYoruba
          ? "Nipa Wa – Yoruba Tech Space"
          : "About Us – Yoruba Tech Space"}
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
            alt="Yoruba Coder"
            className="rounded-xl w-full max-w-[280px] md:max-w-[320px] border-4 border-blue-400 shadow-lg shadow-blue-500/30 hover:scale-105 transition-all duration-300"
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
              sequence={[
                isYoruba
                  ? "Orúkọ mi ni Sola Afolabi."
                  : "My name is Sola Afolabi.",
              ]}
              wrapper="span"
              speed={60}
              repeat={0}
            />
          </div>

          <p>
            {isYoruba
              ? "Software Developer ni mi. Mo ní ìfẹ́ gidi sí imọ̀ ẹrọ àti kí n túmọ̀ rẹ̀ sí èdè Yorùbá kó lè rọrùn fún gbogbo ọmọ bíbí Yorùbá láti kọ́."
              : "I am a software developer with a strong passion for technology and translating it into Yoruba to make learning accessible for all Yoruba speakers."}
          </p>

          <p>
            {isYoruba
              ? "Yoruba Tech Space jẹ́ àyè tí a dá sílẹ̀ láti mú imọ̀ kóòdù wá sílẹ̀ pẹ̀lú àṣà, èdè, àti àyá gíga. A fẹ́ kí agbádá àti kóòdù jọ mọ́ra!"
              : "Yoruba Tech Space was created to bring coding education closer to our culture, language, and identity. We want tradition and technology to walk hand in hand."}
          </p>

          <p>
            {isYoruba
              ? "Àfojúsùn wa ni láti jẹ́ amúgbálẹgbẹ̀yà fún àwọn ọdọ, kí wọ́n le kọ́ HTML, CSS, JavaScript, React, Python, àti Artificial Intelligence ní èdè Yorùbá."
              : "Our mission is to empower young minds to learn HTML, CSS, JavaScript, React, Python, and Artificial Intelligence in Yoruba — with ease and excitement."}
          </p>
        </motion.div>
      </div>

      {/* VISION & MISSION */}
      <div className="max-w-6xl mx-auto mt-20 space-y-16 relative z-10">
        {/* Vision */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="bg-[#1B263B] p-10 rounded-xl shadow-xl hover:shadow-blue-400/20 transition border border-transparent hover:border-blue-500"
        >
          <h2 className="text-3xl font-bold text-blue-400 mb-6">
            🌟 {isYoruba ? "Ìran Wa" : "Our Vision"}
          </h2>
          <p className="text-gray-300 text-lg leading-loose">
            {isYoruba
              ? "Láti jẹ́ pẹpẹ àgbáyé tí yóò kọ́ imọ̀ imọ̀ ẹrọ sí àwọn ọmọ Yorùbá àti gbogbo ilẹ̀ Áfíríkà ní èdè tí wọ́n mọ̀, láì jẹ́ kí èdè tàbí owó dà wọn lóró."
              : "To become a global platform teaching technology to Yoruba speakers and Africans in their native languages, removing language and financial barriers."}
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="bg-[#1B263B] p-10 rounded-xl shadow-xl space-y-6 border border-transparent hover:border-blue-500 hover:shadow-blue-400/20 transition"
        >
          <h2 className="text-3xl font-bold text-blue-400 mb-6">
            🎯 {isYoruba ? "Ìlànà Wa" : "Our Mission"}
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                icon: <FaBullseye />,
                title: isYoruba
                  ? "Kọ́ ọmọ Áfíríkà Mílíọ̀nù"
                  : "Educate 1 Million Africans",
                text: isYoruba
                  ? "A fẹ́ kọ́ àwọn ọdọ Áfíríkà láti kọ́ kóòdù ní èdè abinibi wọn, pẹ̀lú ẹ̀kọ́ tó rọrùn fún gbogbo ènìyàn."
                  : "We aim to teach one million African youths to code in their native languages through free or affordable tech education.",
              },
              {
                icon: <FaRocket />,
                title: isYoruba
                  ? "Ìpolówó imọ̀ ẹrọ ní pátákì"
                  : "Grassroots Tech Campaign",
                text: isYoruba
                  ? "A máa lọ sí ilé-ẹ̀kọ́, ṣọ́ọ̀ṣì, mọ́ṣálásì àti abúlé láti mú ìmọ̀ kọ́mputa dé gbogbo."
                  : "We’ll reach schools, churches, mosques, and rural communities to spread digital awareness and create tech hubs.",
              },
              {
                icon: <FaUsers />,
                title: isYoruba
                  ? "Kọ́ ìdílé imọ̀ ẹrọ"
                  : "Build a Tech Tribe",
                text: isYoruba
                  ? "A ń dá ìdílé àgbáyé kan sílẹ̀ tí àwọn akẹ́kọ̀ọ́ àti olùkọ́ Yorùbá yóò dá pọ̀ kí wọ́n lè kọ́ pọ̀."
                  : "We are building a global family of tech learners and educators collaborating and growing together.",
              },
              {
                icon: <FaLightbulb />,
                title: isYoruba
                  ? "Ẹ̀kọ́ tó jẹ́ mọ́ àṣà"
                  : "Culturally Rooted Education",
                text: isYoruba
                  ? "A gbà pé ẹ̀kọ́ yẹ kí ó ní ìtàn wa. Ẹ̀kọ́ wa dápọ̀ mọ́ àṣà àti èdè Yorùbá fún ìrírí ẹ̀kọ́ tó dùn."
                  : "We believe education should reflect culture. Our lessons blend local traditions and tech for meaningful learning.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-4 items-start bg-[#0D1B2A] p-6 rounded-lg shadow hover:shadow-blue-400/20 transition border border-transparent hover:border-blue-500"
              >
                <div className="text-blue-400 text-3xl mt-1">{item.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-gray-300">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
