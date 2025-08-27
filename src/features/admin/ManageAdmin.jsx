// src/pages/admin/ManageAdminPermissions.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import supabase from "../../supabaseClient";
import {
  motion,
  AnimatePresence
} from "framer-motion";
import {
  Search,
  Shield,
  Users2,
  Crown,
  Trash2,
  Pencil,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Info,
  Copy,
  BadgeCheck,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

// ---------- Constants
const PERMISSIONS = [
  { key: "can_manage_lessons", label: "Lessons" },
  { key: "can_manage_practicals", label: "Practicals" },
  { key: "can_manage_students", label: "Students" },
  { key: "can_manage_projects", label: "Projects" },
  { key: "can_manage_testimonials", label: "Testimonials" },
];

const ROLES = ["super_admin", "admin"];
const ROLE_LABEL = { super_admin: "Super Admin", admin: "Admin" };

// ---------- Helpers
const cn = (...cls) => cls.filter(Boolean).join(" ");
const roleBadgeClass = (role) => role === "super_admin" ? "bg-yellow-400 text-[#0A192F]" : "bg-blue-600 text-white";

// ---------- Toast Hook
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);
  const add = (title, variant = "info") => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, title, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };
  return {
    toasts,
    api: {
      info: (m) => add(m, "info"),
      success: (m) => add(m, "success"),
      error: (m) => add(m, "error"),
      warn: (m) => add(m, "warn"),
    },
  };
}

// ---------- Debounce Hook
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// ---------- Skeleton Row
const RowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="p-3"><div className="h-4 w-40 bg-slate-700/40 rounded" /></td>
    <td className="p-3"><div className="h-6 w-24 bg-slate-700/40 rounded-full" /></td>
    <td className="p-3"><div className="h-6 w-24 bg-slate-700/40 rounded-full" /></td>
    <td className="p-3"><div className="h-8 w-56 bg-slate-700/40 rounded" /></td>
  </tr>
);

// ---------- Confirm Modal
function ConfirmModal({ open, title, message, confirmText = "Confirm", destructive, onConfirm, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-[95%] max-w-md rounded-2xl border border-slate-700 bg-[#0B1220] p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              {destructive ? <AlertTriangle className="h-6 w-6 text-red-400" /> : <Shield className="h-6 w-6 text-emerald-400" />}
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-1 text-slate-300">{message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700/60 text-slate-100 hover:bg-slate-700">Cancel</button>
              <button
                onClick={onConfirm}
                className={cn(
                  "px-4 py-2 rounded-lg font-semibold",
                  destructive ? "bg-red-500/90 hover:bg-red-500 text-white" : "bg-blue-500/90 hover:bg-blue-500 text-white"
                )}
              >{confirmText}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Drawer
function Drawer({ open, user, perms, onClose, togglePermission }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="fixed right-0 top-0 z-[95] h-full w-[92%] max-w-md bg-[#0B1220] border-l border-slate-700 shadow-2xl"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        >
          <div className="p-5 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-700/60">
                <Shield className="h-6 w-6 text-slate-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{user?.full_name || "Unnamed"}</h3>
                <div className="mt-1 flex gap-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs", roleBadgeClass(user?.role))}>{ROLE_LABEL[user?.role]}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-700/60">
              <XCircle className="h-6 w-6 text-slate-300" />
            </button>
          </div>
          <div className="p-5 space-y-4 text-slate-200">
            <div className="flex items-center gap-2 text-slate-300"><Info className="h-4 w-4" /> User ID</div>
            <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-lg break-all">
              <code className="text-xs">{user?.id}</code>
              <button
                className="ml-auto rounded bg-slate-700/60 px-2 py-1 text-xs hover:bg-slate-700"
                onClick={() => navigator.clipboard?.writeText(user?.id || "")}
              >
                <Copy className="h-4 w-4 inline mr-1" /> Copy
              </button>
            </div>
            <div className="rounded-xl border border-slate-700 p-3">
              <div className="text-sm text-slate-400 mb-2">Permissions</div>
              <div className="space-y-2">
                {PERMISSIONS.map(p => (
                  <div key={p.key} className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded-lg">
                    <span>{p.label}</span>
                    <button onClick={() => togglePermission(user.id, p.key)} className="rounded-full p-1">
                      {perms?.[p.key] ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ---------- Main Component
export default function ManageAdminPermissions() {
  const [me, setMe] = useState(null);
  const [locked, setLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [perms, setPerms] = useState({});
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);
  const [drawerUser, setDrawerUser] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const { toasts, api } = useToasts();

  // ---------- Auth & Lock
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLocked(true); setLoading(false); return; }
      const { data, error } = await supabase.from("profiles").select("id, full_name, role").eq("id", user.id).maybeSingle();
      if (error) { api.error(error.message); setLocked(true); setLoading(false); return; }
      setMe(data); setLocked(data?.role !== "super_admin"); setLoading(false);
    })();
  }, []);

  // ---------- Fetch rows
  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("id, full_name, role").in("role", ["admin", "super_admin"]);
    if (error) { api.error(error.message); setLoading(false); return; }
    setRows(data || []);
    const permsData = {};
    for (let row of data) {
      const { data: perm } = await supabase.from("admin_permissions").select("*").eq("admin_id", row.id).maybeSingle();
      permsData[row.id] = perm || {};
    }
    setPerms(permsData);
    setLoading(false);
  };
  useEffect(() => { if (!locked) fetchRows(); }, [locked]);

  // ---------- Filtered rows
  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    return rows.filter(r => !q || r.full_name.toLowerCase().includes(q));
  }, [rows, debouncedQuery]);

  // ---------- Permissions toggle
  const togglePermission = async (adminId, key) => {
    const oldVal = perms[adminId]?.[key] || false;
    setPerms(p => ({ ...p, [adminId]: { ...p[adminId], [key]: !oldVal } }));
    const { error } = await supabase.from("admin_permissions").upsert({ admin_id: adminId, [key]: !oldVal });
    if (error) { api.error(error.message); setPerms(p => ({ ...p, [adminId]: { ...p[adminId], [key]: oldVal } })); }
    else api.success("Permission updated");
  };

  // ---------- Delete Admin
  const removeUser = async (id) => {
    const prev = rows;
    setRows(r => r.filter(x => x.id !== id));
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { api.error(error.message); setRows(prev); }
    else api.success("User deleted");
  };

  if (locked) return (
    <div className="min-h-[70vh] grid place-items-center bg-gradient-to-br from-[#0A192F] to-[#1B263B] p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-700/70 bg-[#0B1220]/90 p-8 text-center shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-700/60">
          <LockKeyhole className="h-7 w-7 text-yellow-400" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">Restricted Area</h2>
        <p className="mt-2 text-slate-300">Only <span className="text-yellow-300">Super Admin</span> can manage roles.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] to-[#1B263B] text-slate-100 p-6">
      {/* Toasts */}
      <div className="fixed right-4 top-4 z-[120] space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn("rounded-xl px-4 py-3 shadow-xl border backdrop-blur-lg",
                t.variant === "success" && "bg-emerald-500/20 border-emerald-500/40",
                t.variant === "error" && "bg-red-500/20 border-red-500/40",
                t.variant === "warn" && "bg-amber-500/20 border-amber-500/40",
                t.variant === "info" && "bg-blue-500/20 border-blue-500/40"
              )}
            >
              <div className="flex items-center gap-2">
                {t.variant === "success" && <CheckCircle2 className="h-5 w-5" />}
                {t.variant === "error" && <XCircle className="h-5 w-5" />}
                {t.variant === "warn" && <AlertTriangle className="h-5 w-5" />}
                {t.variant === "info" && <Info className="h-5 w-5" />}
                <span className="text-sm">{t.title}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header & Search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-400 text-[#0A192F] shadow-lg">
            <Crown className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-yellow-300 drop-shadow">Super Admin · Manage Admins</h1>
            <p className="text-slate-300/80 text-sm">Assign permissions, manage admins, and keep control.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRows}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 md:w-1/2 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-700 bg-[#0B1220] pl-10 pr-4 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          placeholder="Search by name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/70 backdrop-blur bg-[#0B1220]/60 shadow-2xl">
        <table className="w-full">
          <thead className="bg-[#0B1220]/50 text-slate-400 text-left text-sm uppercase tracking-wide">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Permissions</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => <RowSkeleton key={i} />) :
              filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-700/40 hover:bg-slate-700/10">
                  <td className="p-3">{r.full_name}</td>
                  <td className="p-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs", roleBadgeClass(r.role))}>
                      {ROLE_LABEL[r.role]}
                    </span>
                  </td>
                  <td className="p-3 text-sm space-x-1">
                    {PERMISSIONS.map(p => perms[r.id]?.[p.key] && (
                      <span key={p.key} className="inline-block bg-slate-600/40 px-2 py-1 rounded-full text-xs">{p.label}</span>
                    ))}
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => setDrawerUser(r)} className="p-2 rounded-lg hover:bg-slate-700/40"><Pencil className="h-4 w-4" /></button>
                    {r.role !== "super_admin" && (
                      <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-2 rounded-lg hover:bg-red-600/30"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <Drawer
        open={!!drawerUser}
        user={drawerUser}
        perms={perms[drawerUser?.id]}
        onClose={() => setDrawerUser(null)}
        togglePermission={togglePermission}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirm.open}
        title="Delete Admin?"
        message="This action is irreversible."
        destructive
        onConfirm={() => { removeUser(confirm.id); setConfirm({ open: false, id: null }); }}
        onClose={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
}
