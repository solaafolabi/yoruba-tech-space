import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import supabase from "../../../supabaseClient";
import { motion } from "framer-motion";
import { FaChild, FaMoneyBillWave, FaBell } from "react-icons/fa";

export default function ParentDashboardHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // get the logged-in parent
        const { data: parent } = await supabase.auth.getUser();
        const parentId = parent?.user?.id;

        // fetch only children for this parent
        const { data: childrenData } = await supabase
          .from("children")
          .select("*")
          .eq("parent_id", parentId);

        const { data: progressData } = await supabase.from("lesson_progress").select("*");
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("*")
          .eq("parent_id", parentId);
        const { data: notificationsData } = await supabase
          .from("notifications")
          .select("*")
          .eq("parent_id", parentId);

        setChildren(
          childrenData?.map((child) => {
            const childLessons = progressData?.filter((p) => p.child_id === child.id) || [];
            const completedCount = childLessons.filter((l) => l.completed).length;
            const totalCount = childLessons.length || 1;
            const progressPercent = (completedCount / totalCount) * 100;
            return { ...child, progressPercent };
          }) || []
        );

        setData({
          children: childrenData?.length || 0,
          payments: paymentsData?.length || 0,
          notifications: notificationsData?.length || 0,
        });
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
        <h1 className="text-3xl md:text-4xl font-semibold">
          {t("dashboard.parentDashboard")}
        </h1>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-yellow-500 rounded-lg shadow hover:bg-[#1A2A4A] transition">
            {t("dashboard.settings")}
          </button>
          <button className="px-4 py-2 bg-yellow-500 rounded-lg shadow hover:bg-[#1A2A4A] transition">
            {t("dashboard.profile")}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="p-5 bg-[#112750] rounded-xl shadow-md hover:shadow-lg cursor-pointer flex flex-col justify-between"
          onClick={() => navigate("/parents/dashboard/children")}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-[#0A1B3D] text-yellow-500 flex items-center justify-center text-2xl">
              <FaChild />
            </div>
            <div>
              <div className="text-gray-300 font-medium">{t("dashboard.children")}</div>
              <div className="text-white text-xl font-bold mt-1">
                {loading ? "…" : data.children}
              </div>
            </div>
          </div>

          {/* Children progress bars */}
          <div className="mt-4 space-y-2">
            {children.map((child) => (
              <div key={child.id}>
                <div className="text-gray-300 text-sm">{child.full_name || child.username}</div>
                <div className="w-full bg-[#0F294F] rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${child.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Payments card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="p-5 bg-[#112750] rounded-xl shadow-md hover:shadow-lg cursor-pointer flex flex-col justify-between"
          onClick={() => navigate("/parents/dashboard/payments")}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-[#0A1B3D] text-yellow-500 flex items-center justify-center text-2xl">
              <FaMoneyBillWave />
            </div>
            <div>
              <div className="text-gray-300 font-medium">{t("dashboard.payments")}</div>
              <div className="text-white text-xl font-bold mt-1">
                {loading ? "…" : data.payments}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="p-5 bg-[#112750] rounded-xl shadow-md hover:shadow-lg cursor-pointer flex flex-col justify-between"
          onClick={() => navigate("/parents/dashboard/notifications")}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-[#0A1B3D] text-yellow-500 flex items-center justify-center text-2xl">
              <FaBell />
            </div>
            <div>
              <div className="text-gray-300 font-medium">{t("dashboard.notifications")}</div>
              <div className="text-white text-xl font-bold mt-1">
                {loading ? "…" : data.notifications}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
