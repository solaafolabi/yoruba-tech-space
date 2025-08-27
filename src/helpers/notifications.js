// src/helpers/notifications.js
import supabase from "../supabaseClient";

/**
 * Send a single notification to a user
 */
export async function sendNotification({
  user_id,
  title_en,
  title_yo,
  message_en,
  message_yo,
  type = "system",
}) {
  try {
    const { error } = await supabase.from("notifications").insert([
      {
        user_id,
        title_en,
        title_yo,
        message_en,
        message_yo,
        type,
      },
    ]);
    if (error) throw error;
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendBulkNotifications({
  user_ids,
  title_en,
  title_yo,
  message_en,
  message_yo,
  type = "system",
}) {
  try {
    const payload = user_ids.map((id) => ({
      user_id: id,
      title_en,
      title_yo,
      message_en,
      message_yo,
      type,
    }));

    const { error } = await supabase.from("notifications").insert(payload);
    if (error) throw error;
  } catch (err) {
    console.error("Error sending bulk notifications:", err);
  }
}

/**
 * Fetch notifications for a user
 */
export async function fetchNotifications(user_id) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notification_id) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notification_id);

  if (error) console.error("Error marking notification as read:", error);
}

/**
 * Get target users based on category
 * categories: "all", "parents", "students", "adults", "admins", "children:4-7", "children:8-10", etc.
 */
export async function getTargetUsers(category) {
  try {
    if (category === "all") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .neq("is_admin", true); // exclude admins if you want
      if (error) throw error;
      return data.map((u) => u.id);
    }

    if (category === "parents") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "parent");
      if (error) throw error;
      return data.map((u) => u.id);
    }

    if (category === "students") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "student");
      if (error) throw error;
      return data.map((u) => u.id);
    }

    if (category === "adults") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "adult");
      if (error) throw error;
      return data.map((u) => u.id);
    }

    if (category === "admins") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_admin", true);
      if (error) throw error;
      return data.map((u) => u.id);
    }

    if (category.startsWith("children:")) {
      const ageRange = category.split(":")[1];
      const { data, error } = await supabase
        .from("children")
        .select("parent_id")
        .eq("age_range", ageRange);
      if (error) throw error;
      return data.map((c) => c.parent_id);
    }

    return [];
  } catch (err) {
    console.error("Error getting target users:", err);
    return [];
  }
}
