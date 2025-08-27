import React, { useState, useEffect } from "react";
import supabase from "../../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
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
  disabled,
  autoComplete,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        disabled={disabled}
        autoComplete={autoComplete}
        className={`peer block w-full appearance-none border-b-2 bg-transparent px-0 pb-1.5 pt-5 text-white focus:outline-none focus:ring-0 focus:border-yellow-400 transition-colors ${
          error ? "border-red-500" : "border-blue-500"
        }`}
        aria-invalid={!!error}
        aria-describedby={`${id}-error`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <label
        htmlFor={id}
        className={`absolute left-0 select-none cursor-text transition-all duration-300 ${
          hasValue || isFocused
            ? "top-0 text-yellow-400 text-sm font-semibold"
            : "top-5 text-gray-400 text-base font-normal peer-placeholder-shown:text-gray-500"
        }`}
      >
        {label}
      </label>
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-0 top-1.5 text-yellow-400 font-semibold text-sm select-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
          disabled={disabled}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const savedEmail = localStorage.getItem("user_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "yo" : "en");
    setEmailError("");
    setPasswordError("");
    setError("");
    setSuccess("");
  };

  const validateFields = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError(i18n.language === "yo" ? "Jọwọ tẹ imeeli sii." : "Please enter your email.");
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError(i18n.language === "yo" ? "Imeeli ko ni ilana to pe." : "Email format is invalid.");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError(i18n.language === "yo" ? "Jọwọ tẹ ọrọ igbaniwọle sii." : "Please enter your password.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(
        i18n.language === "yo"
          ? "Ọrọ igbaniwọle yẹ ki o jẹ o kere ju awọn ohun kikọ 6 lọ."
          : "Password must be at least 6 characters."
      );
      valid = false;
    }

    return valid;
  };

  const determineUserRole = async (userId) => {
    try {
      // 1️⃣ Check if user is a child
      const { data: childData, error: childError } = await supabase
        .from("children")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (childError) throw childError;
      if (childData) return "child";

      // 2️⃣ Check if user is a parent or other role
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (profileData?.role) return profileData.role.toLowerCase();

      return "unknown";
    } catch (err) {
      console.error("Error determining user role:", err);
      return "unknown";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!validateFields()) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(i18n.language === "yo" ? "Imeeli tabi ọrọ igbaniwọle ko tọ." : "Invalid email or password.");
        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setError(i18n.language === "yo" ? "Ko ri olumulo." : "User not found.");
        setLoading(false);
        return;
      }

      // ✅ Always determine role from database, ignore user_metadata
      const role = await determineUserRole(user.id);

      // Redirect based on role
      let dashboardPath = "/login"; // fallback
      switch (role) {
        case "child":
          dashboardPath = "/kids/dashboard";
          break;
        case "parent":
          dashboardPath = "/parents/dashboard";
          break;
        case "super_admin":
          dashboardPath = "/admin/dashboard";
          break;
        case "student":
          dashboardPath = "/dashboard";
          break;
        default:
          dashboardPath = "/login";
      }

      if (rememberMe) localStorage.setItem("user_email", email);
      else localStorage.removeItem("user_email");

      setSuccess(i18n.language === "yo" ? "Ìwọlé ṣaṣeyọri! A n tọ́ ọ́ lọ sí àpótí iṣẹ́ rẹ." : "Login successful! Redirecting to your dashboard.");
      setLoading(false);
      setTimeout(() => navigate(dashboardPath), 1000);
    } catch (err) {
      console.error("Login error:", err);
      setError(i18n.language === "yo" ? "Aṣiṣe airotẹlẹ kan ṣẹlẹ. Jọwọ tún gbìmọ̀ ṣe." : "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) setError(i18n.language === "yo" ? "Ìwọlé Google kuna: " + error.message : "Google sign-in failed: " + error.message);
    } catch {
      setError(i18n.language === "yo" ? "Aṣiṣe airotẹlẹ kan ṣẹlẹ pẹlu Google sign-in." : "An unexpected error occurred with Google sign-in.");
    }
    setLoading(false);
  };

  const loadingText = i18n.language === "yo" ? "Njẹrisi..." : "Loading...";
  const loginText = i18n.language === "yo" ? "Wọlé" : "Login";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] to-[#1B263B] flex items-center justify-center px-4 relative overflow-hidden pt-20 pb-20">
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

      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 bg-yellow-400 text-[#0A192F] px-3 py-1 rounded shadow hover:scale-105 transition"
        aria-label={i18n.language === "en" ? "Switch language to Yoruba" : "Yi ede pada si Gẹẹsi"}
      >
        {i18n.language === "en" ? "Yoruba" : "English"}
      </button>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-[#112240]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-blue-500"
      >
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-extrabold text-blue-400 mb-6 text-center"
        >
          {t("login.title")}
        </motion.h2>

        {error && <p className="text-red-400 mb-4 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-6" noValidate>
          <FloatingLabelInput
            id="email"
            label={t("login.email")}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
              if (error) setError("");
            }}
            error={emailError}
            disabled={loading}
            autoComplete="email"
          />

          <FloatingLabelInput
            id="password"
            label={t("login.password")}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError("");
              if (error) setError("");
            }}
            error={passwordError}
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            disabled={loading}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between text-sm text-white">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="form-checkbox text-blue-400"
                disabled={loading}
              />
              {t("login.remember")}
            </label>
            <Link to="/forgot-password" className="text-yellow-400 hover:underline" tabIndex={loading ? -1 : 0}>
              {t("login.forgot")}
            </Link>
          </div>

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-2 rounded shadow-lg transition-all border border-yellow-400 flex items-center justify-center gap-2 ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading && <span className="inline-block w-4 h-4 rounded-full bg-yellow-400 animate-pulse" aria-hidden="true" />}
            {loading ? loadingText : loginText}
          </motion.button>
        </form>

        <div className="my-6 text-center text-white">{t("login.or")}</div>

        <motion.button
          whileHover={{ scale: loading ? 1 : 1.05 }}
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`flex items-center justify-center gap-3 w-full font-medium py-2 px-4 rounded shadow-lg border border-blue-400 ${
            loading ? "bg-gray-300 cursor-not-allowed text-gray-600" : "bg-white text-[#0A192F]"
          }`}
        >
          <FcGoogle className="text-xl" /> {t("login.google")}
        </motion.button>
      </motion.div>
    </div>
  );
}
