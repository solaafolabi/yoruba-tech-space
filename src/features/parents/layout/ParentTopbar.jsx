// ParentTopbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ParentTopbar({ setSidebarOpen }) {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const avatarRef = useRef(null);
  const notifRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    fullName: "Parent",
    avatarUrl: "/avatar.png",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    avatarFile: null,
  });
  const [notifications, setNotifications] = useState([]);

  // Language & profile fetching
  useEffect(() => {
    const savedLang = localStorage.getItem("preferredLanguage");
    const browserLang = navigator.language.startsWith("yo") ? "yo" : "en";
    const selectedLang = savedLang || browserLang;
    i18n.changeLanguage(selectedLang);
    localStorage.setItem("preferredLanguage", selectedLang);

    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, profile_picture")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setUserProfile({
            fullName: data.full_name || "Parent",
            avatarUrl: data.profile_picture || "/avatar.png",
          });
          setFormData((prev) => ({
            ...prev,
            fullName: data.full_name || "",
          }));
        } else {
          console.error("Error fetching profile:", error);
        }
      }
    };

    fetchProfile();
    fetchNotifications();
  }, [i18n]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) setNotifications(data);
    else console.error("Error fetching notifications:", error);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "yo" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("preferredLanguage", newLang);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const { fullName, avatarFile } = formData;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let avatar_url = userProfile.avatarUrl;

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        avatar_url = `${data.publicUrl}?t=${Date.now()}`;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, profile_picture: avatar_url })
      .eq("id", user.id);

    if (!error) {
      setUserProfile({ fullName, avatarUrl: avatar_url });
      setShowProfileModal(false);
    } else {
      alert("Profile update failed.");
    }
  };

  return (
    <header className="bg-[#1B263B] text-white px-6 py-4 flex justify-between items-center border-b-4 border-[#FFD700] shadow-xl rounded-b-2xl relative z-50">
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            if (typeof setSidebarOpen === "function") setSidebarOpen(true);
            setDropdownOpen(false);
            setNotifOpen(false);
          }}
          className="md:hidden text-3xl text-[#FFD700] z-[10000]"
        >
          ☰
        </motion.button>

        <h2 className="text-lg md:text-xl font-semibold text-[#fff]">
          👋 {t("topbar.welcome")}, {userProfile.fullName}
        </h2>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="hidden md:block text-sm px-4 py-2 bg-[#FFD700] text-[#0f172a] rounded-full font-bold shadow border"
        >
          🌍 {i18n.language === "en" ? "Yorùbá" : "English"}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#FFD700] text-[#0f172a] shadow-lg"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            🔔
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-64 bg-[#0f172a] border border-[#1B263B] rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {notifications.length === 0 ? (
                  <div className="p-4 text-gray-300">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 border-b border-[#1B263B] hover:bg-[#1B263B] cursor-pointer">
                      {n.message}
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar Dropdown */}
        <div className="relative z-[9999]" ref={avatarRef}>
          <motion.img
            whileHover={{
              y: [-2, 2, -2],
              transition: { repeat: Infinity, duration: 1.5 },
            }}
            onClick={() => setDropdownOpen((prev) => !prev)}
            src={userProfile.avatarUrl}
            alt="Avatar"
            className="w-12 h-12 min-w-[3rem] min-h-[3rem] rounded-full cursor-pointer border-2 border-[#FFD700] shadow-lg object-cover"
          />

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="fixed right-4 top-[72px] bg-[#0f172a] text-white border border-[#1B263B] rounded-xl shadow-xl w-56 z-[99999]"
              >
                <button
                  className="w-full text-left px-4 py-3 hover:bg-[#1B263B] font-bold"
                  onClick={() => {
                    setShowProfileModal(true);
                    setDropdownOpen(false);
                  }}
                >
                  👤 {t("topbar.profile")}
                </button>
                <button
                  className="w-full text-left px-4 py-3 hover:bg-red-100 text-red-400 font-bold"
                  onClick={handleLogout}
                >
                  🚪 {t("topbar.logout")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-[90%] max-w-md"
            >
              <h2 className="text-xl font-bold mb-6 text-[#0f172a]">
                {t("profileForm.title")}
              </h2>

              <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="border px-4 py-2 rounded"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      avatarFile: e.target.files[0],
                    })
                  }
                  className="border px-4 py-2 rounded"
                />

                <div className="flex justify-end gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded text-sm font-bold"
                  >
                    {t("profileForm.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FFD700] text-[#0f172a] rounded text-sm font-bold"
                  >
                    {t("profileForm.save")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
