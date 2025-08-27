import React, { useState, useEffect } from "react";
import supabase from "../../supabaseClient";
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
  const [isFocused, setIsFocused] = useState(false);

  // Label stays up if input is focused or has text
  const labelActive = isFocused || (value && value.length > 0);

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=" " // hide native placeholder
        className={`peer block w-full appearance-none border-b-2 bg-transparent px-0 pb-1.5 pt-5 text-white focus:outline-none focus:ring-0 focus:border-yellow-400 transition-colors ${
          error ? "border-red-500" : "border-blue-500"
        }`}
        autoComplete="off"
      />

      <label
        htmlFor={id}
        className={`absolute left-0 transition-all duration-200
          text-gray-400 text-sm select-none cursor-text
          ${
            labelActive
              ? "top-0 text-yellow-400 font-semibold"
              : "top-5 text-gray-400"
          }
        `}
      >
        {label}
      </label>

      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-0 top-1.5 text-yellow-400 font-semibold text-sm select-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      )}

      {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const savedEmail = localStorage.getItem("user_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateFields = () => {
    const errs = {};

    if (!fullName.trim()) {
      errs.fullName =
        i18n.language === "yo" ? "Oruko kikun nilo" : "Full Name is required";
    }

    if (!email.trim()) {
      errs.email = i18n.language === "yo" ? "Imeeli nilo" : "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errs.email = i18n.language === "yo" ? "Imeeli ko ye" : "Invalid email format";
      }
    }

    if (!password) {
      errs.password =
        i18n.language === "yo" ? "Ọrọigbaniwọle nilo" : "Password is required";
    } else {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
      if (!passwordRegex.test(password)) {
        errs.password =
          i18n.language === "yo"
            ? "Ọrọigbaniwọle gbọdọ ni lẹ́tà nla, lẹ́tà kékeré, nọmba kan ati aami pataki kan."
            : "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.";
      }
    }

    if (!confirmPassword) {
      errs.confirmPassword =
        i18n.language === "yo"
          ? "Ìmúdájú Ọrọigbaniwọle nilo"
          : "Confirm Password is required";
    } else if (password !== confirmPassword) {
      errs.confirmPassword =
        i18n.language === "yo"
          ? "Ọrọigbaniwọle ati ìmúdájú rẹ ko baamu."
          : "Password and confirmation do not match.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setErrors({});

    if (!validateFields()) {
      return;
    }

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: "student" } },
      });

      if (signUpError) {
        setError(
          i18n.language === "yo"
            ? "Oti fi Oruko sile tele: " + signUpError.message
            : "Signup error: " + signUpError.message
        );
        return;
      }

      const user = signUpData?.user;
      if (!user) {
        setError(
          i18n.language === "yo"
            ? "Ìforúkọsílẹ̀ ṣaṣeyọri ṣugbọn ko si olumulo to pada."
            : "Signup succeeded but no user returned."
        );
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert([{ id: user.id, full_name: fullName, role: "student" }], {
          onConflict: "id",
        });

      if (upsertError) {
        setError(
          i18n.language === "yo"
            ? "Ìpamọ profaili kuna: " + upsertError.message
            : "Profile save failed: " + upsertError.message
        );
        return;
      }

      const { error: statusError } = await supabase.from("user_status").insert([
        {
          user_id: user.id,
          username: fullName || email,
          is_online: true,
          last_seen: new Date().toISOString(),
        },
      ]);
      if (statusError) {
        setError(
          i18n.language === "yo"
            ? "Ìfọwọ́sí ipo olumulo kuna: " + statusError.message
            : "User status record creation failed: " + statusError.message
        );
        return;
      }

      if (rememberMe) localStorage.setItem("user_email", email);
      else localStorage.removeItem("user_email");

      setSuccess(
        i18n.language === "yo"
          ? "Ìforúkọsílẹ̀ ṣaṣeyọri! Ẹ jọ̀ọ́ ṣàyẹ̀wò imeeli yín fún ìmúdájú."
          : "Signup successful! Please check your email for confirmation."
      );

      setTimeout(() => navigate("/admission"), 1500);
    } catch (error) {
      setError(
        error.message || (i18n.language === "yo" ? "Aṣiṣe kan ṣẹlẹ." : "An error occurred.")
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] to-[#1B263B] flex flex-col items-center justify-center px-4 relative pt-20 pb-24">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative z-10 bg-[#112240]/90 backdrop-blur-lg p-6 rounded-2xl shadow-2xl max-w-md w-full border border-blue-500"
      >
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-extrabold text-blue-400 mb-5 text-center"
        >
          {t("signup.title")}
        </motion.h2>
        {error && <p className="text-red-400 mb-3">{error}</p>}

        <form onSubmit={handleSignup} className="space-y-5">
          <FloatingLabelInput
            id="fullName"
            label={t("signup.fullName")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
          />

          <FloatingLabelInput
            id="email"
            label={t("signup.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <FloatingLabelInput
            id="password"
            label={t("signup.password")}
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
            label={t("signup.confirmPassword")}
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />

          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="form-checkbox text-blue-400"
            />
            {t("signup.remember")}
          </label>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow-lg transition-all border border-yellow-400 hover:bg-blue-700"
          >
            {t("signup.signup")}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
