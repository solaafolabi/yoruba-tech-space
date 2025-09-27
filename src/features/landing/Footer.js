import React from "react";
import { FaFacebookF, FaXTwitter, FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative bg-[#0D1B2A] text-white py-12 px-6 md:px-16 border-t border-yellow-600 overflow-hidden">
      {/* Subtle blue glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500 opacity-10 rounded-full blur-3xl z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {/* Logo + Text */}
        <div>
          <img src="/logo.png" alt="Yoruba Tech Logo" className="h-14 w-auto object-contain" />
          <p className="text-sm text-yellow-500 max-w-xs mt-3">{t("footer.tagline")}</p>
        </div>

        {/* Links */}
        <div className="text-sm text-gray-300">
          <h3 className="text-yellow-500 text-lg font-semibold mb-3">{t("footer.quickLinks")}</h3>
          <ul className="space-y-2">
            <li>
              <a href="/" className="hover:text-yellow-600 transition">🏠 {t("footer.home")}</a>
            </li>
            <li>
              <a href="/about" className="hover:text-yellow-500 transition">📘 {t("footer.aboutUs")}</a>
            </li>
            <li>
              <a href="/courses" className="hover:text-yellow-500 transition">📚 {t("footer.courses")}</a>
            </li>
            <li>
              <a href="/contact" className="hover:text-yellow-600 transition">📞 {t("footer.contact")}</a>
            </li>
          </ul>
        </div>

        {/* Courses */}
        <div className="text-sm text-gray-300">
          <h3 className="text-yellow-500 text-lg font-semibold mb-3">{t("footer.ourCourses")}</h3>
          <ul className="space-y-2">
            {["HTML & CSS", "JavaScript", "React Native", "Python", "Git & GitHub", "Firebase"].map(
              (course, index) => (
                <li key={index} className="hover:text-yellow-600 transition transform hover:translate-x-1">• {course}</li>
              )
            )}
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-yellow-500 text-lg font-semibold mb-3">{t("footer.followUs")}</h3>
          <div className="flex gap-4 text-2xl text-blue-400">
            <a href="#" className="hover:scale-125 hover:text-yellow-600 transition transform"><FaFacebookF /></a>
            <a href="#" className="hover:scale-125 hover:text-yellow-600 transition"><FaXTwitter /></a>
            <a href="#" className="hover:scale-125 hover:text-yellow-600 transition"><FaInstagram /></a>
            <a href="#" className="hover:scale-125 hover:text-yellow-600 transition"><FaYoutube /></a>
            <a href="#" className="hover:scale-125 hover:text-yellow-600 transition"><FaWhatsapp /></a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <p className="text-center text-gray-500 text-xs mt-10 z-10 relative">
        © {new Date().getFullYear()} Yorùbá Tech Space — {t("footer.rights")}
      </p>
    </footer>
  );
}
