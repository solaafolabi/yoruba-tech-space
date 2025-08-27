import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";

const EditLesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("HTML");
  const [video, setVideo] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLesson = async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", id)
        .single();

      console.log("Fetched lesson data:", data, error);

      if (error || !data) {
        setError("Lesson not found.");
      } else {
        setTitle(data.title);
        setCourse(data.course);
        setYoutubeUrl(data.youtube_url || "");
      }

      setLoading(false);
    };

    fetchLesson();
  }, [id]);

  const handleUpdate = async () => {
    if (!title || !course) return setError("All fields are required");

    let video_url = null;

    if (video) {
      const fileExt = video.name.split(".").pop();
      const filePath = `${course}/${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("lessons")
        .upload(filePath, video);

      if (uploadErr) {
        setError("Video upload failed.");
        return;
      }

      video_url = supabase.storage
        .from("lessons")
        .getPublicUrl(filePath).data.publicUrl;
    }

    const { error: updateErr } = await supabase
      .from("lessons")
      .update({
        title,
        course,
        ...(video_url && { video_url }),
        youtube_url: youtubeUrl || null,
      })
      .eq("id", id);

    if (updateErr) {
      setError("Failed to update lesson.");
    } else {
      navigate("/admin/dashboard");
    }
  };

  if (loading) return <div className="text-center text-white mt-20">Loading lesson...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white px-4">
      <div className="bg-white/10 p-8 rounded-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">✏️ Edit Lesson</h2>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson Title"
          className="w-full mb-4 px-4 py-2 rounded bg-white/10 border border-white/20"
        />

        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded bg-white/10 border border-white/20"
        >
          <option value="HTML">HTML</option>
          <option value="CSS">CSS</option>
          <option value="JS">JavaScript</option>
          <option value="React">React</option>
        </select>

        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideo(e.target.files[0])}
          className="mb-4"
        />

        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="YouTube Embed Link (optional)"
          className="w-full mb-4 px-4 py-2 rounded bg-white/10 border border-white/20"
        />

        <button
          onClick={handleUpdate}
          className="w-full py-2 bg-yellow-400 text-black rounded font-bold hover:bg-yellow-500"
        >
          Update Lesson
        </button>
      </div>
    </div>
  );
};

export default EditLesson;
