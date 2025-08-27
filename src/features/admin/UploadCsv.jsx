import React, { useState } from "react";
import Papa from "papaparse";
import supabase from "../../supabaseClient";

const UploadCsv = ({ onClose }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

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
        const courseMap = new Map();
        const moduleMap = new Map();

        for (const row of rows) {
          const courseName = row.course_name?.trim();
          const moduleTitle = row.module_title?.trim();
          const lessonTitle = row.lesson_title?.trim();

          if (!courseName || !moduleTitle || !lessonTitle) continue;

          const courseSlug = courseName.toLowerCase().replace(/\s+/g, "-");
          const moduleSlug = moduleTitle.toLowerCase().replace(/\s+/g, "-");
          const lessonSlug = lessonTitle.toLowerCase().replace(/\s+/g, "-");

          // 1. Handle course (reuse or insert)
          let courseId = courseMap.get(courseSlug);
          if (!courseId) {
            const { data: existingCourse } = await supabase
              .from("courses")
              .select("id")
              .eq("slug", courseSlug)
              .single();

            if (existingCourse) {
              courseId = existingCourse.id;
            } else {
              const { data: newCourse } = await supabase
                .from("courses")
                .insert([{ name: courseName, slug: courseSlug }])
                .select()
                .single();
              courseId = newCourse?.id;
            }

            courseMap.set(courseSlug, courseId);
          }

          // 2. Handle module (reuse or insert)
          const moduleKey = `${courseSlug}_${moduleSlug}`;
          let moduleId = moduleMap.get(moduleKey);
          if (!moduleId) {
            const { data: existingModule } = await supabase
              .from("modules")
              .select("id")
              .eq("slug", moduleSlug)
              .eq("course_id", courseId)
              .single();

            if (existingModule) {
              moduleId = existingModule.id;
            } else {
              const { data: newModule } = await supabase
                .from("modules")
                .insert([{ course_id: courseId, title: moduleTitle, slug: moduleSlug }])
                .select()
                .single();
              moduleId = newModule?.id;
            }

            moduleMap.set(moduleKey, moduleId);
          }

          // 3. Handle lesson (check for duplicates before insert)
          const { data: existingLesson } = await supabase
            .from("lessons")
            .select("id")
            .eq("slug", lessonSlug)
            .eq("module_id", moduleId)
            .single();

          if (!existingLesson) {
            await supabase.from("lessons").insert([
              {
                module_id: moduleId,
                title: lessonTitle,
                slug: lessonSlug,
              },
            ]);
          }
        }

        setStatus("success");
        setMessage("✅ CSV uploaded and data saved successfully!");
        setCsvFile(null);
        setFileName("");
      },
      error: function (err) {
        setStatus("error");
        setMessage(`❌ Error parsing CSV: ${err.message}`);
      },
    });
  };

  const handleDownloadSample = () => {
    const sampleData = [
      ["course_name", "module_title", "lesson_title"],
      ["HTML", "Introduction to HTML", "What is HTML?"],
      ["HTML", "Introduction to HTML", "History and Importance"],
      ["HTML", "Text Elements", "Headings: h1 to h6"],
      ["CSS", "Getting Started with CSS", "What is CSS?"],
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
    <div className="relative max-w-3xl mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-700">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-6 text-2xl text-red-500"
      >
        &times;
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        📤 Upload CSV File (Courses → Modules → Lessons)
      </h2>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-4"
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
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">📄 Sample CSV Format:</h3>
        <table className="w-full text-sm text-left border dark:border-gray-700 mb-4">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="border px-4 py-2">course_name</th>
              <th className="border px-4 py-2">module_title</th>
              <th className="border px-4 py-2">lesson_title</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="border px-4 py-2">HTML</td>
              <td className="border px-4 py-2">Introduction to HTML</td>
              <td className="border px-4 py-2">What is HTML?</td>
            </tr>
            <tr>
              <td className="border px-4 py-2">CSS</td>
              <td className="border px-4 py-2">Colors and Fonts</td>
              <td className="border px-4 py-2">Using Color in CSS</td>
            </tr>
          </tbody>
        </table>

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
