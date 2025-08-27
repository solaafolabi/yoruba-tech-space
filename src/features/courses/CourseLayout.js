import React from "react";
import StudentSidebar from "../../components/StudentSidebar"; // update path if needed

export default function CourseLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0D1B2A]">
      <StudentSidebar />
      <div className="flex-1 p-4 overflow-y-auto">{children}</div>
    </div>
  );
}
