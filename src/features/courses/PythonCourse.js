import React from "react";
import { motion } from "framer-motion";
import { FaPython } from "react-icons/fa";

export default function PythonCourse() {
  return (
    <section className="min-h-screen bg-[#0D1B2A] text-white px-6 py-20 mt-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex items-center gap-4"
        >
          <FaPython className="text-5xl text-[#4B8BBE]" />
          <h1 className="text-4xl font-bold text-[#FFD700]">Python</h1>
        </motion.div>

        <ul className="list-decimal list-inside text-gray-300 mb-6">
          <li>Ìtẹ̀síwájú Python (Syntax, Variables)</li>
          <li>Pandas àti NumPy</li>
          <li>Ìtúpalẹ̀ data àti Charts</li>
        </ul>

        <div className="bg-[#1B263B] p-6 rounded-xl mb-8 border border-[#FFD700] shadow-md">
          <h3 className="text-xl font-semibold text-[#FFD700] mb-2">Àpẹẹrẹ Kóòdù:</h3>
          <pre className="text-sm text-white overflow-x-auto">
{`import pandas as pd

data = {"Orukọ": ["Sola", "Grace"], "Ìpò": ["Dev", "Designer"]}
df = pd.DataFrame(data)
print(df)`}
          </pre>
        </div>

        <a href="https://www.learnpython.org/" target="_blank" rel="noopener noreferrer">
          <button className="bg-[#FFD700] text-[#0D1B2A] px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all">
            Bẹrẹ Ẹ̀kọ́
          </button>
        </a>
      </div>
    </section>
  );
}