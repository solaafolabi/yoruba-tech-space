import React, { useState, useEffect, useRef } from "react";
import supabase from "../../supabaseClient";
import { useTranslation } from "react-i18next";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function AdmissionModal({ user, onComplete, onClose }) {
  const { t, i18n } = useTranslation();
  const isYoruba = i18n.language === "yo";

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");
  const [profileUrl, setProfileUrl] = useState(null);
  const [fullName, setFullName] = useState("");
  const [idDownloaded, setIdDownloaded] = useState(false);
  const [letterDownloaded, setLetterDownloaded] = useState(false);
  const [admissionNumber, setAdmissionNumber] = useState("");
      const [admissionData, setAdmissionData] = useState(null);

  const idCardRef = useRef();
  const letterRef = useRef();

  const PROJECT_ID = "bqfdfhhscubymyycyoqe";

  useEffect(() => {
    async function fetchAdmissionData() {
      const { data, error } = await supabase
        .from("admissions")
        .select("admission_number, address, city, state, duration_days, start_date")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch admission data:", error);
      } else {
        setAdmissionData(data);
      }
    }

    fetchAdmissionData();
  }, [user.id]);


  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, profile_picture")
        .eq("id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name);
        setProfileUrl(data.profile_picture);
      }
    };





    const fetchAdmission = async () => {
      const { data } = await supabase
        .from("admissions")
        .select("admission_number")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setAdmissionNumber(data.admission_number);
      }
    };

    fetchProfile();
    fetchAdmission();
  }, [user.id]);

  const handleUpload = async () => {
    setUploading(true);
    setUploadSuccess(false);
    setError("");

    if (!file) {
      setError(t("admission.uploadPrompt"));
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { cacheControl: "3600", upsert: true });

    if (uploadErr) {
      setError(t("admission.uploadFailed"));
      setUploading(false);
      return;
    }

    const publicUrl = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/avatars/${fileName}`;
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ profile_picture: publicUrl })
      .eq("id", user.id);

    if (updateErr) {
      setError(t("admission.uploadFailed"));
      setUploading(false);
      return;
    }

    setProfileUrl(publicUrl);
    setUploadSuccess(true);
    setUploading(false);
  };

  const downloadPdf = async (ref, filename, setDownloaded, isIdCard = false) => {
    if (!profileUrl) {
      setError(t("admission.uploadPrompt"));
      return;
    }
    if (!ref.current) return;

    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    let pdf;

    if (isIdCard) {
      const cardWidth = 85.6;
      const cardHeight = 53.98;
      pdf = new jsPDF("landscape", "mm", [cardWidth, cardHeight]);
      pdf.addImage(imgData, "PNG", 0, 0, cardWidth, cardHeight);
    } else {
      pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(filename);
    setDownloaded(true);
  };

  const handleComplete = async () => {
    await supabase
      .from("profiles")
      .update({ has_completed_admission: true })
      .eq("id", user.id);
    onComplete();
  };

  const canProceed = profileUrl && idDownloaded && letterDownloaded;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
    >
      <div className="bg-[#1B263B] text-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl border border-yellow-400 overflow-y-auto max-h-[90vh] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t("admission.close")}
          className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 font-bold text-2xl focus:outline-none"
        >
          &times;
        </button>

        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() =>
              i18n.changeLanguage(isYoruba ? "en" : "yo")
            }
            className="px-4 py-1 bg-yellow-400 text-[#0F172A] rounded-md hover:bg-yellow-500 font-semibold"
          >
            {isYoruba ? "English" : "Yorùbá"}
          </button>
        </div>

        {/* Title */}
        <h2 className="text-center text-3xl font-bold text-yellow-400 mb-6">{t("admission.congrats")}</h2>

        {/* Upload Section */}
        <p className="text-center text-gray-300 mb-6">{t("admission.uploadPrompt")}</p>

        <div className="bg-[#0F172A] p-6 border border-dashed border-yellow-400 rounded-md text-center">
          <label
            htmlFor="uploadInput"
            className="cursor-pointer text-yellow-300 hover:text-yellow-500 font-semibold select-none"
          >
            {file ? file.name : t("admission.dragDrop")}
          </label>
          <input
            id="uploadInput"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setFile(e.target.files[0])}
            aria-describedby="upload-error"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 px-6 py-2 bg-yellow-400 text-[#0F172A] font-semibold rounded-md hover:bg-yellow-500 disabled:opacity-50"
          >
            {uploading ? t("admission.uploading") : t("admission.uploadButton")}
          </button>
          {uploadSuccess && (
            <p className="mt-3 text-green-400 font-semibold">✅ {t("admission.idCardGenerated")}</p>
          )}
          {error && (
            <p
              id="upload-error"
              className="mt-3 text-red-500 font-semibold"
              role="alert"
            >
              {error}
            </p>
          )}
          {profileUrl && (
            <img
              src={profileUrl}
              alt="Preview"
              className="mt-6 w-28 h-28 rounded-full object-cover border border-yellow-400 mx-auto"
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => downloadPdf(idCardRef, "ID_Card.pdf", setIdDownloaded, true)}
            disabled={!profileUrl}
            className={`flex-1 py-3 rounded-md font-semibold text-[#0F172A] ${
              idDownloaded ? "bg-green-600" : "bg-yellow-400"
            } disabled:opacity-50`}
          >
            {t("admission.generateId")}
          </button>

          <button
            onClick={() => downloadPdf(letterRef, "Admission_Letter.pdf", setLetterDownloaded)}
            disabled={!profileUrl}
            className={`flex-1 py-3 rounded-md font-semibold text-[#0F172A] ${
              letterDownloaded ? "bg-green-600" : "bg-yellow-400"
            } disabled:opacity-50`}
          >
            {t("admission.printLetter")}
          </button>
        </div>

        {/* Proceed Button */}
        <div className="text-center mt-10">
          <button
            onClick={handleComplete}
            disabled={!canProceed}
            className={`px-10 py-3 rounded-full font-bold text-white ${
              canProceed ? "bg-green-500 hover:bg-green-600" : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            {t("admission.proceed")}
          </button>
        </div>

        {/* Hidden Templates */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          {/* ID Card */}
          <div
            ref={idCardRef}
            className="w-[340px] h-[210px] relative rounded-xl shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white font-sans border border-gray-700"
          >
            <div className="absolute left-0 top-0 w-3 h-full bg-gradient-to-b from-yellow-400 to-yellow-600"></div>
            <div className="absolute top-2 left-0 w-full text-center text-[13px] font-bold text-yellow-300">
              Yoruba Tech Space
            </div>
            <img
              src="/logo.png"
              alt="Logo"
              className="absolute top-4 right-4 w-18 h-12 object-contain drop-shadow"
            />
            <div className="absolute top-4 left-6 w-10 h-7 bg-yellow-400 rounded-md shadow-inner border border-gray-300"></div>
            <div className="absolute top-14 left-6 w-20 h-20 rounded-full border-2 border-yellow-400 overflow-hidden shadow-md">
              {profileUrl && (
                <img src={profileUrl} alt="Student" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="absolute top-14 left-32 w-[190px] text-sm leading-snug">
              <p className="font-bold text-yellow-300">{t("admission.fullName")}:</p>
              <p className="text-white mb-1">{fullName || t("admission.fullName")}</p>
              <p className="font-bold text-yellow-300">{t("admission.email")}:</p>
              <p className="text-white mb-1">{user?.email}</p>
              <p className="font-bold text-yellow-300">{t("admission.admissionNo")}:</p>
              <p className="text-white">{admissionNumber || "N/A"}</p>
            </div>
            <div className="absolute bottom-11 left-6 w-[100px] h-[18px] bg-white flex items-center justify-center rounded-sm">
              <img
                src={`https://barcodeapi.org/api/128/${admissionNumber || "N/A"}`}
                alt="Barcode"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute bottom-12 right-6 w-8 h-8 bg-white p-[1px] rounded shadow">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=32x32&data=${user?.email}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Admission Letter */}
<div
  ref={letterRef}
  className="w-[595px] h-[842px] bg-[#0f172a] text-white p-10 relative shadow-lg rounded-lg border border-yellow-500"
>
  {/* Watermark */}
  <img
    src="/logo.png"
    alt="Watermark"
    className="absolute opacity-10 w-[300px] h-[300px] -z-10 top-1/3 left-1/4"
  />

  {/* Header */}
  <div className="flex justify-between items-center border-b border-yellow-500 pb-2 mb-6">
    <img src="/logo.png" alt="Logo" className="w-12 h-auto" />
    <div className="text-right">
      <h1 className="text-yellow-400 text-2xl font-bold">Yoruba Tech Space</h1>
      <p className="text-yellow-300 text-sm italic">
        {isYoruba ? "Ọfiisi Ìforúkọsílẹ̀" : "Admission Office"}
      </p>
    </div>
  </div>

  {/* Addresses & Admission Details */}
  <div className="flex gap-6 mb-6 items-start">
    {/* Student Photo */}
    {profileUrl && (
      <img
        src={profileUrl}
        alt="Student"
        className="w-20 h-20 rounded-full border-2 border-yellow-400 object-cover shadow-md"
      />
    )}

    {/* Addresses */}
    <div className="flex-1 flex flex-col justify-between">
      <div className="flex justify-between mb-4">
        {/* Student Address */}
        <div className="max-w-[50%] italic text-sm leading-relaxed">
          <p>
            {[
              admissionData?.address,
              admissionData?.city,
              admissionData?.state,
              admissionData?.country || "Nigeria",
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>

        {/* Yoruba Tech Space Address */}
        <div className="max-w-[45%] text-right text-sm leading-relaxed">
          <p className="text-yellow-400 font-semibold mb-1">Yoruba Tech Space</p>
          <p>
            Zone 2, 15 Ifelodun Community
            <br />
            Ikirun, Osun State, Nigeria
          </p>
        </div>
      </div>

      {/* Admission Number & Date */}
      <div className="flex justify-between text-yellow-400 text-sm font-semibold">
        <p>
          {isYoruba ? "Nọ́mbà Ìforúkọsílẹ̀:" : "Admission No:"}{" "}
          <span className="text-white font-normal">
            {admissionData?.admission_number || "N/A"}
          </span>
        </p>
        <p>
          {isYoruba ? "Ọjọ́:" : "Date:"}{" "}
          <span className="text-white font-normal">
            {new Date().toLocaleDateString()}
          </span>
        </p>
      </div>
    </div>
  </div>

  {/* Letter Content */}
  <div className="text-sm leading-relaxed space-y-4">
    <p>
      {isYoruba ? "Ọ̀rẹ́ mi" : "Dear"}{" "}
      <span className="font-semibold">{fullName || "Student"}</span>,
    </p>

    <p>
      {isYoruba
        ? "A kí yín ku ìforúkọsílẹ̀ sí Yoruba Tech Space. A ti fi ẹ̀tọ́ ọfẹ́ fún ọ láti wọlé sí pẹpẹ ẹ̀kọ́ wa. Jọ̀wọ́ mọ̀ pé kóòdù kọọkan ní àkókò tó yẹ kí a pari rẹ."
        : "Congratulations on your admission to Yoruba Tech Space. We are pleased to offer you free access to our learning platform. Please note that each course is designed to be completed within a specified time frame."}
    </p>

    <p>
      {isYoruba
        ? "Bí o kò bá pari kóòdù rẹ ní àkókò tó yàn, ìforúkọsílẹ̀ rẹ lè dáwọ́ dúró. A ń retí pé gbogbo akẹ́kọ̀ọ́ máa tẹ̀síwájú ní àṣẹ àti àtìlẹ́yìn Yoruba Tech Space láti jẹ́ kí ẹ̀kọ́ pọ̀."
        : "Failure to complete your course within this period may result in withdrawal of your admission. We expect all students to adhere to the rules and regulations of Yoruba Tech Space to maintain a conducive learning environment."}
    </p>

    <p>
      {isYoruba
        ? "A ń retí láti ṣe àtìlẹ́yìn fún ọ nípa ẹ̀kọ́ rẹ, a sì ń gbìmọ̀ràn kí o lo ànfàní yìí dáadáa."
        : "We look forward to supporting you on your educational journey and encourage you to make the most of this opportunity."}
    </p>

    <p>{isYoruba ? "Ẹ ṣé," : "Sincerely,"}</p>

    {/* Registrar Name */}
    <p className="font-semibold">Grace Adegoke</p>
  </div>

  {/* Registrar signature */}
  <div className="absolute bottom-14 right-10 text-center">
    <div className="border-t border-yellow-400 w-40 mx-auto"></div>
    <p className="mt-1 text-yellow-400 text-sm italic">
      {isYoruba ? "Ibuwọlu Alákóso" : "Registrar's Signature"}
    </p>
  </div>
</div>


        </div>
      </div>
    </div>
  );
}
