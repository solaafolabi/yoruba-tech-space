import React, { useState, useEffect } from "react";
import supabase from "../../supabaseClient";
import { FaTrash, FaEdit } from "react-icons/fa";

export default function AdminTestimonialManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    image_url: "",
    youtube_url: "",
    youtube_url_yo: "",
    name_en: "",
    name_yo: "",
    role_en: "",
    role_yo: "",
    message_en: "",
    message_yo: "",
    rating: 5,
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const fetchTestimonials = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return showMessage("error", "❌ Failed to fetch testimonials");
    setTestimonials(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => setImageFile(e.target.files[0]);

  const uploadImage = async () => {
    if (!imageFile) return formData.image_url;

    const fileName = `${Date.now()}-${imageFile.name}`;
    const { error } = await supabase.storage
      .from("testimonials")
      .upload(fileName, imageFile, { cacheControl: "3600", upsert: false });

    if (error) {
      showMessage("error", "❌ Image upload failed");
      return "";
    }

    const { data: urlData } = supabase.storage
      .from("testimonials")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const imageUrl = await uploadImage();
      const payload = { ...formData, image_url: imageUrl };

      const { error } = editingId
        ? await supabase.from("testimonials").update(payload).eq("id", editingId)
        : await supabase.from("testimonials").insert([payload]);

      if (error) return showMessage("error", "❌ " + error.message);

      showMessage("success", "✅ Testimonial saved successfully!");
      resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error(error);
      showMessage("error", "❌ Error saving testimonial");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return showMessage("error", "❌ Failed to delete testimonial");

    showMessage("success", "✅ Testimonial deleted");
    fetchTestimonials();
  };

  const handleEdit = (t) => {
    setFormData({
      image_url: t.image_url || "",
      youtube_url: t.youtube_url || "",
      youtube_url_yo: t.youtube_url_yo || "",
      name_en: t.name_en || "",
      name_yo: t.name_yo || "",
      role_en: t.role_en || "",
      role_yo: t.role_yo || "",
      message_en: t.message_en || "",
      message_yo: t.message_yo || "",
      rating: t.rating || 5,
    });
    setEditingId(t.id);
  };

  const resetForm = () => {
    setFormData({
      image_url: "",
      youtube_url: "",
      youtube_url_yo: "",
      name_en: "",
      name_yo: "",
      role_en: "",
      role_yo: "",
      message_en: "",
      message_yo: "",
      rating: 5,
    });
    setImageFile(null);
    setEditingId(null);
  };

  return (
    <div className="p-6 bg-[#0D1B2A] min-h-screen text-white">
      <h2 className="text-3xl font-bold text-yellow-400 mb-6">
        Admin Testimonial Manager
      </h2>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="bg-[#1B263B] p-6 rounded-xl shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="p-2 rounded bg-gray-800 text-white"
          />
          <input
            name="youtube_url"
            value={formData.youtube_url}
            onChange={handleChange}
            placeholder="YouTube URL (English)"
            className="p-2 rounded bg-gray-800"
          />
          <input
            name="youtube_url_yo"
            value={formData.youtube_url_yo}
            onChange={handleChange}
            placeholder="YouTube URL (Yoruba)"
            className="p-2 rounded bg-gray-800"
          />
          <input
            name="name_en"
            value={formData.name_en}
            onChange={handleChange}
            placeholder="Name (EN)"
            className="p-2 rounded bg-gray-800"
          />
          <input
            name="name_yo"
            value={formData.name_yo}
            onChange={handleChange}
            placeholder="Name (YO)"
            className="p-2 rounded bg-gray-800"
          />
          <input
            name="role_en"
            value={formData.role_en}
            onChange={handleChange}
            placeholder="Role (EN)"
            className="p-2 rounded bg-gray-800"
          />
          <input
            name="role_yo"
            value={formData.role_yo}
            onChange={handleChange}
            placeholder="Role (YO)"
            className="p-2 rounded bg-gray-800"
          />
          <textarea
            name="message_en"
            value={formData.message_en}
            onChange={handleChange}
            placeholder="Message (EN)"
            className="p-2 rounded bg-gray-800 col-span-2"
          />
          <textarea
            name="message_yo"
            value={formData.message_yo}
            onChange={handleChange}
            placeholder="Message (YO)"
            className="p-2 rounded bg-gray-800 col-span-2"
          />
          <input
            type="number"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            min="1"
            max="5"
            className="p-2 rounded bg-gray-800"
          />
        </div>
        <div className="mt-4 flex gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-yellow-500 px-6 py-2 rounded-lg font-bold text-black hover:bg-yellow-400"
          >
            {loading ? "Saving..." : editingId ? "Update" : "Add"} Testimonial
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="bg-gray-600 px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Testimonials List */}
      <div className="grid md:grid-cols-2 gap-6">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="bg-[#1B263B] p-4 rounded-xl shadow-lg flex items-center justify-between"
          >
            <div>
              <h3 className="text-yellow-400 font-bold">
                {t.name_en} ({t.name_yo})
              </h3>
              <p className="text-sm text-gray-400">{t.role_en}</p>
              {t.image_url && (
                <img
                  src={t.image_url}
                  alt={t.name_en}
                  className="w-16 h-16 rounded-full mt-2"
                />
              )}
              <p className="text-xs text-gray-400 mt-1">
                🎥 EN Video: {t.youtube_url || "None"}
              </p>
              <p className="text-xs text-gray-400">
                🎥 YO Video: {t.youtube_url_yo || "None"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(t)}
                className="bg-blue-500 px-3 py-2 rounded"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="bg-red-500 px-3 py-2 rounded"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
