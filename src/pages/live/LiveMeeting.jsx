// src/pages/LiveMeeting.jsx
import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { JitsiMeeting } from "@jitsi/react-sdk";

export default function LiveMeeting() {
  const { roomName } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student"; // "teacher" or "student"
  const name = searchParams.get("name") || "Guest";

  const [joinClicked, setJoinClicked] = useState(false);

  // Ensure roomName exists
  if (!roomName) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0D1B2A] text-[#FFD700] text-xl font-bold">
        Invalid room name
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0D1B2A] flex flex-col">
      {/* Sticky header */}
      <div className="flex-shrink-0 p-4 text-[#FFD700] font-bold sticky top-0 z-10 bg-[#0D1B2A]">
        Live Class: {roomName} (Role: {role})
      </div>

      {/* Meeting area */}
      <div className="flex-grow h-full relative">
        {!joinClicked && (
          <div className="h-full w-full flex flex-col items-center justify-center text-[#FFD700]">
            <div className="text-2xl font-bold mb-4">
              Waiting to join as {name}...
            </div>
            <button
              onClick={() => setJoinClicked(true)}
              className="px-6 py-3 bg-[#FFD700] text-[#0D1B2A] font-bold rounded-lg hover:bg-yellow-500 transition"
            >
              Join Meeting
            </button>
          </div>
        )}

        {joinClicked && (
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            configOverwrite={{
              startWithAudioMuted: role !== "teacher",
              startWithVideoMuted: role !== "teacher",
              prejoinPageEnabled: false,
              enableLobby: false,
              enableWelcomePage: false,
              requireDisplayName: false,
            }}
            interfaceConfigOverwrite={{
              SHOW_JITSI_WATERMARK: false,
              SHOW_BRAND_WATERMARK: false,
              SHOW_POWERED_BY: false,
              SHOW_PROMOTIONAL_CLOSE_PAGE: false,
              TOOLBAR_BUTTONS: [
                "microphone",
                "camera",
                "chat",
                "raisehand",
                "tileview",
                "fullscreen",
                "hangup",
              ],
            }}
            userInfo={{ displayName: name }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = "100%";
              iframeRef.style.width = "100%";
              iframeRef.style.border = "0";
              iframeRef.style.display = "block";
            }}
          />
        )}
      </div>
    </div>
  );
}
