// src/components/Courses.jsx
import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FaGlobe,
  FaLaptopCode,
  FaCertificate
} from "react-icons/fa6";

const HtmlIcon = React.lazy(() => import("react-icons/fa6").then(mod => ({ default: mod.FaHtml5 })));
const FireIcon = React.lazy(() => import("react-icons/fa6").then(mod => ({ default: mod.FaFire })));
const ReactIcon = React.lazy(() => import("react-icons/fa6").then(mod => ({ default: mod.FaReact })));
const PythonIcon = React.lazy(() => import("react-icons/fa6").then(mod => ({ default: mod.FaPython })));
const GithubIcon = React.lazy(() => import("react-icons/fa6").then(mod => ({ default: mod.FaGithub })));

export default function Courses() {
  const { t } = useTranslation();

  const courses = [
    { key: "html", Icon: HtmlIcon, color: "#e44d26", link: "/courses/html-css" },
    { key: "javascript", Icon: FireIcon, color: "#f0db4f", link: "/courses/javascript" },
    { key: "react", Icon: ReactIcon, color: "#61DBFB", link: "/courses/react-native" },
    { key: "python", Icon: PythonIcon, color: "#4B8BBE", link: "/courses/python" },
    { key: "git", Icon: GithubIcon, color: "#ffffff", link: "/courses/git-github" },
    { key: "firebase", Icon: FireIcon, color: "#FFA611", link: "/courses/firebase" },
  ];

  return (
    <section
      id="courses"
      className="bg-[#0D1B2A] pt-20 pb-10 px-6 md:px-16 text-white relative overflow-hidden"
    >
      {/* Subtle gold glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-yellow-500 opacity-5 blur-3xl rounded-full"></div>

      <motion.h2
        initial={{ y: -50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold text-center text-yellow-500 mb-12"
      >
        {t("courses.title")}
      </motion.h2>
      <p className="text-center text-gray-300 mb-10">{t("courses.description")}</p>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto relative z-10">
        {courses.map(({ key, Icon, color, link }, index) => (
          <motion.a
            key={index}
            href={link}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="block bg-[#1B263B] border border-transparent hover:border-yellow-600 rounded-2xl p-6 shadow-md hover:shadow-blue-400/30 transition-all cursor-pointer"
          >
            <Suspense fallback={<div className="w-10 h-10 bg-gray-700 rounded-full mb-4" />}>
              <Icon className="text-4xl mb-4" style={{ color }} />
            </Suspense>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t(`courses.list.${key}`)}
            </h3>
            <ul className="space-y-2 text-sm text-white mt-4">
              <li className="flex items-center gap-2">
                <FaGlobe className="text-blue-400" /> {t("courses.features.bilingual")}
              </li>
              <li className="flex items-center gap-2">
                <FaLaptopCode className="text-green-400" /> {t("courses.features.handsOn")}
              </li>
              <li className="flex items-center gap-2">
                <FaCertificate className="text-yellow-600" /> {t("courses.features.certificate")}
              </li>
            </ul>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 hover:scale-105 transition-all shadow-md border border-[#FFD700]">
              {t("courses.viewCourse")}
            </button>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
