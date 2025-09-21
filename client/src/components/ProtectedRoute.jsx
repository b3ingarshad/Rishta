import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/auth/sign-in" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/auth/sign-in" />;

  return children;
};

export default ProtectedRoute;
