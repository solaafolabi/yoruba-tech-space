// src/components/AdmissionCTA.jsx
import React, { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function AdmissionCTA() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Suspense fallback={<div className="text-center text-white">Loading...</div>}>
      <section className="bg-[#1B263B] text-white py-20 px-6 text-center relative overflow-hidden">
        {/* Subtle gold glow */}
        <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-yellow-600 opacity-5 rounded-full blur-3xl"></div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-4"
        >
          {t("admissionCTA.title")}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-6 text-lg text-yellow-500 max-w-2xl mx-auto"
        >
          {t("admissionCTA.description")}
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/Signup")}
          className="bg-blue-600 text-yellow-500 px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all duration-200 shadow-md border border-[#FFD700]"
        >
          📝 {t("admissionCTA.applyButton")}
        </motion.button>
      </section>
    </Suspense>
  );
}
