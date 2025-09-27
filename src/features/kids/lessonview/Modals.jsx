export default function Modals({
  showBadgeModal,
  setShowBadgeModal,
  badgeInfo,
  language,
  showNavigation = false,
  onPrev,
  onNext,
}) {
  return (
    <>
      {showBadgeModal && badgeInfo && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border-4 border-green-300 text-center relative"
          >
            <div className="text-6xl mb-2" aria-hidden>🏅</div>
            <h3 className="text-2xl font-black mb-2">
              {language === "yo" ? badgeInfo.title_yo || "Aami Aṣeyọri" : badgeInfo.title_en || "Achievement Badge"}
            </h3>
            <p className="text-gray-700 font-bold mb-3">
              {language === "yo" ? badgeInfo.description_yo : badgeInfo.description_en}
            </p>
            {badgeInfo.icon_url && (
              <img src={badgeInfo.icon_url} alt="badge icon" className="mx-auto w-24 h-24 object-contain mb-3" />
            )}

            {showNavigation && (
              <div className="flex justify-between mt-2 mb-4">
                <button onClick={onPrev} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold">
                  ◀️
                </button>
                <button onClick={onNext} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold">
                  ▶️
                </button>
              </div>
            )}

            <button
              onClick={() => setShowBadgeModal(false)}
              className="px-5 py-2 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-extrabold shadow"
            >
              {language === "yo" ? "O ṣeun!" : "Nice!"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
