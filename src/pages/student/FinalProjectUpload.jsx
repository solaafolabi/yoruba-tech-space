// src/pages/student/FinalProjectUpload.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../../supabaseClient";
import StudentSidebar from "./studentsidebar/StudentSidebar";
import ProfileDropdown from "../../components/ProfileDropdown";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import { FaBars } from "react-icons/fa";

export default function FinalProjectUpload() {
  const { t, i18n } = useTranslation();
  const { courseId } = useParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [project, setProject] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);


  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error(error);
      toast.error("⚠️ Failed to load user.");
      return;
    }
    setUser(user);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (profileError) console.error(profileError);
    setProfile(profileData);

    fetchProject(user.id);
    fetchInstructions(courseId);
  }

  async function fetchProject(userId) {
    setLoading(true);
    const { data, error } = await supabase
      .from("final_projects")
      .select(
        "id, repo_url, status, feedback_en, feedback_yo, practical_score, submitted_at"
      )
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .order("submitted_at", { ascending: false })
      .maybeSingle();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("❌ Project fetch error:", error);
        toast.error("⚠️ Could not fetch project.");
      }
    } else {
      setProject(data);
      setRepoUrl(data?.status === "rejected" ? "" : data?.repo_url || "");
    }
    setLoading(false);
  }

  async function fetchInstructions(courseId) {
    const { data, error } = await supabase
      .from("final_projects")
      .select(
        "id, title_en, title_yo, description_en, description_yo, max_points, reference_url"
      )
      .eq("course_id", courseId)
      .is("user_id", null);

    if (error) {
      console.error("❌ Instruction fetch error:", error);
      toast.error("⚠️ Could not fetch instructions.");
    } else if (data && data.length > 0) {
      setInstructions(data);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!repoUrl.trim()) {
      toast.warning("⚠️ Please enter your GitHub/GitLab repository URL.");
      return;
    }

    if (!/^https?:\/\/(github|gitlab)\.com\/.+/.test(repoUrl.trim())) {
      toast.error("❌ Invalid repository URL.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("final_projects")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      let result;
      if (existing) {
        // update
        result = await supabase
          .from("final_projects")
          .update({
            repo_url: repoUrl.trim(),
            status: "pending",
            submitted_at: new Date(),
          })
          .eq("id", existing.id)
          .select();
      } else {
        // insert
        result = await supabase
          .from("final_projects")
          .insert([
            {
              user_id: user.id,
              course_id: courseId,
              repo_url: repoUrl.trim(),
              status: "pending",
              submitted_at: new Date(),
            },
          ])
          .select();
      }

      if (result.error) throw result.error;

      fetchProject(user.id);
      toast.success("✅ Project submitted! Waiting for approval.");
    } catch (err) {
      console.error("❌ Submit error:", err);
      toast.error("⚠️ Failed to submit project.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // ✅ Real-time listener for updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("final_projects_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "final_projects",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setProject(payload.new);
            setRepoUrl(
              payload.new.status === "rejected" ? "" : payload.new.repo_url || ""
            );
            toast.info("ℹ️ Project status updated.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ✅ Language-aware getter
  const getLocalized = (inst) => {
    const lang = i18n.language;
    return {
      title: lang === "yo" ? inst.title_yo : inst.title_en,
      description: lang === "yo" ? inst.description_yo : inst.description_en,
    };
  };

  // ✅ Badge for status
  const StatusBadge = ({ status }) => {
    let style =
      "px-3 py-1 rounded-full text-xs font-bold inline-block mt-1 capitalize ";
    switch (status) {
      case "approved":
        style += "bg-green-600 text-white";
        break;
      case "rejected":
        style += "bg-red-600 text-white";
        break;
      default:
        style += "bg-yellow-500 text-black";
    }
    return <span className={style}>{t(`finalProject.${status}`)}</span>;
  };

  return (
  <div className="flex min-h-screen bg-[#0A192F] text-white">
    {/* Sidebar */}
    <StudentSidebar
      isOpen={sidebarOpen}
      setIsOpen={setSidebarOpen}
      onLogout={handleLogout}
    />

    <div className="flex-1 flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-[#112240]">
        {/* Hamburger for mobile */}
        <button
          className="lg:hidden text-yellow-400 text-2xl"
          onClick={() => setSidebarOpen(true)}
        >
          <FaBars />
        </button>

        <h1 className="text-xl font-bold">{t("finalProject.title")}</h1>

        {user && profile && (
          <ProfileDropdown
            user={user}
            profile={profile}
            setProfile={setProfile}
            handleLogout={handleLogout}
          />
        )}
      </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {loading && <p className="text-gray-400">{t("finalProject.loading")}</p>}

          {/* Instructions */}
          {!loading && instructions.length > 0 && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-yellow-400">
                {t("finalProject.instructions")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {instructions.map((inst, idx) => {
                  const { title, description } = getLocalized(inst);
                  return (
                    <div
                      key={inst.id || idx}
                      className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-[#1B263B] to-[#0F172A] border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <h3 className="text-base md:text-lg font-semibold text-yellow-300 mb-2">
                        {title}
                      </h3>
                      <p className="text-gray-300 mb-3 text-sm md:text-base">{description}</p>

                      {inst.max_points && (
                        <p className="text-sm text-green-400 mb-2">
                          🎯 {t("finalProject.maxPoints")}: {inst.max_points}
                        </p>
                      )}

                      {inst.reference_url && (
                        <a
                          href={inst.reference_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-2 px-3 py-2 text-xs md:text-sm font-medium rounded-lg bg-yellow-500 text-black hover:bg-yellow-600 transition"
                        >
                          🔗 {t("finalProject.reference")}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project Status */}
          {!loading && project && (
            <div className="max-w-lg mx-auto p-4 md:p-6 rounded-xl bg-[#1B263B] border border-gray-700 shadow-lg mb-6">
              <p className="mb-3 text-sm md:text-base">
                <strong>{t("finalProject.repo")}:</strong>{" "}
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline break-words"
                >
                  {project.repo_url}
                </a>
              </p>

              <p className="mb-3 text-sm md:text-base">
                <strong>{t("finalProject.status")}:</strong>{" "}
                <StatusBadge status={project.status} />
              </p>

              {/* Feedback & Score Section */}
             <div className="mt-4 p-4 rounded-lg bg-[#0F172A] border border-gray-600">
  <h3 className="text-yellow-400 font-semibold mb-2">
    {t("finalProject.feedbackSection")}
  </h3>

  <div className="space-y-2 text-sm">
    {i18n.language === "en" && (
      <p className="text-gray-300">
        <span className="font-medium">{t("finalProject.feedbackEn")}:</span>{" "}
        {project.feedback_en || (
          <span className="text-gray-500">{t("finalProject.noFeedback")}</span>
        )}
      </p>
    )}

    {i18n.language === "yo" && (
      <p className="text-gray-300">
        <span className="font-medium">{t("finalProject.feedbackYo")}:</span>{" "}
        {project.feedback_yo || (
          <span className="text-gray-500">{t("finalProject.noFeedbackYo")}</span>
        )}
      </p>
    )}

    <p className="text-green-400">
      <span className="font-medium">🏆 {t("finalProject.score")}:</span>{" "}
      {project.practical_score !== null
        ? `${project.practical_score} / 100`
        : t("finalProject.notGraded")}
    </p>
  </div>

  <p className="text-xs text-gray-500 mt-3">
    {t("finalProject.submittedOn")}{" "}
    {new Date(project.submitted_at).toLocaleString()}
  </p>
</div>            </div>
          )}

          {/* Upload Form */}
          {!loading &&
            (!project || project.status === "rejected" || project.status === "pending") && (
              <form
                onSubmit={handleSubmit}
                className="max-w-lg mx-auto p-4 md:p-6 rounded-xl bg-[#1B263B] border border-gray-700 shadow-lg"
              >
                <label className="block mb-2 font-medium text-sm md:text-base">
                  {t("finalProject.repoLabel")}
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder={t("finalProject.repoPlaceholder")}
                  className="w-full px-3 py-2 md:px-4 md:py-2 rounded-lg bg-[#0A192F] border border-gray-600 focus:outline-none focus:border-yellow-400 text-white mb-4 text-sm md:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 md:py-3 rounded-lg font-semibold text-sm md:text-lg bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-300 transform hover:scale-105"
                >
                  {submitting
                    ? t("finalProject.submitting")
                    : t("finalProject.submitButton")}
                </button>
              </form>
            )}

          {!loading && project?.status === "approved" && (
            <p className="text-center text-green-400 font-semibold mt-4 text-sm md:text-base">
              ✅ {t("finalProject.projectApproved")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
