import React from "react";
import { motion } from "framer-motion";
import "./TalkingDrumSpinner.css";

export default function TalkingDrumSpinner() {
  return (
    <div className="drum-spinner-wrapper">
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 300"
        width="120"
        height="180"
        className="drum-svg"
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        {/* Drum Body */}
        <ellipse cx="100" cy="30" rx="40" ry="20" fill="#FFD700" />
        <rect x="60" y="30" width="80" height="180" fill="#FFD700" rx="40" />
        <ellipse cx="100" cy="210" rx="40" ry="20" fill="#FFD700" />

        {/* Dark Leather Rims */}
        <ellipse cx="100" cy="30" rx="40" ry="20" fill="none" stroke="#1B263B" strokeWidth="6" />
        <ellipse cx="100" cy="210" rx="40" ry="20" fill="none" stroke="#1B263B" strokeWidth="6" />

        {/* Ropes */}
        {[...Array(8)].map((_, i) => {
          const angle = (Math.PI * 2 * i) / 8;
          const x1 = 100 + 40 * Math.cos(angle);
          const y1 = 30 + 20 * Math.sin(angle);
          const x2 = 100 + 40 * Math.cos(angle);
          const y2 = 210 + 20 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#1B263B"
              strokeWidth="2"
            />
          );
        })}
      </motion.svg>

      <p className="text-yellow-500 mt-6 text-lg animate-pulse">Ìkànnì Yorùbá Tech...</p>
    </div>
  );
}
