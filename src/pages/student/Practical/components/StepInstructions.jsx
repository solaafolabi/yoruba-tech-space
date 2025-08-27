// src/pages/student/practical/components/StepInstructions.jsx
import React from "react";
import { motion } from "framer-motion";

export const StepInstructions = ({ instruction }) => (
  <motion.div
    key={instruction}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className="bg-gray-100 text-black text-sm p-4 rounded border border-gray-300 mb-6 shadow-sm select-text"
  >
    {instruction}
  </motion.div>
);
export default StepInstructions;