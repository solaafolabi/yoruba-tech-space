import React, { useState, useEffect } from "react";
import { useLanguage } from "../admission/LanguageContext";
import admissionText from "../admission/admission";
import supabase from "../../supabaseClient";

export default function AdmissionWelcomeModal({ user, onComplete }) {
  const { lang } = useLanguage();
  const t = admissionText[lang];

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  // 🔁 Run only once: check if profile already uploaded
  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("profile_picture, id_card_downloaded")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.profile_picture && data?.id_card_downloaded) {
            setCompleted(true);
            onComplete();
          }
        });
    }
  }, [user]);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!profileImage || !user) return;

    setUploading(true);
    setError("");

    const fileExt = profileImage.name.split(".").pop();
    const filePath = `profile-pictures/${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("students")
      .upload(filePath, profileImage, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      setError(t.uploadFailed);
      setUploading(false);
      return;
    }

    // Save path to profile table
    const publicURL = supabase.storage
      .from("students")
      .getPublicUrl(filePath).data.publicUrl;

    await supabase
      .from("profiles")
      .update({ profile_picture: publicURL })
      .eq("id", user.id);

    setUploading(false);
    setUploaded(true);
  };

  const handleComplete = async () => {
    await supabase
      .from("profiles")
      .update({ id_card_downloaded: true })
      .eq("id", user.id);

    setCompleted(true);
    onComplete();
  };

  if (completed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 text-white">
      <div className="bg-[#1B263B] p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-[#FFD700] mb-4">{t.congrats}</h2>
        <p className="mb-4">{t.uploadPrompt}</p>

        {/* Image Preview */}
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
          />
        )}

        {/* Drag and Drop */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-yellow-400 p-4 rounded text-center mb-4"
        >
          {t.dragDrop}
        </div>

        {/* OR File Input */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setProfileImage(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
          className="mb-4"
        />

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || !profileImage}
          className="w-full bg-yellow-500 py-2 rounded text-black font-semibold mb-2"
        >
          {uploading ? t.uploading : t.uploadButton}
        </button>

        {/* Actions after upload */}
        {uploaded && (
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => alert(t.idCardGenerated)}
              className="bg-green-500 py-2 rounded text-white"
            >
              🎫 {t.generateId}
            </button>
            <button
              onClick={() => alert(t.letterPrinted)}
              className="bg-blue-600 py-2 rounded text-white"
            >
              🖨 {t.printLetter}
            </button>
            <button
              onClick={handleComplete}
              className="bg-yellow-500 text-black py-2 rounded font-bold"
            >
              ✅ {t.proceed}
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
