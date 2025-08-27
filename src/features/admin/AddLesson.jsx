// src/pages/admin/AddLesson.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";

const AddLesson = () => {
  const [form, setForm] = useState({
    title: "",
    course: "",
    youtube_url: "",
    transcript: "",
    description: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is logged in
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      console.log("👤 Logged in as:", user);
      if (!user) {
        setError("You must be logged in as admin to upload lessons.");
        navigate("/admin/login");
      }
    });
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!form.title || !form.course || !form.youtube_url) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!form.youtube_url.includes("youtube.com") && !form.youtube_url.includes("youtu.be")) {
      setError("Please enter a valid YouTube URL.");
      setLoading(false);
      return;
    }

    // Insert into Supabase
    const { data, error } = await supabase.from("lessons").insert([
      {
        title: form.title,
        course: form.course,
        youtube_url: form.youtube_url,
        transcript: form.transcript || "",
        description: form.description || "",
      },
    ]);

    console.log("📤 Upload response:", data);
    console.log("❌ Upload error:", error);

    if (error) {
      setError("Upload failed: " + error.message);
    } else {
      setSuccess("✅ Lesson uploaded successfully!");
      setTimeout(() => navigate("/admin/dashboard"), 2000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white/10 p-8 rounded-lg shadow-md space-y-5"
      >
        <h2 className="text-2xl font-bold text-center mb-4">📹 Upload YouTube Lesson</h2>

        {error && <p className="text-red-400">{error}</p>}
        {success && <p className="text-green-400">{success}</p>}

        <div>
          <label className="block mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full p-2 rounded bg-white text-black"
            placeholder="Lesson title"
          />
        </div>

        <div>
          <label className="block mb-1">Course *</label>
          <select
            name="course"
            value={form.course}
            onChange={handleChange}
            className="w-full p-2 rounded bg-white text-black"
          >
            <option value="">-- Select Course --</option>
            <option value="HTML">HTML</option>
            <option value="CSS">CSS</option>
            <option value="JavaScript">JavaScript</option>
            <option value="React">React</option>
            <option value="React Native">React Native</option>
            <option value="Firebase">Firebase</option>
            <option value="Git">Git</option>
            <option value="Python">Python</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">YouTube URL *</label>
          <input
            type="url"
            name="youtube_url"
            value={form.youtube_url}
            onChange={handleChange}
            className="w-full p-2 rounded bg-white text-black"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div>
          <label className="block mb-1">Transcript</label>
          <textarea
            name="transcript"
            value={form.transcript}
            onChange={handleChange}
            rows={5}
            className="w-full p-2 rounded bg-white text-black"
            placeholder="Paste transcript text here..."
          />
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 rounded bg-white text-black"
            placeholder="Short lesson description"
          />
        </div>

        <button
          type="submit"
          className={`w-full p-3 rounded bg-blue-600 hover:bg-blue-700 font-bold ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload Lesson"}
        </button>
      </form>
    </div>
  );
};

export default AddLesson;
