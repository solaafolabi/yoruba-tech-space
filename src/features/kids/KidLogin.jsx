import React, { useState } from "react";
import supabase from "../../supabaseClient";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ChildrenSignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });
  const [showPassword, setShowPassword] = useState(false);

  function validate() {
    const errs = { email: "", password: "", general: "" };
    if (!email.trim()) errs.email = t("children.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = t("children.invalidEmail");
    if (!password.trim()) errs.password = t("children.passwordRequired");
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({ email: "", password: "", general: "" });

    const validationErrors = validate();
    if (validationErrors.email || validationErrors.password) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !authData?.user) {
        setErrors((prev) => ({ ...prev, general: t("children.signinFailed") }));
        setLoading(false);
        return;
      }

      // Optionally fetch child profile from children table if you want to save extra info locally
      const { data: child, error: childError } = await supabase
        .from("children")
        .select("*")
        .eq("email", email.trim())
        .single();

      if (!childError && child) {
        localStorage.setItem("kidUser", JSON.stringify(child));
      } else {
        // fallback: save minimal info if no child found
        localStorage.setItem("kidUser", JSON.stringify({ email: email.trim() }));
      }

      navigate("/kids/dashboard");
    } catch (e) {
      setErrors((prev) => ({ ...prev, general: t("children.signinFailed") + ": " + e.message }));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] to-[#1B263B] flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-[#112240]/90 backdrop-blur-lg p-10 rounded-3xl shadow-2xl max-w-md w-full border border-blue-600"
      >
        <h1 className="text-4xl font-extrabold text-blue-400 mb-8 text-center">
          {t("children.signinTitle")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Email input */}
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`peer w-full px-5 pt-6 pb-2 rounded bg-[#0A192F] text-white border ${
                errors.email ? "border-red-500" : "border-blue-600"
              } focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition`}
              placeholder=" "
              autoComplete="email"
              disabled={loading}
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
            />
            <label
              htmlFor="email"
              className="absolute left-5 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-3 peer-focus:text-sm peer-focus:text-yellow-400 select-none"
            >
              {t("children.email")}
            </label>
            {errors.email && (
              <p id="email-error" className="text-red-500 mt-1 text-sm font-medium">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`peer w-full px-5 pt-6 pb-2 rounded bg-[#0A192F] text-white border ${
                errors.password ? "border-red-500" : "border-blue-600"
              } focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition`}
              placeholder=" "
              autoComplete="current-password"
              disabled={loading}
              aria-invalid={!!errors.password}
              aria-describedby="password-error"
            />
            <label
              htmlFor="password"
              className="absolute left-5 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-3 peer-focus:text-sm peer-focus:text-yellow-400 select-none"
            >
              {t("children.password")}
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-3 text-yellow-400 text-sm font-semibold focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? t("login.hide") : t("login.show")}
            >
              {showPassword ? t("login.hide") : t("login.show")}
            </button>
            {errors.password && (
              <p id="password-error" className="text-red-500 mt-1 text-sm font-medium">
                {errors.password}
              </p>
            )}
          </div>

          {/* General error message */}
          {errors.general && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-center font-medium"
              role="alert"
            >
              {errors.general}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-500 text-black font-semibold rounded-xl shadow-lg hover:bg-yellow-600 transition disabled:opacity-50 flex justify-center items-center gap-2"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <span>{t("children.signingIn")}</span>
              </>
            ) : (
              t("children.signin")
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
