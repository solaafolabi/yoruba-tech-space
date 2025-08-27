// src/pages/student/practical/components/CompletionModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export const CompletionModal = ({ show, onClose, navigate }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white bg-opacity-95 rounded-lg p-10 max-w-md mx-4 text-center shadow-2xl border border-transparent"
          initial={{ y: 50, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
        >
          <h2 className="text-3xl font-extrabold mb-4 text-green-700 select-none">
            🎉 Congratulations!
          </h2>
          <p className="mb-8 text-gray-900 font-semibold select-text">
            All code passed successfully. Well done!
          </p>
          <button
            onClick={() => {
              onClose();
              navigate("/dashboard");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded font-semibold transition-shadow shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
export default CompletionModal;