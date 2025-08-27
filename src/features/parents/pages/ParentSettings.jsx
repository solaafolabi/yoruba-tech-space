// src/pages/parents/ParentControl.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import supabase from "../../../supabaseClient";
import Confetti from "react-confetti";
import { useTranslation } from "react-i18next";

const COLORS = {
  primary: "#112240",
  primaryLight: "#0A192F",
  accentBlue: "#3B82F6",
  accentYellow: "#FACC15",
  accentGreen: "#22C55E",
  accentPurple: "#A78BFA",
  accentRed: "#EF4444",
};

export default function ParentControl() {
  const { t } = useTranslation();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confettiOn, setConfettiOn] = useState(false);

  // Fetch children and controls
  useEffect(() => {
    const fetchChildrenControls = async () => {
      try {
        setLoading(true);
        const { data: userRes } = await supabase.auth.getUser();
        const parentId = userRes?.user?.id;
        if (!parentId) return;

        // Fetch children
        const { data: childrenData } = await supabase
          .from("children")
          .select("*")
          .eq("parent_id", parentId);

        console.log("🟢 Children fetched:", childrenData);

        // Ensure each child has a control row
        for (const child of childrenData || []) {
          const { data: existing } = await supabase
            .from("child_controls")
            .select("*")
            .eq("child_id", child.id)
            .single();

          if (!existing) {
            console.log("⚠️ Creating default controls for child:", child.id);
            await supabase.from("child_controls").insert({
              child_id: child.id,
              parent_id: parentId,
              schedule_enabled: true,
              max_daily_hours: 2,
              language: "en",
              lessons_locked: false,
              quizzes_locked: false,
              notifications_enabled: true,
              session_start: "08:00",
              session_end: "10:00",
              usage_today: 0,
            });
          }
        }

        // Fetch all controls
        const { data: controlsData } = await supabase
          .from("child_controls")
          .select("*")
          .eq("parent_id", parentId);

        const merged = (childrenData || []).map((child) => {
          const control = (controlsData || []).find((c) => c.child_id === child.id) || {};
          return {
            ...child,
            control: {
              schedule_enabled: control.schedule_enabled ?? true,
              max_daily_hours: control.max_daily_hours ?? 2,
              language: control.language ?? "en",
              lessons_locked: control.lessons_locked ?? false,
              quizzes_locked: control.quizzes_locked ?? false,
              notifications_enabled: control.notifications_enabled ?? true,
              session_start: control.session_start || "08:00",
              session_end: control.session_end || "10:00",
              usage_today: control.usage_today || 0,
            },
          };
        });

        setChildren(merged);
        console.log("🛠️ Children with controls:", merged);
      } catch (err) {
        console.error("❌ Error fetching children:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChildrenControls();
  }, []);

  // Upsert control to Supabase
  const updateControl = async (childId, newSettings) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const parentId = userRes?.user?.id;
      const { data, error } = await supabase
        .from("child_controls")
        .upsert({ child_id: childId, parent_id: parentId, ...newSettings, updated_at: new Date() })
        .select();

      if (error) console.error("❌ Upsert error:", error);
      else console.log("✅ Control updated for child", childId, data);
    } catch (err) {
      console.error("❌ Error updating control:", err);
    }
  };

  // Toggle switch handler
  const handleToggle = (child, key) => {
    const newValue = !child.control[key];
    console.log(`🔄 Toggling ${key} for ${child.full_name || child.username}:`, newValue);

    setChildren((prev) =>
      prev.map((c) => (c.id === child.id ? { ...c, control: { ...c.control, [key]: newValue } } : c))
    );
    updateControl(child.id, { [key]: newValue });
  };

  // Slider handler
  const handleSlider = (child, key, value) => {
    console.log(`🔄 Updating ${key} for ${child.full_name || child.username}:`, value);
    setChildren((prev) =>
      prev.map((c) => (c.id === child.id ? { ...c, control: { ...c.control, [key]: value } } : c))
    );
    updateControl(child.id, { [key]: value });
  };

  // Select handler
  const handleSelect = (child, key, value) => {
    console.log(`🔄 Selecting ${key} for ${child.full_name || child.username}:`, value);
    setChildren((prev) =>
      prev.map((c) => (c.id === child.id ? { ...c, control: { ...c.control, [key]: value } } : c))
    );
    updateControl(child.id, { [key]: value });
  };

  if (loading) return <div className="p-6 text-white">{t("loading")}</div>;

  return (
    <div
      className="min-h-screen p-6 md:p-10 space-y-6"
      style={{ background: `linear-gradient(180deg, ${COLORS.primaryLight}, ${COLORS.primary})` }}
    >
      {confettiOn && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          colors={[COLORS.accentYellow, COLORS.accentGreen, COLORS.accentBlue, COLORS.accentPurple]}
        />
      )}

      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-6" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
        {t("parentControl.title")}
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {children.map((child) => (
          <motion.div
            key={child.id}
            className="p-5 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg"
            whileHover={{ scale: 1.03 }}
          >
            <h2 className="text-xl font-bold text-white">{child.full_name || child.username}</h2>

            {/* Schedule Toggle */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-white">{t("parentControl.scheduleEnabled")}</span>
              <button
                onClick={() => handleToggle(child, "schedule_enabled")}
                className={`w-14 h-7 rounded-full ${child.control.schedule_enabled ? "bg-green-500" : "bg-gray-400"} relative`}
              >
                <span
                  className={`block w-7 h-7 rounded-full bg-white absolute top-0 transform transition ${
                    child.control.schedule_enabled ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Max Daily Hours */}
            <div className="mt-4">
              <span className="text-white">
                {t("parentControl.maxDailyHours")}: {child.control.max_daily_hours}
              </span>
              <input
                type="range"
                min="1"
                max="8"
                value={child.control.max_daily_hours}
                onChange={(e) => handleSlider(child, "max_daily_hours", Number(e.target.value))}
                className="w-full mt-1 accent-purple-400"
              />
            </div>

            {/* Language */}
            <div className="mt-4">
              <span className="text-white">{t("parentControl.language")}</span>
              <select
                value={child.control.language}
                onChange={(e) => handleSelect(child, "language", e.target.value)}
                className="w-full mt-1 rounded-lg px-2 py-1 text-black"
              >
                <option value="en">{t("languages.english")}</option>
                <option value="yo">{t("languages.yoruba")}</option>
              </select>
            </div>

            {/* Lock Lessons / Quizzes */}
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-white">{t("parentControl.lockLessons")}</span>
                <button
                  onClick={() => handleToggle(child, "lessons_locked")}
                  className={`w-14 h-7 rounded-full ${child.control.lessons_locked ? "bg-red-500" : "bg-green-500"} relative`}
                >
                  <span
                    className={`block w-7 h-7 rounded-full bg-white absolute top-0 transform transition ${
                      child.control.lessons_locked ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">{t("parentControl.lockQuizzes")}</span>
                <button
                  onClick={() => handleToggle(child, "quizzes_locked")}
                  className={`w-14 h-7 rounded-full ${child.control.quizzes_locked ? "bg-red-500" : "bg-green-500"} relative`}
                >
                  <span
                    className={`block w-7 h-7 rounded-full bg-white absolute top-0 transform transition ${
                      child.control.quizzes_locked ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-white">{t("parentControl.notifications")}</span>
              <button
                onClick={() => handleToggle(child, "notifications_enabled")}
                className={`w-14 h-7 rounded-full ${child.control.notifications_enabled ? "bg-green-500" : "bg-gray-400"} relative`}
              >
                <span
                  className={`block w-7 h-7 rounded-full bg-white absolute top-0 transform transition ${
                    child.control.notifications_enabled ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-3 py-2 rounded-full font-bold bg-purple-500 text-white hover:bg-purple-600"
                onClick={() => setConfettiOn(true)}
              >
                {t("parentControl.rewardConfetti")}
              </button>
              <button
                className="flex-1 px-3 py-2 rounded-full font-bold bg-yellow-500 text-white hover:bg-yellow-600"
                onClick={() => handleSlider(child, "usage_today", 0)}
              >
                {t("parentControl.resetUsage")}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
