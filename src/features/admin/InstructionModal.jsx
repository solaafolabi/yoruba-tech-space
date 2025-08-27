// src/pages/admin/InstructionModal.jsx
import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import { toast } from "react-toastify";

export default function InstructionModal({ onClose }) {
  const [englishCourses, setEnglishCourses] = useState([]);
  const [yorubaCourses, setYorubaCourses] = useState([]);
  const [selectedEnCourse, setSelectedEnCourse] = useState("");
  const [selectedYoCourse, setSelectedYoCourse] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleYo, setTitleYo] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionYo, setDescriptionYo] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedEnCourse) fetchInstructions(selectedEnCourse);
  }, [selectedEnCourse]);

  async function fetchCourses() {
    try {
      const { data: courses, error } = await supabase
        .from("courses")
        .select("id, title_en, title_yo")
        .order("title_en", { ascending: true });

      if (error) throw error;

      setEnglishCourses(courses);
      setYorubaCourses(courses);
    } catch (err) {
      console.error("Fetch courses error:", err);
      toast.error("Failed to load courses");
    }
  }

  async function fetchInstructions(courseId) {
    try {
      const { data, error } = await supabase
        .from("final_projects")
        .select("*")
        .eq("course_id", courseId);

      if (error) throw error;
      setInstructions(data || []);
    } catch (err) {
      console.error("Fetch instructions error:", err);
      toast.error("Failed to load instructions");
    }
  }

  async function handleSave() {
    if (!selectedEnCourse || !titleEn) {
      toast.error("English course and title are required");
      return;
    }

    setLoading(true);

    try {
      const safeUrl = referenceUrl
        ? referenceUrl.startsWith("http")
          ? referenceUrl
          : `https://${referenceUrl}`
        : "";

      if (editingId) {
        // --- EDIT MODE ---
        const { error } = await supabase
          .from("final_projects")
          .update({
            title_en: titleEn,
            title_yo: titleYo,
            description_en: descriptionEn,
            description_yo: descriptionYo,
            reference_url: safeUrl,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Instruction updated!");
      } else {
        // --- NEW INSERT MODE ---
        const rowsToInsert = [
          {
            course_id: selectedEnCourse,
            repo_url: "",
            status: "pending",
            title_en: titleEn || "",
            title_yo: titleYo || "",
            description_en: descriptionEn || "",
            description_yo: descriptionYo || "",
            reference_url: safeUrl,
          },
        ];

        if (selectedYoCourse) {
          rowsToInsert.push({
            course_id: selectedYoCourse,
            repo_url: "",
            status: "pending",
            title_en: titleEn || "",
            title_yo: titleYo || "",
            description_en: descriptionEn || "",
            description_yo: descriptionYo || "",
            reference_url: safeUrl,
          });
        }

        const { error } = await supabase
          .from("final_projects")
          .insert(rowsToInsert);

        if (error) throw error;
        toast.success("Instruction added!");
      }

      resetForm();
      fetchInstructions(selectedEnCourse);
    } catch (err) {
      console.error("Save instruction error:", err);
      toast.error(`Failed to save instruction: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      const { error } = await supabase
        .from("final_projects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Instruction deleted!");
      fetchInstructions(selectedEnCourse);
    } catch (err) {
      console.error("Delete instruction error:", err);
      toast.error(`Failed to delete instruction: ${err.message}`);
    }
  }

  function handleEdit(instruction) {
    setEditingId(instruction.id);
    setTitleEn(instruction.title_en || "");
    setTitleYo(instruction.title_yo || "");
    setDescriptionEn(instruction.description_en || "");
    setDescriptionYo(instruction.description_yo || "");
    setReferenceUrl(instruction.reference_url || "");
    setSelectedEnCourse(instruction.course_id);
    // ⚠ if Yoruba course is paired separately, you can also setSelectedYoCourse here if needed
  }

  function resetForm() {
    setEditingId(null);
    setTitleEn("");
    setTitleYo("");
    setDescriptionEn("");
    setDescriptionYo("");
    setReferenceUrl("");
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A192F] p-6 rounded-lg w-full max-w-lg text-white overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">
          {editingId ? "Edit Final Project Instruction" : "Add Final Project Instruction"}
        </h2>

        {/* English Course */}
        <label className="block mb-2">
          Select English Course
          <select
            value={selectedEnCourse}
            onChange={(e) => setSelectedEnCourse(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1B2A] border border-gray-600 mb-2 text-white"
          >
            <option value="">-- Select English Course --</option>
            {englishCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title_en}
              </option>
            ))}
          </select>
        </label>

        {/* Yoruba Course */}
        <label className="block mb-2">
          Select Yoruba Course
          <select
            value={selectedYoCourse}
            onChange={(e) => setSelectedYoCourse(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1B2A] border border-gray-600 mb-2 text-white"
          >
            <option value="">-- Select Yoruba Course --</option>
            {yorubaCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title_yo}
              </option>
            ))}
          </select>
        </label>

        {/* Title & Description */}
        <label className="block mb-2">
          Title (EN)
          <input
            type="text"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1B2A] border border-gray-600 mb-2 text-white"
          />
        </label>

        <label className="block mb-2">
          Title (YO)
          <input
            type="text"
            value={titleYo}
            onChange={(e) => setTitleYo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1B2A] border border-gray-600 mb-2 text-white"
          />
        </label>

        <label className="block mb-2">
          Description (EN)
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1B2A] border border-gray-600 mb-2 text-white"
          />
        </label>

        <label className="block mb-2">
          Description (YO)
          <textarea
            value={descriptionYo}
            onChange={(e) => setDescriptionYo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1B2A] border border-gray-600 mb-2 text-white"
          />
        </label>

        <label className="block mb-4">
          Reference URL
          <input
            type="text"
            value={referenceUrl}
            onChange={(e) => setReferenceUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1B2A] border border-gray-600 mb-2 text-white"
          />
        </label>

        <div className="flex justify-end gap-2 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            {loading ? "Saving..." : editingId ? "Update" : "Save"}
          </button>
        </div>

        {/* Existing Instructions */}
        {instructions.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold mb-2">Existing Instructions</h3>
            <ul className="space-y-2 max-h-[200px] overflow-y-auto">
              {instructions.map((inst) => (
                <li
                  key={inst.id}
                  className="bg-[#0D1B2A] p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{inst.title_en}</p>
                    <p className="text-gray-400 text-sm">
                      {inst.description_en}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(inst)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(inst.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
