import React, { useState } from "react";
import { FaChevronDown, FaUpload } from "react-icons/fa";
import supabase from "../supabaseClient";
import NotificationBell from "../utils/NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function ProfileDropdown({ user, profile, setProfile, handleLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const { t } = useTranslation();

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadMessage("");

    try {
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > 2) {
        setUploadMessage(t("profileDropdown.fileTooLarge"));
        setUploading(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture: avatarUrlWithTimestamp })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, profile_picture: avatarUrlWithTimestamp }));
      setUploadMessage(t("profileDropdown.uploadSuccess"));
    } catch (err) {
      console.error("Upload failed:", err.message);
      setUploadMessage(t("profileDropdown.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadPreview(URL.createObjectURL(file));
      handleAvatarUpload(file);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Notification Bell */}
      <NotificationBell userId={user?.id} />

      {/* Profile Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 px-4 py-2 bg-[#1B263B] rounded-lg border border-[#FFD700]/40 hover:bg-[#FFD700]/10"
        >
          <img
            src={
              profile?.profile_picture ||
              `https://api.dicebear.com/6.x/initials/svg?seed=${profile?.full_name || "U"}`
            }
            alt={t("profileDropdown.profile")}
            className="w-8 h-8 rounded-full"
          />
          <FaChevronDown />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-[#1B263B] border border-[#FFD700]/30 rounded-lg shadow-lg z-50 p-4 space-y-3">
            
            {/* Global Language Switcher */}
            <LanguageSwitcher />

            {/* Profile Info */}
            <div className="flex items-center gap-3 mt-2">
              <img
                src={
                  profile?.profile_picture ||
                  `https://api.dicebear.com/6.x/initials/svg?seed=${profile?.full_name || "U"}`
                }
                alt={t("profileDropdown.profile")}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold">{profile?.full_name}</p>
                <p className="text-sm text-gray-300">{user?.email}</p>
              </div>
            </div>

            {/* Upload Avatar */}
            <label className="text-sm text-gray-400 block mb-1 mt-2">
              {t("profileDropdown.uploadAvatar")}:
            </label>
            <label className="flex items-center gap-2 px-4 py-2 bg-[#0D1B2A] rounded border border-[#FFD700] cursor-pointer hover:bg-[#FFD700]/10">
              <FaUpload className="text-[#FFD700]" /> <span>{t("profileDropdown.selectImage")}</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {uploadPreview && (
              <img
                src={uploadPreview}
                alt={t("profileDropdown.avatarPreview")}
                className="w-16 h-16 rounded-full mt-3 object-cover"
              />
            )}

            {uploading && (
              <p className="text-xs text-yellow-400 mt-1">{t("profileDropdown.uploading")}</p>
            )}
            {uploadMessage && (
              <p
                className={`text-xs mt-1 ${
                  uploadMessage.includes("✅") ? "text-green-400" : "text-red-400"
                }`}
              >
                {uploadMessage}
              </p>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              {t("profileDropdown.logout")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
