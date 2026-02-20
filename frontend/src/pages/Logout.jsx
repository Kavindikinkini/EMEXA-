import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect immediately to login
    navigate("/login", { replace: true });
  }, [navigate]);

  return null;
}
