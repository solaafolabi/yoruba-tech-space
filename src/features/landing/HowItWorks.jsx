import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { FileText, UserCheck, BookOpen, Code2, Award } from "lucide-react";
import { useTranslation } from "react-i18next";

function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { icon: <FileText className="text-blue-400 w-10 h-10 mb-2" />, title: t("howItWorks.step1.title"), desc: t("howItWorks.step1.desc") },
    { icon: <UserCheck className="text-blue-400 w-10 h-10 mb-2" />, title: t("howItWorks.step2.title"), desc: t("howItWorks.step2.desc") },
    { icon: <BookOpen className="text-blue-400 w-10 h-10 mb-2" />, title: t("howItWorks.step3.title"), desc: t("howItWorks.step3.desc") },
    { icon: <Code2 className="text-blue-400 w-10 h-10 mb-2" />, title: t("howItWorks.step4.title"), desc: t("howItWorks.step4.desc") },
    { icon: <Award className="text-blue-400 w-10 h-10 mb-2" />, title: t("howItWorks.step5.title"), desc: t("howItWorks.step5.desc") },
  ];

  return (
    <section id="how-it-works" className="bg-[#1B263B] text-white py-20 px-6 md:px-20 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[#FFD700] opacity-5 blur-3xl rounded-full"></div>
      
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        <span className="text-blue-400">{t("howItWorks.title")}</span>
      </h2>
      
      <div className="grid md:grid-cols-5 gap-8 relative z-10">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            viewport={{ once: true }}
            className="bg-[#0f172a] rounded-xl p-6 text-center shadow-lg hover:scale-105 transition-transform border border-transparent hover:border-blue-500"
          >
            {step.icon}
            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
            <p className="text-gray-300">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function LazyHowItWorks() {
  return (
    <Suspense fallback={<div className="text-center text-white">Loading...</div>}>
      <HowItWorks />
    </Suspense>
  );
}
