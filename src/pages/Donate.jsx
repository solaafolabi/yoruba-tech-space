
import React, { useState, useEffect } from "react";
import { PaystackButton } from "react-paystack";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import supabase from "../supabaseClient";

const DonationPage = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.language; // 'en' or 'yo'

  const presetAmounts = [10000, 20000, 50000, 100000];

  const [publicKey, setPublicKey] = useState("");
  const [amount, setAmount] = useState(2000);
  const [customAmount, setCustomAmount] = useState("2000");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [loadingKey, setLoadingKey] = useState(true);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [proofFile, setProofFile] = useState(null);
  const [donationMethod, setDonationMethod] = useState(null);

  const finalAmount = parseInt(customAmount || amount) * 100;

  // 🔑 Fetch Paystack public key
  useEffect(() => {
    const fetchPaystackKey = async () => {
      setLoadingKey(true);
      const { data, error } = await supabase
        .from("payment_keys")
        .select("key_value")
        .eq("service", "paystack")
        .eq("key_name", "public_key")
        .single();

      if (!error && data?.key_value) setPublicKey(data.key_value);
      setLoadingKey(false);
    };
    fetchPaystackKey();
  }, []);

  // 🏦 Fetch bank accounts
  useEffect(() => {
    const fetchBankAccounts = async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .order("id", { ascending: true });
      if (!error && data) setBankAccounts(data);
    };
    fetchBankAccounts();
  }, []);

  const handlePresetClick = (amt) => {
    setAmount(amt);
    setCustomAmount(amt.toString());
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomAmount(val);
    setAmount(parseInt(val) || 0);
  };

  // ✅ Handle Paystack success
  const handlePaymentSuccess = async (reference) => {
    try {
      const res = await fetch(
        "https://bqfdfhhscubymyycyoqe.functions.supabase.co/verify-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ reference }),
        }
      );

      const result = await res.json();

      if (result?.data?.status === "success") {
        setDonationMethod("paystack");
        setShowThankYou(true);

        await supabase.from("donations").insert([
          {
            reference,
            amount: parseInt(customAmount) || 0,
            currency: "NGN",
            donor_name: anonymous ? "Anonymous" : null,
            email: anonymous ? null : email,
            method: "paystack",
            type: "card",
            status: "success",
          },
        ]);
      } else {
        alert(t("donation.paymentFailed"));
      }
    } catch (err) {
      console.error("❌ Payment verification error:", err);
      alert(t("donation.paymentError"));
    }
  };

  // ✅ Handle Bank proof upload (no login required)
  const handleBankProofSubmit = async () => {
    if (!proofFile) return alert(t("donation.proofRequired"));

    try {
      const fileExt = proofFile.name.split(".").pop();
      const fileName = `proofs/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("donation_proofs")
        .upload(fileName, proofFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("donation_proofs")
        .getPublicUrl(fileName);

      const proofUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase.from("donations").insert([
        {
          reference: `BANK-${Date.now()}`,
          amount: parseInt(customAmount) || 0,
          currency: "NGN",
          donor_name: anonymous ? "Anonymous" : null,
          email: anonymous ? null : email,
          method: "bank",
          type: "bank",
          status: "pending",
          proof_url: proofUrl,
        },
      ]);

      if (insertError) throw insertError;

      setDonationMethod("bank");
      setShowThankYou(true);
      setProofFile(null);
    } catch (err) {
      console.error("❌ Error uploading bank proof:", err.message);
      alert(t("donation.proofError"));
    }
  };

  // Paystack props
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
    onSuccess: (response) => handlePaymentSuccess(response.reference),
    onClose: () => console.log("Donation closed"),
  };

  return (
    <div className="min-h-screen bg-[#1B263B] text-white px-4 py-16 pt-[100px] flex justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl w-full">
        {/* LEFT: Message */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#0D1B2A] rounded-2xl shadow-xl p-8 flex flex-col justify-center border border-yellow-600"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-500 mb-4">
            {t("donation.title")}
          </h1>
          <p className="text-lg text-gray-200 mb-4">{t("donation.englishMsg")}</p>
          <p className="text-lg text-gray-400 italic">{t("donation.yorubaMsg")}</p>
          <div className="mt-6 text-yellow-500 font-semibold">
            {t("donation.impact")}
          </div>
        </motion.div>

        {/* RIGHT: Payment */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#0D1B2A] rounded-2xl shadow-xl p-8 border border-yellow-600"
        >
          <h2 className="text-2xl font-bold text-yellow-500 mb-6">
            {t("donation.confirmTitle")}
          </h2>

          {/* Preset Amount */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => handlePresetClick(amt)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  amt.toString() === customAmount
                    ? "bg-yellow-600 text-black border border-yellow-500"
                    : "bg-[#1B263B] hover:bg-yellow-600 hover:text-black"
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
            onChange={handleCustomChange}
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

          {/* Anonymous */}
          <label className="mb-6 text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={() => setAnonymous(!anonymous)}
            />
            {t("donation.anonymous")}
          </label>

          {/* Paystack Button */}
          {loadingKey ? (
            <p className="text-gray-400">Loading payment...</p>
          ) : publicKey ? (
            <PaystackButton
              {...componentProps}
              className="w-full px-6 py-3 bg-yellow-600 text-[#1B263B] rounded-xl font-bold hover:bg-yellow-300 transition-all"
            />
          ) : (
            <p className="text-red-500">{t("donation.keyMissing")}</p>
          )}

        {/* Direct Bank Accounts */}
<div className="mt-6 p-4 rounded-xl bg-[#12213a] border border-yellow-500">
  <h3 className="text-yellow-500 font-bold mb-2">
    {t("donation.directBank")}
  </h3>

  {bankAccounts.length === 0 ? (
    <p className="text-gray-400">{t("donation.noBankAccounts")}</p>
  ) : (
    bankAccounts.map((acc) => (
      <div key={acc.id} className="mb-6 text-gray-300">
        <p>
          <span className="font-semibold">{t("donation.bankName")}: </span>
          {acc.bank_name}
        </p>
        <p>
          <span className="font-semibold">{t("donation.accountName")}: </span>
          {acc.account_name}
        </p>
        <p>
          <span className="font-semibold">{t("donation.accountNumber")}: </span>
          {acc.account_number}
        </p>

        <p className="text-sm italic mt-2">{t("donation.proofMsg")}</p>

        {/* Proof Upload */}
        <div className="mt-2">
          <label className="block">
            <div className="mt-2 text-black p-1 rounded w-full bg-white border cursor-pointer">
              {proofFile ? (
                <span>
                  {t("donation.selectedFile")}: {proofFile.name}
                </span>
              ) : (
                <span>{t("donation.noFile")}</span>
              )}
            </div>

            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setProofFile(e.target.files[0])}
              className="hidden"
            />
          </label>

          <button
            onClick={handleBankProofSubmit}
            className="mt-2 px-4 py-2 bg-yellow-600 text-black rounded hover:bg-yellow-400 font-bold"
          >
            {t("donation.submitProof")}
          </button>
        </div>
      </div>
    ))
  )}
</div>

          

          {/* Thank You */}
          {showThankYou && (
            <div className="mt-6 bg-green-600 p-4 rounded-xl text-white text-center animate-pulse">
              <h2 className="text-2xl font-bold mb-2">
                🎉 {t("donation.thank_title")}
              </h2>
              <p>
                {t("donation.thank_msg")}{" "}
                {donationMethod === "paystack"
                  ? `(${t("donation.paystack")})`
                  : `(${t("donation.bank")})`}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DonationPage;