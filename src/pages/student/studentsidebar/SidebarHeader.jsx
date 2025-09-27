// src/components/SidebarHeader.jsx
import React from "react";
import { FaUserCircle, FaTimes } from "react-icons/fa";

export default function SidebarHeader({ closeSidebar }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-yellow-600">
      <div className="flex items-center gap-3">
         {/* Logo image */}
  <img
    src="/logo.png" alt="Yoruba Tech Logo" className="h-20 w-auto" />
      </div>
      <button onClick={closeSidebar} className="md:hidden text-white">
        <FaTimes className="text-xl" />
      </button>
    </div>
  );
}
