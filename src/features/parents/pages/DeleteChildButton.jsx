// src/pages/parents/DeleteChildButton.jsx
import React from "react";
import supabase from "../../../supabaseClient";
import { useTranslation } from "react-i18next";

export default function DeleteChildButton({ childId, onChildDeleted }) {
  const { t } = useTranslation();

  const handleDelete = async () => {
    if (!window.confirm(t("confirmDelete") || "Are you sure?")) return;

    const { error } = await supabase
      .from("children")
      .delete()
      .eq("id", childId);

    if (error) {
      console.error("Delete failed:", error.message);
      alert(t("deleteError") || "Failed to delete child");
      return;
    }

    if (onChildDeleted) {
      onChildDeleted();
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-500 hover:underline">
      {t("delete")}
    </button>
  );
}
