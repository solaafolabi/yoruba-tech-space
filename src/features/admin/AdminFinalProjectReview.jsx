// src/pages/admin/AdminFinalProjectReview.jsx
import React, { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import AdminLayout from "../../features/admin/layout/AdminLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InstructionModal from "./InstructionModal";
import { sendNotification } from "../../helpers/notifications";

export default function AdminFinalProjectReview() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({});
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [page, search]);

  async function fetchProjects() {
    setLoading(true);
    try {
      let query = supabase
        .from("final_projects")
        .select(`
          id,
          user_id,
          course_id,
          repo_url,
          status,
          feedback_en,
          feedback_yo,
          practical_score,
          submitted_at
        `)
        .not("user_id", "is", null)
        .order("submitted_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) query = query.ilike("repo_url", `%${search}%`);

      const { data: projectsData, error } = await query;
      if (error) throw error;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      const userIds = projectsData.map((p) => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const formatted = projectsData.map((p) => ({
        ...p,
        full_name:
          profiles.find((prof) => prof.id === p.user_id)?.full_name ||
          `Student ID: ${p.user_id}`,
      }));

      setProjects(formatted);
    } catch (err) {
      console.error("Fetch projects error:", err);
      toast.error("Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Updated: approve/reject without deleting projects, sends notifications
  async function updateStatus(id, status, userId) {
    setUpdating(id);
    try {
      const { error: updateError } = await supabase
        .from("final_projects")
        .update({
          status,
          feedback_en: feedback[id]?.en ?? null,
          feedback_yo: feedback[id]?.yo ?? null,
          practical_score: feedback[id]?.score ?? null,
        })
        .eq("id", id);
      if (updateError) throw updateError;

      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === id
            ? {
                ...proj,
                status,
                feedback_en: feedback[id]?.en ?? proj.feedback_en,
                feedback_yo: feedback[id]?.yo ?? proj.feedback_yo,
                practical_score: feedback[id]?.score ?? proj.practical_score,
              }
            : proj
        )
      );

      const msg =
        status === "approved"
          ? {
              title_en: "Project Approved",
              title_yo: "Ìṣẹ́ agbẹ́yẹ̀wò ti fọwọ́si",
              message_en:
                "🎉 Congratulations! Your final project has been approved.",
              message_yo: "🎉 Ẹ ku oriire! Ìṣẹ́ agbẹ́yẹ̀wò yín ti fọwọ́si.",
            }
          : {
              title_en: "Project Rejected",
              title_yo: "Ìṣẹ́ agbẹ́yẹ̀wò kọ́",
              message_en:
                "❌ Your project was rejected. Please resubmit.",
              message_yo:
                "❌ Ìṣẹ́ agbẹ́yẹ̀wò yín kọ́. Ẹ̀ jọ̀wọ́ tún ránṣẹ́.",
            };

      await sendNotification({
        user_id: userId,
        ...msg,
        type: "system",
        link: `/student/final-project/${id}`,
      });

      toast[status === "approved" ? "success" : "error"](
        status === "approved"
          ? "✅ Project approved. Student notified."
          : "❌ Project rejected. Student notified."
      );
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Action failed!");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <AdminLayout>
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-2xl font-bold mb-6 text-yellow-400">
        Final Project Review
      </h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by repo URL..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 w-full md:w-1/3 rounded-lg bg-[#0A192F] border border-gray-600 text-white"
      />

      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
      >
        Add Global Instruction
      </button>

      {loading ? (
        <p className="text-gray-400">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-400">No submissions yet.</p>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-[#0D1B2A] rounded-lg border border-gray-700"
              >
                <p className="text-yellow-400 font-bold">{p.full_name}</p>
                <p className="text-gray-300 text-sm">Course: {p.course_id}</p>
                <a
                  href={p.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline break-all"
                >
                  View Repo
                </a>
                <p className="mt-2">
                  Status:{" "}
                  <span
                    className={
                      p.status === "approved"
                        ? "text-green-400"
                        : p.status === "rejected"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }
                  >
                    {p.status ?? "pending"}
                  </span>
                </p>

                {/* Feedback Inputs */}
                <input
                  type="text"
                  value={feedback[p.id]?.en ?? p.feedback_en ?? ""}
                  onChange={(e) =>
                    setFeedback({
                      ...feedback,
                      [p.id]: { ...feedback[p.id], en: e.target.value },
                    })
                  }
                  placeholder="Feedback EN"
                  className="mt-2 w-full px-2 py-1 rounded bg-[#0A192F] border border-gray-600 text-white text-sm"
                />
                <input
                  type="text"
                  value={feedback[p.id]?.yo ?? p.feedback_yo ?? ""}
                  onChange={(e) =>
                    setFeedback({
                      ...feedback,
                      [p.id]: { ...feedback[p.id], yo: e.target.value },
                    })
                  }
                  placeholder="Feedback YO"
                  className="mt-2 w-full px-2 py-1 rounded bg-[#0A192F] border border-gray-600 text-white text-sm"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feedback[p.id]?.score ?? p.practical_score ?? ""}
                  onChange={(e) =>
                    setFeedback({
                      ...feedback,
                      [p.id]: { ...feedback[p.id], score: e.target.value },
                    })
                  }
                  placeholder="Score"
                  className="mt-2 w-20 px-2 py-1 rounded bg-[#0A192F] border border-gray-600 text-white text-sm"
                />

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateStatus(p.id, "approved", p.user_id)}
                    disabled={updating === p.id}
                    className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => updateStatus(p.id, "rejected", p.user_id)}
                    disabled={updating === p.id}
                    className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-lg shadow border border-gray-700">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#1B263B] border-b border-gray-700 text-gray-300 text-sm">
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Repo</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Feedback (EN)</th>
                  <th className="p-4">Feedback (YO)</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-700 hover:bg-[#0D1B2A]"
                  >
                    <td className="p-4">{p.full_name}</td>
                    <td className="p-4">{p.course_id}</td>
                    <td className="p-4">
                      <a
                        href={p.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 underline break-all"
                      >
                        View Repo
                      </a>
                    </td>
                    <td className="p-4">
                      <span
                        className={
                          p.status === "approved"
                            ? "text-green-400"
                            : p.status === "rejected"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }
                      >
                        {p.status ?? "pending"}
                      </span>
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        value={feedback[p.id]?.en ?? p.feedback_en ?? ""}
                        onChange={(e) =>
                          setFeedback({
                            ...feedback,
                            [p.id]: { ...feedback[p.id], en: e.target.value },
                          })
                        }
                        placeholder="Feedback EN"
                        className="w-full px-3 py-2 rounded-lg bg-[#0A192F] border border-gray-600 text-white text-sm"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        value={feedback[p.id]?.yo ?? p.feedback_yo ?? ""}
                        onChange={(e) =>
                          setFeedback({
                            ...feedback,
                            [p.id]: { ...feedback[p.id], yo: e.target.value },
                          })
                        }
                        placeholder="Feedback YO"
                        className="w-full px-3 py-2 rounded-lg bg-[#0A192F] border border-gray-600 text-white text-sm"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={feedback[p.id]?.score ?? p.practical_score ?? ""}
                        onChange={(e) =>
                          setFeedback({
                            ...feedback,
                            [p.id]: { ...feedback[p.id], score: e.target.value },
                          })
                        }
                        placeholder="Score"
                        className="w-24 px-3 py-2 rounded-lg bg-[#0A192F] border border-gray-600 text-white text-sm"
                      />
                    </td>
                    <td className="p-4 flex flex-row gap-2">
                      <button
                        onClick={() => updateStatus(p.id, "approved", p.user_id)}
                        disabled={updating === p.id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, "rejected", p.user_id)}
                        disabled={updating === p.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
                      >
                        ❌ Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-lg text-white disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
            >
              Next
            </button>
          </div>
        </>
      )}

      {isModalOpen && <InstructionModal onClose={() => setIsModalOpen(false)} />}
    </AdminLayout>
  );
}
