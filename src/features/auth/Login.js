// Login.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ReCAPTCHA from "react-google-recaptcha";
import { createClient } from "@supabase/supabase-js";

const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
const SUPABASE_FUNCTION_URL =
  "https://bqfdfhhscubymyycyoqe.functions.supabase.co/verify-login";
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        className={`peer block w-full appearance-none border-b-2 bg-transparent px-0 pb-1.5 pt-5 text-white focus:outline-none focus:ring-0 transition-colors ${
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
            ? "top-0 text-yellow-500 text-sm font-semibold"
            : "top-5 text-gray-400 text-base font-normal peer-placeholder-shown:text-gray-500"
        }`}
      >
        {label}
      </label>
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-0 top-1.5 text-yellow-500 font-semibold text-sm select-none"
          aria-label={showPassword ? "hide" : "show"}
          disabled={disabled}
        >
          {showPassword ? "👁️" : "🙈"}
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
  const [captchaValue, setCaptchaValue] = useState(null);

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
    setError("");

    if (!email.trim()) {
      setEmailError(t("login.errors.emailRequired"));
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError(t("login.errors.emailInvalid"));
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError(t("login.errors.passwordRequired"));
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(t("login.errors.passwordShort"));
      valid = false;
    }

    if (!captchaValue) {
      setError(t("login.errors.captcha"));
      valid = false;
    }

    return valid;
  };

  const callLoginAPI = async (body) => {
  try {
    const res = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log("Raw function response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { error: "Invalid JSON from server" };
    }

    if (!res.ok) {
      console.error("Function HTTP error:", res.status, res.statusText);

      if (res.status === 429) {
        return { error: "Too many login attempts. Please wait a minute." };
      }
      if (res.status === 401) {
        return { error: "Invalid email or password" };
      }

      return { error: data.error || `Server returned ${res.status}` };
    }

    console.log("Parsed function response:", data);
    return data;
  } catch (err) {
    console.error("Login API error:", err);
    return { error: "Network or function error" };
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

  const payload = { provider: "password", email, password, captchaToken: captchaValue };
  const data = await callLoginAPI(payload);

  if (data.error) {
    setError(data.error);
    setLoading(false);
    return;
  }

  // ✅ Set session in Supabase client
  if (data.session) {
    const { access_token, refresh_token } = data.session;
    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sessionError) {
      setError(sessionError.message);
      setLoading(false);
      return;
    }
  }

  if (rememberMe) localStorage.setItem("user_email", email);
  else localStorage.removeItem("user_email");

  setSuccess(t("login.success"));
  setLoading(false);

  if (data.url) navigate(data.url);
};


  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    const payload = { provider: "google", captchaToken: captchaValue };
    const data = await callLoginAPI(payload);

    if (data.error) setError(data.error);
    else if (data.url) window.location.href = data.url;

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] to-[#1B263B] flex items-center justify-center px-4 relative overflow-hidden pt-20 pb-20">
      {/* Background circles */}
      <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-blue-400 opacity-10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-20 left-20 w-[200px] h-[200px] bg-yellow-600 opacity-10 blur-3xl rounded-full"></div>

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
      >
        {i18n.language === "en" ? "Yoruba" : "English"}
      </button>

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
            <Link
              to="/forgot-password"
              className="text-yellow-500 hover:underline"
              tabIndex={loading ? -1 : 0}
            >
              {t("login.forgot")}
            </Link>
          </div>

          <ReCAPTCHA
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={setCaptchaValue}
            theme="dark"
          />

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-2 rounded shadow-lg transition-all border border-yellow-600 flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-yellow-500 hover:bg-blue-700"
            }`}
          >
            {loading && (
              <span
                className="inline-block w-4 h-4 rounded-full bg-yellow-500 animate-pulse"
                aria-hidden="true"
              />
            )}
            {loading ? t("login.loading") : t("login.button")}
          </motion.button>
        </form>

        <div className="my-6 text-center text-yellow-500">{t("login.or")}</div>

        <motion.button
          whileHover={{ scale: loading ? 1 : 1.05 }}
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`flex items-center justify-center gap-3 w-full font-medium py-2 px-4 rounded shadow-lg border border-blue-400 ${
            loading
              ? "bg-gray-300 cursor-not-allowed text-gray-600"
              : "bg-white text-[#0A192F]"
          }`}
        >
          <FcGoogle className="text-xl" /> {t("login.google")}
        </motion.button>
      </motion.div>
    </div>
  );
}
