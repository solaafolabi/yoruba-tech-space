import React from "react";

export const Button = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl transition-all duration-200 font-semibold ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
