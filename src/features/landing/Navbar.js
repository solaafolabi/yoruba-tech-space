import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signupDropdownOpen, setSignupDropdownOpen] = useState(false);

  const navItems = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.courses"), to: "/courses" },
    { label: t("nav.about"), to: "/about" },
    { label: t("nav.contact"), to: "/contact" },
  ];

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "yo" : "en");
  };

  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0D1B2A] border-b border-yellow-500 shadow-md">
      <div className="flex items-center justify-between px-6 md:px-16 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
        >
          <Link to="/" onClick={handleLinkClick} className="flex items-center gap-2">
            <img src="/logo.png" alt="Yoruba Tech Logo" className="h-10 w-auto" />
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.to} className="cursor-pointer text-white hover:text-blue-400 font-medium">
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}

            {/* Signup Dropdown */}
            <li
              onMouseEnter={() => setSignupDropdownOpen(true)}
              onMouseLeave={() => setSignupDropdownOpen(false)}
              className="relative cursor-pointer text-yellow-500 font-semibold"
            >
              <span className="flex items-center gap-1 hover:text-yellow-600">
                {t("nav.signup")} ▼
              </span>

             <AnimatePresence>
  {signupDropdownOpen && (
    <motion.ul
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 mt-2 bg-[#112240] rounded shadow-lg border border-blue-500 w-64 p-4 space-y-4"
    >
      {/* Parent Signup */}
      <li>
        <Link
          to="/parents/signup"
          onClick={handleLinkClick}
          className="block text-xl px-2 py-2 text-yellow-500 hover:bg-yellow-600 hover:text-[#0D1B2A] rounded font-bold"
        >
          {t("nav.parentSignup")}
        </Link>
        <span className="block text-sm text-gray-300 mt-1">
          {t("nav.parentSignupDescription")}
        </span>
      </li>

      {/* Adult Signup */}
      <li>
        <Link
          to="/signup"
          onClick={handleLinkClick}
          className="block text-xl px-2 py-2 text-yellow-500 hover:bg-yellow-600 hover:text-[#0D1B2A] rounded font-bold"
        >
          {t("nav.adultSignup")}
        </Link>
        <span className="block text-sm text-gray-300 mt-1">
          {t("nav.adultSignupDescription")}
        </span>
      </li>
    </motion.ul>
  )}
</AnimatePresence>

            </li>
          </ul>

          {/* Single Login Button */}
          <Link
            to="/login"
            className="ml-6 text-[#112240] bg-yellow-500 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition"
          >
            {t("nav.login")}
          </Link>

          {/* Donate Button */}
          <Link
            to="/donate"
            className="ml-4 bg-yellow-500 text-[#112240] px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition"
          >
            {t("nav.donate")}
          </Link>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="ml-4 bg-white text-[#0D1B2A] px-3 py-1 rounded-lg font-semibold hover:bg-yellow-600 transition"
          >
            {i18n.language === "en" ? "Yoruba" : "English"}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden cursor-pointer text-yellow-500 text-3xl" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4 px-6 pb-6 md:hidden bg-[#0D1B2A] text-white"
          >
            {navItems.map((item) => (
              <li key={item.to} className="border-b border-blue-400 pb-2 font-semibold text-lg">
                <Link to={item.to} onClick={handleLinkClick}>{item.label}</Link>
              </li>
            ))}

            {/* Mobile Signup */}
            <li>
              <button
                onClick={() => setSignupDropdownOpen(!signupDropdownOpen)}
                className="flex justify-between w-full text-yellow-500 font-semibold text-lg"
              >
                {t("nav.signup")} {signupDropdownOpen ? "▲" : "▼"}
              </button>
              <AnimatePresence>
                {signupDropdownOpen && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-2 mt-2 pl-4 border-l border-yellow-600"
                  >
                    <li>
                      <Link
                        to="/parents/signup"
                        onClick={handleLinkClick}
                        className="block text-yellow-500 hover:text-yellow-600 font-semibold"
                      >
                        {t("nav.parentSignup")}
                      </Link>
                      <span className="block text-xs text-gray-300 mt-1">
                        {t("nav.parentSignupDescription")}
                      </span>
                    </li>
                    <li>
                      <Link
                        to="/signup"
                        onClick={handleLinkClick}
                        className="block text-yellow-500 hover:text-yellow-600 font-semibold"
                      >
                        {t("nav.adultSignup")}
                      </Link>
                      <span className="block text-xs text-gray-300 mt-1">
                        {t("nav.adultSignupDescription")}
                      </span>
                    </li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>

            {/* Single Login */}
            <li className="border-b border-blue-400 pb-2 font-semibold text-lg">
              <Link to="/login" onClick={handleLinkClick} className="text-white hover:text-yellow-400">
                {t("nav.login")}
              </Link>
            </li>

            {/* Donate */}
            <li>
              <Link to="/donate" onClick={handleLinkClick} className="block bg-yellow-500 text-[#112240] text-center px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition mt-2">
                {t("nav.donate")}
              </Link>
            </li>

            {/* Language */}
            <li>
              <button
                onClick={() => { toggleLanguage(); setMenuOpen(false); }}
                className="bg-white text-[#0D1B2A] px-3 py-1 rounded-lg font-semibold hover:bg-yellow-600 transition w-full mt-2"
              >
                {i18n.language === "en" ? "Yorùbá" : "English"}
              </button>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </nav>
  );
}
