import React, { useState, useEffect } from "react";
import ParentSidebar from "./ParentSidebar";
import ParentTopbar from "./ParentTopbar";
import { Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "../../../supabaseClient";

export default function ParentDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const { ready } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (isMounted) {
          setSession(data.session);
          if (!data.session) {
            navigate("/login", { replace: true });
          }
        }
      } catch {
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (isMounted) {
          setSession(currentSession);
          if (!currentSession) navigate("/login", { replace: true });
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // ✅ Use your global spinner instead of text
  if (loading || loadError || !ready) {
    return null; // Let your global spinner show instead
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <ParentSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ParentTopbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
