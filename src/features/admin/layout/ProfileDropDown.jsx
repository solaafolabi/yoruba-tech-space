import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaUpload, FaCog, FaTachometerAlt, FaSignOutAlt } from "react-icons/fa";
import supabase from "../../../supabaseClient";
import { Link } from "react-router-dom";

export default function ProfileDropdown({ user, profile, setProfile, handleLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const dropdownRef = useRef();

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      setUploadMessage("");
      const file = event.target.files[0];
      if (!file) return;

      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > 2) {
        setUploadMessage("📛 File too large. Max size: 2MB");
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

      const { data: { publicUrl } } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrlWithTimestamp })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => ({
        ...prev,
        avatar_url: avatarUrlWithTimestamp,
      }));
      setUploadMessage("✅ Uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error.message);
      setUploadMessage("❌ Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setUploadPreview(URL.createObjectURL(file));
    handleAvatarUpload(e);
  };

  return (
    <div className="relative flex justify-end items-center" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2 bg-[#1B263B] rounded-lg border border-[#FFD700]/40 hover:bg-[#FFD700]/10"
      >
        <img
          src={
            profile?.avatar_url ||
            `https://api.dicebear.com/6.x/initials/svg?seed=${profile?.full_name || "U"}`
          }
          alt="Avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
        <FaChevronDown
          className={`text-white transform transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute right-0 top-full mt-2 w-72 bg-[#1B263B] border border-[#FFD700]/30 rounded-lg shadow-lg z-50 p-4 space-y-3 transition-all duration-200 ${
          dropdownOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src={
              profile?.avatar_url ||
              `https://api.dicebear.com/6.x/initials/svg?seed=${profile?.full_name || "U"}`
            }
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-white">{profile?.full_name}</p>
            <p className="text-sm text-gray-300">{user?.email}</p>
          </div>
        </div>

        <label className="text-sm text-gray-400 block mb-1">Upload New Avatar:</label>
        <label className="flex items-center gap-2 px-4 py-2 bg-[#0D1B2A] rounded border border-[#FFD700] cursor-pointer hover:bg-[#FFD700]/10">
          <FaUpload className="text-[#FFD700]" /> <span className="text-white">Select Image</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>

        {uploadPreview && (
          <img
            src={uploadPreview}
            alt="Preview"
            className="w-16 h-16 rounded-full mt-3 object-cover"
          />
        )}

        {uploading && <p className="text-xs text-yellow-400 mt-1">Uploading...</p>}
        {uploadMessage && <p className="text-xs text-green-400 mt-1">{uploadMessage}</p>}

        <div className="border-t border-gray-600 pt-3 space-y-2">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 text-gray-200 hover:text-[#FFD700]"
          >
            <FaTachometerAlt /> Dashboard
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-2 text-gray-200 hover:text-[#FFD700]"
          >
            <FaCog /> Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 w-full"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
