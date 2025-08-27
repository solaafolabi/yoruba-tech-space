import React, { useEffect, useRef, useState } from "react";
import supabase from "../supabaseClient";

const ChatModal = ({ isOpen, onClose, user, channelId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true });

      if (!error) {
        setMessages(data);
      } else {
        console.error("Fetch error:", error.message);
      }
    };

    fetchMessages();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const newChannel = supabase
      .channel(`chat-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    channelRef.current = newChannel;

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (newMessage.trim() === "") {
      console.log("Empty message — not sending.");
      return;
    }

    console.log("HANDLE SEND CLICKED!", newMessage);
    console.log("Sending as user:", user);
    console.log("Channel ID:", channelId);

    if (!user?.id) {
      console.error("No user ID found! Cannot send message.");
      return;
    }
    if (!channelId) {
      console.error("No channel ID specified! Cannot send message.");
      return;
    }

    const { error } = await supabase.from("messages").insert([
      {
        text: newMessage,
        sender_id: user.id,
        channel_id: channelId,
        is_dm: false,
      },
    ]);

    if (error) {
      console.error("Send error:", error.message);
    } else {
      setNewMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-[#0f172a] rounded-xl shadow-lg w-full max-w-md h-[80vh] flex flex-col text-white">
        <div className="p-4 flex justify-between items-center border-b border-yellow-400 bg-[#1B263B] rounded-t-xl">
          <h2 className="font-bold text-lg text-yellow-400">💬 Chat Room</h2>
          <button
            onClick={onClose}
            className="text-yellow-400 font-bold text-xl hover:text-yellow-300"
          >
            ×
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-[#0f172a] space-y-3">
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${
                msg.sender_id === user?.id
                  ? "ml-auto bg-yellow-500 text-[#0f172a]"
                  : "mr-auto bg-[#1B263B] text-white"
              }`}
            >
              <p className="text-xs font-semibold mb-1">
                {msg.sender_id === user?.id
                  ? "You"
                  : msg.sender_id?.slice(0, 6) || "Anon"}
              </p>
              <p>{msg.content ?? "[no content]"}</p>
              <span className="text-[10px] text-yellow-300 mt-1 block">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-yellow-400 bg-[#1B263B]">
          <textarea
            ref={textareaRef}
            rows={2}
            className="w-full p-2 rounded-lg bg-[#0f172a] text-white border border-yellow-400 placeholder-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            className="mt-2 bg-yellow-500 text-[#0f172a] font-semibold px-4 py-2 rounded-lg hover:bg-yellow-400 w-full"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
