import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { useExperienceCheck } from "./useExperienceCheck";
import ExperienceModal from "./ExperienceModal";

const AdmissionForm = () => {
  const user = useUser();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [course, setCourse] = useState("");
  const [motivation, setMotivation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  const { checkExperienceRequirement } = useExperienceCheck();

  useEffect(() => {
    if (course === "CSS" || course === "JavaScript") {
      setShowExperienceModal(true);
    }
  }, [course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from("admissions").insert([
      {
        full_name: fullName,
        email,
        course,
        motivation,
      },
    ]);

    setTimeout(() => {
      setIsSubmitting(false);
      if (!error) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          setShowFollowUpModal(true);
        }, 1500);
      }
    }, 60000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-[#1B263B] text-white rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Fọọmu Ìforúkọsílẹ̀ (Admission Form)</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Orúkọ Kíkún (Full Name)</label>
          <input
            type="text"
            value={fullName}
            readOnly
            className="w-full px-3 py-2 rounded bg-[#0f172a] text-white"
          />
        </div>
        <div>
          <label className="block mb-1">Ìmẹ́lì (Email)</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full px-3 py-2 rounded bg-[#0f172a] text-white"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1">Yàn Kọ́ọ̀sì (Select Course)</label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full px-3 py-2 rounded bg-[#0f172a] text-white"
          >
            <option value="">-- Jọ̀wọ́ yan kọ́ọ̀sì --</option>
            <option value="HTML">HTML</option>
            <option value="CSS">CSS</option>
            <option value="JavaScript">JavaScript</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1">Ìdí tí o fi fẹ́ kọ́ ẹ̀kọ́ (Your Motivation)</label>
          <textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            className="w-full px-3 py-2 rounded bg-[#0f172a] text-white"
            required
          ></textarea>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-600"
          >
            {isSubmitting ? "Ìmúlò ń lọ..." : "Fọwọ́ sílẹ̀ (Submit)"}
          </button>
        </div>
      </form>

      {showSuccessModal && (
        <div className="mt-4 p-4 bg-green-700 text-white text-center rounded">
          ✅ O ti gba wọlé sí Yorùbá Tech Space!
        </div>
      )}

      {showFollowUpModal && (
        <div className="mt-4 p-4 bg-blue-700 text-white text-center rounded">
          📸 Jọwọ:
          <ul className="list-disc pl-6 text-left mt-2">
            <li>Ìkó pasipọ́ rẹ</li>
            <li>Ṣẹ̀dá lẹ́tà ìforúkọsílẹ̀</li>
            <li>Ṣẹ̀dá kaadi ID rẹ</li>
          </ul>
          <button
            className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded"
            onClick={() => navigate("/dashboard")}
          >
            Lọ sí Dashboard
          </button>
        </div>
      )}

      {showExperienceModal && (
        <ExperienceModal
          isOpen={showExperienceModal}
          onClose={() => setShowExperienceModal(false)}
        />
      )}
    </div>
  );
};

export default AdmissionForm;
