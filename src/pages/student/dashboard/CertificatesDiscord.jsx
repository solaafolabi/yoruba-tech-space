// src/pages/dashboard/CertificatesDiscord.jsx
import React from "react";
import { FaDiscord, FaCertificate, FaWhatsapp } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function CertificatesDiscord({
  certificates,
  discordCourseLink,
  discordGeneralLink,
  whatsappCourseLink,
  whatsappGeneralLink,
}) {
  const { t } = useTranslation();

  return (
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      {/* Certificates Card */}
      <div className="bg-gradient-to-br from-[#1B263B] to-[#0D1B2A] p-6 rounded-2xl shadow-xl border border-yellow-500/20">
        <div className="flex items-center gap-3 mb-4">
          <FaCertificate className="text-[#FFD700] text-2xl" />
          <h3 className="text-xl font-bold text-[#FFD700]">
            {t("dashboard.certificates.title")}
          </h3>
        </div>
        {certificates && certificates.length > 0 ? (
          <ul className="space-y-3">
            {certificates.map((cert) => (
              <li
                key={cert.id}
                className="flex items-center justify-between bg-[#24344D] p-3 rounded-lg hover:bg-[#2E3F5F] transition-colors"
              >
                <span className="text-white font-medium truncate">
                  📘 {cert.name}
                </span>
                <a
                  href={cert.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-[#FFD700] text-[#0D1B2A] rounded font-semibold hover:bg-yellow-400 transition"
                >
                  {t("dashboard.certificates.view")}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">{t("dashboard.certificates.empty")}</p>
        )}
      </div>

      {/* Discord Card */}
      <div className="bg-gradient-to-br from-[#1B263B] to-[#0D1B2A] p-6 rounded-2xl shadow-xl border border-indigo-500/20">
        <div className="flex items-center gap-3 mb-4">
          <FaDiscord className="text-indigo-400 text-2xl" />
          <h3 className="text-xl font-bold text-indigo-400">
            {t("dashboard.discord.title")}
          </h3>
        </div>
        <p className="text-gray-300 mb-4">{t("dashboard.discord.desc")}</p>

        {/* Course-specific link */}
        {discordCourseLink && discordCourseLink !== "#" && (
          <a
            href={discordCourseLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition mb-2"
          >
            {t("dashboard.discord.course")}
          </a>
        )}

        {/* General link */}
        {discordGeneralLink && discordGeneralLink !== "#" ? (
          <a
            href={discordGeneralLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-indigo-400 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition"
          >
            {t("dashboard.discord.general")}
          </a>
        ) : (
          <p className="text-gray-400 italic">{t("dashboard.discord.none")}</p>
        )}
      </div>

      {/* WhatsApp Card */}
      <div className="bg-gradient-to-br from-[#1B263B] to-[#0D1B2A] p-6 rounded-2xl shadow-xl border border-green-500/20">
        <div className="flex items-center gap-3 mb-4">
          <FaWhatsapp className="text-green-400 text-2xl" />
          <h3 className="text-xl font-bold text-green-400">
            {t("dashboard.whatsapp.title")}
          </h3>
        </div>
        <p className="text-gray-300 mb-4">{t("dashboard.whatsapp.desc")}</p>

        {/* Course-specific link */}
        {whatsappCourseLink && whatsappCourseLink !== "#" && (
          <a
            href={whatsappCourseLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition mb-2"
          >
            {t("dashboard.whatsapp.course")}
          </a>
        )}

        {/* General link */}
        {whatsappGeneralLink && whatsappGeneralLink !== "#" ? (
          <a
            href={whatsappGeneralLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition"
          >
            {t("dashboard.whatsapp.general")}
          </a>
        ) : (
          <p className="text-gray-400 italic">{t("dashboard.whatsapp.none")}</p>
        )}
      </div>
    </div>
  );
}
