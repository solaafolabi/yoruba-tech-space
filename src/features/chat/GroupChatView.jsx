import { useEffect, useState } from 'react';
import { Pencil, Trash2, Lock, Unlock } from 'lucide-react';
import supabase from '../../supabaseClient';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import GroupChatbox from './GroupChatbox';

export default function GroupChatView({ user }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [editingRoom, setEditingRoom] = useState(null);
  const [editName, setEditName] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at');

    if (!error) setRooms(data || []);
  };

  const fetchAdminStatus = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    setIsAdmin(data?.is_admin === true);
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({ name: newRoomName })
      .select()
      .single();

    if (!error && data) {
      setRooms((prev) => [...prev, data]);
      setNewRoomName('');
    }
  };

  const updateRoomName = async () => {
    if (!editName.trim()) return;
    const { data, error } = await supabase
      .from('chat_rooms')
      .update({ name: editName })
      .eq('id', editingRoom.id)
      .select()
      .single();

    if (!error && data) {
      setRooms((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      setEditingRoom(null);
      setEditName('');
    }
  };

  const toggleLock = async (room) => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .update({ is_locked: !room.is_locked })
      .eq('id', room.id)
      .select()
      .single();

    if (!error && data) {
      setRooms((prev) => prev.map((r) => (r.id === room.id ? data : r)));
    }
  };

  const deleteRoom = async () => {
    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', confirmDelete.id);

    if (!error) {
      setRooms((prev) => prev.filter((r) => r.id !== confirmDelete.id));
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchAdminStatus();
  }, []);

  if (selectedRoom) {
    return (
      <div className="bg-[#1B263B] p-4 rounded-lg text-white">
        <button
          onClick={() => setSelectedRoom(null)}
          className="mb-3 text-yellow-400 hover:underline text-sm"
        >
          ← Bọ sí àtòjọ ẹgbẹ́
        </button>
        <GroupChatbox user={user} room={selectedRoom} />
      </div>
    );
  }

  return (
    <div className="bg-[#1B263B] p-4 rounded-lg text-white">
      {isAdmin && (
        <div className="flex mb-4">
          <input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Orúkọ ẹgbẹ́ tuntun..."
            className="flex-1 px-3 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-l focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400"
          />
          <button
            onClick={createRoom}
            disabled={!newRoomName.trim()}
            className={`px-4 py-2 rounded-r font-semibold transition ${
              newRoomName.trim()
                ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                : 'bg-gray-500 text-white cursor-not-allowed'
            }`}
          >
            ➕ Ṣẹda Ẹgbẹ́
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {rooms.length === 0 ? (
          <p className="text-sm text-gray-400 italic">🚫 Ko si ẹgbẹ́ kankan tí a ṣẹda.</p>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between px-4 py-2 bg-[#0f172a] border border-gray-700 rounded hover:bg-[#16263b] transition"
            >
              <button
                onClick={() => setSelectedRoom(room)}
                className="text-left flex-1 text-white"
              >
                {room.name} {room.is_locked && <span className="text-red-500 ml-2">🔒</span>}
              </button>

              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingRoom(room); setEditName(room.name); }} title="Ṣatúnṣe">
                    <Pencil className="w-4 h-4 text-yellow-400" />
                  </button>
                  <button onClick={() => toggleLock(room)} title={room.is_locked ? 'Ṣí ẹgbẹ́' : 'Ti ẹgbẹ́'}>
                    {room.is_locked ? (
                      <Unlock className="w-4 h-4 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button onClick={() => setConfirmDelete(room)} title="Pa ẹgbẹ́ rẹ́">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-2 text-white">✍🏾 Ṣatúnṣe Orúkọ Ẹgbẹ́</h2>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Orúkọ tuntun..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setEditingRoom(null)}>Fagilé</Button>
            <Button onClick={updateRoomName}>Gba</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <h2 className="text-lg font-semibold text-white">⚠️ Ríráyẹwo</h2>
          <p className="text-white">Ṣé o dájú pé o fẹ́ pa ẹgbẹ́ "{confirmDelete?.name}" rẹ́?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Rárá</Button>
            <Button variant="destructive" onClick={deleteRoom}>Bẹẹni, pa á</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
