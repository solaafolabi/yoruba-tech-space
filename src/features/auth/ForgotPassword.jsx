import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { t, i18n } = useTranslation();

  const handleSendLink = async (e) => {
    e.preventDefault();
    setError("");
    setMessage(t("forgot.sending"));

    const API_BASE =
      process.env.REACT_APP_API_BASE || "http://localhost:5000";

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lang: i18n.language,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(t("forgot.success"));
      } else {
        setMessage("");
        setError(data.error || t("forgot.failed"));
      }
    } catch (err) {
      setMessage("");
      setError(`${t("forgot.networkError")} ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] to-[#1B263B] flex items-center justify-center px-4 relative overflow-hidden pt-20 pb-20">
      {/* Background glow */}
      <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-blue-400 opacity-10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-20 left-20 w-[200px] h-[200px] bg-yellow-400 opacity-10 blur-3xl rounded-full"></div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 text-center left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-6 rounded shadow-lg z-50"
        >
          {message}
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-[#112240]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-blue-500"
      >
        <h2 className="text-3xl font-extrabold text-blue-400 mb-6 text-center">
          {t("forgot.title")}
        </h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={handleSendLink} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full px-4 pt-5 pb-2 rounded bg-[#0A192F] text-white border border-blue-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none"
              required
            />
            <label
              className={`absolute left-4 top-2 text-gray-400 text-sm transition-all 
                ${email ? "-translate-y-3 scale-90 text-blue-400" : "translate-y-2"}`}
            >
              {t("forgot.email")}
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow-lg transition-all border border-yellow-400 hover:bg-blue-700"
          >
            {t("forgot.send")}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
