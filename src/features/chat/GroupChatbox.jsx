import { useEffect, useRef, useState } from "react";
import supabase from "../../supabaseClient";
import TypingPresence from "../../features/chat/TypingPresence";
import { SendHorizonal, Trash2, Pencil } from "lucide-react";

export default function GeneralChatbox({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [profilesMap, setProfilesMap] = useState({});
  const [chatLocked, setChatLocked] = useState(false);
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
    const fetchInitialMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, content, created_at, sender_id, receiver_id, username")
        .is("room_id", null)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      scrollToBottom();
    };

    const fetchChatLock = async () => {
      const { data } = await supabase
        .from("chat_settings")
        .select("is_locked")
        .eq("room", "general")
        .single();
      if (data) setChatLocked(data.is_locked);
    };

    const fetchProfiles = async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, role");
      const map = {};
      data?.forEach((p) => (map[p.id] = p.full_name));
      setProfilesMap(map);
      const me = data?.find((p) => p.id === user.id);
      if (me?.role) setUserRole(me.role);
    };

    fetchProfiles();
    fetchInitialMessages();
    fetchChatLock();

    const channel = supabase.channel("general-chat", {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "room_id=is.null",
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
        filter: "room_id=is.null",
      }, (payload) => {
        setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "messages",
        filter: "room_id=is.null",
      }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ typing: false });
        }
      });

    return () => supabase.removeChannel(channel);
  }, [user.id]);

  const sendMessage = async () => {
    if (!text.trim() || (chatLocked && userRole !== "admin")) return;
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
      room_id: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setText("");
    scrollToBottom();

    await supabase.from("messages").insert([{
      content: text,
      sender_id: user.id,
      username: fullName,
      room_id: null,
      receiver_id: null,
    }]);
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    channelRef.current?.track({ typing: true });
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      channelRef.current?.track({ typing: false });
    }, 1200);
  };

  const formatTime = (t) => new Date(t).toLocaleTimeString("yo-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getDisplayName = (msg) => {
    const name = msg.username || profilesMap[msg.sender_id] || "Anon";
    if (name.toLowerCase().includes("admin")) return { name: `🛡️ ${name}`, isAdmin: true };
    return { name, isAdmin: false };
  };

  const deleteMessage = async (id) => {
    await supabase.from("messages").delete().eq("id", id);
    setShowDeleteModal(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl p-4 bg-[#1B263B] text-white border border-yellow-500 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#FFD700]">Ìbánisọ̀rọ̀ Gbogbogbò</h2>
        {userRole === "admin" && (
          <button
            onClick={async () => {
              await supabase.from("chat_settings").update({ is_locked: !chatLocked }).eq("room", "general");
              setChatLocked(!chatLocked);
            }}
            className="text-sm px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg"
          >
            {chatLocked ? "Unlock Chat" : "🔒 Lock Chat"}
          </button>
        )}
      </div>

      <div ref={messageBoxRef} className="h-[400px] overflow-y-auto rounded-xl bg-[#0f172a] p-4 space-y-3 border border-gray-700">
        {messages.map((msg) => {
          const { name, isAdmin } = getDisplayName(msg);
          const isMine = msg.sender_id === user.id;
          const canModify = isMine || userRole === "admin";

          return (
            <div
              key={msg.id}
              className={`group relative p-3 rounded-2xl max-w-[80%] text-sm ${isMine ? "bg-blue-600 text-white ml-auto" : "bg-gray-800 text-white mr-auto"}`}
            >
              <div className={`font-semibold text-xs mb-1 ${isAdmin ? "text-amber-400" : "text-yellow-400"}`}>
                {isMine ? "You" : name}
              </div>
              <div>{msg.content}</div>
              <div className="text-[10px] text-gray-400 mt-1">{formatTime(msg.created_at)}</div>
              {canModify && (
                <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                  <button onClick={() => { setEditingId(msg.id); setText(msg.content); }} className="hover:text-yellow-400">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setShowDeleteModal(msg.id)} className="hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              {showDeleteModal === msg.id && (
                <div className="absolute z-10 top-5 right-5 bg-gray-900 text-white p-3 rounded-xl border border-red-500 shadow-lg">
                  <p className="text-sm mb-2">Delete this message?</p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowDeleteModal(null)} className="text-sm bg-gray-600 px-3 py-1 rounded">Cancel</button>
                    <button onClick={() => deleteMessage(msg.id)} className="text-sm bg-red-600 px-3 py-1 rounded">Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TypingPresence userId={user.id} chatRoomId={null} showNamesInGroup={false} />

      <div className="flex mt-4 gap-2">
        <textarea
          rows={1}
          value={text}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
          className="flex-1 p-3 rounded-xl bg-[#0f172a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
          placeholder={chatLocked && userRole !== "admin" ? "🔒 Chat is locked by Admin" : "Sọ ọrọ rẹ nibi... (Press Enter to send)"}
          disabled={chatLocked && userRole !== "admin"}
        />
        <button
          onClick={sendMessage}
          disabled={chatLocked && userRole !== "admin"}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold p-3 rounded-xl disabled:opacity-50"
        >
          <SendHorizonal size={20} />
        </button>
      </div>
    </div>
  );
}
