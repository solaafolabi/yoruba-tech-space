import {
  MoreHorizontal, Reply, Share2, Bell, Save, Copy, Link2, Clock, EyeOff, Pin
} from 'lucide-react';
import { useState, useRef } from 'react';

export default function MessageActionsDropdown({ onReply, onCopyText }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleCopyText = () => {
    onCopyText();
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="hover:bg-gray-700 p-1 rounded-full"
        title="More actions"
      >
        <MoreHorizontal className="text-white" size={18} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-56 bg-[#1B263B] border border-gray-700 text-white rounded-md shadow-xl z-50"
        >
          <ul className="text-sm">
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-[#0f172a] cursor-pointer" onClick={onReply}>
              <Reply size={16} /> Reply <span className="ml-auto text-gray-400">R</span>
            </li>
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-[#0f172a] cursor-pointer">
              <Share2 size={16} /> Forward <span className="ml-auto text-gray-400">Shift+F</span>
            </li>
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-[#0f172a] cursor-pointer">
              <EyeOff size={16} /> Mark as Unread <span className="ml-auto text-gray-400">U</span>
            </li>
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-[#0f172a] cursor-pointer">
              <Clock size={16} /> Remind
            </li>
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-[#0f172a] cursor-pointer">
              <Save size={16} /> Save Message <span className="ml-auto text-gray-400">S</span>
            </li>
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-[#0f172a] cursor-pointer">
              <Pin size={16} /> Pin to Channel <span className="ml-auto text-gray-400">P</span>
            </li>
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-[#0f172a] cursor-pointer">
              <Link2 size={16} /> Copy Link
            </li>
            <li
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#0f172a] cursor-pointer"
              onClick={handleCopyText}
            >
              <Copy size={16} /> Copy Text <span className="ml-auto text-gray-400">C</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
