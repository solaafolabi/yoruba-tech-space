// src/App.js
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "./supabaseClient";
import "./i18n";
import LanguagePopup from "./components/LanguagePopup";
import { LanguageProvider } from "./pages/admission/LanguageContext";
import TalkingDrumSpinner from "./components/TalkingDrumSpinner";

// --- Components & Pages ---
import ErrorPage from "./components/ErrorPage"; // ✅ New error page

// Admin
import AddLesson from "./features/admin/AddLesson";
import AdminLogin from "./features/auth/AdminLogin";
import AdminDashboard from "./features/admin/AdminDashboard";
import PracticalStepsUpload from "./features/admin/PracticalStepsUpload";
import EditCourse from "./features/admin/EditCourse";
import AdminDropDown from "./features/admin/layout/ProfileDropDown";
import EditLesson from "./features/admin/EditLesson";
import AddCourse from "./features/admin/AddCourse";
import UploadCsv from "./features/admin/UploadCsv";
import ManualUpload from "./features/admin/ManualUpload";
import AdminLessonBuilder from "./features/admin/lesson_builder/AdminLessonBuilder";
import AdminTestimonialManager from "./features/admin/AdminTestimonialManager";
import AdminFinalProjectReview from "./features/admin/AdminFinalProjectReview";
import AdminNotificationSender from "./features/admin/AdminNotificationSender";
import ManageAdmin from "./features/admin/ManageAdmin";
import LiveClass from "./features/admin/LiveClass";
import LiveMeeting from "./pages/live/LiveMeeting";


// Kids
import ParentLogin from "./features/parents/components/ParentLogin";
import ParentSignup from "./features/parents/components/ParentSignup";
import ChildrenDashboard from "./features/kids/ChildrenDashboard";
import LessonViewKid from "./features/kids/LessonViewKid";
import KidLogin from "./features/kids/KidLogin";
import ChildrenDashboardLayout from "./features/kids/ChildrenDashboardLayout";
import ParentDashboardLayout from "./features/parents/layout/ParentDashboardLayout";
import MyChildren from "./features/parents/pages/MyChildren";
import ProgressReports from "./features/parents/pages/ProgressReports";
import Donations from "./features/parents/pages/Donations";
import ParentSettings from "./features/parents/pages/ParentSettings";
import ParentHome from "./features/parents/components/ParentHome";

// Student
import Dashboard from "./pages/student/dashboard/Dashboard";
import LessonView from "./pages/student/lesson/LessonView";
import PracticalView from "./pages/student/Practical/PracticalView";
import FinalProjectUpload from "./pages/student/FinalProjectUpload";


// Landing Pages
import Navbar from "./features/landing/Navbar";
import Hero from "./features/landing/Hero";
import Courses from "./features/landing/Courses";
import HowItWorks from "./features/landing/HowItWorks";
import AdmissionCTA from "./features/landing/AdmissionCTA";
import Testimonial from "./features/landing/Testimonial";
import Footer from "./features/landing/Footer";
import About from "./features/landing/About";
import Contact from "./features/landing/Contact";
import AdmissionForm from "./pages/admission/AdmissionForm";
import Donate from "./pages/Donate";

// Chat
import ChatModal from "./features/chat/ChatModal";

// Courses
import JsCourse from "./features/courses/JsCourse";
import PythonCourse from "./features/courses/PythonCourse";
import FirebaseCourse from "./features/courses/FirebaseCourse";
import GitCourse from "./features/courses/GitCourse";
import ReactNativeCourse from "./features/courses/ReactNativeCourse";
import HtmlCourse from "./features/courses/HtmlCourse";

// Auth
import Login from "./features/auth/Login";
import Signup from "./features/auth/Signup";
import ForgotPassword from "./features/auth/ForgotPassword";
import ResetPassword from "./features/auth/ResetPassword";

/** -------------------------
 * ProtectedRoute
 * ------------------------- */
function ProtectedRoute({ allowedRoles, redirectPath }) {
  const [status, setStatus] = useState({ loading: true, allowed: false });

  useEffect(() => {
    async function checkAccess() {
      let role = null;
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user) {
          role = user.user_metadata?.role?.toLowerCase() || null;

          if (!role) {
            const { data: childData, error: childError } = await supabase
              .from("children")
              .select("level")
              .eq("user_id", user.id)
              .single();

            if (childError && childError.code !== "PGRST116") throw childError;
            if (childData) role = "child";
          }
        }

        const allowed = allowedRoles.map(r => r.toLowerCase());
        setStatus({ loading: false, allowed: role && allowed.includes(role) });
      } catch (err) {
        console.error("ProtectedRoute error:", err.message || err);
        setStatus({ loading: false, allowed: false });
      }
    }

    checkAccess();
  }, [allowedRoles]);

  if (status.loading) return <TalkingDrumSpinner />;
  return status.allowed ? <Outlet /> : <Navigate to={redirectPath} replace />;
}

/** -------------------------
 * AppContent
 * ------------------------- */
function AppContent() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const isKidsDashboard = location.pathname.startsWith("/kids");
  const showChatModal =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin");

  const hideLayout =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/student/practical") ||
    location.pathname.startsWith("/student/final-project") ||
    location.pathname.startsWith("/parents/dashboard") ||
    isKidsDashboard;

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
      } catch (err) {
        console.error("AppContent user fetch error:", err);
      }
    }
    fetchUser();

    if (location.pathname === "/") setShowPopup(true);
  }, [location.pathname]);

  return (
    <>
      {showPopup && <LanguagePopup onClose={() => setShowPopup(false)} />}
      {!hideLayout && <Navbar />}

      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Kids */}
        <Route path="/kid/login" element={<KidLogin />} />
        <Route element={<ProtectedRoute allowedRoles={["child"]} redirectPath="/kid/login" />}>
          <Route path="/kids/dashboard" element={<ChildrenDashboardLayout><ChildrenDashboard /></ChildrenDashboardLayout>} />
          <Route path="/kids/lesson/:lessonSlug" element={<LessonViewKid />} />
        </Route>

        {/* Parents */}
        <Route path="/parents/signup" element={<ParentSignup />} />
        <Route path="/parents/login" element={<ParentLogin />} />
        <Route element={<ProtectedRoute allowedRoles={["parent"]} redirectPath="/parents/login" />}>
          <Route path="/parents/dashboard" element={<ParentDashboardLayout />}>
            <Route index element={<ParentHome />} />
            <Route path="children" element={<MyChildren />} />
            <Route path="reports" element={<ProgressReports />} />
            <Route path="donations" element={<Donations />} />
            <Route path="settings" element={<ParentSettings />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute allowedRoles={["admin"]} redirectPath="/admin/login" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-lesson" element={<AddLesson />} />
          <Route path="/admin/add-course" element={<AddCourse />} />
          <Route path="/admin/uploadcsv" element={<UploadCsv />} />
          <Route path="/admin/manualupload" element={<ManualUpload />} />
          <Route path="/admin/lesson-upload" element={<AdminLessonBuilder />} />
          <Route path="/admin/editcourse" element={<EditCourse />} />
          <Route path="/admin/dropdown" element={<AdminDropDown />} />
          <Route path="/admin/practical-steps-upload" element={<PracticalStepsUpload />} />
          <Route path="/admin/edit-lesson/:id" element={<EditLesson />} />
          <Route path="/admin/testimonials" element={<AdminTestimonialManager />} />
          <Route path="/admin/final-projects" element={<AdminFinalProjectReview />} />
          <Route path="/admin/notifications" element={<AdminNotificationSender />} />
          <Route path="/admin/manageadmin" element={<ManageAdmin />} />
             <Route path="/admin/liveclass" element={<LiveClass />} />
             <Route path="/live/:roomName" element={<LiveMeeting />} />
        </Route>

        {/* Student */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} redirectPath="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/learn/:courseSlug/:lessonSlug" element={<LessonView />} />
          <Route path="/student/practical/:lessonSlug" element={<PracticalView />} />
          <Route path="/student/final-project/:courseId" element={<FinalProjectUpload />} />
         

        </Route>

        {/* Public Pages */}
        <Route path="/" element={<><Hero /><HowItWorks /><Courses /><AdmissionCTA /><Testimonial /></>} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/admission" element={<AdmissionForm />} />
        <Route path="/donate" element={<Donate />} />

        {/* Public Course Views */}
        <Route path="/courses/firebase" element={<FirebaseCourse />} />
        <Route path="/courses/react-native" element={<ReactNativeCourse />} />
        <Route path="/courses/javascript" element={<JsCourse />} />
        <Route path="/courses/python" element={<PythonCourse />} />
        <Route path="/courses/git-github" element={<GitCourse />} />
        <Route path="/courses/html-css" element={<HtmlCourse />} />

        {/* Catch-All Error Page */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>

      {!hideLayout && <Footer />}
      {user && showChatModal && <ChatModal user={user} />}
    </>
  );
}

/** -------------------------
 * App Wrapper
 * ------------------------- */
export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <TalkingDrumSpinner />;

  return (
    <Router>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </Router>
  );
}



