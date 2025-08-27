import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * SidebarNavLink
 * Reusable sidebar navigation link component
 * Props:
 * - to: string, route path
 * - icon: React component, icon to show
 * - translationKey: string, key from i18n JSON
 */
export default function SidebarNavLink({ to, icon: Icon, translationKey }) {
  const { t } = useTranslation();

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 p-3 rounded-lg hover:bg-[#FFD700]/10 transition ${
          isActive ? "bg-[#FFD700]/10 border-l-4 border-[#FFD700]" : ""
        }`
      }
    >
      {Icon && <Icon />}
      <span>{t(translationKey)}</span>
    </NavLink>
  );
}
