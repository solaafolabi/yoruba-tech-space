// src/components/SidebarHeader.jsx
import React from "react";
import { FaUserCircle, FaTimes } from "react-icons/fa";

export default function SidebarHeader({ closeSidebar }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-[#FFD700]/30">
      <div className="flex items-center gap-3">
        <FaUserCircle className="text-3xl text-[#FFD700]" />
        <h1 className="text-xl font-bold text-[#FFD700]">Yorùbá Tech</h1>
      </div>
      <button onClick={closeSidebar} className="md:hidden text-white">
        <FaTimes className="text-xl" />
      </button>
    </div>
  );
}
