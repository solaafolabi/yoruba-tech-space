import React from "react";

/**
 * DeleteQuizModal
 * Props:
 * - isOpen (bool)
 * - quizToDelete ({id, index} or null)
 * - onCancel()
 * - onConfirm()
 * - deleteLoadingId
 * - deleteError
 */
export default function DeleteQuizModal({
  isOpen,
  quizToDelete,
  onCancel,
  onConfirm,
  deleteLoadingId,
  deleteError,
}) {
  if (!isOpen || !quizToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
        <p>Are you sure you want to delete this quiz?</p>

        {deleteError && <p className="text-red-600 mt-2">{deleteError}</p>}

        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onCancel} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleteLoadingId === quizToDelete.id}
            className={`px-4 py-2 rounded text-white ${
              deleteLoadingId === quizToDelete.id ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {deleteLoadingId === quizToDelete.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
