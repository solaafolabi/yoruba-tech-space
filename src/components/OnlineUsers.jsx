import { useEffect, useState } from "react";
import supabase from "../supabaseClient";

const OnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  const fetchOnlineUsers = async () => {
    const { data, error } = await supabase
      .from("online_status")
      .select("user_id, profiles(username, avatar_url)")
      .eq("is_online", true);

    if (!error) setOnlineUsers(data);
  };

  useEffect(() => {
    fetchOnlineUsers();

    const channel = supabase
      .channel("online-users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "online_status" },
        () => fetchOnlineUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      <h2 className="font-bold mb-2">🟢 Online Now</h2>
      <ul>
        {onlineUsers.map((u) => (
          <li key={u.user_id} className="flex items-center gap-2">
            <img
              src={u.profiles?.avatar_url || "/default-avatar.png"}
              className="w-6 h-6 rounded-full"
              alt=""
            />
            {u.profiles?.username || u.user_id}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnlineUsers;
