import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";

const LEVELS_TRANSLATIONS = {
  en: {
    earlyLearners: "Early Learners",
    youngJuniors: "Young Juniors",
    preTeens: "Pre-Teens",
    teens: "Teens",
  },
  yo: {
    earlyLearners: "Awọn Akẹ́kọ̀ọ́ Àkọ́kọ́",
    youngJuniors: "Awọn Akẹ́kọ̀ọ́ Kekere",
    preTeens: "Àwọn Ọmọde Tí Ó Ti Dẹ́gbẹ́",
    teens: "Àwọn Ọdọ́",
  },
};

const getEmoji = (percent) => {
  if (percent > 50) return "🍏";
  if (percent > 20) return "🍊";
  if (percent > 0) return "🔴";
  return "🚫";
};

const formatTime = (seconds) => {
  if (seconds == null) return "00:00:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = n => String(n).padStart(2, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
};


export default function Topbar({ setSidebarOpen }) {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [childControl, setChildControl] = useState(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const [parentLock, setParentLock] = useState(false);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);

  const normalizeLevel = (level) => {
    const LEVEL_KEY_MAP = {
      "Early Learners": "earlyLearners",
      "Young Juniors": "youngJuniors",
      "Pre-Teens": "preTeens",
      "Teens": "teens",
      "Awọn Akẹ́kọ̀ọ́ Àkọ́kọ́": "earlyLearners",
      "Awọn Akẹ́kọ̀ọ́ Kekere": "youngJuniors",
      "Àwọn Ọmọde Tí Ó Ti Dẹ́gbẹ́": "preTeens",
      "Àwọn Ọdọ́": "teens",
      earlyLearners: "earlyLearners",
      youngJuniors: "youngJuniors",
      preTeens: "preTeens",
      teens: "teens",
    };
    return LEVEL_KEY_MAP[level] || "earlyLearners";
  };

  useEffect(() => {
    let mounted = true;
    let channel;

    async function fetchKidProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate("/kid/login");

        const { data: kidData } = await supabase
          .from("children")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!mounted || !kidData) return;

        setUserProfile({
          full_name: kidData.full_name || kidData.username || "Kid",
          avatar_url: kidData.avatar_url || "/avatar.png",
          level: normalizeLevel(kidData.level),
        });

        const { data: control } = await supabase
          .from("child_controls")
          .select("*")
          .eq("child_id", kidData.id)
          .maybeSingle();

        if (control) {
          setChildControl(control);
          setParentLock(control.lessons_locked);
          updateRemaining(control);
          
          // subscribe realtime updates
          channel = supabase
            .channel("child_controls")
            .on(
              "postgres_changes",
              { event: "UPDATE", schema: "public", table: "child_controls", filter: `child_id=eq.${kidData.id}` },
              (payload) => {
                setChildControl(payload.new);
                setParentLock(payload.new.lessons_locked);
                updateRemaining(payload.new);
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchKidProfile();
    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [navigate]);

const updateRemaining = (control) => {
  if (!control || !control.daily_limit_minutes || !control.time_start) {
    setRemainingSec(0);
    setParentLock(false);
    return;
  }

  const start = new Date(control.time_start).getTime();
  const totalSec = control.daily_limit_minutes * 60; // ✅ convert minutes to seconds
  const elapsed = Math.floor((Date.now() - start) / 1000);
  const left = Math.max(totalSec - elapsed, 0);

  setRemainingSec(left);
  setParentLock(control.lessons_locked || left <= 0);
};


useEffect(() => {
  if (!childControl) return;

  // initialize remaining time
  updateRemaining(childControl);

  const interval = setInterval(() => {
    setRemainingSec(prev => {
      if (prev <= 1) {
        setParentLock(true);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [childControl]);

  // close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === "en" ? "yo" : "en");
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    navigate("/kid/login");
  };

  if (loading || !userProfile) {
    return (
      <header className="px-6 py-4 bg-gradient-to-r from-pink-300 via-yellow-200 to-purple-300 rounded-b-[2rem] border-b-4 border-yellow-400 shadow-2xl flex justify-center items-center">
        <p className="text-purple-800 font-bold">Loading...</p>
      </header>
    );
  }

  const currentLang = i18n.language.startsWith("yo") ? "yo" : "en";
  const levelLabel = t("top.level", "Level");
  const levelValue = LEVELS_TRANSLATIONS[currentLang][userProfile.level] || userProfile.level;

  const totalSec = childControl?.daily_limit_minutes || 0;
  const percent = totalSec ? (remainingSec / totalSec) * 100 : 0;
  let emoji = parentLock ? "🚫" : childControl?.daily_limit_minutes ? getEmoji(percent) : "⏰";
  const timerText = parentLock
    ? currentLang === "yo" ? "Ẹkọ ti dina! Duro de obi" : "Lessons locked! Wait for parent"
    : childControl?.daily_limit_minutes
    ? `${currentLang === "yo" ? "Akoko to ku" : "Time left"}: ${formatTime(remainingSec)}`
    : currentLang === "yo" ? "Ko si akoko ti a ṣeto" : "No timer set";

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-30 
    bg-gradient-to-r from-pink-300 via-yellow-200 to-purple-300 shadow-2xl 
    flex flex-col md:flex-row justify-between items-center 
    px-4 sm:px-6 py-6 md:py-8 
    rounded-b-[2rem] border-b-4 border-yellow-400 gap-4">

      {/* Left side greeting */}
      <div className="flex w-full justify-between items-center md:flex-1">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            aria-label="Open menu"
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-3xl text-purple-800"
          >
            ☰
          </motion.button>

          <div className="flex flex-col min-w-0 md:ml-4">
            <h2 className="text-sm sm:text-base md:text-2xl font-extrabold text-purple-800 truncate">
              {t("top.welcome", { name: userProfile.full_name })}
            </h2>
            <p className="text-xs sm:text-sm md:text-lg text-purple-700 font-semibold mt-1">
              {t("top.greetingYorubaTechSpace")}
            </p>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-purple-800 mt-1">
              {levelLabel}: {levelValue}
            </p>
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: [0, 5, -5, 0] }}
            className="text-lg sm:text-xl md:text-2xl text-purple-800 cursor-pointer"
          >
            🔔
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleLanguage}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-purple-600 rounded-full font-bold 
            text-white shadow-lg border-2 border-white"
          >
            🌍 {i18n.language === "en" ? "Yorùbá" : "English"}
          </motion.button>

          <div className="relative order-last" ref={dropdownRef}>
            <motion.img
              whileHover={{ y: [-2, 2, -2], transition: { repeat: Infinity, duration: 1.5 } }}
              onClick={() => setDropdownOpen(prev => !prev)}
              src={userProfile.avatar_url}
              alt="User Avatar"
              className="w-9 h-9 sm:w-12 sm:h-12 rounded-full cursor-pointer border-2 sm:border-4 
              border-purple-500 shadow-xl object-cover"
            />
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-0 top-12 sm:top-16 bg-white border-4 border-yellow-300 
                  rounded-2xl shadow-2xl p-4 w-40 sm:w-48"
                >
                  <button
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-100 
                    font-bold text-red-500 flex gap-2"
                    onClick={handleLogout}
                  >
                    🚪 {t("childrenDashboard.topbar.logout", "Logout")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center mx-auto">
        <svg className="w-full h-full">
          <circle cx="50%" cy="50%" r="45%" stroke="#ddd" strokeWidth="6" fill="transparent" />
          <motion.circle
            cx="50%" cy="50%" r="45%"
            stroke={percent > 50 ? "#34D399" : percent > 20 ? "#FBBF24" : "#F87171"}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray="283"
            strokeDashoffset={283 - (percent / 100) * 283}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <span className="absolute text-xl md:text-3xl animate-bounce" role="img">{emoji}</span>
        <span className="absolute bottom-[-2rem] text-center text-xs md:text-sm font-bold text-purple-900">{timerText}</span>
      </div>
    </header>
  );
}
