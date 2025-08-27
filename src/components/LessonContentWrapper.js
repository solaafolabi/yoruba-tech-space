import React from "react";

export default function LessonContentWrapper({ title, videoUrl, children }) {
  return (
    <div className="w-full px-4 py-6 space-y-10">
      {/* Lesson Title */}
      <h5 className="text-4xl font-bold text-[#FFD700]">{title}</h5>

      {/* Video */}
      {videoUrl && (
        <div className="flex justify-end">
          <div className="w-full max-w-6xl aspect-video ml-auto mr-10">
            <iframe
              className="w-full h-full rounded-lg shadow-lg"
              src={videoUrl}
              title={title}
              frameBorder="0"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Lesson Content */}
      <div className="text-gray-200 text-base leading-relaxed max-w-3xl">
        {children}
      </div>
    </div>
  );
}
