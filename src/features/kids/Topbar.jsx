import React, { useEffect, useState } from "react";
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

export default function Topbar({ setSidebarOpen }) {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    async function fetchKidProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/kid/login");
          return;
        }

        const { data: kidData, error } = await supabase
          .from("children")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error || !kidData) {
          console.error("Error fetching kid profile:", error);
          navigate("/kid/login");
          return;
        }

        setUserProfile({
          full_name: kidData.full_name || kidData.username || "Kid",
          avatar_url: kidData.avatar_url || "/avatar.png",
          level: normalizeLevel(kidData.level),
        });
      } catch (err) {
        console.error("Topbar fetch error:", err);
        navigate("/kid/login");
      } finally {
        setLoading(false);
      }
    }

    fetchKidProfile();
  }, [navigate]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "yo" : "en";
    i18n.changeLanguage(newLang);
  };

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
  const levelLabel = t("top.level");
  const levelValue = LEVELS_TRANSLATIONS[currentLang][userProfile.level] || userProfile.level;

  return (
    <header className="relative z-20 bg-gradient-to-r from-pink-300 via-yellow-200 to-purple-300 shadow-2xl flex flex-wrap md:flex-nowrap justify-between items-center px-4 sm:px-6 py-3 rounded-b-[2rem] border-b-4 border-yellow-400 gap-3">
  {/* Left: Menu + Greeting */}
  <div className="flex flex-1 items-center gap-3">
    {/* Hamburger menu (mobile only) */}
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setSidebarOpen(true)}
      className="md:hidden text-3xl text-purple-800"
    >
      ☰
    </motion.button>

    {/* Greeting */}
    <div className="flex flex-col min-w-0">
      <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-purple-800 truncate">
        {t("top.welcome", { name: userProfile.full_name })}
      </h2>
      <p className="text-sm sm:text-base md:text-lg text-purple-700 font-semibold">
        {t("top.greetingYorubaTechSpace")}
      </p>
      <p className="text-xs sm:text-sm md:text-base font-semibold text-purple-800 mt-1">
        {levelLabel}: {levelValue}
      </p>
    </div>
  </div>

  {/* Right: Actions */}
 <div className="flex items-center justify-end gap-1 sm:gap-2 ml-auto">
  {/* Bell */}
  <motion.div
    whileHover={{ rotate: [0, 5, -5, 0] }}
    className="text-xl sm:text-2xl text-purple-800 cursor-pointer"
  >
    🔔
  </motion.div>

  {/* Language Toggle */}
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={toggleLanguage}
    className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-purple-600 rounded-full font-bold text-white shadow-lg border-2 border-white"
  >
    🌍 {i18n.language === "en" ? "Yorùbá" : "English"}
  </motion.button>

  {/* Avatar */}
  <div className="relative">
    <motion.img
      whileHover={{ y: [-2, 2, -2], transition: { repeat: Infinity, duration: 1.5 } }}
      onClick={() => setDropdownOpen((prev) => !prev)}
      src={userProfile.avatar_url}
      alt="User Avatar"
      className="w-10 sm:w-12 h-10 sm:h-12 rounded-full cursor-pointer border-2 sm:border-4 border-purple-500 shadow-xl object-cover"
    />
    <AnimatePresence>
      {dropdownOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.3 }}
          className="absolute right-0 top-14 sm:top-16 bg-white border-4 border-yellow-300 rounded-2xl shadow-2xl p-4 w-40 sm:w-48"
        >
          <button
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-100 font-bold text-red-500 flex gap-2"
            onClick={handleLogout}
          >
            🚪 {t("childrenDashboard.topbar.logout", "Logout")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div>
</header>

  );
}
