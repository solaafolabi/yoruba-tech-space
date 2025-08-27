import React from "react";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";


export default function JsCourse() {
  return (
    <section className="min-h-screen bg-[#0D1B2A] text-white px-6 py-20 mt-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex items-center gap-4"
        >
          <FaFire className="text-5xl text-[#f0db4f]" />
          <h1 className="text-4xl font-bold text-[#FFD700]">JavaScript</h1>
        </motion.div>

        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Ẹ̀kọ́ JavaScript yìí máa ràn é lọ́wọ́ láti dá ojú-òpó alágbára sílẹ̀. A ó kọ́ bí a ṣe n lo variables, functions, arrays àti DOM manipulation.
        </p>

        <div className="bg-[#1B263B] p-6 rounded-xl mb-8 border border-[#FFD700] shadow-md">
          <h3 className="text-xl font-semibold text-[#FFD700] mb-2">Àpẹẹrẹ Kóòdù:</h3>
          <pre className="text-sm text-white overflow-x-auto">
{`const oruko = "YorubaTech";
function bawoNi() {
  console.log("Báwo ni, " + oruko);
}

bawoNi();`}
          </pre>
        </div>

        <button className="bg-[#FFD700] text-[#0D1B2A] px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all">
          Bẹrẹ Ẹ̀kọ́
        </button>
      </div>
    </section>
  );
}
