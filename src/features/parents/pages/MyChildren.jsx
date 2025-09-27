// ChildrenManager.jsx
import React, { useEffect, useState, useRef } from "react";
import supabase from "../../../supabaseClient";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;
const BRAND_PREFIX = "yor";
const GENDERS = ["Male", "Female", "Non-Binary", "Prefer Not to Say"];

function getLevelFromAgeRange(ageRange) {
  const LEVELS_MAP = {
    "4-7": "Early Learners / Beginners",
    "8-10": "Young Juniors",
    "11-12": "Pre-Teens",
    "13-15": "Teens",
  };
  return LEVELS_MAP[ageRange] || "Unknown";
}

const FloatingInput = ({ label, value, onChange, type = "text", readOnly = false, error, children }) => (
  <div className="relative w-full">
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
      placeholder=" "
      className={`peer w-full p-3 rounded bg-[#112240] text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400 border border-blue-500 ${
        readOnly ? "cursor-not-allowed bg-gray-700 text-gray-400" : ""
      }`}
    />
    <label
      className={`absolute left-3 text-gray-400 text-sm transition-all
      ${value ? "top-0 text-yellow-400 text-sm" : "top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base"}`}
    >
      {label}
    </label>
    {children}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default function ChildrenManager({ onSelectChild, selectedChild }) {
  const { t } = useTranslation();
  const [parentId, setParentId] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastCreatedAt = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [ageRanges, setAgeRanges] = useState([]);
  const [gender, setGender] = useState(GENDERS[0]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [modalMessage, setModalMessage] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [done, setDone] = useState(false);

  const hasFetchedUser = useRef(false);

  // fetch parent ID
  useEffect(() => {
    if (hasFetchedUser.current) return;
    hasFetchedUser.current = true;

    async function fetchUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return console.error(error.message);
      setParentId(user?.id || null);
    }
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setParentId(session?.user?.id || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // fetch unique age ranges
  useEffect(() => {
    async function fetchAgeRanges() {
      const { data, error } = await supabase.from("lessons").select("target_audience");
      if (error) return console.error(error);
      const uniqueRanges = [...new Set(data.map((r) => r.target_audience).filter(Boolean))];
      setAgeRanges(uniqueRanges.filter((r) => !r.includes("25+")));
    }
    fetchAgeRanges();
  }, []);

  // auto-generate username for new child
  useEffect(() => {
    if (!editingChild && fullName.trim()) {
      generateUsername(fullName.trim()).then(setUsername).catch(() => setUsername(""));
    }
  }, [fullName, editingChild]);

  async function generateUsername(name) {
    const firstName = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "").slice(0, 4);
    const year = new Date().getFullYear().toString().slice(-2);
    for (let attempt = 0; attempt < 10; attempt++) {
      const randNum = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
      const candidate = `${BRAND_PREFIX}${firstName}${year}${randNum}`;
      const { data } = await supabase.from("children").select("id").eq("username", candidate).single();
      if (!data) return candidate;
    }
    throw new Error("Failed to generate username");
  }

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (editingChild) setAvatarPreview(editingChild.avatar_url || "");
    else setAvatarPreview("");
  }, [avatarFile, editingChild]);

  // fetch children
  async function fetchChildrenPage() {
    if (!parentId || loading) return;
    setLoading(true);
    let query = supabase.from("children").select("*").eq("parent_id", parentId).order("created_at", { ascending: false }).limit(PAGE_SIZE);
    if (lastCreatedAt.current) query = query.lt("created_at", lastCreatedAt.current);
    const { data, error } = await query;
    if (error) console.error(error);
    else if (data?.length) {
      setChildren((prev) => {
        const ids = new Set(prev.map(c => c.id));
        return [...prev, ...data.filter(c => !ids.has(c.id))];
      });
      lastCreatedAt.current = data[data.length - 1].created_at;
    }
    setLoading(false);
  }

  useEffect(() => { if (parentId) fetchChildrenPage(); }, [parentId]);

  function clearAvatar() { setAvatarFile(null); setAvatarPreview(""); }

  function validate() {
    const errs = {};
    if (!fullName.trim()) errs.fullName = t("children.fullNameRequired");
    if (!username.trim()) errs.username = t("children.usernameRequired");
    if (!email.trim()) errs.email = t("children.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = t("children.emailInvalid");
    if (!editingChild && !password.trim()) errs.password = t("children.passwordRequired");
    if (!ageRange) errs.ageRange = t("children.ageRangeRequired");
    return errs;
  }

  async function saveChild() {
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      let avatar_url = editingChild?.avatar_url || "";
      if (avatarFile) avatar_url = await uploadAvatar(avatarFile);

      if (editingChild) {
        const { data: updated, error } = await supabase.from("children").update({
          full_name: fullName.trim(),
          username,
          email: email.trim(),
          age_range: ageRange,
          gender,
          level: getLevelFromAgeRange(ageRange),
          avatar_url
        }).eq("id", editingChild.id).select().single();
        if (error) throw error;
        setChildren(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (signUpError) throw signUpError;

        const { data: inserted, error } = await supabase.from("children").insert({
          parent_id: parentId,
          full_name: fullName.trim(),
          username,
          email: email.trim(),
          age_range: ageRange,
          gender,
          level: getLevelFromAgeRange(ageRange),
          avatar_url,
          user_id: authData.user.id
        }).select().single();
        if (error) throw error;
        setChildren(prev => [inserted, ...prev]);
      }

      setShowForm(false); setAvatarFile(null); setAvatarPreview(""); setErrors({}); setPassword("");
      setModalType("success"); setModalMessage(t("children.savedSuccessfully"));
    } catch (e) {
      setModalType("error"); setModalMessage(t("children.saveFailed") + ": " + e.message);
    }
    setLoading(false);
  }

  async function uploadAvatar(file) {
    const ext = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `avatars/${fileName}`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  }

  function confirmDelete(child) { setDeleteTarget(child); setModalType("confirm"); setModalMessage(t("children.confirmDelete", { name: child.full_name })); }
  async function deleteChild() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("children").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setChildren(prev => prev.filter(c => c.id !== deleteTarget.id));
      setModalType("success"); setModalMessage(t("children.deletedSuccessfully")); setDeleteTarget(null);
    } catch (e) {
      setModalType("error"); setModalMessage(t("children.deleteFailed") + ": " + e.message);
    }
    setLoading(false);
  }

  const loadMoreRef = useRef();
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) fetchChildrenPage(); }, { rootMargin: "100px" });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [parentId]);

  if (!parentId) return <p>{t("children.loadingUser")}</p>;
 

  return (
    <div className="m-h-screen mx-auto p-4 sm:p-6 bg-[#112240] text-white rounded-lg">
  <h1 className="text-2xl sm:text-3xl mb-4 sm:mb-6 font-bold truncate">
    {t("children.manageChildren")}
  </h1>

  {/* Add Child Button */}
  <button
    onClick={() => {
      setEditingChild(null);
      setFullName("");
      setUsername("");
      setEmail("");
      setAgeRange("");
      setGender(GENDERS[0]);
      setPassword("");
      setAvatarFile(null);
      setAvatarPreview("");
      setErrors({});
      setShowForm(true);
    }}
    disabled={loading || showForm}
    className="mb-4 px-4 py-2 w-full sm:w-auto bg-yellow-500 text-black rounded hover:bg-yellow-600 text-center"
  >
    {t("children.addChild")}
  </button>

  {/* Children List */}
  <ul className="space-y-4 max-h-[60vh] overflow-y-auto mb-4">
    {children.map((child) => {
      const isSelected = selectedChild?.id === child.id;
      return (
        <li
          key={child.id}
          onClick={() => onSelectChild?.(child)}
          className={`bg-[#112240] p-3 sm:p-4 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer transition-all ${
            isSelected ? "ring-2 ring-yellow-400" : ""
          }`}
        >
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <img
              src={child.avatar_url || "/placeholder-avatar.png"}
              alt="avatar"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-yellow-500"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{child.full_name}</p>
              <p className="text-sm text-gray-300 truncate">{child.username}</p>
              <p className="text-sm text-gray-400 truncate">
                {t("children.email")}: {child.email}
              </p>
              <p className="text-sm text-gray-400 truncate">
                {t("children.age")}: {child.age_range} | {t("children.level")}: {child.level} | {t("children.gender")}: {child.gender}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap sm:flex-nowrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingChild(child);
                setFullName(child.full_name);
                setUsername(child.username);
                setEmail(child.email);
                setAgeRange(child.age_range);
                setGender(child.gender);
                setPassword("");
                setAvatarFile(null);
                setAvatarPreview(child.avatar_url || "");
                setErrors({});
                setShowForm(true);
              }}
              className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600"
              disabled={loading || showForm}
            >
              {t("children.edit")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                confirmDelete(child);
              }}
              className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
              disabled={loading || showForm}
            >
              {t("children.delete")}
            </button>
          </div>
        </li>
      );
    })}
  </ul>

  {!done && <div ref={loadMoreRef} style={{ height: "1px" }} />}
  {loading && <p className="text-center">{t("children.loading")}</p>}

  {/* Add/Edit Form Modal */}
  {showForm && (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50">
      <div className="bg-[#112240] p-4 sm:p-6 rounded-lg w-full max-w-md relative overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl sm:text-2xl mb-4 font-bold truncate">
          {editingChild ? t("children.editChild") : t("children.addChild")}
        </h2>

        <div className="space-y-3">
          <FloatingInput
            label={t("children.fullName")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
          />
          <FloatingInput
            label={t("children.usernameAuto")}
            value={username}
            readOnly
            error={errors.username}
          />
          <FloatingInput
            label={t("children.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          {/* Age Range */}
          <div className="relative">
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full p-3 rounded bg-[#112240] text-white border border-blue-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="" disabled>{t("children.age")}</option>
              {ageRanges.map((ar) => (
                <option key={ar} value={ar}>{ar}</option>
              ))}
            </select>
            {errors.ageRange && <p className="text-red-500 text-sm mt-1">{errors.ageRange}</p>}
          </div>

          {/* Gender */}
          <div className="relative">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-3 rounded bg-[#112240] text-white border border-blue-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {t(`children.genders.${g.toLowerCase().replace(/[^a-z]/g, "")}`, { defaultValue: g })}
                </option>
              ))}
            </select>
          </div>

          {/* Avatar Upload */}
          <label className="block text-sm font-semibold text-gray-400">{t("children.avatar")}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.length ? setAvatarFile(e.target.files[0]) : clearAvatar()}
            className="w-full p-2 rounded bg-[#112240] text-white"
          />
          {avatarPreview && (
            <img src={avatarPreview} alt="Avatar Preview" className="mt-2 w-24 h-24 rounded-full object-cover border-2 border-yellow-500" />
          )}

          {/* Password (only for new child) */}
          {!editingChild && (
            <FloatingInput
              label={t("children.password")}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            >
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </FloatingInput>
          )}
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 w-full sm:w-auto"
            disabled={loading}
          >
            {t("children.cancel")}
          </button>
          <button
            onClick={saveChild}
            className="px-4 py-2 rounded bg-yellow-500 text-black hover:bg-yellow-600 w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? t("children.saving") : t("children.save")}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Modal for Confirm/Delete */}
  {modalType && modalMessage && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-[#112240] p-6 rounded max-w-sm w-full text-center">
        <p className="mb-6">{modalMessage}</p>
        {modalType === "confirm" ? (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => { deleteChild(); setModalType(null); }}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white"
              disabled={loading}
            >
              {t("children.confirm")}
            </button>
            <button
              onClick={() => setModalType(null)}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 text-white"
              disabled={loading}
            >
              {t("children.cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setModalType(null)}
            className="px-4 py-2 bg-yellow-500 rounded hover:bg-yellow-600 text-black w-full sm:w-auto"
          >
            OK
          </button>
        )}
      </div>
    </div>
  )}
</div>
 );
}
