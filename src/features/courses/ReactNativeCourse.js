import React from "react";
import { motion } from "framer-motion";
import { FaReact } from "react-icons/fa";

export default function ReactNativeCourse() {
  return (
    <section className="min-h-screen bg-[#0D1B2A] text-white px-6 py-20 mt-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex items-center gap-4"
        >
          <FaReact className="text-5xl text-[#61DBFB]" />
          <h1 className="text-4xl font-bold text-[#FFD700]">React Native</h1>
        </motion.div>

        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Ẹ̀kọ́ yìí máa kọ́ ọ bí o ṣe le dá app alágbèéká sílẹ̀ pẹ̀lú React Native. A ó kọ́ nipa components,
          state, props, navigation, àti deployment sí Android àti iOS. Gbogbo rẹ̀ ní èdè Yorùbá!
        </p>

        <div className="bg-[#1B263B] p-6 rounded-xl mb-8 border border-[#FFD700] shadow-md">
          <h3 className="text-xl font-semibold text-[#FFD700] mb-2">Àpẹẹrẹ Kóòdù:</h3>
          <pre className="text-sm text-white overflow-x-auto">
{`import React from 'react';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View>
      <Text>Báwo ni, Yorùbá World!</Text>
    </View>
  );
}`}
          </pre>
        </div>

        <button className="bg-[#FFD700] text-[#0D1B2A] px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all">
          Bẹrẹ Ẹ̀kọ́
        </button>
      </div>
    </section>
  );
}
