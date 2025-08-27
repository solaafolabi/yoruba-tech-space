import React, { useState, useEffect } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../../supabaseClient"; // adjust path accordingly

export default function ChildrenDashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState(null);

//Get Current Seesion 
 useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => {
    subscription?.unsubscribe();
  };
}, []);


  return (
    <div className="min-h-screen flex bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-56 bg-white shadow-2xl">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} session={session} />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-56 bg-white shadow-2xl z-50 md:hidden"
            >
              <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} session={session} />
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg shadow hover:bg-red-600"
              >
                ✖
              </button>
            </motion.div>

            {/* Dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Topbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
