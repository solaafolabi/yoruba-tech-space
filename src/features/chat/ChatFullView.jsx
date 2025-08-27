// src/pages/chat/ChatFullView.jsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';
import GeneralChatbox from '../../pages/chat/GeneralChatbox';
import GroupChatView from '../../pages/chat/GroupChatView';

export default function ChatFullView({ user }) {
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  if (!user) return <div className="text-white p-6">User not logged in</div>;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f172a] border-r border-yellow-500 p-4">
        <div className="mb-6 text-yellow-400 font-bold text-xl">💬 Ìbánisọ̀rọ̀</div>
        <ChatSidebar onSelectTab={setActiveTab} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#1B263B]">
        {/* Header */}
        <div className="flex justify-between items-center bg-yellow-400 text-black px-6 py-3 border-b border-yellow-500">
          <h2 className="text-xl font-bold">
            {activeTab === 'general' ? 'Ìbánisọ̀rọ̀ Gbogbogbo' : 'Ìbánisọ̀rọ̀ Ẹgbẹ́'}
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="hover:text-red-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'general' ? (
            <GeneralChatbox user={user} />
          ) : (
            <GroupChatView user={user} />
          )}
        </div>
      </div>
    </div>
  );
}
