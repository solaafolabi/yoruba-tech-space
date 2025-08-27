// src/utils/onlineStatus.js
import supabase from "../supabaseClient";

export const setOnlineStatus = async (userId) => {
  await supabase.from("online_status").upsert({
    user_id: userId,
    is_online: true,
    last_seen: new Date().toISOString(),
  });
};

export const setOfflineStatus = async (userId) => {
  await supabase.from("online_status").update({
    is_online: false,
    last_seen: new Date().toISOString(),
  }).eq("user_id", userId);
};
