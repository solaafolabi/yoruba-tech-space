// src/pages/chat/general.jsx
import GeneralLayout from './GeneralLayout';
import GeneralChatbox from './GeneralChatbox';

export default function GeneralPage() {
  return (
    <GeneralLayout>
      <div className="p-4 h-full overflow-hidden">
        <GeneralChatbox />
      </div>
    </GeneralLayout>
  );
}
