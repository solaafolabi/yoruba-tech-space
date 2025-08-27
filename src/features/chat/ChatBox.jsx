import { useEffect, useState, useRef } from 'react';
import supabase from '../../supabaseClient';
import TypingPresence from '../../pages/chat/TypingPresence';

export default function GroupChatbox({ user, room }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const channelRef = useRef(null);
  const messageBoxRef = useRef(null);

  // 🚫 Guard if user or room is not yet loaded
  if (!user || !room || !room.id) {
    return (
      <div className="text-center text-gray-400 p-4">
        Yàn ẹgbẹ́ kan láti bẹ̀rẹ̀ ìbánisọ̀rọ̀.
      </div>
    );
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(id, username)')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true });

    setMessages(data || []);

    const unreadIds = data
      ?.filter((msg) => msg.sender_id !== user.id && !msg.is_read)
      .map((msg) => msg.id);

    if (unreadIds?.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadIds);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    await supabase.from('messages').insert({
      sender_id: user.id,
      content: text,
      room_id: room.id,
      is_read: false,
    });

    setText('');
    channelRef.current?.track({ typing: false });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    channelRef.current?.track({ typing: true });

    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      channelRef.current?.track({ typing: false });
    }, 1500);
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase.channel(`room-${room.id}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new;
          if (msg.room_id === room.id) {
            setMessages((prev) => [...prev, msg]);

            if (msg.sender_id !== user.id) {
              await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', msg.id);
            }
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, user.id]);

  return (
    <div className="max-w-xl mx-auto border border-yellow-600 rounded shadow p-4 bg-[#1B263B] text-white mt-4">
      <h2 className="text-xl font-bold mb-3 text-yellow-400">Ìbánisọ̀rọ̀ ẹgbẹ́: {room.name}</h2>

      <div
        ref={messageBoxRef}
        className="h-64 overflow-y-auto p-2 border border-gray-600 bg-[#0f172a] rounded mb-2 space-y-2"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${
              msg.sender_id === user.id ? 'text-right text-yellow-400' : 'text-left text-white'
            }`}
          >
            <span className="block font-semibold">{msg.sender?.username || 'Anon'}</span>
            <span>{msg.content}</span>
            {msg.sender_id === user.id && msg.is_read && (
              <span className="block text-xs text-gray-400">✓ Read</span>
            )}
          </div>
        ))}
      </div>

      {/* 👥 Typing presence */}
      <TypingPresence
        userId={user.id}
        chatRoomId={room.id}
        showNamesInGroup={true}
      />

      {/* 📝 Input */}
      <div className="flex mt-3">
        <input
          value={text}
          onChange={handleTyping}
          className="flex-1 bg-[#0f172a] border border-gray-600 text-white p-2 rounded-l focus:outline-none focus:ring focus:ring-yellow-500"
          placeholder="Sọ̀rọ̀ rẹ nibi..."
        />
        <button
          onClick={sendMessage}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 rounded-r font-semibold"
        >
          Rán
        </button>
      </div>
    </div>
  );
}
