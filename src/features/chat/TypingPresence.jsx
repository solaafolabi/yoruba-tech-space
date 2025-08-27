// TypingPresence.jsx
import { useEffect, useState } from 'react';
import supabase from './../../supabaseClient';

export default function TypingPresence({ userId, chatRoomId, otherUserId, otherUserName }) {
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const channelId = `room-${chatRoomId}`;

  useEffect(() => {
    const channel = supabase.channel(channelId, {
      config: {
        presence: { key: userId },
      },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ typing: false });
      }
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const other = state[otherUserId]?.[0];
      setOtherIsTyping(other?.typing || false);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, otherUserId, chatRoomId]);

  return otherIsTyping ? (
    <div className="text-sm italic text-gray-500 mt-1">{otherUserName} ń kọ̀wé...</div>
  ) : null;
}
