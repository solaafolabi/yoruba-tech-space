// CodeEditorTabs.jsx
export default function CodeEditorTabs({ currentLanguage, supportedLanguages, onChange }) {
  return (
    <div className="flex border-b mb-4">
      {supportedLanguages.map(lang => (
        <button
          key={lang}
          className={`px-4 py-2 ${currentLanguage === lang 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500'}`}
          onClick={() => onChange(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}