// src/components/admin/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import ProfileDropdown from "./ProfileDropDown";
import TalkingDrumSpinner from "../../../components/TalkingDrumSpinner";
import supabase from "../../../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/admin/login");
        return;
      }
      if (data.user.user_metadata?.role !== "admin") {
        navigate("/not-authorized");
        return;
      }
      setUser(data.user);
      setProfile({
        full_name: data.user.user_metadata.full_name || "Admin User",
        avatar_url: data.user.user_metadata.avatar_url || "",
      });
    };
    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const getBreadcrumbTitle = () => {
    if (location.pathname.includes("testimonial")) return "Testimonial Manager";
    if (location.pathname.includes("dashboard")) return "Dashboard";
    if (location.pathname.includes("lesson")) return "Lesson Management";
    return "Admin";
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1B2A]">
        <TalkingDrumSpinner />
      </div>
    );
  }

  return (
    <div className="flex bg-[#0D1B2A] text-white min-h-screen">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 md:ml-64">
        {/* Header */}
        <header className="w-full flex justify-between items-center px-6 py-4 bg-[#1B263B] border-b border-[#FFD700]/30 fixed md:static z-30">
          {/* Breadcrumb */}
          <h1 className="text-xl font-bold text-yellow-400">
            {getBreadcrumbTitle()}
          </h1>
          <ProfileDropdown
            user={user}
            profile={profile}
            setProfile={setProfile}
            handleLogout={handleLogout}
          />
        </header>

        {/* Content */}
        <main className="flex-1 p-6 pt-20 md:pt-6">{children}</main>
      </div>
    </div>
  );
}
