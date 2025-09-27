// src/pages/parents/ParentControl.jsx
import React, { useEffect, useState } from "react";
import supabase from "../../../supabaseClient";
import { motion } from "framer-motion";
import { useUser } from "@supabase/auth-helpers-react";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  FaLock,
  FaLockOpen,
  FaChild,
  FaClock,
  FaEdit,
  FaTimesCircle,
  FaInfinity,
} from "react-icons/fa";

export default function ParentControl() {
  const user = useUser();
  const parentId = user?.id || user?.user?.id;
  const { t } = useTranslation();

  const [children, setChildren] = useState([]);
  const [controls, setControls] = useState({});
  const [loading, setLoading] = useState(true);

  const [editingChild, setEditingChild] = useState(null);
  const [formData, setFormData] = useState({
    daily_limit_minutes: 0,
    allowed_start: "",
    allowed_end: "",
  });

  // Tick for real-time updates
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch children + controls
  useEffect(() => {
    if (!parentId) return;

    const fetchChildren = async () => {
      setLoading(true);
      const { data: kids, error } = await supabase
        .from("children")
        .select("id, full_name, age_range, avatar_url")
        .eq("parent_id", parentId);

      if (error) {
        console.error("Error fetching children:", error);
        setChildren([]);
        setLoading(false);
        return;
      }

      setChildren(kids || []);

      if (kids?.length) {
        const ids = kids.map((c) => c.id);
        const { data: controlData, error: controlError } = await supabase
          .from("child_controls")
          .select(
            "child_id, lessons_locked, daily_limit_minutes, time_used_today, allowed_start, allowed_end, time_start"
          )
          .in("child_id", ids);

        if (controlError) console.error("Error fetching controls:", controlError);

        const map = {};
        kids.forEach((c) => {
          const row = controlData?.find((r) => r.child_id === c.id);
          map[c.id] = row || {
            lessons_locked: false,
            daily_limit_minutes: 0,
            time_used_today: 0,
            allowed_start: null,
            allowed_end: null,
            time_start: null,
          };
        });

        setControls(map);
      }

      setLoading(false);
    };

    fetchChildren();
  }, [parentId]);

  // Toggle Lock
  const toggleLock = async (childId) => {
    const newStatus = !controls[childId].lessons_locked;
    const { error } = await supabase
      .from("child_controls")
      .upsert({ child_id: childId, lessons_locked: newStatus }, { onConflict: ["child_id"] });

    if (!error) {
      setControls((prev) => ({
        ...prev,
        [childId]: { ...prev[childId], lessons_locked: newStatus },
      }));
    } else {
      console.error("Error toggling lock:", error);
      toast.error(t("parentControls.saveError"));
    }
  };

  // Set No Limit
  const setNoLimit = async (childId) => {
    const { error } = await supabase
      .from("child_controls")
      .upsert(
        {
          child_id: childId,
          daily_limit_minutes: 0,
          time_used_today: 0,
          time_start: null,
        },
        { onConflict: ["child_id"] }
      );

    if (!error) {
      setControls((prev) => ({
        ...prev,
        [childId]: {
          ...prev[childId],
          daily_limit_minutes: 0,
          time_used_today: 0,
          time_start: null,
        },
      }));
      toast.success(t("parentControls.noLimitSet"));
    }
  };

  // Open Edit Modal
  const openEdit = (childId) => {
    const data = controls[childId];
    setEditingChild(childId);
    setFormData({
      daily_limit_minutes: data.daily_limit_minutes || 0,
      allowed_start: data.allowed_start || "",
      allowed_end: data.allowed_end || "",
    });
  };

  // Save settings
  const saveSettings = async () => {
    const { error } = await supabase
      .from("child_controls")
      .upsert(
        {
          child_id: editingChild,
          daily_limit_minutes: formData.daily_limit_minutes,
          allowed_start: formData.allowed_start || null,
          allowed_end: formData.allowed_end || null,
          time_start: new Date().toISOString(),
        },
        { onConflict: ["child_id"] }
      );

    if (error) {
      console.error("Save error:", error);
      toast.error(t("parentControls.saveError"));
    } else {
      setControls((prev) => ({
        ...prev,
        [editingChild]: { ...prev[editingChild], ...formData, time_start: new Date().toISOString() },
      }));
      setEditingChild(null);
      toast.success(t("parentControls.saveSuccess"));
    }
  };

  // Compute countdown and allowed status with proper priority
  const computeStatus = (control) => {
    const now = new Date();
    let allowed = true;
    let allowedText = t("parentControls.noSchedule");
    let percent = 0;
    let countdownText = t("parentControls.noLimit");
    let barColor = "bg-green-500";

    // Schedule check
    if (control.allowed_start && control.allowed_end) {
      const [startH, startM] = control.allowed_start.split(":").map(Number);
      const [endH, endM] = control.allowed_end.split(":").map(Number);
      const startTime = new Date(now);
      startTime.setHours(startH, startM, 0, 0);
      const endTime = new Date(now);
      endTime.setHours(endH, endM, 0, 0);

      if (now < startTime || now > endTime) allowed = false;
      allowedText = `${control.allowed_start} – ${control.allowed_end}`;
    }

    // Locked by parent → highest priority
    if (control.lessons_locked) {
      allowed = false;
      countdownText = t("parentControls.locked");
      barColor = "bg-red-600";
      percent = 100;
      return { allowed, allowedText, percent, countdownText, barColor };
    }

    // No limit → second priority
    if (control.daily_limit_minutes === 0) {
      allowed = true;
      countdownText = t("parentControls.unlimited");
      barColor = "bg-green-500";
      percent = 100;
      return { allowed, allowedText, percent, countdownText, barColor };
    }

    // Countdown for daily limit
    if (control.daily_limit_minutes > 0 && control.time_start) {
      const total = control.daily_limit_minutes * 60;
      const elapsed = Math.floor((Date.now() - new Date(control.time_start).getTime()) / 1000);
      const remaining = Math.max(total - elapsed, 0);
      percent = Math.min((elapsed / total) * 100, 100);

      countdownText =
        remaining > 0 ? `${Math.floor(remaining / 60)}m ${remaining % 60}s left` : t("parentControls.timeUp");

      if (remaining <= 0) barColor = "bg-red-500";
      else if (percent > 80) barColor = "bg-yellow-500";
      else barColor = "bg-green-500";
    }

    return { allowed, allowedText, percent, countdownText, barColor };
  };

  if (!user) return <p className="p-4 text-gray-700">{t("parentControls.mustLogin")}</p>;
  if (loading) return <p className="p-4 text-gray-700">{t("parentControls.loading")}</p>;

  return (
<div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 bg-gradient-to-b from-yellow-50 to-purple-50 min-h-screen rounded-xl shadow-md">
  <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-900 mb-4 sm:mb-6 border-b-2 border-purple-200 pb-2 flex items-center gap-2">
    <FaChild className="text-yellow-500" /> {t("parentControls.title")}
  </h1>

  {children.length === 0 ? (
    <p className="text-gray-700">{t("parentControls.noChildren")}</p>
  ) : (
    children.map((child) => {
      const control = controls[child.id];
      const { allowed, allowedText, percent, countdownText, barColor } = computeStatus(control);

      return (
        <motion.div
          key={child.id}
          className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition space-y-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {child.avatar_url ? (
                <img
                  src={child.avatar_url}
                  alt={child.full_name}
                  className="w-12 h-12 rounded-full object-cover border flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                  <FaChild className="text-purple-600 text-lg" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 truncate">{child.full_name}</h2>
                <p className="text-sm text-gray-600 truncate">
                  {t("parentControls.ageRange", { range: child.age_range })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleLock(child.id)}
                className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 shadow transition-colors ${
                  control.lessons_locked
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {control.lessons_locked ? <FaLock /> : <FaLockOpen />}
                {control.lessons_locked ? t("parentControls.locked") : t("parentControls.unlocked")}
              </motion.button>

              <button
                onClick={() => openEdit(child.id)}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow flex items-center gap-2"
              >
                <FaEdit /> {t("parentControls.edit")}
              </button>

              <button
                onClick={() => setNoLimit(child.id)}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow flex items-center gap-2"
              >
                <FaInfinity /> {t("parentControls.noLimit")}
              </button>
            </div>
          </div>

          {/* Screen Time */}
          <div className="space-y-1 mt-2">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <FaClock className="text-purple-500" /> {t("parentControls.screenTime")}
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div className={`${barColor} h-3`} style={{ width: `${percent}%` }} />
            </div>
            <p className="text-sm font-medium text-gray-700">{countdownText}</p>
            <p className="text-sm text-gray-600 italic">{allowedText}</p>
          </div>
        </motion.div>
      );
    })
  )}

      {/* Modal */}
      {editingChild && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-800">{t("parentControls.editSettings")}</h2>

            <label className="block text-sm font-medium">{t("parentControls.screenTime")}</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={(formData.daily_limit_minutes / 60).toFixed(1)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  daily_limit_minutes: Number(e.target.value) * 60,
                })
              }
              className="w-full border px-3 py-2 rounded"
              placeholder="Hours per day"
            />

            <button
              onClick={() =>
                setFormData({ daily_limit_minutes: 0, allowed_start: "", allowed_end: "" })
              }
              className="mt-2 flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
            >
              <FaTimesCircle /> {t("parentControls.removeTiming")}
            </button>

            <label className="block text-sm font-medium">{t("parentControls.schedule")}</label>
            <div className="flex gap-2">
              <input
                type="time"
                value={formData.allowed_start}
                onChange={(e) => setFormData({ ...formData, allowed_start: e.target.value })}
                className="border px-3 py-2 rounded w-1/2"
              />
              <input
                type="time"
                value={formData.allowed_end}
                onChange={(e) => setFormData({ ...formData, allowed_end: e.target.value })}
                className="border px-3 py-2 rounded w-1/2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingChild(null)}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
              >
                {t("parentControls.cancel")}
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                {t("parentControls.save")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <Toaster position="top-right" />
    </div>
  );
}
