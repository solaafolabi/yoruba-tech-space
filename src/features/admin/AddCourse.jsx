import React, { useState } from "react";
import supabase from "../../supabaseClient";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const AddCourse = () => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState(null);
  const [status, setStatus] = useState(null); // success or error

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.from("courses").insert([
      { name, slug: slug.toLowerCase().replace(/\s+/g, "-") }
    ]);

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("success");
      setMessage("Course added successfully!");
      setName("");
      setSlug("");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">📚 Add New Course</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              const value = e.target.value;
              setName(value);
              setSlug(value.toLowerCase().replace(/\s+/g, "-"));
            }}
            required
            placeholder="e.g. HTML"
            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug (auto-generated)</label>
          <input
            type="text"
            value={slug}
            readOnly
            className="w-full px-4 py-2 rounded-lg border bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:brightness-110 transition duration-300 shadow-lg hover:shadow-xl"
        >
          ➕ Add Course
        </button>

        {message && (
          <div
            className={`mt-4 flex items-center space-x-2 text-sm px-4 py-3 rounded-lg ${
              status === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {status === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddCourse;
