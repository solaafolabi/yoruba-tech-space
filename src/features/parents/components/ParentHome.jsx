import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import supabase from "../../../supabaseClient";
import { motion } from "framer-motion";
import {
  FaChild,
  FaChartBar,
  FaBullseye,
  FaComments,
  FaMoneyBillWave,
  FaBell,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const DASHBOARD_CARDS = [
  { key: "children", icon: <FaChild />, route: "/parents/dashboard/children" },
  { key: "progress", icon: <FaChartBar />, route: "/parents/dashboard/reports" },
  { key: "goals", icon: <FaBullseye />, route: "/parents/dashboard/goals" },
  { key: "messages", icon: <FaComments />, route: "/parents/dashboard/messages" },
  { key: "payments", icon: <FaMoneyBillWave />, route: "/parents/dashboard/payments" },
  { key: "notifications", icon: <FaBell />, route: "/parents/dashboard/notifications" },
];

export default function ParentDashboardHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [progressChartData, setProgressChartData] = useState([]);
  const [childProgressData, setChildProgressData] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const { data: childrenData } = await supabase.from("children").select("*");
        const { data: progressData } = await supabase.from("lesson_progress").select("*");
        const { data: goalsData } = await supabase.from("goals").select("*");
        const { data: messagesData } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(5);
        const { data: paymentsData } = await supabase.from("payments").select("*");
        const { data: notificationsData } = await supabase.from("notifications").select("*");

        setData({
          children: childrenData?.length || 0,
          progress: progressData?.length || 0,
          goals: goalsData?.length || 0,
          messages: messagesData?.length || 0,
          payments: paymentsData?.length || 0,
          notifications: notificationsData?.length || 0,
        });

        setRecentMessages(messagesData || []);

        const miniChart = progressData?.map((p, idx) => ({
          name: `L${idx + 1}`,
          completed: p.completed ? 1 : 0,
        }));
        setProgressChartData(miniChart || []);

        const childProgress = childrenData?.map((child) => {
          const childLessons = progressData?.filter((p) => p.child_id === child.id) || [];
          const completedCount = childLessons.filter((l) => l.completed).length;
          const totalCount = childLessons.length || 1;
          return {
            name: child.full_name || child.username,
            completed: (completedCount / totalCount) * 100,
            pending: 100 - (completedCount / totalCount) * 100,
          };
        });
        setChildProgressData(childProgress || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-6 md:p-10 bg-[#0A1B3D] min-h-screen space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl md:text-4xl font-semibold">{t("dashboard.parentDashboard")}</h1>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-[#112750] rounded-lg shadow hover:bg-[#1A2A4A] transition">
            Settings
          </button>
          <button className="px-4 py-2 bg-[#112750] rounded-lg shadow hover:bg-[#1A2A4A] transition">
            Profile
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {DASHBOARD_CARDS.map((card) => (
          <motion.div
            key={card.key}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-5 bg-[#112750] rounded-xl shadow-md hover:shadow-lg cursor-pointer flex flex-col justify-between"
            onClick={() => navigate(card.route)}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-[#0A1B3D] text-cyan-400 flex items-center justify-center text-2xl">
                {card.icon}
              </div>
              <div>
                <div className="text-gray-300 font-medium">{t(`dashboard.${card.key}`)}</div>
                <div className="text-white text-xl font-bold mt-1">{loading ? "…" : data[card.key]}</div>
              </div>
            </div>

            {/* Mini progress chart */}
            {card.key === "progress" && progressChartData.length > 0 && (
              <div className="mt-4 bg-[#0F294F] rounded-lg p-2">
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E3A60" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={[0, 1]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#112750", border: "none", color: "#fff" }}
                      formatter={(value) => `${value * 100}%`}
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    />
                    <Bar dataKey="completed" fill="#22C55E" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Overall Progress Chart */}
      <div className="p-6 bg-[#112750] rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-6">{t("dashboard.overallProgress")}</h2>
        {childProgressData.length === 0 ? (
          <div className="h-48 bg-[#0F294F] rounded-lg flex items-center justify-center text-gray-400">
            {t("dashboard.noData")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={childProgressData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A60" />
              <XAxis dataKey="name" stroke="#CBD5E1" />
              <YAxis stroke="#CBD5E1" />
              <Tooltip
                contentStyle={{ backgroundColor: "#112750", border: "none", color: "#fff" }}
                formatter={(value) => `${Math.round(value)}%`}
              />
              <Legend wrapperStyle={{ color: "#CBD5E1" }} />
              <Bar dataKey="completed" stackId="a" fill="#22C55E" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" stackId="a" fill="#64748B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Messages */}
      <div className="p-6 bg-[#112750] rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">{t("dashboard.recentMessages")}</h2>
        {recentMessages.length === 0 ? (
          <div className="h-32 bg-[#0F294F] rounded-lg flex items-center justify-center text-gray-400">
            {t("dashboard.noData")}
          </div>
        ) : (
          <ul className="space-y-3">
            {recentMessages.map((msg) => (
              <li
                key={msg.id}
                className="flex justify-between items-center p-3 bg-[#0F294F] rounded-lg hover:bg-[#1E3A60] transition"
              >
                <span className="text-gray-200">{msg.sender_name || msg.title}</span>
                <span className="text-gray-400 text-sm">
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
