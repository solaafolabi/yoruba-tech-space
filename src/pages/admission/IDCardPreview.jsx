// IDCardPreview.jsx
// Authored by Sola Afolabi

import React from "react";
import admissionText from "../../pages/admission/admission";

export default function IDCardPreview({ profile, imageUrl, language }) {
  const t = admissionText[language];

  return (
    <div className="w-[350px] h-[200px] rounded-xl shadow-lg border bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-black font-sans">
      <div className="flex items-center justify-between border-b border-blue-300 pb-2 mb-2">
        <img src="/logo.png" alt="Logo" className="w-10 h-10" />
        <h3 className="text-sm font-bold text-center flex-1 text-blue-800 uppercase">
          Yoruba Tech Space<br />{t.studentIdCard}
        </h3>
      </div>
      <div className="flex items-center justify-between h-full">
        <div className="space-y-1 text-sm text-gray-800">
          <p><strong>{t.fullName}:</strong> {profile.full_name}</p>
          <p><strong>{t.email}:</strong> {profile.email}</p>
          <p><strong>{t.course}:</strong> {profile.course}</p>
        </div>
        <img
          src={imageUrl}
          alt="Passport"
          className="w-20 h-20 rounded object-cover border-2 border-blue-500"
        />
      </div>
    </div>
  );
}
