import { useContext } from "react";
import { Context } from "../utils/Context";
import { Navigate } from "react-router";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(Context);
  if (loading) return null;
  if (user != null) {
    return children;
  } else {
    return <Navigate to="/" replace={true} />;
  }
};

export default ProtectedRoute;
