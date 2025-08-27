// src/components/dashboard/DashboardCharts.jsx
import React from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

export default function DashboardCharts({ pieData, streakData, COLORS }) {
  const { t } = useTranslation();

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div className="bg-[#1B263B] p-6 rounded-xl shadow-xl">
        <h3 className="text-[#FFD700] font-semibold mb-4">{t("dashboard.courseCompletion")}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80}>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-[#1B263B] p-6 rounded-xl shadow-xl">
        <h3 className="text-[#FFD700] font-semibold mb-4">{t("dashboard.weeklyStreak")}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={streakData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#fff" />
            <YAxis stroke="#fff" allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#FFD700" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
