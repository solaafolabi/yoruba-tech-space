// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import AdminLayout from "./layout/AdminLayout"; // ✅ Use your new layout!
import UploadCsv from "./UploadCsv";
import ManualUpload from "./ManualUpload";
import { motion } from "framer-motion";
import {
  FaBookOpen,
  FaClipboardList,
  FaChalkboardTeacher,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const barData = [
  { course: "HTML", uploads: 5 },
  { course: "CSS", uploads: 3 },
  { course: "React", uploads: 2 },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [courseCount, setCourseCount] = useState(0);
  const [moduleCount, setModuleCount] = useState(0);
  const [lessonCount, setLessonCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user;

      if (currentUser?.user_metadata?.role === "admin") {
        setUser(currentUser);
      } else {
        navigate("/not-authorized");
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: courses }, { count: modules }, { count: lessons }] =
        await Promise.all([
          supabase.from("courses").select("*", { count: "exact", head: true }),
          supabase.from("modules").select("*", { count: "exact", head: true }),
          supabase.from("lessons").select("*", { count: "exact", head: true }),
        ]);

      setCourseCount(courses || 0);
      setModuleCount(modules || 0);
      setLessonCount(lessons || 0);
    };

    fetchCounts();
  }, []);

  if (!user) return <div className="text-white text-center mt-20">Loading dashboard...</div>;

  const stats = [
    {
      title: "Courses",
      icon: <FaBookOpen />,
      count: courseCount,
      color: "text-pink-400",
    },
    {
      title: "Modules",
      icon: <FaClipboardList />,
      count: moduleCount,
      color: "text-yellow-400",
    },
    {
      title: "Lessons",
      icon: <FaChalkboardTeacher />,
      count: lessonCount,
      color: "text-green-300",
    },
  ];

  const notifications = [
    "📥 New lesson submitted",
    "🧑‍🎓 3 new students joined",
    "✅ Grace passed CSS quiz",
  ];

  return (
    <AdminLayout>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Upload CSV Modal */}
        {showCsvModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white text-black p-6 rounded-lg w-full max-w-xl relative">
              <button
                onClick={() => setShowCsvModal(false)}
                className="absolute top-2 right-4 text-xl text-red-500"
              >
                &times;
              </button>
              <UploadCsv />
            </div>
          </div>
        )}

        {/* Manual Upload Modal */}
        {showManualModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <ManualUpload onClose={() => setShowManualModal(false)} />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              className="bg-white/10 p-4 rounded-xl border border-white/20 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className={`text-sm font-bold ${card.color}`}>{card.title}</h2>
                <span className={`${card.color} text-xl`}>{card.icon}</span>
              </div>
              <p className="text-2xl font-bold">{card.count}</p>
              <p className="text-xs text-gray-300">
                Total {card.title.toLowerCase()}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Charts + Notifications */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 p-6 rounded-xl border border-white/20">
            <h3 className="text-lg font-bold text-purple-300 mb-4">
              📊 Course Upload Stats
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="course" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Bar dataKey="uploads" fill="#facc15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/10 p-6 rounded-xl border border-white/20">
            <h3 className="text-lg font-bold text-blue-300 mb-4">
              🔔 Notifications
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 max-h-40 overflow-y-auto">
              {notifications.map((note, idx) => (
                <li
                  key={idx}
                  className="bg-white/5 px-4 py-2 rounded"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recently Uploaded Lessons (Static for now) */}
        <div className="mt-8 bg-white/10 p-6 rounded-xl border border-white/20">
          <h3 className="text-lg font-bold text-green-300 mb-4">
            🎥 Recently Uploaded Lessons
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/20">
                  <th className="p-2">Title</th>
                  <th className="p-2">Course</th>
                  <th className="p-2">Video</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="p-2">Intro to HTML</td>
                  <td className="p-2">HTML</td>
                  <td className="p-2">
                    <a href="#" className="text-yellow-300 underline">Watch</a>
                  </td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="p-2">Flexbox Basics</td>
                  <td className="p-2">CSS</td>
                  <td className="p-2">
                    <a href="#" className="text-yellow-300 underline">Watch</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
