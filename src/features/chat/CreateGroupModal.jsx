import React, { useState } from 'react';
import supabase from '../../supabaseClient';

export default function CreateGroupModal({ onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    const user = (await supabase.auth.getUser()).data.user;

    const { data, error } = await supabase.from('chat_rooms').insert({
      name: groupName,
      created_by: user.id,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setGroupName('');
      onGroupCreated(); // Refresh list
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Create New Group</h2>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-2">✅ Group created!</p>}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
