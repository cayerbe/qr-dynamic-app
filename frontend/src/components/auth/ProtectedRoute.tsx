import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Spinner from "../common/Spinner";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRoles?: Array<"user" | "admin" | "manufacturer" | "inspector">;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  adminOnly = false,
}) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Add state to prevent multiple redirects
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);

  // Log auth state changes only, not on every render
  useEffect(() => {
    console.log("🔒 Protected Route Auth State:", {
      path: location.pathname,
      loading,
      isAuthenticated,
      currentUser: currentUser
        ? `${currentUser.email} (${currentUser.role || "no role"})`
        : "none",
    });
  }, [loading, isAuthenticated, currentUser, location.pathname]);

  // Don't render anything until we're sure about the auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="medium" color="blue" />
      </div>
    );
  }

  // Only redirect once to prevent loops
  if (!isAuthenticated && !hasAttemptedRedirect) {
    console.log("Not authenticated, redirecting to login (once)");
    setHasAttemptedRedirect(true);
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Admin-only route protection
  if (isAuthenticated && adminOnly && currentUser?.role !== "admin") {
    console.log("Not admin, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // Role-based access control
  if (
    isAuthenticated &&
    requiredRoles?.length &&
    (!currentUser?.role || !requiredRoles.includes(currentUser.role))
  ) {
    console.log(
      `Role ${currentUser?.role} not in required roles, redirecting to dashboard`,
    );
    return <Navigate to="/dashboard" replace />;
  }

  // Allow access if all checks pass
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
