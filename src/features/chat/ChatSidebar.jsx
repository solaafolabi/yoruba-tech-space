// /pages/chat/ChatSidebar.jsx

export default function ChatSidebar({ activeTab, onSelectTab, isModal }) {
  return (
    <div className={`flex flex-col text-white ${isModal ? 'w-full md:w-60' : 'w-60'} h-full`}>
      <div className="p-4 border-b border-yellow-500 bg-[#0f172a]">
        <h2 className="text-lg font-bold text-yellow-400">💬 Channels</h2>
      </div>

      <div className="flex flex-col gap-1 px-2 py-4 flex-1 overflow-y-auto">
        <button
          onClick={() => onSelectTab('general')}
          className={`text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-500/20 transition ${
            activeTab === 'general' ? 'bg-yellow-500/10 text-yellow-300' : 'text-white'
          }`}
        >
          🌍 General Chat
        </button>

        <button
          onClick={() => onSelectTab('group')}
          className={`text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-500/20 transition ${
            activeTab === 'group' ? 'bg-yellow-500/10 text-yellow-300' : 'text-white'
          }`}
        >
          👥 Group Rooms
        </button>

        {/* Future: Admin-only create group */}
        {/* <button className="mt-4 text-left text-yellow-400 text-xs">+ Create Group</button> */}
      </div>
    </div>
  );
}
