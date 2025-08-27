// src/components/dashboard/CourseTabs.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function CourseTabs({ allCoursesDerived, currentTab, setTab, search, setSearch }) {
  const { t, i18n } = useTranslation();

  const tabCourses = useMemo(() => {
    const { courseProgress } = allCoursesDerived;
    let base = courseProgress.map(c => ({ ...c, isBookmarked: false }));
    let list = [];

    if (currentTab === "myCourses") list = base.filter(c => c.progress > 0 && c.progress < 100);
    else if (currentTab === "completed") list = base.filter(c => c.progress === 100);
    else list = base.filter(c => c.isBookmarked);

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(s));
    }
    return list;
  }, [allCoursesDerived, currentTab, search, i18n.language]);

  return (
    <div className="mb-6 bg-[#1B263B] p-6 rounded-xl shadow-xl">
      <div className="flex gap-4 mb-4">
        {["myCourses", "completed", "bookmarks"].map(tab => {
          const isActive = currentTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`px-4 py-2 rounded ${
                isActive ? "bg-[#FFD700] text-[#0D1B2A]" : "bg-gray-700 text-gray-200"
              }`}
            >
              {t(`dashboard.tabs.${tab}`)}
            </button>
          );
        })}
        <input
          type="text"
          placeholder={t("dashboard.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto px-3 py-2 rounded bg-gray-700 text-white w-full md:w-64"
          aria-label={t("dashboard.searchPlaceholder")}
        />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {tabCourses.length ? (
          tabCourses.map(c => (
            <div key={c.id} className="p-4 rounded-lg bg-gray-800">
              <h4 className="font-semibold text-white">{c.title}</h4>
              <p className="text-gray-300 text-sm">
                {t("dashboard.progress")}: {c.progress}%
              </p>
            </div>
          ))
        ) : (
          <div className="text-gray-400">{t("dashboard.noCourses")}</div>
        )}
      </div>
    </div>
  );
}
