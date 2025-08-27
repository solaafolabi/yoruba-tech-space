import React, { useState } from "react";
import { PaystackButton } from "react-paystack";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const DonationPage = () => {
  const { t } = useTranslation();

  const publicKey =
    process.env.REACT_APP_PAYSTACK_PUBLIC_KEY ||
    "pk_test_dc43840a422abddb07b49a176ed8028c273e40d9";

  const [amount, setAmount] = useState(2000);
  const [customAmount, setCustomAmount] = useState("");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const finalAmount = customAmount
    ? parseInt(customAmount) * 100
    : amount * 100;

  const componentProps = {
    email: email || "donate@yorubatechspace.org",
    amount: finalAmount,
    metadata: {
      custom_fields: [
        {
          display_name: "Anonymous",
          variable_name: "anonymous_donor",
          value: anonymous ? "Yes" : "No",
        },
      ],
    },
    publicKey,
    text: t("donation.button"),
    onSuccess: () => setShowThankYou(true),
    onClose: () => console.log("Donation closed"),
  };

  return (
    <div className="min-h-screen bg-[#1B263B] text-white px-4 py-16 pt-[100px] flex justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl w-full">
        {/* LEFT: Captivating Message */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#0D1B2A] rounded-2xl shadow-xl p-8 flex flex-col justify-center border border-[#FFD700]"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-[#FFD700] mb-4">
            {t("donation.title")}
          </h1>
          <p className="text-lg text-gray-200 mb-4">{t("donation.englishMsg")}</p>
          <p className="text-lg text-gray-400 italic">{t("donation.yorubaMsg")}</p>
          <div className="mt-6 text-[#FFD700] font-semibold">
            {t("donation.impact")}
          </div>
        </motion.div>

        {/* RIGHT: Payment Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#0D1B2A] rounded-2xl shadow-xl p-8 border border-[#FFD700]"
        >
          <h2 className="text-2xl font-bold text-[#FFD700] mb-6">
            {t("donation.confirmTitle")}
          </h2>

          {/* Preset Amount Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[1000, 2000, 5000, 10000].map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setAmount(amt);
                  setCustomAmount("");
                }}
                className={`px-4 py-2 rounded-xl font-semibold bg-[#1B263B] hover:bg-[#FFD700] hover:text-black transition ${
                  amount === amt && !customAmount
                    ? "border border-[#FFD700]"
                    : ""
                }`}
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <input
            type="number"
            placeholder={t("donation.custom")}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="mb-4 px-4 py-2 rounded w-full bg-[#1B263B] text-white placeholder-gray-400"
          />

          {/* Email */}
          <input
            type="email"
            placeholder={t("donation.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 px-4 py-2 rounded w-full bg-[#1B263B] text-white placeholder-gray-400"
          />

          {/* Anonymous checkbox */}
          <label className="mb-6 text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={() => setAnonymous(!anonymous)}
            />
            {t("donation.anonymous")}
          </label>

          {/* Paystack Button */}
          <PaystackButton
            {...componentProps}
            className="w-full px-6 py-3 bg-[#FFD700] text-[#1B263B] rounded-xl font-bold hover:bg-yellow-300"
          />

          {/* Thank You Message */}
          {showThankYou && (
            <div className="mt-6 bg-green-600 p-4 rounded-xl text-white text-center animate-pulse">
              <h2 className="text-2xl font-bold mb-2">
                🎉 {t("donation.thank_title")}
              </h2>
              <p>{t("donation.thank_msg")}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DonationPage;
