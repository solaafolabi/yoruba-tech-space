import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaHtml5, FaReact, FaPython, FaGithub, FaFire } from "react-icons/fa6";

const courses = [
  {
    title: "HTML àti CSS",
    desc: "Ìpilẹ̀ṣẹ̀ wẹẹ̀bù ní èdè Yorùbá. Kọ́ bi a ṣe ń lò tag, attribute, CSS layout àti responsiveness.",
    icon: <FaHtml5 />, 
    color: "#e44d26",
    slug: "html-css"
  },
  {
    title: "JavaScript",
    desc: "Ṣe kí ojú-òpó rẹ rìn àti dáradára. Ẹ̀kọ́ lórí variables, functions, DOM manipulation àti ES6.",
    icon: <FaFire />, 
    color: "#f0db4f",
    slug: "javascript"
  },
  {
    title: "React Native",
    desc: "Ṣẹda App alágbèéká fún Android àti iOS. Kọ́ component, props, state, navigation àti API call.",
    icon: <FaReact />, 
    color: "#61DBFB",
    slug: "react-native"
  },
  {
    title: "Python",
    desc: "Ẹ̀kọ́ ìtẹ̀síwájú fún data àti AI. Kọ́ syntax, data structures, libraries bí Pandas, NumPy, àti ML intro.",
    icon: <FaPython />, 
    color: "#4B8BBE",
    slug: "python"
  },
  {
    title: "Git & GitHub",
    desc: "Fipamọ́ iṣẹ́ rẹ lórí orí ayélujára. Kọ́ git init, commit, branch, merge àti GitHub repo management.",
    icon: <FaGithub />, 
    color: "#fff",
    slug: "git-github"
  },
  {
    title: "Firebase",
    desc: "Ṣe kódi lẹ́yìn ojú-òpó (backend) pẹ̀lú rọrùn. Authentication, Firestore, hosting àti deployment.",
    icon: <FaFire />, 
    color: "#FFA611",
    slug: "firebase"
  },
];

export default function Courses() {
  return (
    <section id="courses" className="bg-[#0D1B2A] py-20 px-6 md:px-16 text-white">
      <motion.h2
        initial={{ y: -50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold text-center text-[#FFD700] mb-12"
      >
        Ẹ̀kọ́ Wa
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {courses.map((course, index) => (
          <Link to={`/courses/${course.slug}`} key={index}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-[#1B263B] border border-[#FFD700] rounded-2xl p-6 shadow-md hover:shadow-yellow-500/40 transition-all cursor-pointer"
            >
              <div className="text-4xl mb-4" style={{ color: course.color }}>
                {course.icon}
              </div>
              <h3 className="text-xl font-semibold text-[#FFD700] mb-2">{course.title}</h3>
              <p className="text-gray-300 text-sm">{course.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
