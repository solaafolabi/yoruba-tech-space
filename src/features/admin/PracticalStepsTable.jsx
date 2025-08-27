import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";



export default function PracticalStepsTable({ refreshKey, onEdit }) {
  const [steps, setSteps] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStep, setSelectedStep] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    const fetchSteps = async () => {
      const { data, error } = await supabase
        .from("practical_steps")
        .select(`
          id,
          step_number,
          instruction,
          lesson_type,
          validation_rules,
          lessons(id, title, modules(id, title, courses(id, name)))
        `)
        .order("step_number", { ascending: true });

      if (error) console.error(error);
      else setSteps(data);
    };
    fetchSteps();
  }, [refreshKey]);

  const filteredSteps = steps.filter((step) =>
    step.instruction.toLowerCase().includes(search.toLowerCase()) ||
    step.lessons?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedSteps = filteredSteps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredSteps.length / itemsPerPage);

  const handleDelete = async () => {
    if (!selectedStep) return;
    const { error } = await supabase
      .from("practical_steps")
      .delete()
      .eq("id", selectedStep.id);

    if (error) console.error(error);
    else {
      setSteps((prev) => prev.filter((s) => s.id !== selectedStep.id));
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="mt-10 px-2 sm:px-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-xl font-bold text-yellow-400">📋 Practical Steps</h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Instruction or Lesson..."
          className="p-2 border rounded bg-white dark:bg-gray-800 w-full sm:w-auto"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded border border-yellow-500">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#1B263B] text-yellow-400">
            <tr>
              <th className="px-4 py-2 text-left">Course</th>
              <th className="px-4 py-2 text-left">Module</th>
              <th className="px-4 py-2 text-left">Lesson</th>
              <th className="px-4 py-2 text-left">Step #</th>
              <th className="px-4 py-2 text-left">Instruction</th>
              <th className="px-4 py-2 text-left">Lesson Types</th>
              <th className="px-4 py-2 text-left">Validation Rules</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[#0D1B2A] divide-y divide-gray-700 text-white">
            {paginatedSteps.map((step, index) => (
              <tr
                key={step.id}
                className={index % 2 === 0 ? "bg-[#0D1B2A]" : "bg-[#11263C]"}
              >
                <td className="px-4 py-2">{step.lessons?.modules?.courses?.name || "-"}</td>
                <td className="px-4 py-2">{step.lessons?.modules?.title || "-"}</td>
                <td className="px-4 py-2">{step.lessons?.title || "-"}</td>
                <td className="px-4 py-2">{step.step_number}</td>
                <td className="px-4 py-2 break-words max-w-xs">{step.instruction}</td>
                <td className="px-4 py-2">{step.lesson_type}</td>
                <td className="px-4 py-2">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(step.validation_rules, null, 2)}
                  </pre>
                </td>
                <td className="px-4 py-2 flex gap-3">
                  <button
                    onClick={() => onEdit(step)}
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStep(step);
                      setDeleteConfirmOpen(true);
                    }}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedSteps.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-400">
                  No practical steps found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {paginatedSteps.map((step) => (
          <div
            key={step.id}
            className="bg-[#1B263B] border border-yellow-500 rounded-lg p-4 text-white shadow-sm"
          >
            <div className="text-sm text-yellow-300 font-semibold mb-2">
              Step #{step.step_number}
            </div>
            <p><strong>Course:</strong> {step.lessons?.modules?.courses?.name || "-"}</p>
            <p><strong>Module:</strong> {step.lessons?.modules?.title || "-"}</p>
            <p><strong>Lesson:</strong> {step.lessons?.title || "-"}</p>
            <p><strong>Instruction:</strong> {step.instruction}</p>
            <p><strong>Lesson Type:</strong> {step.lesson_type}</p>
            <p><strong>Validation:</strong></p>
            <pre className="whitespace-pre-wrap text-xs text-gray-300">
              {JSON.stringify(step.validation_rules, null, 2)}
            </pre>
            <div className="mt-3 flex gap-4">
              <button
                onClick={() => onEdit(step)}
                className="text-yellow-400 hover:text-yellow-300"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => {
                  setSelectedStep(step);
                  setDeleteConfirmOpen(true);
                }}
                className="text-red-500 hover:text-red-400"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {paginatedSteps.length === 0 && (
          <div className="text-center text-gray-400">No practical steps found.</div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center items-center gap-2 flex-wrap">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`px-4 py-1 rounded font-bold text-sm transition-all border border-yellow-400 hover:bg-yellow-500 hover:text-black ${
              currentPage === i + 1
                ? "bg-yellow-400 text-black"
                : "bg-transparent text-yellow-300"
            }`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#1B263B] border border-yellow-400 rounded-xl p-6 max-w-md w-full text-white">
            <h3 className="text-lg font-bold mb-4">⚠️ Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete Step #{selectedStep?.step_number}?
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
