import React, { useEffect, useState } from 'react';
import supabase from '../../supabaseClient';

export default function GroupChatList() {
  const [groups, setGroups] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newName, setNewName] = useState('');

  const fetchGroups = async () => {
    const { data, error } = await supabase.from('chat_rooms').select('*');
    setGroups(data || []);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = async (id) => {
    await supabase.from('chat_rooms').delete().eq('id', id);
    fetchGroups();
  };

  const handleEdit = async () => {
    await supabase.from('chat_rooms').update({ name: newName }).eq('id', editingGroup.id);
    setEditingGroup(null);
    setNewName('');
    fetchGroups();
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold">📂 Your Chat Rooms</h3>

      {groups.map((group) => (
        <div
          key={group.id}
          className="flex items-center justify-between bg-gray-100 p-3 rounded"
        >
          <span>{group.name}</span>
          <div className="space-x-2">
            <button
              onClick={() => {
                setEditingGroup(group);
                setNewName(group.name);
              }}
              className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleDelete(group.id)}
              className="bg-red-500 text-white px-2 py-1 rounded text-sm"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}

      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-2">Edit Group</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingGroup(null)}
                className="bg-gray-400 px-4 py-2 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="bg-blue-600 px-4 py-2 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
