import { useEffect, useRef, useState } from "react";
import supabase from "../../supabaseClient";
import TypingPresence from "./TypingPresence";
import { SendHorizonal } from "lucide-react";

export default function GeneralChatbox({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [profilesMap, setProfilesMap] = useState({});
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
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, created_at, sender_id, receiver_id, username")
        .is("room_id", null)
        .order("created_at", { ascending: true });

      if (!error) {
        setMessages(data);
        scrollToBottom();
      } else {
        console.error("❌ Error loading messages:", error);
      }
    };

    const fetchProfiles = async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (!error) {
        const map = {};
        data.forEach((p) => {
          map[p.id] = p.full_name;
        });
        setProfilesMap(map);
      }
    };

    fetchProfiles();
    fetchInitialMessages();

    const channel = supabase.channel("general-chat", {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "room_id=is.null",
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ typing: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const fullName = profilesMap[user.id] || "Anon";

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

    const { error } = await supabase.from("messages").insert([
      {
        content: text,
        sender_id: user.id,
        username: fullName,
        room_id: null,
        receiver_id: null,
      },
    ]);

    if (error) {
      console.error("❌ Send failed:", error);
    }
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
      return { name: `👑 ${name}`, isAdmin: true };
    }
    return { name, isAdmin: false };
  };

  return (
    <div className="max-w-xl mx-auto border border-yellow-500 rounded-2xl shadow p-4 bg-[#1B263B] mt-4 text-white">
      <h2 className="text-xl font-bold mb-4 text-[#FFD700]">
        Ìbánisọ̀rọ̀ Gbogbogbò (General Chat)
      </h2>

      <div
        ref={messageBoxRef}
        className="h-64 overflow-y-auto p-2 rounded-xl bg-[#0f172a] space-y-3 border border-gray-700"
      >
        {messages.map((msg) => {
          const { name, isAdmin } = getDisplayName(msg);
          return (
            <div
              key={msg.id}
              className={`text-sm px-3 py-1 rounded-xl max-w-[80%] ${
                msg.sender_id === user.id
                  ? "bg-blue-600 text-white ml-auto text-right"
                  : "bg-gray-800 text-white mr-auto text-left"
              }`}
            >
              <div
                className={`font-semibold text-xs mb-1 ${
                  isAdmin ? "text-amber-400" : "text-yellow-400"
                }`}
              >
                {msg.sender_id === user.id ? "You" : name}
              </div>

              <div>{msg.content}</div>

              <div className="text-[10px] text-gray-400 mt-1">
                {formatTime(msg.created_at)}
              </div>
            </div>
          );
        })}
      </div>

      <TypingPresence
        userId={user.id}
        chatRoomId={null}
        showNamesInGroup={false}
      />

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
