// src/components/admin/AdminSidebar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../../../supabaseClient";
import {
  FaChevronDown,
  FaBars,
  FaHome,
  FaBook,
  FaLaptopCode,
  FaChalkboardTeacher,
  FaQuoteRight,
  FaClipboardCheck,
  FaSignOutAlt,
} from "react-icons/fa";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showPracticalDropdown, setShowPracticalDropdown] = useState(false);
  const [lessonDropdown, setLessonDropdown] = useState(false);
  const [testimonialDropdown, setTestimonialDropdown] = useState(false);
  const [projectDropdown, setProjectDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paymentDropdown, setPaymentDropdown] = useState(false);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <>
      {/* Hamburger for Mobile */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden p-4 text-white bg-[#0f172a] fixed top-4 left-4 z-50 rounded"
      >
        <FaBars size={20} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#0f172a] text-white flex flex-col z-40 transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-6 text-yellow-400">⚙️ Admin</h2>
          <ul className="space-y-4">
            {/* Dashboard */}
            <li>
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 py-2 px-3 rounded hover:bg-yellow-500/20 transition"
              >
                <FaHome /> Dashboard
              </Link>
            </li>

            {/* Course Management */}
            <li>
              <button
                onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-white/10 transition text-sm rounded"
              >
                <FaBook className="mr-2" /> Course Management
                <FaChevronDown
                  className={`ml-2 transition-transform ${showCourseDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {showCourseDropdown && (
                <div className="pl-6 space-y-1 mt-1">
                  <Link
                    to="/admin/editcourse"
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 text-xs rounded"
                  >
                    📤 Course CRUD
                  </Link>
                </div>
              )}
            </li>

            {/* Practical */}
            <li>
              <button
                onClick={() => setShowPracticalDropdown(!showPracticalDropdown)}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-white/10 transition text-sm rounded"
              >
                <FaLaptopCode className="mr-2" /> Practical
                <FaChevronDown
                  className={`ml-2 transition-transform ${showPracticalDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {showPracticalDropdown && (
                <div className="pl-6 space-y-1 mt-1">
                  <Link
                    to="/admin/practical-steps-upload"
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 text-xs rounded"
                  >
                    ✍️ Practical Steps Upload
                  </Link>
                  <Link
                    to="/admin/practical/upload-csv"
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 text-xs rounded"
                  >
                    📤 Edit Practical
                  </Link>
                </div>
              )}
            </li>

            {/* Lesson */}
            <li>
              <button
                onClick={() => setLessonDropdown(!lessonDropdown)}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-white/10 transition text-sm rounded"
              >
                <FaChalkboardTeacher className="mr-2" /> Lesson
                <FaChevronDown
                  className={`ml-2 transition-transform ${lessonDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {lessonDropdown && (
                <div className="pl-6 space-y-1 mt-1">
                  <Link
                    to="/admin/lesson-upload"
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 text-xs rounded"
                  >
                    ✍️ Upload Lesson
                  </Link>
                  <Link
                    to="/admin/lesson/edit"
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 text-xs rounded"
                  >
                    📤 Edit Lesson
                  </Link>
                </div>
              )}
            </li>

            {/* Testimonials */}
            <li>
              <button
                onClick={() => setTestimonialDropdown(!testimonialDropdown)}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-white/10 transition text-sm rounded"
              >
                <FaQuoteRight className="mr-2" /> Testimonials
                <FaChevronDown
                  className={`ml-2 transition-transform ${testimonialDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {testimonialDropdown && (
                <div className="pl-6 space-y-1 mt-1">
                  <Link
                    to="/admin/testimonials"
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 text-xs rounded"
                  >
                    📤 Upload / Manage Testimonials
                  </Link>
                </div>
              )}
            </li>

            {/* Project */}
            <li>
              <button
                onClick={() => setProjectDropdown(!projectDropdown)}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-white/10 transition text-sm rounded"
              >
                🗂 Project
                <FaChevronDown
                  className={`ml-2 transition-transform ${projectDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {projectDropdown && (
                <div className="pl-6 space-y-1 mt-1">
                  <Link
                    to="/admin/final-projects"
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 text-xs rounded"
                  >
                    📤 Manage Project
                  </Link>
                  <Link
                    to="/admin/final-project-review"
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 text-xs rounded"
                  >
                    ✅ Review Final Projects
                  </Link>
                </div>
              )}
            </li>
                {/* Payment / Keys */}
<li>
  <button
    onClick={() => setPaymentDropdown(!paymentDropdown)}
    className="flex items-center justify-between w-full px-4 py-2 hover:bg-white/10 transition text-sm rounded"
  >
    💳 Payment
    <FaChevronDown
      className={`ml-2 transition-transform ${paymentDropdown ? "rotate-180" : ""}`}
    />
  </button>
  {paymentDropdown && (
    <div className="pl-6 space-y-1 mt-1">
      <Link
        to="/admin/paystack"
        className="block w-full text-left px-2 py-1 hover:bg-white/10 text-xs rounded"
      >
        🔑 Manage Keys
      </Link>
    </div>
  )}
</li>

            {/* Back Home */}
            <li>
              <Link
                to="/"
                className="flex items-center gap-2 py-2 px-3 rounded hover:bg-yellow-500/20 transition"
              >
                <FaHome /> Back Home
              </Link>
            </li>
          </ul>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm flex items-center justify-center gap-2"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
