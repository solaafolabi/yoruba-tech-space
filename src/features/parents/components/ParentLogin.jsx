import React, { useState } from "react";
import supabase from "../../../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function ParentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const clearErrors = () => {
    setErrorEmail("");
    setErrorPassword("");
    setGeneralError("");
  };

  async function handleLogin(e) {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    let hasError = false;

    if (!email.trim()) {
      setErrorEmail(i18n.language === "yo" ? "Imeeli jẹ dandan." : "Email is required.");
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorEmail(i18n.language === "yo" ? "Imeeli ko ni fọọmat to tọ." : "Email format is invalid.");
      hasError = true;
    }

    if (!password) {
      setErrorPassword(i18n.language === "yo" ? "Ọrọigbaniwọle jẹ dandan." : "Password is required.");
      hasError = true;
    }

    if (hasError) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userMetadata = data.user.user_metadata;

      if (userMetadata?.role === "parent") {
        navigate("/parents/dashboard");
      } else {
        setGeneralError(t("parentLogin.errors.invalidCredentials"));
      }
    } catch (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("invalid login credentials")) {
        setGeneralError(t("parentLogin.errors.invalidCredentials"));
      } else if (msg.includes("network error")) {
        setGeneralError(t("parentLogin.errors.networkError"));
      } else if (msg.includes("required") || msg.includes("missing")) {
        setGeneralError(t("parentLogin.errors.requiredField"));
      } else {
        setGeneralError(t("parentLogin.errors.invalidCredentials"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] to-[#1B263B] flex items-center justify-center px-4 pt-20 pb-20 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-blue-400 opacity-10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-20 left-20 w-[200px] h-[200px] bg-yellow-400 opacity-10 blur-3xl rounded-full"></div>

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
          {t("parentLogin.title")}
        </motion.h2>

        {generalError && (
          <p className="text-red-400 mb-4 text-center">{generalError}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-6" noValidate>
          {/* Email */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`peer w-full px-4 pt-5 pb-2 rounded bg-[#0A192F] text-white border ${
                errorEmail ? "border-red-500" : "border-blue-500"
              } focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none`}
              aria-describedby="error-email"
              required
            />
            <label
              className={`absolute left-4 top-2 text-gray-400 text-sm transition-all ${
                email ? "-translate-y-3 scale-90 text-blue-400" : "translate-y-1/2"
              }`}
            >
              {t("parentLogin.parentEmail")}
            </label>
            {errorEmail && (
              <p
                id="error-email"
                className="mt-1 text-xs text-red-400"
                role="alert"
              >
                {errorEmail}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`peer w-full px-4 pt-5 pb-2 rounded bg-[#0A192F] text-white border ${
                errorPassword ? "border-red-500" : "border-blue-500"
              } focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none`}
              aria-describedby="error-password"
              required
            />
            <label
              className={`absolute left-4 top-2 text-gray-400 text-sm transition-all ${
                password ? "-translate-y-3 scale-90 text-blue-400" : "translate-y-1/2"
              }`}
            >
              {t("parentLogin.password")}
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-sm text-yellow-400"
            >
              {showPassword ? t("parentLogin.hide") : t("parentLogin.show")}
            </button>
            {errorPassword && (
              <p
                id="error-password"
                className="mt-1 text-xs text-red-400"
                role="alert"
              >
                {errorPassword}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center text-blue-400 text-sm">
            <Link to="/forgot-password" className="text-yellow-400 hover:underline">
              {t("parentLogin.forgot.link")}
            </Link>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow-lg transition-all border border-yellow-400 hover:bg-blue-700"
          >
            {loading ? t("parentLogin.loading") : t("parentLogin.login")}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
