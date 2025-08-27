// src/utils/NotificationBell.jsx
import React, { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import supabase from "../supabaseClient";
import { useTranslation } from "react-i18next";

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || "en";

  // Fetch notifications
  async function fetchNotifications() {
    if (!userId) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) console.error("Fetch notifications error:", error);
    else setNotifications(data || []);
  }

  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [userId]);

  // Mark a notification as read
  async function markAsRead(id) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) console.error("Mark as read error:", error);
    else fetchNotifications();
  }

  // Mark all as read
  async function markAllAsRead() {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
    if (error) console.error("Mark all as read error:", error);
    else fetchNotifications();
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative text-gray-300 hover:text-yellow-400"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1B263B] border border-[#FFD700]/30 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center p-2 border-b border-gray-700">
            <span className="text-yellow-400 font-bold text-sm">Notifications</span>
            <button
              onClick={markAllAsRead}
              className="text-gray-300 text-xs hover:text-white"
            >
              Mark all as read
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="p-4 text-gray-400">{t("notifications.noNotifications")}</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3 border-b border-gray-700 cursor-pointer ${
                    n.is_read ? "bg-[#0A192F]" : "bg-[#162447]"
                  }`}
                >
                  <p className="font-bold text-yellow-400 text-sm">
                    {currentLanguage === "en" ? n.title_en : n.title_yo}
                  </p>
                  <p className="text-gray-300 text-xs truncate">
                    {currentLanguage === "en" ? n.message_en : n.message_yo}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
