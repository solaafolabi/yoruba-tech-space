// src/components/CourseList.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHtml5, FaChevronDown } from "react-icons/fa";
import { BsCircle, BsCheckCircleFill } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import { useUser } from "@supabase/auth-helpers-react";
import supabase from "../../../supabaseClient";
import { generateCertificate } from "../../../utils/generateCertificate";

export default function CourseList({ userCourses, completedLessons, onCertificateGenerated, setSelectedCourseId, selectedCourseId }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useUser();

  const [openCourse, setOpenCourse] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const [loadingCerts, setLoadingCerts] = useState({});
  const [downloadedCerts, setDownloadedCerts] = useState({});
  const [finalProjects, setFinalProjects] = useState({});

  // Fetch approved final projects for the user
  useEffect(() => {
    if (!user) return;
    const fetchFinalProjects = async () => {
      const { data, error } = await supabase
        .from("final_projects")
        .select("course_id,status")
        .eq("user_id", user.id)
        .eq("status", "approved");

      if (!error && data) {
        const approvedProjects = {};
        data.forEach((p) => {
          approvedProjects[p.course_id] = true;
        });
        setFinalProjects(approvedProjects);
      }
    };
    fetchFinalProjects();
  }, [user]);

  const toggleCourse = (courseId) =>
    setOpenCourse(openCourse === courseId ? null : courseId);
  const toggleModule = (moduleId) =>
    setOpenModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));

  const isCertificateReady = (uc) => {
    const course = uc.courses;
    const allLessons = course.modules?.flatMap((mod) => mod.lessons || []) || [];
    const allLessonsCompleted = allLessons.every((l) =>
      completedLessons.includes(l.slug)
    );
    const requiresAssignment = course.requires_assignment;
    const assignmentApproved = finalProjects[course.id] || false;

    return allLessonsCompleted && (!requiresAssignment || assignmentApproved);
  };

  const handleGenerateCertificate = async (uc) => {
    setLoadingCerts((prev) => ({ ...prev, [uc.id]: true }));
    try {
      const publicUrl = await generateCertificate(user, uc.courses);
      const link = document.createElement("a");
      link.href = publicUrl;
      link.download = `${i18n.language === "yo" ? uc.courses.title_yo : uc.courses.title_en || uc.courses.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadedCerts((prev) => ({ ...prev, [uc.id]: true }));
      if (onCertificateGenerated) onCertificateGenerated(uc.id);
    } catch (err) {
      console.error("Certificate generation failed:", err);
    } finally {
      setLoadingCerts((prev) => ({ ...prev, [uc.id]: false }));
    }
  };

  const getTitle = (item) =>
    i18n.language === "yo"
      ? item.title_yo || item.title_en || item.name || item.title
      : item.title_en || item.name || item.title;

  return (
    <>
      {userCourses.map((uc) => {
        const course = uc.courses;
        const allLessons = course.modules?.flatMap((mod) => mod.lessons || []) || [];
        const completedCount = allLessons.filter((l) =>
          completedLessons.includes(l.slug)
        ).length;
        const totalCount = allLessons.length;
        const certificateReady = isCertificateReady(uc);

        const isActive = selectedCourseId === course.id;

        return (
          <div key={uc.id} className="mt-3">
            {/* Course Header */}
            <button
              onClick={() => {
                setSelectedCourseId(course.id);
                localStorage.setItem("selectedCourseId", course.id);
                toggleCourse(uc.id);
              }}
              className={`flex items-center justify-between p-3 rounded-lg transition w-full text-left text-lg ${
                isActive ? "bg-[#FFD700]/20 text-[#FFD700]" : "hover:bg-[#FFD700]/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <FaHtml5 className="text-[#e44d26]" />
                <div className="flex flex-col">
                  <span>{getTitle(course)}</span>
                  <span className="text-xs text-gray-400">
                    {course.modules?.length || 0} {t("sidebar.modules")},{" "}
                    {allLessons.length} {t("sidebar.lessons")}
                  </span>
                </div>
              </div>
              <FaChevronDown
                className={`transform transition-transform ${
                  openCourse === uc.id ? "rotate-180 text-[#FFD700]" : "rotate-0"
                }`}
              />
            </button>

            {/* Final Project Button */}
            {course.requires_assignment && (
              <button
                onClick={() => {
                  if (completedCount === totalCount) {
                    navigate(`/student/final-project/${course.id}`);
                  }
                }}
                className={`block mt-2 w-full px-4 py-2 rounded font-bold transition ${
                  completedCount === totalCount
                    ? "bg-green-600 text-white hover:bg-green-500"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                🚀 {t("sidebar.finalProject")} ({completedCount}/{totalCount})
              </button>
            )}

            {/* Certificate Button */}
            {certificateReady && (
              <button
                onClick={() => handleGenerateCertificate(uc)}
                className={`block mt-2 w-full px-4 py-2 rounded font-bold text-black bg-yellow-400 hover:bg-yellow-300 transition flex justify-center items-center gap-2`}
                disabled={loadingCerts[uc.id]}
              >
                {loadingCerts[uc.id] ? t("sidebar.generating") : `🎓 ${t("sidebar.downloadCertificate")}`}
                {downloadedCerts[uc.id] && !loadingCerts[uc.id] && (
                  <BsCheckCircleFill className="text-green-600" />
                )}
              </button>
            )}

            {/* Modules & Lessons */}
            {openCourse === uc.id &&
              course.modules?.map((mod) => {
                const lessonCount = mod.lessons?.length || 0;
                const completedModCount = mod.lessons?.filter((l) =>
                  completedLessons.includes(l.slug)
                ).length || 0;

                return (
                  <div key={mod.id} className="pl-4 flex flex-col gap-2 text-white text-base">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between text-left font-medium text-base py-2 hover:text-[#FFD700] transition"
                    >
                      <span>{getTitle(mod)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#FFD700]">{completedModCount}/{lessonCount}</span>
                        <FaChevronDown
                          className={`transform transition-transform ${openModules[mod.id] ? "rotate-180 text-[#FFD700]" : "rotate-0"}`}
                        />
                      </div>
                    </button>

                    {openModules[mod.id] &&
                      mod.lessons?.map((lesson) => (
                        <Link
                          key={lesson.id}
                          to={`/dashboard/learn/${course.slug}/${lesson.slug}`}
                          className="flex items-center gap-2 pl-3 hover:text-white transition"
                        >
                          {completedLessons.includes(lesson.slug) ? (
                            <BsCheckCircleFill className="text-green-400" />
                          ) : (
                            <BsCircle className="text-gray-500" />
                          )}
                          <span>{getTitle(lesson)}</span>
                        </Link>
                      ))}
                  </div>
                );
              })}
          </div>
        );
      })}
    </>
  );
}
