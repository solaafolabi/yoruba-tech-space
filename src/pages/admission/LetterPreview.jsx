// LetterPreview.jsx
// Authored by Sola Afolabi

import React from "react";
import admissionText from "../../pages/admission/admission";

export default function LetterPreview({ profile, imageUrl, language }) {
  const t = admissionText[language];

  return (
    <div className="w-[600px] bg-white border shadow-lg p-6 rounded-lg text-gray-900 font-serif">
      <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-4">
        <img src="/logo.png" alt="Logo" className="w-14 h-14" />
        <h2 className="text-xl font-bold text-center flex-1 text-blue-900 uppercase">
          Yoruba Tech Space - {t.admissionLetter}
        </h2>
      </div>

      <p className="leading-relaxed text-sm mb-6">
        {t.dear} <strong>{profile.full_name}</strong>,<br /><br />
        {t.letterBody}<br />
        {t.course}: <strong>{profile.course}</strong><br /><br />
        {t.warning}
      </p>

      <div className="text-xs space-y-1 mb-6">
        <p><strong>{t.registrar}:</strong> Grace Adegoke</p>
        <p><strong>{t.address}:</strong> Zone 2, 15 Ifelodun Community, Ikirun, Osun State, Nigeria</p>
      </div>

      <div className="flex justify-end">
        <img
          src={imageUrl}
          alt="Passport"
          className="w-24 h-24 rounded object-cover border-2 border-blue-400"
        />
      </div>
    </div>
  );
}
