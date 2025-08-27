import React from "react";
import { motion } from "framer-motion";
import { FaGithub } from "react-icons/fa";

export default function GitCourse() {
  return (
    <section className="min-h-screen bg-[#0D1B2A] text-white px-6 py-20 mt-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex items-center gap-4"
        >
          <FaGithub className="text-5xl text-white" />
          <h1 className="text-4xl font-bold text-[#FFD700]">Git & GitHub</h1>
        </motion.div>

        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Ẹ̀kọ́ yìí máa kọ́ ọ bí o ṣe le lò Git àti GitHub fún ìmúlò orí kóòdù rẹ, ṣiṣẹ́ pọ̀ pẹ̀lú ẹlòmíràn, àti fipamọ́ àtúnṣe iṣẹ́ rẹ.
        </p>

        <div className="bg-[#1B263B] p-6 rounded-xl mb-8 border border-[#FFD700] shadow-md">
          <h3 className="text-xl font-semibold text-[#FFD700] mb-2">Àpẹẹrẹ Kóòdù:</h3>
          <pre className="text-sm text-white overflow-x-auto">
{`git init
git add .
git commit -m "First commit"
git remote add origin https://github.com/username/repo.git
git push -u origin main`}
          </pre>
        </div>

        <button className="bg-[#FFD700] text-[#0D1B2A] px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all">
          Bẹrẹ Ẹ̀kọ́
        </button>
      </div>
    </section>
  );
}
