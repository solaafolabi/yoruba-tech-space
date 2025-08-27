// /pages/chat/ChatModal.jsx
import { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GeneralChatbox from './GeneralChatbox';
import GroupChatView from './GroupChatView';
import ChatSidebar from './ChatSidebar';

export default function ChatModal({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-[#1B263B] border border-yellow-500 rounded-xl shadow-2xl w-[720px] max-h-[600px] overflow-hidden text-white flex">
          {/* Sidebar */}
          <div className="w-56 bg-[#0f172a] border-r border-yellow-500">
            <ChatSidebar isModal onSelectTab={setActiveTab} />
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center bg-yellow-400 text-black px-4 py-2">
              <span className="font-bold text-lg">
                {activeTab === 'general' ? 'Ìbánisọ̀rọ̀ Gbogbogbo' : 'Ìbánisọ̀rọ̀ Ẹgbẹ́'}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/chat/full');
                  }}
                  className="hover:text-blue-600 transition"
                  title="Open Full View"
                >
                  <Maximize2 size={20} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:text-red-600 transition"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-3 flex-1 overflow-y-auto bg-[#1B263B]">
              {activeTab === 'general' ? (
                <GeneralChatbox user={user} />
              ) : (
                <GroupChatView user={user} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-yellow-400 text-black px-4 py-2 rounded-full shadow-lg font-bold hover:bg-yellow-300 transition"
          title="Open Chat"
        >
          💬
        </button>
      )}
    </div>
  );
}
