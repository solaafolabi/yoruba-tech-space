// src/pages/admin/UploadCsv.jsx
import React, { useState } from "react";
import Papa from "papaparse";
import supabase from "../../supabaseClient";
import slugify from "slugify";

const UploadCsv = ({ onClose }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [previewData, setPreviewData] = useState([]); // ✅ show uploaded data

  // ✅ required columns for validation
  const requiredHeaders = [
    "course_en",
    "course_yo",
    "course_order",
    "module_en",
    "module_yo",
    "module_order",
    "lesson_en",
    "lesson_yo",
    "lesson_order",
    "age_group",
    "requires_assignment",
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      setFileName(file.name);
    }
  };

  const handleUpload = () => {
    if (!csvFile) {
      setStatus("error");
      setMessage("❌ Please select a CSV file first.");
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        const rows = results.data;

        // ✅ Validate headers
        const headers = results.meta.fields || [];
        const missing = requiredHeaders.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          setStatus("error");
          setMessage(`❌ Missing required columns: ${missing.join(", ")}`);
          return;
        }

        const courseMap = new Map();
        const moduleMap = new Map();

        try {
          for (const row of rows) {
            const courseEn = row.course_en?.trim();
            const courseYo = row.course_yo?.trim();
            const courseOrder = parseInt(row.course_order) || 1;

            const moduleEn = row.module_en?.trim();
            const moduleYo = row.module_yo?.trim();
            const moduleOrder = parseInt(row.module_order) || 1;

            const lessonEn = row.lesson_en?.trim();
            const lessonYo = row.lesson_yo?.trim();
            const lessonOrder = parseInt(row.lesson_order) || 1;

            const ageGroup = row.age_group?.trim() || "25+";
            const requiresAssignment =
              row.requires_assignment?.toLowerCase() === "true";

            if (
              !courseEn ||
              !courseYo ||
              !moduleEn ||
              !moduleYo ||
              !lessonEn
            )
              continue;

            const courseSlug = slugify(courseEn, { lower: true });
            const moduleSlug = slugify(moduleEn, { lower: true });
            const lessonSlug = slugify(lessonEn, { lower: true });

            // 1. Handle course
            let courseId = courseMap.get(courseSlug);
            if (!courseId) {
              const { data: existingCourse } = await supabase
                .from("courses")
                .select("id")
                .eq("slug", courseSlug)
                .maybeSingle();

              if (existingCourse) {
                courseId = existingCourse.id;
                await supabase
                  .from("courses")
                  .update({
                    requires_assignment: requiresAssignment,
                    course_order: courseOrder,
                  })
                  .eq("id", courseId);
              } else {
                const { data: newCourse } = await supabase
                  .from("courses")
                  .insert([
                    {
                      slug: courseSlug,
                      name: courseEn,
                      title_en: courseEn,
                      title_yo: courseYo,
                      target_audience: ageGroup,
                      requires_assignment: requiresAssignment,
                      course_order: courseOrder,
                    },
                  ])
                  .select()
                  .single();
                courseId = newCourse?.id;
              }
              courseMap.set(courseSlug, courseId);
            }

            // 2. Handle module
            const moduleKey = `${courseSlug}_${moduleSlug}`;
            let moduleId = moduleMap.get(moduleKey);
            if (!moduleId) {
              const { data: existingModule } = await supabase
                .from("modules")
                .select("id")
                .eq("slug", moduleSlug)
                .eq("course_id", courseId)
                .maybeSingle();

              if (existingModule) {
                moduleId = existingModule.id;
                await supabase
                  .from("modules")
                  .update({ module_order: moduleOrder })
                  .eq("id", moduleId);
              } else {
                const { data: newModule } = await supabase
                  .from("modules")
                  .insert([
                    {
                      slug: moduleSlug,
                      title_en: moduleEn,
                      title_yo: moduleYo,
                      course_id: courseId,
                      target_audience: ageGroup,
                      module_order: moduleOrder,
                    },
                  ])
                  .select()
                  .single();
                moduleId = newModule?.id;
              }
              moduleMap.set(moduleKey, moduleId);
            }

            // 3. Handle lesson
            const { data: existingLesson } = await supabase
              .from("lessons")
              .select("id")
              .eq("slug", lessonSlug)
              .eq("module_id", moduleId)
              .maybeSingle();

            if (existingLesson) {
              await supabase
                .from("lessons")
                .update({ lesson_order: lessonOrder })
                .eq("id", existingLesson.id);
            } else {
              await supabase.from("lessons").insert([
                {
                  module_id: moduleId,
                  slug: lessonSlug,
                  title_en: lessonEn,
                  title_yo: lessonYo,
                  lesson_order: lessonOrder,
                  target_audience: ageGroup,
                },
              ]);
            }
          }

          // ✅ Fetch back for preview
          const { data: preview } = await supabase
            .from("courses")
            .select(
              `id, title_en, course_order,
               modules (
                 id, title_en, module_order,
                 lessons (id, title_en, lesson_order)
               )`
            )
            .order("course_order", { ascending: true });

          setPreviewData(preview || []);
          setStatus("success");
          setMessage("✅ CSV uploaded and data saved successfully!");
          setCsvFile(null);
          setFileName("");
        } catch (err) {
          console.error(err);
          setStatus("error");
          setMessage(`❌ Upload failed: ${err.message}`);
        }
      },
      error: function (err) {
        setStatus("error");
        setMessage(`❌ Error parsing CSV: ${err.message}`);
      },
    });
  };

  const handleDownloadSample = () => {
    const sampleData = [
      requiredHeaders,
      [
        "HTML",
        "HTML (YO)",
        "1",
        "Introduction to HTML",
        "Ifihan si HTML",
        "1",
        "What is HTML?",
        "Kini HTML?",
        "1",
        "8-10",
        "false",
      ],
      [
        "CSS",
        "CSS (YO)",
        "2",
        "Getting Started",
        "Bẹrẹ pẹlu CSS",
        "1",
        "What is CSS?",
        "Kini CSS?",
        "1",
        "11-12",
        "true",
      ],
    ];
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "sample_lessons_upload.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative max-w-5xl mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-700">
      <button
        onClick={onClose}
        className="absolute top-4 right-6 text-2xl text-red-500"
      >
        &times;
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        📤 Upload CSV File (Courses → Modules → Lessons with Orders)
      </h2>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 
          file:rounded-md file:border-0 file:text-sm file:font-semibold 
          file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-4"
      />

      {fileName && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          Selected File: <span className="font-medium">{fileName}</span>
        </p>
      )}

      <button
        onClick={handleUpload}
        className="w-full bg-blue-700 text-white font-semibold py-2 rounded hover:bg-blue-800 transition mb-6"
      >
        ⬆️ Upload CSV
      </button>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md text-sm ${
            status === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : status === "error"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* ✅ Preview uploaded data */}
      {previewData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            📊 Uploaded Data Preview:
          </h3>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 border">Course</th>
                  <th className="px-4 py-2 border">Module</th>
                  <th className="px-4 py-2 border">Lesson</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((course) =>
                  course.modules.map((module) =>
                    module.lessons.map((lesson) => (
                      <tr key={lesson.id}>
                        <td className="px-4 py-2 border">
                          {course.title_en} ({course.course_order})
                        </td>
                        <td className="px-4 py-2 border">
                          {module.title_en} ({module.module_order})
                        </td>
                        <td className="px-4 py-2 border">
                          {lesson.title_en} ({lesson.lesson_order})
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
          📄 Sample CSV Format:
        </h3>
        <button
          onClick={handleDownloadSample}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded shadow"
        >
          ⬇️ Download Sample CSV
        </button>
      </div>
    </div>
  );
};

export default UploadCsv;
