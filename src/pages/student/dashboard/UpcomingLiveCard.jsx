// src/components/dashboard/UpcomingLiveCard.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function UpcomingLiveCard({ liveClass }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 bg-[#1B263B] p-6 rounded-xl shadow-xl">
      <h3 className="text-yellow-500 font-semibold mb-4">{t("dashboard.upcomingLiveClass")}</h3>
      <ul className="space-y-2 text-gray-300">
        <li className="flex justify-between p-2 rounded bg-yellow-900/10">
          <span className="font-medium">{t("dashboard.live.title")}</span>
          <span className="text-yellow-500">{t("dashboard.live.time")}</span>
        </li>
        <li className="flex justify-between p-2 rounded">
          <span>{t("dashboard.instructor")}:</span>
          <span className="text-white font-semibold">{liveClass.instructor}</span>
        </li>
        <li className="flex justify-center mt-2">
          <a
            href={liveClass.joinLink}
            className="bg-yellow-500 text-[#0D1B2A] px-4 py-2 rounded font-bold w-full text-center"
          >
            {t("dashboard.joinNow")}
          </a>
        </li>
      </ul>
    </div>
  );
}
