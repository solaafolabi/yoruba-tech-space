import { useEffect, useState } from 'react';
import supabase from '../../supabaseClient';

export default function RoomList({ user, onEnterRoom }) {
  const [rooms, setRooms] = useState([]);
  const [joinedRoomIds, setJoinedRoomIds] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');

  const fetchRooms = async () => {
    const { data, error } = await supabase.from('rooms').select('*').order('created_at');
    if (error) console.error('❌ Fetch rooms error:', error.message);
    setRooms(data || []);
  };

  const fetchJoinedRooms = async () => {
    const { data, error } = await supabase
      .from('room_participants')
      .select('room_id')
      .eq('user_id', user.id);
    if (error) console.error('❌ Fetch joined rooms error:', error.message);
    setJoinedRoomIds(data.map((r) => r.room_id));
  };

  const joinRoom = async (roomId) => {
    const { error } = await supabase
      .from('room_participants')
      .insert({ user_id: user.id, room_id: roomId });

    if (!error) {
      setJoinedRoomIds((prev) => [...prev, roomId]);
    } else {
      alert('Error joining room: ' + error.message);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    const { data, error } = await supabase
      .from('rooms')
      .insert({ name: newRoomName })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating room:', error.message);
      alert('Failed to create room: ' + error.message);
      return;
    }

    if (data) {
      await joinRoom(data.id);
      setRooms((prev) => [...prev, data]);
      setNewRoomName('');
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchJoinedRooms();
  }, []);

  return (
    <div className="bg-[#1B263B] text-white p-4 rounded-xl max-w-md mx-auto shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">📚 Àwọn Yàrá Ìbánisọ̀rọ̀</h2>

      {/* Create Room */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 p-2 rounded bg-[#0f172a] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white placeholder:text-gray-400"
          placeholder="Fọ́ọ̀mù orúkọ yàrá tuntun..."
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button
          onClick={createRoom}
          disabled={!newRoomName.trim()}
          className={`px-4 py-2 rounded font-semibold shadow transition ${
            newRoomName.trim()
              ? 'bg-yellow-500 text-black hover:bg-yellow-400 hover:shadow-lg'
              : 'bg-gray-500 text-white cursor-not-allowed'
          }`}
        >
          ➕ Ṣẹda
        </button>
      </div>

      {/* Room List */}
      <ul className="space-y-3 max-h-[300px] overflow-y-auto">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="bg-[#0f172a] border border-gray-700 p-3 rounded flex justify-between items-center hover:bg-[#16263b] transition"
          >
            <span className="font-semibold text-white">{room.name}</span>
            {joinedRoomIds.includes(room.id) ? (
              <button
                onClick={() => onEnterRoom(room)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm transition"
              >
                👁‍🗨 Ṣàbẹwò
              </button>
            ) : (
              <button
                onClick={() => joinRoom(room.id)}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm transition"
              >
                ➕ Darapọ̀
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
