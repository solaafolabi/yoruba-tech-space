import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import AdminLayout from "./layout/AdminLayout";
import PracticalStepsTable from "../../features/admin/PracticalStepsTable";

// ✅ Universal JSON cleaner that accepts raw, HTML-wrapped, or encoded JSON
function cleanAndParseJson(input) {
  if (!input) return [];
  try {
    if (typeof input === "object") return input;

    let text = input
      .replace(/<[^>]*>/g, "") // remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

    // auto-wrap if it's a single object
    if (text.startsWith("{") && text.endsWith("}")) text = `[${text}]`;

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error("❌ Invalid JSON:", err);
    return [];
  }
}

export default function PracticalStepsUpload() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");

  const [lessonType, setLessonType] = useState([]);
  const [stepsJSON, setStepsJSON] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [refreshSteps, setRefreshSteps] = useState(false);

  const LANGS = ["html", "css", "javascript", "python", "php", "sql"];

  // Fetch courses
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("courses").select("id, name");
      if (error) setError(`Failed to fetch courses: ${error.message}`);
      else setCourses(data || []);
    })();
  }, []);

  // Fetch modules
  useEffect(() => {
    if (!selectedCourse) return;
    (async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, title")
        .eq("course_id", selectedCourse);
      if (error) setError(`Failed to fetch modules: ${error.message}`);
      else setModules(data || []);
    })();
  }, [selectedCourse]);

  // Fetch lessons
  useEffect(() => {
    if (!selectedModule) return;
    (async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title")
        .eq("module_id", selectedModule);
      if (error) setError(`Failed to fetch lessons: ${error.message}`);
      else setLessons(data || []);
    })();
  }, [selectedModule]);

  // Fetch existing steps when a lesson is selected
  useEffect(() => {
    if (!selectedLesson) {
      setStepsJSON("");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { data, error } = await supabase
          .from("practical_steps")
          .select("*")
          .eq("lesson_id", selectedLesson)
          .order("step_number", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map((s) => ({
            step: s.step_number,
            instruction_en: s.instruction_en,
            instruction_yo: s.instruction_yo,
            lesson_type: s.lesson_type || [],
            validation_rules: s.validation_rules || [],
            expected_output: s.expected_output || "",
          }));
          setStepsJSON(JSON.stringify(formatted, null, 2));
          setLessonType(data[0]?.lesson_type || []);
          setSuccess(`📖 Loaded ${data.length} step(s) for editing.`);
        } else {
          setStepsJSON("");
          setSuccess("ℹ️ No steps found for this lesson.");
        }
      } catch (err) {
        setError("Failed to load steps: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedLesson]);

  const handleLessonTypeChange = (lang) => {
    setLessonType((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    if (!selectedLesson) {
      setError("Please select a lesson.");
      setLoading(false);
      return;
    }

    if (lessonType.length === 0) {
      setError("Please select at least one lesson type (HTML, CSS, JS, etc.)");
      setLoading(false);
      return;
    }

    // ✅ CLEAN AND PARSE any JSON format (HTML-wrapped, stringified, etc.)
    const parsedSteps = cleanAndParseJson(stepsJSON);
    if (parsedSteps.length === 0) {
      setError("Steps must be a valid JSON array or object.");
      setLoading(false);
      return;
    }

    try {
      const inserts = parsedSteps.map((s, index) => {
        const rules = cleanAndParseJson(s.validation_rules);

        return {
          lesson_id: selectedLesson,
          step_number: s.step ?? index + 1,
          instruction_en: s.instruction_en,
          instruction_yo: s.instruction_yo,
          lesson_type:
            Array.isArray(s.lesson_type) && s.lesson_type.length > 0
              ? s.lesson_type
              : lessonType,
          validation_rules: rules,
          expected_output: s.expected_output || "",
        };
      });

      const { error: insertError } = await supabase
        .from("practical_steps")
        .upsert(inserts, {
          onConflict: "lesson_id,step_number",
        });

      if (insertError) throw insertError;

      setSuccess(`✅ ${parsedSteps.length} steps uploaded/updated successfully.`);
      setRefreshSteps((k) => !k);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStep = (step) => {
    const json = [
      {
        step: step.step_number,
        instruction_en: step.instruction_en,
        instruction_yo: step.instruction_yo,
        lesson_type: step.lesson_type || [],
        validation_rules: step.validation_rules || [],
        expected_output: step.expected_output || "",
      },
    ];
    setStepsJSON(JSON.stringify(json, null, 2));
    setLessonType(step.lesson_type || []);
    setSelectedLesson(step.lesson_id || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExportSteps = async () => {
    setExporting(true);
    setSuccess(null);
    setError(null);

    if (!selectedLesson) {
      setError("Please select a lesson to export its steps.");
      setExporting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("practical_steps")
        .select("*")
        .eq("lesson_id", selectedLesson)
        .order("step_number", { ascending: true });

      if (error) throw error;

      const fileContent = JSON.stringify(data || [], null, 2);
      const blob = new Blob([fileContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "practical_steps.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSuccess(`📦 Exported ${data.length} step(s) to JSON.`);
    } catch (err) {
      setError("Export failed: " + (err?.message || String(err)));
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">
        🛠 Upload or Update Practical Steps (Accepts Any JSON)
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            required
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedModule("");
              setSelectedLesson("");
              setModules([]);
              setLessons([]);
              setStepsJSON("");
            }}
            className="p-2 border rounded bg-white dark:bg-gray-800"
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            required
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              setSelectedLesson("");
              setLessons([]);
              setStepsJSON("");
            }}
            className="p-2 border rounded bg-white dark:bg-gray-800"
          >
            <option value="">Select Module</option>
            {modules.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.title}
              </option>
            ))}
          </select>

          <select
            required
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="p-2 border rounded bg-white dark:bg-gray-800"
          >
            <option value="">Select Lesson</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </div>

        {/* Lesson Types */}
        <div>
          <p className="font-bold mb-2">
            Select Lesson Type(s) (Default for all steps if not set in JSON):
          </p>
          <div className="flex gap-6 flex-wrap">
            {LANGS.map((lang) => (
              <label key={lang} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={lang}
                  checked={lessonType.includes(lang)}
                  onChange={() => handleLessonTypeChange(lang)}
                />
                {lang.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        {/* Steps JSON */}
        <textarea
          placeholder="Paste your steps JSON (any format: raw, HTML, or encoded)"
          rows={12}
          value={stepsJSON}
          onChange={(e) => setStepsJSON(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-800 font-mono"
        />

        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-500 text-black font-bold py-2 rounded hover:bg-green-600 transition"
          >
            {loading ? "Saving..." : "Upload / Upsert Steps"}
          </button>

          <button
            type="button"
            disabled={exporting || !selectedLesson}
            onClick={handleExportSteps}
            className="md:w-56 bg-white dark:bg-gray-800 border font-semibold py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-60"
          >
            {exporting ? "Exporting..." : "Download Steps JSON"}
          </button>
        </div>

        {success && <p className="text-green-400 mt-2">{success}</p>}
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>

      <div className="mt-12">
        <PracticalStepsTable refreshKey={refreshSteps} onEdit={handleEditStep} />
      </div>
    </AdminLayout>
  );
}
