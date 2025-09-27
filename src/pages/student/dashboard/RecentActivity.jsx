// src/components/dashboard/RecentActivity.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function RecentActivity({ activity }) {
  const { t } = useTranslation();
  return (
    <div className="bg-[#1B263B] p-6 rounded-xl shadow-xl mb-6">
      <h3 className="text-yellow-500 font-semibold mb-4">{t("dashboard.newActivity")}</h3>
      <ul className="space-y-2 text-gray-300">
        {activity.length ? activity.map((a, i) => <li key={i}>{a}</li>) : <li>{t("dashboard.noActivity")}</li>}
      </ul>
    </div>
  );
}
