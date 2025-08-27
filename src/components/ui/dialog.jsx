import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// Main Dialog wrapper
export const Dialog = ({ open, onClose, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="fixed z-50 inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="bg-[#1B263B] text-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-yellow-400"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Dialog header with title and close button
export const DialogHeader = ({ title, onClose }) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">{title}</h2>
    <button onClick={onClose} className="text-white hover:text-yellow-400">
      ✕
    </button>
  </div>
);

// Trigger that opens the dialog (you can pass an onClick handler)
export const DialogTrigger = ({ onClick, children }) => (
  <button onClick={onClick} className="text-sm font-medium text-yellow-400 hover:underline">
    {children}
  </button>
);

// Dialog content wrapper
export const DialogContent = ({ children }) => (
  <div className="mt-2">{children}</div>
);
