import React, { useEffect, useState } from "react";
import supabase from "./supabaseClient"; // adjust path
import ChildrenDashboardLayout from "./ChildrenDashboardLayout";

export default function ParentWrapper({ session, children }) {
  const [userAgeRange, setUserAgeRange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAgeRange() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles") // your profile table
        .select("age_range") // column storing age range
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Failed to fetch user age range:", error);
      } else {
        setUserAgeRange(data?.age_range || null);
      }
      setLoading(false);
    }

    fetchUserAgeRange();
  }, [session]);

  if (loading) return <div>Loading...</div>;
  if (!userAgeRange)
    return <div>Could not determine age range for user.</div>;

  return (
    <ChildrenDashboardLayout session={session} userAgeRange={userAgeRange}>
      {children}
    </ChildrenDashboardLayout>
  );
}
