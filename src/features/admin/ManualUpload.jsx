// src/pages/admin/ManualUpload.jsx
import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import slugify from "slugify";

const ageGroups = [
  { value: "4-7", label: "Early Learners (4-7)" },
  { value: "8-10", label: "Young Juniors (8-10)" },
  { value: "11-12", label: "Pre-Teens (11-12)" },
  { value: "13-15", label: "Teens (13-15)" },
  { value: "16-17", label: "Older Teens (16-17)" },
  { value: "18-24", label: "Young Adults (18-24)" },
  { value: "25+", label: "Adults / Parents (25+)" },
];

const ManualUpload = ({ onClose }) => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);

  // dual course selection
  const [selectedCourseEn, setSelectedCourseEn] = useState("");
  const [selectedCourseYo, setSelectedCourseYo] = useState("");
  const [customCourseEn, setCustomCourseEn] = useState("");
  const [customCourseYo, setCustomCourseYo] = useState("");
  

  // dual module selection
  const [selectedModuleEn, setSelectedModuleEn] = useState("");
  const [selectedModuleYo, setSelectedModuleYo] = useState("");
  const [customModuleEn, setCustomModuleEn] = useState("");
  const [customModuleYo, setCustomModuleYo] = useState("");

  // lessons
  const [lessonsEn, setLessonsEn] = useState("");
  const [lessonsYo, setLessonsYo] = useState("");
  const [lessonOrders, setLessonOrders] = useState("");

  const [ageGroup, setAgeGroup] = useState("25+"); // default Adults
  const [requiresAssignment, setRequiresAssignment] = useState(false); // 🔥 toggle for practical
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState(null);

  // fetch all courses once
  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("*");
      if (error) console.error(error);
      else setCourses(data || []);
    };
    fetchCourses();
  }, []);

  // fetch modules for selected EN course
  useEffect(() => {
    const fetchModules = async () => {
      if (selectedCourseEn) {
        const { data, error } = await supabase
          .from("modules")
          .select("*")
          .eq("course_id", selectedCourseEn);
        if (error) console.error(error);
        else setModules(data || []);
      } else {
        setModules([]);
      }
    };
    fetchModules();
  }, [selectedCourseEn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError(null);

    try {
      // course titles
      const courseTitleEn =
        customCourseEn ||
        courses.find((c) => c.id === selectedCourseEn)?.title_en ||
        "";
      const courseTitleYo =
        customCourseYo ||
        courses.find((c) => c.id === selectedCourseYo)?.title_yo ||
        "";

      if (!courseTitleEn) throw new Error("🚫 Course English title is required.");
      if (!courseTitleYo) throw new Error("🚫 Course Yoruba title is required.");

      const courseSlug = slugify(courseTitleEn, { lower: true });

      // ensure course exists or create
      let { data: courseData } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", courseSlug)
        .single();

      if (!courseData) {
        const { data: newCourse, error: courseError } = await supabase
          .from("courses")
          .insert([
            {
              name: courseTitleEn,
              slug: courseSlug,
              title_en: courseTitleEn,
              title_yo: courseTitleYo,
              target_audience: ageGroup,
              requires_assignment: requiresAssignment, // 🔥 save toggle
            },
          ])
          .select()
          .single();
        if (courseError) throw courseError;
        courseData = newCourse;
      } else {
        // 🔥 update toggle if changed
        await supabase
          .from("courses")
          .update({ requires_assignment: requiresAssignment })
          .eq("id", courseData.id);
      }

      // module titles
      const moduleTitleEn =
        customModuleEn ||
        modules.find((m) => m.id === selectedModuleEn)?.title_en ||
        "";
      const moduleTitleYo =
        customModuleYo ||
        modules.find((m) => m.id === selectedModuleYo)?.title_yo ||
        "";

      if (!moduleTitleEn) throw new Error("🚫 Module English title is required.");
      if (!moduleTitleYo) throw new Error("🚫 Module Yoruba title is required.");

      const moduleSlug = slugify(moduleTitleEn, { lower: true });

      // ensure module exists or create
      let { data: moduleData } = await supabase
        .from("modules")
        .select("id")
        .eq("slug", moduleSlug)
        .eq("course_id", courseData.id)
        .single();

      if (!moduleData) {
        const { data: newModule, error: moduleError } = await supabase
          .from("modules")
          .insert([
            {
              title: moduleTitleEn,
              slug: moduleSlug,
              course_id: courseData.id,
              title_en: moduleTitleEn,
              title_yo: moduleTitleYo,
              target_audience: ageGroup,
            },
          ])
          .select()
          .single();
        if (moduleError) throw moduleError;
        moduleData = newModule;
      }

      // lessons
      const lessonsArrayEn = lessonsEn
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      const lessonsArrayYo = lessonsYo
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      const orderArray = lessonOrders
        .split(",")
        .map((o) => parseInt(o.trim()))
        .filter((n) => !isNaN(n));

      if (lessonsArrayEn.length !== orderArray.length)
        throw new Error("🚫 Lesson EN count must match order count.");
      if (
        lessonsArrayYo.length &&
        lessonsArrayYo.length !== lessonsArrayEn.length
      )
        throw new Error("🚫 Yoruba lessons count must match English count.");

      const insertedLessons = [];
      for (let i = 0; i < lessonsArrayEn.length; i++) {
        const en = lessonsArrayEn[i];
        const yo = lessonsArrayYo[i] || "";
        const order = orderArray[i] ?? i + 1;
        const lessonSlug = slugify(en, { lower: true });

        const { data: existing } = await supabase
          .from("lessons")
          .select("id")
          .eq("slug", lessonSlug)
          .eq("module_id", moduleData.id)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase.from("lessons").insert([
            {
              title: en,
              slug: lessonSlug,
              module_id: moduleData.id,
              lesson_order: order,
              title_en: en,
              title_yo: yo,
              target_audience: ageGroup,
            },
          ]);
          if (insertError) throw insertError;
          insertedLessons.push(en);
        }
      }

      setSuccess(`✅ ${insertedLessons.length} new lesson(s) added.`);
      setLessonsEn("");
      setLessonsYo("");
      setLessonOrders("");
      setCustomCourseEn("");
      setCustomCourseYo("");
      setCustomModuleEn("");
      setCustomModuleYo("");
      setSelectedCourseEn("");
      setSelectedCourseYo("");
      setSelectedModuleEn("");
      setSelectedModuleYo("");
      setAgeGroup("25+");
      setRequiresAssignment(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white text-black dark:bg-gray-800 dark:text-white p-6 rounded-lg w-full max-w-5xl relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-4 text-xl text-red-500"
      >
        &times;
      </button>

      <h2 className="text-xl font-bold mb-4">✍️ Manually Add Lessons</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dual Course Selection */}
        <div className="grid grid-cols-2 gap-4">
          {/* English */}
          <div>
            <label className="block mb-1">📘 Course (English)</label>
            <select
              className="w-full p-2 rounded bg-white/10 text-white"
              value={selectedCourseEn}
              onChange={(e) => setSelectedCourseEn(e.target.value)}
            >
              <option value="">-- New Course EN --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title_en}
                </option>
              ))}
            </select>
            {!selectedCourseEn && (
              <input
                type="text"
                placeholder="New Course EN"
                className="w-full p-2 rounded bg-white/10 text-white mt-2"
                value={customCourseEn}
                onChange={(e) => setCustomCourseEn(e.target.value)}
              />
            )}
          </div>

          {/* Yoruba */}
          <div>
            <label className="block mb-1">📘 Course (Yoruba)</label>
            <select
              className="w-full p-2 rounded bg-white/10 text-white"
              value={selectedCourseYo}
              onChange={(e) => setSelectedCourseYo(e.target.value)}
            >
              <option value="">-- New Course YO --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title_yo}
                </option>
              ))}
            </select>
            {!selectedCourseYo && (
              <input
                type="text"
                placeholder="New Course YO"
                className="w-full p-2 rounded bg-white/10 text-white mt-2"
                value={customCourseYo}
                onChange={(e) => setCustomCourseYo(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Dual Module Selection */}
        <div className="grid grid-cols-2 gap-4">
          {/* English */}
          <div>
            <label className="block mb-1">📦 Module (English)</label>
            <select
              className="w-full p-2 rounded bg-white/10 text-white"
              value={selectedModuleEn}
              onChange={(e) => setSelectedModuleEn(e.target.value)}
              disabled={!selectedCourseEn}
            >
              <option value="">-- New Module EN --</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title_en}
                </option>
              ))}
            </select>
            {!selectedModuleEn && (
              <input
                type="text"
                placeholder="New Module EN"
                className="w-full p-2 rounded bg-white/10 text-white mt-2"
                value={customModuleEn}
                onChange={(e) => setCustomModuleEn(e.target.value)}
              />
            )}
          </div>

          {/* Yoruba */}
          <div>
            <label className="block mb-1">📦 Module (Yoruba)</label>
            <select
              className="w-full p-2 rounded bg-white/10 text-white"
              value={selectedModuleYo}
              onChange={(e) => setSelectedModuleYo(e.target.value)}
              disabled={!selectedCourseYo}
            >
              <option value="">-- New Module YO --</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title_yo}
                </option>
              ))}
            </select>
            {!selectedModuleYo && (
              <input
                type="text"
                placeholder="New Module YO"
                className="w-full p-2 rounded bg-white/10 text-white mt-2"
                value={customModuleYo}
                onChange={(e) => setCustomModuleYo(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Assignment Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={requiresAssignment}
            onChange={(e) => setRequiresAssignment(e.target.checked)}
          />
          <label>📂 This course requires final project upload (GitHub)</label>
        </div>

        {/* Age Group */}
        <div>
          <label className="block mb-1">🎯 Target Age Group</label>
          <select
            className="w-full p-2 rounded bg-white/10 text-white"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
          >
            {ageGroups.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lessons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <textarea
            placeholder="Lessons EN (comma separated)"
            className="w-full p-2 rounded bg-white/10 text-white"
            rows="2"
            value={lessonsEn}
            onChange={(e) => setLessonsEn(e.target.value)}
            required
          />
          <textarea
            placeholder="Lessons YO (comma separated)"
            className="w-full p-2 rounded bg-white/10 text-white"
            rows="2"
            value={lessonsYo}
            onChange={(e) => setLessonsYo(e.target.value)}
          />
          <textarea
            placeholder="Lesson Orders (1,2,3)"
            className="w-full p-2 rounded bg-white/10 text-white"
            rows="2"
            value={lessonOrders}
            onChange={(e) => setLessonOrders(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 text-black font-bold py-2 rounded"
        >
          {loading ? "Uploading..." : "Submit"}
        </button>

        {success && <p className="text-green-400 mt-3">{success}</p>}
        {error && <p className="text-red-400 mt-3">{error}</p>}
      </form>
    </div>
  );
};

export default ManualUpload;
