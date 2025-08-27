// src/pages/admin/AdminNotificationSender.jsx
import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import AdminLayout from "../../features/admin/layout/AdminLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminNotificationSender() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [audienceOptions, setAudienceOptions] = useState([]);
  const [audience, setAudience] = useState("single");
  const [titleEn, setTitleEn] = useState("");
  const [titleYo, setTitleYo] = useState("");
  const [messageEn, setMessageEn] = useState("");
  const [messageYo, setMessageYo] = useState("");
  const [type, setType] = useState("general");
  const [loading, setLoading] = useState(false);

  // Fetch profiles and children
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, role, is_admin");
        if (profileError) throw profileError;

        const { data: childrenData, error: childrenError } = await supabase
          .from("children")
          .select("user_id, full_name, age_range");
        if (childrenError) throw childrenError;

        // Combine all users
        const allUsers = [
          ...profileData.map((u) => ({
            id: u.id,
            name: u.full_name,
            role: u.is_admin
              ? "admin"
              : u.role
              ? u.role
              : "parent", // default to parent if no role and not admin
            type: "profile",
          })),
          ...childrenData.map((c) => ({
            id: c.user_id,
            name: `${c.full_name} (child ${c.age_range})`,
            role: `children:${c.age_range}`,
            type: "child",
          })),
        ];

        setUsers(allUsers);
        setFilteredUsers(allUsers);

        // Prepare audience options
        const rolesSet = new Set(
          profileData.map((u) =>
            u.is_admin ? "admin" : u.role ? u.role : "parent"
          )
        );

        const ageSet = new Set(childrenData.map((c) => c.age_range));

        const audOptions = [
          { label: "Single User", value: "single" },
          ...Array.from(rolesSet)
            .filter(Boolean)
            .map((r) => ({ label: r.charAt(0).toUpperCase() + r.slice(1), value: r })),
          ...Array.from(ageSet)
            .filter(Boolean)
            .map((a) => ({ label: `Children ${a}`, value: `children:${a}` })),
          { label: "All Users", value: "all" },
        ];

        setAudienceOptions(audOptions);
        setAudience(audOptions[0]?.value || "single");
      } catch (err) {
        console.error("Fetch data error:", err);
        toast.error("Failed to fetch users or children");
      }
    }
    fetchData();
  }, []);

  // Global search
  useEffect(() => {
    setFilteredUsers(
      users.filter((u) =>
        u.name.toLowerCase().includes(searchUser.toLowerCase())
      )
    );
  }, [searchUser, users]);

  async function handleSend() {
    setLoading(true);
    try {
      let targetUserIds = [];

      if (audience === "single") {
        if (!selectedUser) {
          toast.error("Please select a user");
          setLoading(false);
          return;
        }
        targetUserIds = [selectedUser];
      } else if (audience.startsWith("children:")) {
        targetUserIds = users
          .filter((u) => u.role === audience)
          .map((u) => u.id);
      } else if (audience === "all") {
        targetUserIds = users.map((u) => u.id);
      } else {
        targetUserIds = users
          .filter((u) => u.type === "profile" && u.role === audience)
          .map((u) => u.id);
      }

      if (targetUserIds.length === 0) {
        toast.error("No users found for selected audience");
        setLoading(false);
        return;
      }

      const notifications = targetUserIds.map((id) => ({
        user_id: id,
        title_en: titleEn,
        title_yo: titleYo,
        message_en: messageEn,
        message_yo: messageYo,
        type,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      toast.success("✅ Notifications sent successfully!");
      setTitleEn("");
      setTitleYo("");
      setMessageEn("");
      setMessageYo("");
      setSelectedUser("");
      setAudience("single");
      setType("general");
      setSearchUser("");
    } catch (err) {
      console.error("Send notification error:", err);
      toast.error("❌ Failed to send notifications");
    } finally {
      setLoading(false);
    }
  }

  const showPreview = titleEn || titleYo || messageEn || messageYo;

  return (
    <AdminLayout>
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-2xl font-bold mb-6 text-yellow-400">Send Notification</h2>

      {/* Audience selection */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Target Audience:</label>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="px-2 py-1 rounded bg-[#0A192F] border border-gray-600 text-white"
        >
          {audienceOptions.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      {/* Search + Single user */}
      {audience === "single" && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search user..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="mb-2 w-full px-3 py-2 rounded bg-[#0A192F] border border-gray-600 text-white"
          />
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-2 py-1 rounded bg-[#0A192F] border border-gray-600 text-white w-full"
          >
            <option value="">-- Select User --</option>
            {filteredUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Notification type */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Type:</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-2 py-1 rounded bg-[#0A192F] border border-gray-600 text-white"
        >
          <option value="lesson">Lesson</option>
          <option value="quiz">Quiz</option>
          <option value="system">System</option>
          <option value="chat">Chat</option>
          <option value="parent">Parent</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Titles & Messages */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Title (EN)"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className="mb-2 w-full px-3 py-2 rounded bg-[#0A192F] border border-gray-600 text-white"
        />
        <input
          type="text"
          placeholder="Title (YO)"
          value={titleYo}
          onChange={(e) => setTitleYo(e.target.value)}
          className="mb-2 w-full px-3 py-2 rounded bg-[#0A192F] border border-gray-600 text-white"
        />
        <textarea
          placeholder="Message (EN)"
          value={messageEn}
          onChange={(e) => setMessageEn(e.target.value)}
          className="mb-2 w-full px-3 py-2 rounded bg-[#0A192F] border border-gray-600 text-white"
        />
        <textarea
          placeholder="Message (YO)"
          value={messageYo}
          onChange={(e) => setMessageYo(e.target.value)}
          className="w-full px-3 py-2 rounded bg-[#0A192F] border border-gray-600 text-white"
        />
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="mb-4 p-4 bg-[#1B263B] rounded border border-gray-700 text-white">
          <h3 className="font-bold text-lg mb-2">Preview:</h3>
          <p><strong>Title (EN):</strong> {titleEn || "—"}</p>
          <p><strong>Title (YO):</strong> {titleYo || "—"}</p>
          <p><strong>Message (EN):</strong> {messageEn || "—"}</p>
          <p><strong>Message (YO):</strong> {messageYo || "—"}</p>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
      >
        {loading ? "Sending..." : "Send Notification"}
      </button>
    </AdminLayout>
  );
}
