// src/components/ErrorModal.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function ErrorModal({ message, closeModal }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl">
        <h2 className="text-lg font-bold text-red-600 mb-4">{t("modals.warning")}</h2>
        <p className="text-black">{message}</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            {t("modals.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
