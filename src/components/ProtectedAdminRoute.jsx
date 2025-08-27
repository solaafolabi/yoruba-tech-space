import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const ProtectedAdminRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        navigate("/admin/login"); // redirect to admin login if not logged in
      }
    };

    checkSession();
  }, [navigate]);

  return children;
};

export default ProtectedAdminRoute;
