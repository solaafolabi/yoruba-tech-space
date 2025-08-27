// src/pages/student/practical/components/ValidationFeedback.jsx
import React from "react";
import { motion } from "framer-motion";

export const ValidationFeedback = ({ message, type }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className={`p-3 rounded-lg mb-4 ${
      type === "error" 
        ? "bg-red-900 text-red-200 border border-red-700" 
        : "bg-green-900 text-green-200 border border-green-700"
    }`}
  >
    {message}
  </motion.div>
);
export default ValidationFeedback;