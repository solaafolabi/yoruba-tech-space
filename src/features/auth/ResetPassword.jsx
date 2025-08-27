// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const location = useLocation();
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const resetToken = queryParams.get("token");
    if (resetToken) setToken(resetToken);
  }, [location]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError(t("reset.weakPassword"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("reset.mismatch"));
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setSuccess(t("reset.success"));
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.error || t("reset.failed"));
      }
    } catch (err) {
      setLoading(false);
      setError(t("reset.networkError") + ": " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] to-[#1B263B] flex items-center justify-center px-4 relative overflow-hidden pt-20 pb-20">
      {/* Background glow effects */}
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
        className="bg-[#112240]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-blue-500"
      >
        <h2 className="text-3xl font-extrabold text-blue-400 mb-6 text-center">
          {t("reset.title")}
        </h2>
        {error && <p className="text-red-400 mb-4 text-sm text-center">{error}</p>}

        <form onSubmit={handleReset} className="space-y-6">
          {/* New Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="peer w-full px-4 pt-5 pb-2 rounded bg-[#0A192F] text-white border border-blue-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none"
              required
            />
            <label
              className={`absolute left-4 top-2 text-gray-400 text-sm transition-all 
                ${newPassword ? "-translate-y-3 scale-90 text-blue-400" : "translate-y-2"}`}
            >
              {t("reset.newPassword")}
            </label>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="peer w-full px-4 pt-5 pb-2 rounded bg-[#0A192F] text-white border border-blue-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none"
              required
            />
            <label
              className={`absolute left-4 top-2 text-gray-400 text-sm transition-all 
                ${confirmPassword ? "-translate-y-3 scale-90 text-blue-400" : "translate-y-2"}`}
            >
              {t("reset.confirmPassword")}
            </label>
          </div>

          {/* Toggle Show Password */}
          <div className="text-sm text-white text-right">
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-yellow-400 hover:underline"
            >
              {showPassword ? t("reset.hide") : t("reset.show")}
            </button>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow-lg transition-all border border-yellow-400 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("reset.loading") : t("reset.reset")}
          </motion.button>
        </form>

        {/* Back to Login */}
        <p className="text-sm text-center text-white mt-4">
          <a href="/login" className="underline text-yellow-400 hover:text-yellow-300">
            {t("reset.backToLogin")}
          </a>
        </p>
      </motion.div>
    </div>
  );
}
