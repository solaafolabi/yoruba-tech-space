// src/features/auth/ParentSignup.jsx
import React, { useState, useEffect } from "react";
import supabase from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const FloatingLabelInput = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
}) => {
  const hasValue = value && value.length > 0;

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`peer block w-full appearance-none border-b-2 bg-transparent px-0 pb-1.5 pt-5 text-white focus:outline-none focus:ring-0 focus:border-yellow-500 transition-colors ${
          error ? "border-red-500" : "border-blue-500"
        }`}
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <label
        htmlFor={id}
        className={`absolute left-0 top-0 text-gray-400 text-sm select-none cursor-text
          transition-all duration-300
          peer-placeholder-shown:top-5
          peer-placeholder-shown:text-gray-500
          peer-placeholder-shown:text-base
          peer-placeholder-shown:font-normal
          peer-focus:top-0
          peer-focus:text-yellow-500
          peer-focus:text-sm
          peer-focus:font-semibold
          ${hasValue ? "top-0 text-yellow-500 text-sm font-semibold" : ""}
        `}
      >
        {label}
      </label>
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-0 top-1.5 text-yellow-500 font-semibold text-sm select-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-red-500 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default function ParentSignup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const savedEmail = localStorage.getItem("user_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const errs = {};

    if (!fullName.trim()) errs.fullName = t("parentSignup.errors.fullNameRequired");

    if (!email.trim()) {
      errs.email = t("parentSignup.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = t("parentSignup.errors.invalidEmail");
    }

    if (!password) {
      errs.password = t("parentSignup.errors.passwordRequired");
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password)
    ) {
      errs.password = t("parentSignup.errors.passwordWeak");
    }

    if (!confirmPassword) {
      errs.confirmPassword = t("parentSignup.errors.confirmPasswordRequired");
    } else if (password !== confirmPassword) {
      errs.confirmPassword = t("parentSignup.errors.passwordMismatch");
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setErrors({});
    if (!validate()) return;

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: "parent" } },
      });

      if (signUpError) {
        setError(t("parentSignup.errors.signupFailed", { message: signUpError.message }));
        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setError(t("parentSignup.errors.noUserReturned"));
        setLoading(false);
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert([{ id: user.id, full_name: fullName, role: "parent" }], { onConflict: "id" });

      if (upsertError) {
        setError(t("parentSignup.errors.profileSaveFailed", { message: upsertError.message }));
        setLoading(false);
        return;
      }

      if (rememberMe) localStorage.setItem("user_email", email);
      else localStorage.removeItem("user_email");

      setSuccess(t("parentSignup.messages.signupSuccess"));
      setTimeout(() => navigate("/parents/dashboard"), 1500);
    } catch (err) {
      setError(t("parentSignup.errors.genericError", { message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] to-[#1B263B] flex items-center justify-center px-4 pt-20 pb-20 relative overflow-hidden">
      {/* background effects */}
      <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-blue-400 opacity-10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-20 left-20 w-[200px] h-[200px] bg-yellow-400 opacity-10 blur-3xl rounded-full"></div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 text-center left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-6 rounded shadow-lg z-50"
        >
          {success}
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-[#112240]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-yellow-600"
      >
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-extrabold text-yellow-500 mb-6 text-center"
        >
          {t("parentSignup.parentTitle")}
        </motion.h2>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={handleSignup} className="space-y-6" noValidate>
          <FloatingLabelInput
            id="fullName"
            label={t("parentSignup.fullName")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
          />

          <FloatingLabelInput
            id="email"
            label={t("parentSignup.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <FloatingLabelInput
            id="password"
            label={t("parentSignup.password")}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
          />

          <FloatingLabelInput
            id="confirmPassword"
            label={t("parentSignup.confirmPassword")}
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
          />

          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="form-checkbox text-blue-400"
            />
            {t("parentSignup.remember")}
          </label>

          <motion.button
            whileHover={{ scale: !loading ? 1.05 : 1 }}
            whileTap={{ scale: !loading ? 0.95 : 1 }}
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-2 rounded shadow-lg transition-all border border-yellow-600 ${
              loading
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-blue-600 text-yellow-500 hover:bg-blue-700"
            }`}
          >
            {loading ? t("parentSignup.loading") : t("parentSignup.signup")}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
