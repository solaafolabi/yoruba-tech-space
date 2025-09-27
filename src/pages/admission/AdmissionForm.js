import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const nigeriaStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

export default function AdmissionForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const stepLabels = [
    t("admission.personalInfo"),
    t("admission.location"),
    t("admission.motivations"),
  ];

  const [form, setForm] = useState({
    phone: "",
    sex: "male",
    motivation: "",
    experience: "",
    hearAboutUs: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
    otherCountry: "",
    agreeTerms: false,
  });

  const [userInfo, setUserInfo] = useState({ fullName: "", email: "" });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const [processingCaption, setProcessingCaption] = useState("");


  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        setUserInfo({
          fullName: profile?.full_name || "👤",
          email: user.email,
        });

        const { data } = await supabase
          .from("admissions")
          .select("*")
          .eq("user_id", user.id);

        if (data && data.length > 0) setAlreadySubmitted(true);
      }
    }
    fetchUser();
  }, []);

  const validateStep = (currentStep) => {
    const errs = {};
    if (currentStep === 0) {
      if (!form.phone.trim()) errs.phone = t("admission.errors.required");
      if (!form.sex.trim()) errs.sex = t("admission.errors.required");
      if (!form.hearAboutUs.trim()) errs.hearAboutUs = t("admission.errors.required");
    }
    if (currentStep === 1) {
      if (!form.city.trim()) errs.city = t("admission.errors.required");
      if (form.country === "Nigeria" && !form.state.trim()) errs.state = t("admission.errors.required");
      if (!form.address.trim()) errs.address = t("admission.errors.required");
      if (form.country === "Other" && !form.otherCountry.trim())
        errs.otherCountry = t("admission.errors.required");
      if (!form.country.trim()) errs.country = t("admission.errors.required");
    }
    if (currentStep === 2) {
      if (!form.motivation.trim()) errs.motivation = t("admission.errors.required");
      if (!form.agreeTerms) errs.agreeTerms = t("admission.errors.agreeTerms");
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const generateAdmissionNumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `YORU-${year}-${rand}`;
  };

  const nextStep = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    if (step < stepLabels.length - 1) {
      nextStep();
    } else {
      setShowModal(true);
    }
  };

  const handleFinalSubmit = async () => {
  setShowModal(false);
  setProcessing(true);
  setProcessingCaption(t("admission.verifying"));

  // Simulate 8 seconds of verification delay
  setTimeout(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admission_number = generateAdmissionNumber();
    const today = new Date();
    const expected_end = new Date(today);
    expected_end.setDate(today.getDate() + 90);

    const admissionData = {
      user_id: user.id,
      admission_number,
      motivation: form.motivation,
      hear_about_us: form.hearAboutUs,
      address: form.address,
      city: form.city,
      state: form.state,
      duration_days: 90,
      start_date: today.toISOString().split("T")[0],
      status: "active",
    };

    const { error: insertError } = await supabase.from("admissions").insert(admissionData);

    if (insertError) {
      setProcessing(false);
      setProcessingCaption("");
      alert("Failed to save admission, please try again later.");
      return;
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({
        phone: form.phone,
        role: "student",
        motivation: form.motivation,
        admission_date: today.toISOString().split("T")[0],
        expected_end_date: expected_end.toISOString().split("T")[0],
        language: i18n.language,
        status: "active",
        address: form.address,
      })
      .eq("id", user.id);

   setProcessingCaption(t("admission.verifying"));;
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setProcessingCaption("");
      setTimeout(() => navigate("/dashboard"), 2000);
    }, 2000);
  }, 8000);
};

  if (alreadySubmitted) {
    return (
     <div className="min-h-screen bg-[#0f172a] text-white px-4 pt-32 pb-20 flex justify-center">
        <div className="bg-[#1B263B] p-10 rounded shadow-lg text-center text-yellow-500 text-lg">
          🎉 {t("admission.alreadySubmitted")}
        </div>
      </div>
    );
  }

  return (
   <div className="min-h-screen bg-[#0f172a] text-white px-4 pt-40 pb-40 flex justify-center">
      <div className="w-full max-w-3xl bg-[#1B263B] p-8 rounded-lg shadow-lg">
       <div className="flex justify-center items-center mb-6">
  <h1 className="text-2xl font-bold text-yellow-500">{t("admission.title")}</h1>
</div>

        {/* Stepper */}
       <div className="flex justify-between mb-8 px-4 max-w-3xl mx-auto">
  {stepLabels.map((label, i) => (
    <div key={label} className="relative flex-1 flex flex-col items-center">
      {/* Circle */}
      <div
        className={`z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          i === step
            ? "bg-yellow-600 text-[#0f172a]"
            : i < step
            ? "bg-[#fff] text-[#0f1724]"
            : "bg-gray-600 text-gray-300"
        }`}
      >
        {i < step ? "✓" : i + 1}
      </div>

      {/* Label */}
      <div
        className={`mt-2 text-xs select-none text-center ${
          i === step ? "text-yellow-500" : i < step ? "text-[#fff]" : "text-gray-400"
        }`}
      >
        {label}
      </div>

      {/* Connector line: only add if not last step */}
      {i !== stepLabels.length - 1 && (
        <div
          className={`absolute top-4 right-0 w-full h-1 ${
            i < step ? "bg-[#fff]" : "bg-gray-600"
          }`}
          style={{ width: "100%", transform: "translateX(50%)" }}
        />
      )}
    </div>
  ))}

        </div>
{processing ? (
  <div className="flex flex-col items-center text-yellow-500 space-y-4">
    <svg
      className="animate-spin h-10 w-10 text-yellow-5000"

      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      ></path>
    </svg>
    <p>{processingCaption}</p>
  </div>
) : success ? (
  <p className="text-green-400 text-center text-xl animate-bounce">{t("admission.success")}</p>
) : (
          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence exitBeforeEnter>
              {step === 0 && (
                <motion.div
                  key="step1"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                 {/* Phone */}
<div className="flex flex-col">
  <label
    htmlFor="phone"
    className="mb-1 text-white font-semibold select-none"
  >
    {t("admission.phone")}
  </label>
  <input
    type="tel"
    id="phone"
    name="phone"
    value={form.phone}
    onChange={(e) => {
      let val = e.target.value.replace(/\D/g, ""); // remove non-digits
      if (val.length <= 11) setForm((prev) => ({ ...prev, phone: val }));

      // Real-time error
      if (val.length !== 11) {
        setErrors((prev) => ({
          ...prev,
          phone: t("admission.phoneError") || "Phone must be 11 digits",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
    }}
    className={`w-full rounded bg-[#0A192F] border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
      errors.phone
        ? "border-red-500 focus:ring-red-400"
        : "border-blue-600 focus:ring-yellow-500"
    }`}
    aria-invalid={!!errors.phone}
    aria-describedby="phone-error"
  />
  {errors.phone && (
    <p
      id="phone-error"
      className="mt-1 text-red-500 text-xs select-none"
      role="alert"
    >
      {errors.phone}
    </p>
  )}
</div>

                  {/* Sex */}
                  <div className="flex flex-col">
                    <label htmlFor="sex" className="mb-1 text-white font-semibold select-none">
                      {t("admission.sex")}
                    </label>
                    <select
                      id="sex"
                      name="sex"
                      value={form.sex}
                      onChange={handleChange}
                      className="w-full rounded bg-[#0A192F] border border-blue-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="male">{t("admission.male")}</option>
                      <option value="female">{t("admission.female")}</option>
                    </select>
                  </div>

                  {/* Hear About Us */}
                  <div className="flex flex-col md:col-span-2">
                    <label htmlFor="hearAboutUs" className="mb-1 text-white font-semibold select-none">
                      {t("admission.hearAboutUsLabel")}
                    </label>
                    <select
                      id="hearAboutUs"
                      name="hearAboutUs"
                      value={form.hearAboutUs}
                      onChange={handleChange}
                      className={`w-full rounded bg-[#0A192F] border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
                        errors.hearAboutUs ? "border-red-500 focus:ring-red-400" : "border-blue-600 focus:ring-yellow-500"
                      }`}
                      aria-invalid={!!errors.hearAboutUs}
                      aria-describedby="hearAboutUs-error"
                    >
                      <option value="">{t("admission.selectOption")}</option>
                      <option value="socialMedia">{t("admission.hearOptions.socialMedia")}</option>
                      <option value="friend">{t("admission.hearOptions.friend")}</option>
                      <option value="advertisement">{t("admission.hearOptions.advertisement")}</option>
                      <option value="other">{t("admission.hearOptions.other")}</option>
                    </select>
                    {errors.hearAboutUs && (
                      <p id="hearAboutUs-error" className="mt-1 text-red-500 text-xs select-none" role="alert">
                        {errors.hearAboutUs}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

             {step === 1 && (
  <motion.div
    key="step2"
    initial={{ x: 300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -300, opacity: 0 }}
    transition={{ duration: 0.4 }}
    className="grid grid-cols-1 gap-6"
  >
    {/* Country */}
    <div className="flex flex-col">
      <label htmlFor="country" className="mb-1 text-white font-semibold select-none">
        {t("admission.country")}
      </label>
      <select
        id="country"
        name="country"
        value={form.country}
        onChange={handleChange}
        className={`w-full rounded bg-[#0A192F] border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
          errors.country ? "border-red-500 focus:ring-red-400" : "border-blue-600 focus:ring-yellow-500"
        }`}
        aria-invalid={!!errors.country}
        aria-describedby="country-error"
      >
        <option value="">-- {t("admission.selectOption")} --</option>
        <option value="Nigeria">Nigeria</option>
        <option value="Other">{t("admission.otherCountry")}</option>
      </select>
      {errors.country && (
        <p id="country-error" className="mt-1 text-red-500 text-xs select-none" role="alert">
          {errors.country}
        </p>
      )}
    </div>

    {/* Other Country */}
    {form.country === "Other" && (
      <div className="flex flex-col">
        <label htmlFor="otherCountry" className="mb-1 text-white font-semibold select-none">
          {t("admission.enterOtherCountry")}
        </label>
        <input
          id="otherCountry"
          name="otherCountry"
          value={form.otherCountry}
          onChange={handleChange}
          className={`w-full rounded bg-[#0A192F] border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
            errors.otherCountry ? "border-red-500 focus:ring-red-400" : "border-blue-600 focus:ring-yellow-500"
          }`}
          aria-invalid={!!errors.otherCountry}
          aria-describedby="otherCountry-error"
        />
        {errors.otherCountry && (
          <p id="otherCountry-error" className="mt-1 text-red-500 text-xs select-none" role="alert">
            {errors.otherCountry}
          </p>
        )}
      </div>
    )}

    {/* State (only Nigeria) */}
    {form.country === "Nigeria" && (
      <div className="flex flex-col">
        <label htmlFor="state" className="mb-1 text-white font-semibold select-none">
          {t("admission.state")}
        </label>
        <select
          id="state"
          name="state"
          value={form.state}
          onChange={handleChange}
          className={`w-full rounded bg-[#0A192F] border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
            errors.state ? "border-red-500 focus:ring-red-400" : "border-blue-600 focus:ring-yellow-500"
          }`}
          aria-invalid={!!errors.state}
          aria-describedby="state-error"
        >
          <option value="">{t("admission.selectOption")}</option>
          {nigeriaStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
          <option value="Other">{t("admission.otherState")}</option>
        </select>
        {errors.state && (
          <p id="state-error" className="mt-1 text-red-500 text-xs select-none" role="alert">
            {errors.state}
          </p>
        )}
      </div>
    )}

    {/* City and Address side by side */}
    <div className="flex flex-col md:flex-row md:space-x-6">
      <div className="flex-1 flex flex-col mb-4 md:mb-0">
        <label htmlFor="city" className="mb-1 text-white font-semibold select-none">
          {t("admission.city")}
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={form.city}
          onChange={handleChange}
          className={`w-full rounded bg-[#0A192F] border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
            errors.city ? "border-red-500 focus:ring-red-400" : "border-blue-600 focus:ring-yellow-450"
          }`}
          aria-invalid={!!errors.city}
          aria-describedby="city-error"
        />
        {errors.city && (
          <p id="city-error" className="mt-1 text-red-500 text-xs select-none" role="alert">
            {errors.city}
          </p>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <label htmlFor="address" className="mb-1 text-white font-semibold select-none">
          {t("admission.addressLabel")}
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={form.address}
          onChange={handleChange}
          className={`w-full rounded bg-[#0A192F] border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
            errors.address ? "border-red-500 focus:ring-red-400" : "border-blue-600 focus:ring-yellow-500"
          }`}
          aria-invalid={!!errors.address}
          aria-describedby="address-error"
        />
        {errors.address && (
          <p id="address-error" className="mt-1 text-red-500 text-xs select-none" role="alert">
            {errors.address}
          </p>
        )}
      </div>
    </div>
  </motion.div>
)}

              {step === 2 && (
                <motion.div
                  key="step3"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 gap-6"
                >
                  {/* Motivation */}
                  <div className="flex flex-col">
                    <label htmlFor="motivation" className="mb-1 text-white font-semibold select-none">
                      {t("admission.motivation")}
                    </label>
                    <textarea
                      id="motivation"
                      name="motivation"
                      value={form.motivation}
                      onChange={handleChange}
                      className={`w-full rounded bg-[#0A192F] border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
                        errors.motivation ? "border-red-500 focus:ring-red-400" : "border-blue-600 focus:ring-yellow-500"
                      }`}
                      rows="4"
                      aria-invalid={!!errors.motivation}
                      aria-describedby="motivation-error"
                    />
                    {errors.motivation && (
                      <p id="motivation-error" className="mt-1 text-red-500 text-xs select-none" role="alert">
                        {errors.motivation}
                      </p>
                    )}
                  </div>

                  {/* Experience */}
                  <div className="flex flex-col">
                    <label htmlFor="experience" className="mb-1 text-white font-semibold select-none">
                      {t("admission.experienceNote")}
                    </label>
                    <textarea
                      id="experience"
                      name="experience"
                      value={form.experience}
                      onChange={handleChange}
                      className="w-full rounded bg-[#0A192F] border border-blue-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      rows="3"
                    />
                  </div>

                  {/* Agree Terms */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      name="agreeTerms"
                      checked={form.agreeTerms}
                      onChange={handleChange}
                      className="w-4 h-4 text-yellow-500 rounded border-gray-300 focus:ring-yellow-500 focus:ring-2"
                    />
                    <label htmlFor="agreeTerms" className="text-white select-none">
                      {t("admission.agreeTermsText")}
                    </label>
                  </div>
                  {errors.agreeTerms && (
                    <p className="text-red-500 text-xs select-none" role="alert">
                      {errors.agreeTerms}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={processing}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-5 rounded transition disabled:opacity-50"
                >
                  {t("admission.back")}
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={processing}
                className="bg-yellow-500 hover:bg-yellow-600 text-[#0f172a] font-bold py-2 px-6 rounded transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {step === stepLabels.length - 1
                  ? processing
                    ? t("admission.submitting")
                    : t("admission.submit")
                  : t("admission.next")}
              </button>
            </div>
          </form>
        )}

        {/* Confirmation Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="bg-[#1B263B] rounded-lg p-6 max-w-md w-full text-white">
              <h2 id="modal-title" className="text-xl font-bold mb-4">
                {t("admission.confirmSubmission")}
              </h2>
              <p className="mb-6">{t("admission.confirmText")}</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition"
                >
                  {t("admission.cancel")}
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="px-4 py-2 bg-yellow-500 text-[#0f172a] font-bold rounded hover:bg-yellow-600 transition"
                  disabled={processing}
                >
                  {processing ? t("admission.submitting") : t("admission.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* General error message */}
        {errors.general && (
          <p className="text-red-500 mt-4 text-center select-none" role="alert">
            {errors.general}
          </p>
        )}
      </div>
    </div>
  );
}
