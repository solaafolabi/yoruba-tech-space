import React from "react";
import {
  FaFacebookF,
  FaXTwitter,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa6";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { i18n } = useTranslation();
  const isYoruba = i18n.language === "yo";

  return (
    <footer className="relative bg-[#0D1B2A] text-white py-12 px-6 md:px-16 border-t border-blue-500 overflow-hidden">
      {/* Subtle blue glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500 opacity-10 rounded-full blur-3xl z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {/* Logo + Text */}
        <div>
          <img
            src="/logo.png"
            alt="Yoruba Tech Logo"
            className="h-14 w-auto object-contain"
          />
          <p className="text-sm text-gray-400 max-w-xs mt-3">
            {isYoruba
              ? "Ẹ jẹ ká kọ́ ẹ̀kọ́ kóòdù pẹ̀lú èdè wa, àṣà wa, àti ìran tuntun."
              : "Let’s learn coding with our language, culture, and new vision."}
          </p>
        </div>

        {/* Links */}
        <div className="text-sm text-gray-300">
          <h3 className="text-blue-400 text-lg font-semibold mb-3">
            {isYoruba ? "Àwọn Àsàyàn" : "Quick Links"}
          </h3>
          <ul className="space-y-2">
            <li>
              <a href="/" className="hover:text-blue-400 transition">
                🏠 {isYoruba ? "Àkọ́kọ́" : "Home"}
              </a>
            </li>
            <li>
              <a href="/about" className="hover:text-blue-400 transition">
                📘 {isYoruba ? "Nipa Wa" : "About Us"}
              </a>
            </li>
            <li>
              <a href="/courses" className="hover:text-blue-400 transition">
                📚 {isYoruba ? "Ẹ̀kọ́" : "Courses"}
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-blue-400 transition">
                📞 {isYoruba ? "Kàn sí Wa" : "Contact"}
              </a>
            </li>
          </ul>
        </div>

        {/* Courses */}
        <div className="text-sm text-gray-300">
          <h3 className="text-blue-400 text-lg font-semibold mb-3">
            {isYoruba ? "Ẹ̀kọ́ Wa" : "Our Courses"}
          </h3>
          <ul className="space-y-2">
            {["HTML & CSS", "JavaScript", "React Native", "Python", "Git & GitHub", "Firebase"].map(
              (course, index) => (
                <li
                  key={index}
                  className="hover:text-blue-400 transition transform hover:translate-x-1"
                >
                  • {course}
                </li>
              )
            )}
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-blue-400 text-lg font-semibold mb-3">
            {isYoruba ? "Tẹ̀lé wa" : "Follow Us"}
          </h3>
          <div className="flex gap-4 text-2xl text-blue-400">
            <a href="#" className="hover:scale-125 transition">
              <FaFacebookF />
            </a>
            <a href="#" className="hover:scale-125 transition">
              <FaXTwitter />
            </a>
            <a href="#" className="hover:scale-125 transition">
              <FaInstagram />
            </a>
            <a href="#" className="hover:scale-125 transition">
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <p className="text-center text-gray-500 text-xs mt-10 z-10 relative">
        © {new Date().getFullYear()} Yorùbá Tech Space —{" "}
        {isYoruba ? "Gbogbo ẹ̀tọ́ wa lórí." : "All rights reserved."}
      </p>
    </footer>
  );
}
