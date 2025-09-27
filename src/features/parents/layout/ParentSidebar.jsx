import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaChild, FaChartBar, FaDonate, FaCog, FaUserGraduate, FaBullseye,
  FaLock, FaBoxOpen, FaTrophy, FaBell, FaMoneyBillWave, FaComments, FaTimes,
  FaTachometerAlt,  // <-- import dashboard icon
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function ParentSidebar({ sidebarOpen, setSidebarOpen }) {
  const { t } = useTranslation();

  // New dashboard link object
  const dashboardLink = { 
    name: t("sidebar.dashboard") || "Dashboard", 
    path: "/parents/dashboard", 
    icon: <FaTachometerAlt /> 
  };

  // Your existing menu items
  const menu = [
    { name: t("sidebar.myChildren"), path: "/parents/dashboard/children", icon: <FaChild /> },
    { name: t("sidebar.progressReports"), path: "/parents/dashboard/reports", icon: <FaChartBar /> },
    { name: t("sidebar.tutorMessages"), path: "/parents/dashboard/messages", icon: <FaComments /> },
    { name: t("sidebar.assignGoals"), path: "/parents/dashboard/goals", icon: <FaBullseye /> },
    { name: t("sidebar.parentalControls"), path: "/parents/dashboard/controls", icon: <FaLock /> },
    { name: t("sidebar.learningPackages"), path: "/parents/dashboard/packages", icon: <FaBoxOpen /> },
    { name: t("sidebar.achievements"), path: "/parents/dashboard/achievements", icon: <FaTrophy /> },
    { name: t("sidebar.notifications"), path: "/parents/dashboard/notifications", icon: <FaBell /> },
    { name: t("sidebar.payments"), path: "/parents/dashboard/payments", icon: <FaMoneyBillWave /> },
    { name: t("sidebar.donations"), path: "/parents/dashboard/donations", icon: <FaDonate /> },
    { name: t("sidebar.settings"), path: "/parents/dashboard/settings", icon: <FaCog /> },
  ];

  return (
    <aside
      className={`fixed z-40 inset-y-0 left-0 w-72 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } bg-[#112240] text-white p-6 pt-8 transition-transform duration-300 ease-in-out md:translate-x-0 md:static  shadow-2xl mt-[64px] md:mt-0`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-yellow-500 drop-shadow-md">
          👨‍👧 {t("sidebar.parentPanel")}
        </h2>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white text-xl">
          <FaTimes />
        </button>
      </div>

      <nav className="space-y-2 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
        {/* Dashboard link at the top */}
        <NavLink
          to={dashboardLink.path}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg font-medium tracking-wide transition-all duration-200 text-base ${
              isActive
                ? "bg-yellow-500 text-[#0f172a] shadow-md scale-105"
                : "hover:bg-[#1B263B] hover:text-yellow-500 text-white"
            }`
          }
        >
          <span className="text-lg">{dashboardLink.icon}</span>
          <span>{dashboardLink.name}</span>
        </NavLink>

        {/* Existing menu items */}
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg font-medium tracking-wide transition-all duration-200 text-base ${
                isActive
                  ? "bg-yellow-500 text-[#0f172a] shadow-md scale-105"
                  : "hover:bg-[#1B263B] hover:text-yellow-500 text-white"
              }`    
             
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
