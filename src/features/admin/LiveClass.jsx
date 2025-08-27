// src/pages/admin/AdminLiveClasses.jsx
import React, { useState, useEffect } from "react";
import supabase from "../../supabaseClient";

// Countdown component with nice UI
function LiveClassCountdown({ startTime }) {
  const [timeLeft, setTimeLeft] = useState({});
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(startTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsLive(true);
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (isLive) {
    return (
      <span className="text-green-400 font-bold animate-pulse text-lg">
        🔴 Live Now!
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="bg-yellow-500 text-black px-3 py-1 rounded-lg font-mono">
        {timeLeft.hours ?? 0}h
      </span>
      <span className="bg-yellow-400 text-black px-3 py-1 rounded-lg font-mono">
        {timeLeft.minutes ?? 0}m
      </span>
      <span className="bg-yellow-300 text-black px-3 py-1 rounded-lg font-mono">
        {timeLeft.seconds ?? 0}s
      </span>
    </div>
  );
}

export default function AdminLiveClasses() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    id: null,
    course_id: "",
    title: "",
    instructor: "",
    start_time: "",
  });
  const [courses, setCourses] = useState([]);
  const [pendingModerators, setPendingModerators] = useState([]);

  /** Fetch courses */
  const fetchCourses = async () => {
    const { data, error } = await supabase.from("courses").select("*");
    if (!error) setCourses(data || []);
  };

  /** Fetch live classes */
  const fetchLiveClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("live_classes")
      .select(`*, courses(name)`)
      .order("start_time", { ascending: true });
    if (!error) setLiveClasses(data || []);
    setLoading(false);
  };

  /** Fetch pending moderators */
  const fetchPendingModerators = async () => {
    const { data, error } = await supabase
      .from("live_class_moderators")
      .select(`
        id,
        status,
        profiles(full_name),
        live_classes(title)
      `)
      .eq("status", "pending");
    if (!error) setPendingModerators(data || []);
  };

  /** Realtime subscription */
  useEffect(() => {
    fetchCourses();
    fetchLiveClasses();
    fetchPendingModerators();

    const sub = supabase
      .channel("moderators")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_class_moderators" },
        () => fetchPendingModerators()
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  /** Form handling */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const generateRoomName = (title) =>
    `${title.replace(/\s+/g, "_")}_${Date.now()}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.instructor || !form.start_time || !form.course_id) {
      alert("Please fill all fields");
      return;
    }

    const payload = {
      course_id: form.course_id,
      title: form.title,
      instructor: form.instructor,
      start_time: form.start_time,
      room_name: form.id ? form.room_name : generateRoomName(form.title),
    };

    if (form.id) {
      await supabase.from("live_classes").update(payload).eq("id", form.id);
    } else {
      await supabase.from("live_classes").insert([payload]);
    }

    setForm({ id: null, course_id: "", title: "", instructor: "", start_time: "" });
    fetchLiveClasses();
  };

  const handleEdit = (lc) =>
    setForm({ ...lc, start_time: lc.start_time.slice(0, 16) });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await supabase.from("live_classes").delete().eq("id", id);
    fetchLiveClasses();
  };

  const approveModerator = async (id) => {
    await supabase
      .from("live_class_moderators")
      .update({ status: "approved" })
      .eq("id", id);
    fetchPendingModerators();
  };

  const rejectModerator = async (id) => {
    await supabase
      .from("live_class_moderators")
      .update({ status: "rejected" })
      .eq("id", id);
    fetchPendingModerators();
  };

  return (
    <div className="p-6 bg-[#0D1B2A] min-h-screen text-white">
      <h1 className="text-2xl font-bold text-[#FFD700] mb-4">
        Admin - Live Classes
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 bg-[#1B263B] p-4 rounded-lg shadow-md space-y-3"
      >
        <select
          name="course_id"
          value={form.course_id}
          onChange={handleChange}
          className="w-full p-2 rounded bg-[#0D1B2A]"
        >
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="title"
          placeholder="Class Title"
          value={form.title}
          onChange={handleChange}
          className="w-full p-2 rounded bg-[#0D1B2A]"
        />
        <input
          type="text"
          name="instructor"
          placeholder="Instructor"
          value={form.instructor}
          onChange={handleChange}
          className="w-full p-2 rounded bg-[#0D1B2A]"
        />
        <input
          type="datetime-local"
          name="start_time"
          value={form.start_time}
          onChange={handleChange}
          className="w-full p-2 rounded bg-[#0D1B2A]"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#FFD700] text-[#0D1B2A] font-bold rounded"
        >
          {form.id ? "Update" : "Create"}
        </button>
      </form>

      {/* Classes */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full text-left border border-gray-700">
          <thead>
            <tr className="bg-[#1B263B]">
              <th className="p-2">Course</th>
              <th className="p-2">Title</th>
              <th className="p-2">Instructor</th>
              <th className="p-2">Start Time</th>
              <th className="p-2">Countdown</th>
              <th className="p-2">Room</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {liveClasses.map((lc) => (
              <tr key={lc.id} className="hover:bg-[#1B263B]/50">
                <td className="p-2">{lc.courses?.name}</td>
                <td className="p-2">{lc.title}</td>
                <td className="p-2">{lc.instructor}</td>
                <td className="p-2">
                  {new Date(lc.start_time).toLocaleString()}
                </td>
                <td className="p-2">
                  <LiveClassCountdown startTime={lc.start_time} />
                </td>
                <td className="p-2 font-mono text-xs">{lc.room_name}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(lc)}
                    className="px-2 py-1 bg-blue-600 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lc.id)}
                    className="px-2 py-1 bg-red-600 rounded"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `/live/${lc.room_name}?role=admin`,
                        "_blank"
                      )
                    }
                    className="px-2 py-1 bg-green-600 rounded"
                  >
                    Join
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Moderator Requests */}
      <h2 className="text-lg font-bold text-[#FFD700] mt-6">
        Pending Moderators
      </h2>
      {pendingModerators.length === 0 ? (
        <p className="text-gray-300">No pending requests</p>
      ) : (
        <table className="w-full text-left mt-2">
          <thead>
            <tr className="bg-[#1B263B]">
              <th className="p-2">User</th>
              <th className="p-2">Class</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingModerators.map((pm) => (
              <tr key={pm.id} className="hover:bg-[#1B263B]/50">
                <td className="p-2">{pm.profiles?.full_name}</td>
                <td className="p-2">{pm.live_classes?.title}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => approveModerator(pm.id)}
                    className="px-3 py-1 bg-green-600 rounded hover:bg-green-500"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => rejectModerator(pm.id)}
                    className="px-3 py-1 bg-red-600 rounded hover:bg-red-500"
                  >
                    ❌ Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
