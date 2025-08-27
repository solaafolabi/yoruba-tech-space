// GroupRoomChat.jsx
import { useEffect, useRef, useState } from "react";
import supabase from "../../supabaseClient";
import { useParams } from "react-router-dom";
import TypingPresence from "../../pages/chat/TypingPresence";
import { SendHorizonal, Trash2, Pencil } from "lucide-react";

export default function GroupRoomChat({ user }) {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [profilesMap, setProfilesMap] = useState({});
  const [roomName, setRoomName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [userRole, setUserRole] = useState("user");

  const messageBoxRef = useRef(null);
  const channelRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (messageBoxRef.current) {
        messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
      }
    });
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const [{ data: messagesData }, { data: profilesData }, { data: roomData }] = await Promise.all([
        supabase
          .from("messages")
          .select("id, content, created_at, sender_id, receiver_id, username")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true }),
        supabase.from("profiles").select("id, full_name, role"),
        supabase.from("rooms").select("name").eq("id", roomId).single(),
      ]);

      const map = {};
      profilesData.forEach((p) => (map[p.id] = p.full_name));
      setProfilesMap(map);

      const me = profilesData.find((p) => p.id === user.id);
      if (me?.role) setUserRole(me.role);

      setMessages(messagesData || []);
      if (roomData) setRoomName(roomData.name);
      scrollToBottom();
    };

    fetchInitialData();

    const channel = supabase.channel(`room-${roomId}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const newMsg = payload.new;
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.new.id ? payload.new : m))
        );
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ typing: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user.id]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const fullName = profilesMap[user.id] || "Anon";

    if (editingId) {
      await supabase.from("messages").update({ content: text }).eq("id", editingId);
      setEditingId(null);
      setText("");
      return;
    }

    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: text,
      sender_id: user.id,
      receiver_id: null,
      username: fullName,
      room_id: roomId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setText("");
    scrollToBottom();

    await supabase.from("messages").insert([
      {
        content: text,
        sender_id: user.id,
        username: fullName,
        room_id: roomId,
        receiver_id: null,
      },
    ]);
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    channelRef.current?.track({ typing: true });

    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      channelRef.current?.track({ typing: false });
    }, 1200);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (t) =>
    new Date(t).toLocaleTimeString("yo-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getDisplayName = (msg) => {
    const name = msg.username || profilesMap[msg.sender_id] || "Anon";
    if (name.toLowerCase().includes("admin")) {
      return { name: `\ud83d\udee1\ufe0f ${name}`, isAdmin: true };
    }
    return { name, isAdmin: false };
  };

  const deleteMessage = async (id) => {
    await supabase.from("messages").delete().eq("id", id);
    setShowDeleteModal(null);
  };

  return (
    <div className="max-w-xl mx-auto border border-yellow-500 rounded-2xl shadow p-4 bg-[#1B263B] mt-4 text-white">
      <h2 className="text-xl font-bold mb-4 text-[#FFD700]">{roomName || "Room Chat"}</h2>

      <div
        ref={messageBoxRef}
        className="h-64 overflow-y-auto p-2 rounded-xl bg-[#0f172a] space-y-3 border border-gray-700"
      >
        {messages.map((msg) => {
          const { name, isAdmin } = getDisplayName(msg);
          const isMine = msg.sender_id === user.id;
          const canModify = isMine || userRole === "admin";

          return (
            <div
              key={msg.id}
              className={`relative group text-sm px-3 py-1 rounded-xl max-w-[80%] ${
                isMine
                  ? "bg-blue-600 text-white ml-auto text-right"
                  : "bg-gray-800 text-white mr-auto text-left"
              }`}
            >
              <div
                className={`font-semibold text-xs mb-1 ${
                  isAdmin ? "text-amber-400" : "text-yellow-400"
                }`}
              >
                {isMine ? "You" : name}
              </div>
              <div>{msg.content}</div>
              <div className="text-[10px] text-gray-400 mt-1">{formatTime(msg.created_at)}</div>

              {canModify && (
                <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                  <button onClick={() => {
                    setEditingId(msg.id);
                    setText(msg.content);
                  }} className="text-white hover:text-yellow-400">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setShowDeleteModal(msg.id)} className="text-white hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {showDeleteModal === msg.id && (
                <div className="absolute z-10 top-5 right-5 bg-gray-900 text-white p-3 rounded-xl border border-red-500 shadow-lg">
                  <p className="text-sm mb-2">Are you sure you want to delete this message?</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowDeleteModal(null)}
                      className="text-sm bg-gray-600 px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="text-sm bg-red-600 px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TypingPresence userId={user.id} chatRoomId={roomId} showNamesInGroup={true} />

      <div className="flex mt-3 gap-1">
        <textarea
          rows={1}
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyPress}
          className="flex-1 p-2 rounded-xl bg-[#0f172a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
          placeholder="Sọ ọrọ rẹ nibi... (Press Enter to send)"
        />

        <button
          onClick={sendMessage}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold p-3 rounded-xl"
        >
          <SendHorizonal size={20} />
        </button>
      </div>
    </div>
  );
}
