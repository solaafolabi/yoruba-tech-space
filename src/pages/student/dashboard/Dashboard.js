// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../supabaseClient";
import StudentSidebar from "../studentsidebar/StudentSidebar";
import ProfileDropdown from "../../../components/ProfileDropdown";
import AdmissionModal from "../../admission/AdmissionModal";

import CourseTabs from "./CourseTabs";
import DashboardCharts from "./DashboardCharts";
import RecentActivity from "./RecentActivity";
import CertificatesDiscord from "./CertificatesDiscord";

import { useTranslation } from "react-i18next";

// Countdown component
// Beautiful Live Class Countdown
function LiveClassCountdown({ startTime }) {
  const [timeLeft, setTimeLeft] = useState({});
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(startTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsLive(true);
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Color gradient based on seconds left
  const getColor = (s) => {
    if (s > 30) return "bg-green-500";
    if (s > 10) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isLive) {
    return <span className="text-green-400 font-bold animate-pulse text-lg">Live Now! 🚀</span>;
  }

  return (
    <div className="flex gap-2 justify-center items-center text-white font-semibold">
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColor(timeLeft.seconds || 0)}`}>
          {timeLeft.hours?.toString().padStart(2, "0") || "00"}
        </div>
        <span className="text-xs mt-1">Hrs</span>
      </div>
      <span className="text-white text-lg">:</span>
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColor(timeLeft.seconds || 0)}`}>
          {timeLeft.minutes?.toString().padStart(2, "0") || "00"}
        </div>
        <span className="text-xs mt-1">Min</span>
      </div>
      <span className="text-white text-lg">:</span>
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColor(timeLeft.seconds || 0)}`}>
          {timeLeft.seconds?.toString().padStart(2, "0") || "00"}
        </div>
        <span className="text-xs mt-1">Sec</span>
      </div>
    </div>
  );
}


// Jitsi embed component
function LiveClass({ liveClass, profile }) {
  return (
    <iframe
      src={`https://meet.jit.si/${liveClass.room_name}#userInfo.displayName=${encodeURIComponent(profile?.full_name || "Student")}`}
      allow="camera; microphone; fullscreen; display-capture"
      style={{ width: "100%", height: "400px", border: "none", borderRadius: "12px" }}
      title="Live Class"
    />
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [currentTab, setTab] = useState("myCourses");

  const [audience, setAudience] = useState("25+");
  const [courseTree, setCourseTree] = useState([]);
  const [completedLessonSlugs, setCompletedLessonSlugs] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(() => localStorage.getItem("selectedCourseId") || null);

  const [discordCourseLink, setDiscordCourseLink] = useState(null);
  const [whatsappCourseLink, setWhatsappCourseLink] = useState(null);
  const [discordGeneralLink, setDiscordGeneralLink] = useState(null);
  const [whatsappGeneralLink, setWhatsappGeneralLink] = useState(null);

  const [liveClass, setLiveClass] = useState(null);

  const [certificates, setCertificates] = useState([]);
  const COLORS = ["#00FFB2", "#FFD700", "#FF5D5D"];

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  /** Language persistence */
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
  }, []);
  useEffect(() => localStorage.setItem("lang", i18n.language), [i18n.language]);

  /** Fetch user, profile, courses, progress, certificates */
  useEffect(() => {
    const run = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) return navigate("/login");
        setUser(user);

        // Profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;
        setProfile(profileData);
        if (!profileData?.has_completed_admission) setShowAdmissionModal(true);
        setAudience(profileData?.target_audience || "25+");

        // Courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select(`
            id, name, slug, title_en, title_yo,
            modules (
              id, title, slug,
              lessons (
                id, title, slug, title_en, title_yo, lesson_order, target_audience
              )
            )
          `);
        if (coursesError) throw coursesError;

        const filteredCourses = (coursesData || [])
          .map(course => ({
            ...course,
            modules: (course.modules || [])
              .map(mod => ({
                ...mod,
                lessons: (mod.lessons || [])
                  .filter(l => l.target_audience === (profileData?.target_audience || "25+"))
                  .sort((a, b) => a.lesson_order - b.lesson_order),
              }))
              .filter(mod => (mod.lessons || []).length > 0)
          }))
          .filter(course => (course.modules || []).length > 0);

        setCourseTree(filteredCourses);

        if (!selectedCourseId && filteredCourses.length > 0) {
          const firstCourseId = filteredCourses[0].id;
          setSelectedCourseId(firstCourseId);
          localStorage.setItem("selectedCourseId", firstCourseId);
        }

        // Progress
        const { data: progress, error: progressError } = await supabase
          .from("practical_progress")
          .select("lesson_slug, completed, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });
        if (progressError) throw progressError;
        setProgressRows(progress || []);
        setCompletedLessonSlugs((progress || []).filter(r => r.completed).map(r => r.lesson_slug));

        // Certificates
        const { data: certData, error: certError } = await supabase
          .from("certificates")
          .select(`
            id,
            certificate_link,
            courses ( id, title_en, title_yo, name )
          `)
          .eq("user_id", user.id);
        if (certError) throw certError;
        setCertificates(
          (certData || []).map(c => ({
            id: c.id,
            name: i18n.language === "yo" && c.courses?.title_yo ? c.courses.title_yo : c.courses?.title_en || c.courses?.name || "Course",
            file_url: c.certificate_link
          }))
        );
      } catch (err) {
        console.error("Dashboard fetch error:", err?.message || err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [navigate, i18n.language]);

  /** Fetch Discord/WhatsApp links */
  useEffect(() => {
    async function fetchGroupLinks() {
      if (!user || !selectedCourseId) return;
      try {
        const { data: courseLinks, error } = await supabase
          .from("course_groups")
          .select("discord_link_en, discord_link_yo, whatsapp_link_en, whatsapp_link_yo")
          .eq("course_id", selectedCourseId)
          .single();
        if (error && error.code !== "PGRST116") console.error(error);

        const { data: generalLinks } = await supabase
          .from("general_groups")
          .select("discord_link_en, discord_link_yo, whatsapp_link_en, whatsapp_link_yo")
          .single();

        setDiscordCourseLink(courseLinks ? (i18n.language === "yo" ? courseLinks.discord_link_yo : courseLinks.discord_link_en) : (i18n.language === "yo" ? generalLinks?.discord_link_yo : generalLinks?.discord_link_en));
        setWhatsappCourseLink(courseLinks ? (i18n.language === "yo" ? courseLinks.whatsapp_link_yo : courseLinks.whatsapp_link_en) : (i18n.language === "yo" ? generalLinks?.whatsapp_link_yo : generalLinks?.whatsapp_link_en));
        setDiscordGeneralLink(i18n.language === "yo" ? generalLinks?.discord_link_yo : generalLinks?.discord_link_en);
        setWhatsappGeneralLink(i18n.language === "yo" ? generalLinks?.whatsapp_link_yo : generalLinks?.whatsapp_link_en);
      } catch (err) {
        console.error("Error fetching group links:", err);
      }
    }
    fetchGroupLinks();
  }, [user, selectedCourseId, i18n.language]);

  /** Fetch Live Class dynamically */
  useEffect(() => {
    async function fetchLiveClass() {
      if (!selectedCourseId) return;
      try {
        const { data, error } = await supabase
          .from("live_classes")
          .select("*")
          .eq("course_id", selectedCourseId)
          .order("start_time", { ascending: true })
          .limit(1)
          .single();
        if (error && error.code !== "PGRST116") throw error;
        if (data) setLiveClass(data);
      } catch (err) {
        console.error("Error fetching live class:", err);
      }
    }
    fetchLiveClass();
  }, [selectedCourseId]);

  /** Logout */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  /** Derived data */
  const allCoursesDerived = useMemo(() => {
    const lessonBySlug = new Map();
    const courseProgress = [];
    (courseTree || []).forEach(course => {
      let totalLessons = 0;
      let completedCount = 0;
      (course.modules || []).forEach(mod => {
        (mod.lessons || []).forEach(lesson => {
          totalLessons++;
          lessonBySlug.set(lesson.slug, { course, mod, lesson });
          if (completedLessonSlugs.includes(lesson.slug)) completedCount++;
        });
      });
      courseProgress.push({
        id: course.id,
        slug: course.slug,
        title: i18n.language === "yo" && course.title_yo ? course.title_yo : course.title_en || course.name,
        totalLessons,
        completedCount,
        progress: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
      });
    });
    return { courseProgress, lessonBySlug };
  }, [courseTree, completedLessonSlugs, i18n.language]);

  const presentCourse = useMemo(() => courseTree.find(c => c.id === selectedCourseId) || null, [selectedCourseId, courseTree]);
  const continueLesson = useMemo(() => {
    if (!presentCourse) return null;
    for (const mod of presentCourse.modules || []) {
      for (const l of mod.lessons || []) if (!completedLessonSlugs.includes(l.slug)) return l;
    }
    return null;
  }, [presentCourse, completedLessonSlugs]);

  const pieData = useMemo(() => {
    const { courseProgress } = allCoursesDerived;
    const completed = courseProgress.filter(c => c.progress === 100).length;
    const inProgress = courseProgress.filter(c => c.progress > 0 && c.progress < 100).length;
    const notStarted = courseProgress.filter(c => c.progress === 0).length;
    return [
      { name: t("dashboard.pie.completed"), value: completed },
      { name: t("dashboard.pie.inProgress"), value: inProgress },
      { name: t("dashboard.pie.pending"), value: notStarted },
    ];
  }, [allCoursesDerived, i18n.language]);

  const streakData = useMemo(() => {
    const byDate = new Set((progressRows || []).filter(r => r.updated_at).map(r => new Date(r.updated_at).toDateString()));
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), value: byDate.has(d.toDateString()) ? 1 : 0 });
    }
    return days;
  }, [progressRows]);

  const activity = useMemo(() => {
    const { lessonBySlug } = allCoursesDerived;
    return (progressRows || []).slice(0, 5).map(row => {
      const meta = lessonBySlug.get(row.lesson_slug);
      const courseTitle = meta?.course ? i18n.language === "yo" && meta.course.title_yo ? meta.course.title_yo : meta.course.title_en || meta.course.name : row.lesson_slug;
      const lessonTitle = meta?.lesson ? i18n.language === "yo" && meta.lesson.title_yo ? meta.lesson.title_yo : meta.lesson.title_en || meta.lesson.title : row.lesson_slug;
      const status = row.completed ? t("dashboard.activity.completed") : t("dashboard.activity.continued");
      return `${status} • ${courseTitle} • ${lessonTitle}`;
    });
  }, [progressRows, allCoursesDerived, i18n.language]);

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#0D1B2A] text-white">{t("dashboard.loading")}</div>;
  if (showAdmissionModal) return <AdmissionModal user={user} onComplete={() => { setShowAdmissionModal(false); setProfile(p => ({ ...p, has_completed_admission: true })); }} />;

  const presentCourseTitle = presentCourse ? i18n.language === "yo" && presentCourse.title_yo ? presentCourse.title_yo : presentCourse.title_en || presentCourse.name : "";
  const continueHref = presentCourse && continueLesson ? `/dashboard/learn/${presentCourse.slug}/${continueLesson.slug}` : null;

  return (
    <div className="bg-[#0D1B2A] text-white flex min-h-screen transition-colors duration-300">
      {/* Sidebar */}
      <StudentSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
        language={i18n.language}
        courses={courseTree}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={id => { setSelectedCourseId(id); localStorage.setItem("selectedCourseId", id); }}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#1B263B] px-4 py-3 shadow-lg sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white text-2xl md:hidden" aria-label={sidebarOpen ? t("dashboard.a11y.closeMenu") : t("dashboard.a11y.openMenu")} title={sidebarOpen ? t("dashboard.a11y.closeMenu") : t("dashboard.a11y.openMenu")}>
            {sidebarOpen ? "✖" : "☰"}
          </button>
          <h1 className="text-[#FFD700] font-bold text-lg">{t("appTitle")}</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => i18n.changeLanguage(i18n.language === "yo" ? "en" : "yo")} className="px-3 py-1 bg-[#FFD700] text-[#0D1B2A] rounded font-semibold">{i18n.language === "yo" ? "EN" : "YO"}</button>
            <ProfileDropdown user={user} profile={profile} setProfile={setProfile} handleLogout={handleLogout} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <h1 className="text-xl md:text-3xl font-bold text-[#FFD700] mb-1">{t("dashboard.welcome")}, {profile?.full_name || t("dashboard.studentFallback")} 👋</h1>
          <p className="text-sm text-gray-300 mb-4">{t("dashboard.audience")}: <span className="text-[#FFD700] font-semibold">{audience}</span></p>
          <div className="mb-4 bg-yellow-800 text-yellow-100 py-2 px-4 rounded-lg text-sm">📅 {t("dashboard.reminder")}</div>

          {/* Cards */}
          <div className="mb-6 flex flex-col md:flex-row gap-6">
            {/* Present Course */}
            <div className="flex-1 bg-[#1B263B] p-6 rounded-xl shadow-xl">
              <h3 className="text-[#FFD700] font-semibold mb-4">{t("dashboard.presentCourse")}</h3>
              {presentCourse ? (
                <>
                  <p className="font-semibold text-white mb-2">📘 {presentCourseTitle}</p>
                  {continueLesson ? (
                    <>
                      <div className="text-sm text-gray-300 mb-2">{t("dashboard.nextLesson")}: <span className="text-white font-medium">{i18n.language === "yo" && continueLesson.title_yo ? continueLesson.title_yo : continueLesson.title_en || continueLesson.title}</span></div>
                      <button onClick={() => navigate(continueHref)} className="mt-1 px-4 py-2 bg-[#FFD700] text-[#0D1B2A] rounded font-bold w-full">{t("dashboard.continue")}</button>
                    </>
                  ) : (
                    <div className="text-gray-300">{t("dashboard.allCompleted")}</div>
                  )}
                </>
              ) : <div className="text-gray-300">{t("dashboard.noPresentCourse")}</div>}
            </div>

            {/* Live Class */}
           {/* Live Class */}
<div className="flex-1 bg-[#1B263B] p-6 rounded-xl shadow-xl">
  <h3 className="text-[#FFD700] font-semibold mb-4">{t("dashboard.upcomingLiveClass")}</h3>
  {liveClass ? (
    <div className="mt-2 rounded-xl overflow-hidden p-4 bg-[#15203B]">
      <p className="text-sm text-gray-300">{t("dashboard.live.instructor")}: <span className="text-white font-semibold">{liveClass.instructor}</span></p>
      <p className="text-sm text-gray-300">{t("dashboard.live.time")}: <LiveClassCountdown startTime={liveClass.start_time} /></p>

      {/* Admin/Student Controls */}
      {profile?.role === "admin" ? (
        <div className="mt-2 flex gap-2">
          {!liveClass.started_at && (
            <button
              className="px-4 py-2 bg-green-600 rounded font-semibold"
              onClick={async () => {
                const { error } = await supabase.from("live_classes").update({ started_at: new Date().toISOString() }).eq("id", liveClass.id);
                if (!error) setLiveClass(prev => ({ ...prev, started_at: new Date().toISOString() }));
              }}
            >
              {t("dashboard.live.startClass")}
            </button>
          )}
          {liveClass.started_at && !liveClass.ended_at && (
            <button
              className="px-4 py-2 bg-red-600 rounded font-semibold"
              onClick={async () => {
                const { error } = await supabase.from("live_classes").update({ ended_at: new Date().toISOString() }).eq("id", liveClass.id);
                if (!error) setLiveClass(prev => ({ ...prev, ended_at: new Date().toISOString() }));
              }}
            >
              {t("dashboard.live.endClass")}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Student can join only if class started and not ended */}
          {!liveClass.ended_at && (
  <div className="mt-2">
    <button
      className="px-4 py-2 bg-blue-600 rounded font-semibold"
      onClick={async () => {
        try {
          if (!user) {
            alert("Please login first");
            return;
          }

          // Check if already requested
          const { data: existing, error: checkError } = await supabase
            .from("live_class_moderators")
            .select("id, status")
            .eq("live_class_id", liveClass.id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (checkError) throw checkError;
          if (existing) {
            alert("You already requested. Status: " + existing.status);
            return;
          }

          const { error } = await supabase
            .from("live_class_moderators")
            .insert([
              {
                live_class_id: liveClass.id,
                user_id: user.id, // ✅ FIX: use auth user id
                status: "pending",
              },
            ]);

          if (error) throw error;
          alert(t("dashboard.live.requestSent"));
        } catch (err) {
          console.error("Moderator request error:", err.message);
          alert("Error requesting moderator role.");
        }
      }}
    >
      {t("dashboard.live.requestModerator")}
    </button>
    <p className="text-xs text-gray-300 mt-1">{t("dashboard.live.moderatorInfo")}</p>
  </div>
)}
        </>
      )}
    </div>
  ) : (
    <p className="text-gray-300">{t("dashboard.live.noUpcoming")}</p>
  )}
</div>

          </div>

          {/* Tabs, Charts, Activity, Certificates */}
          <CourseTabs allCoursesDerived={allCoursesDerived} currentTab={currentTab} setTab={setTab} search={search} setSearch={setSearch} />
          <DashboardCharts pieData={pieData} streakData={streakData} COLORS={COLORS} />
          <RecentActivity activity={activity} />
          <CertificatesDiscord certificates={certificates} discordCourseLink={discordCourseLink} discordGeneralLink={discordGeneralLink} whatsappCourseLink={whatsappCourseLink} whatsappGeneralLink={whatsappGeneralLink} />
        </div>
      </div>
    </div>
  );
}
