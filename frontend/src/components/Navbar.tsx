import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar: React.FC = () => {
  const { logout, isAuthenticated, isAdmin, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for public view parameter
  const urlParams = new URLSearchParams(location.search);
  const isPublicView = urlParams.get("public") === "true";

  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/password-reset-success",
  ];

  const shouldHideNavbar =
    (!isAuthenticated && publicPaths.includes(location.pathname)) ||
    isPublicView; // Hide navbar for public view

  if (shouldHideNavbar) return null;

  return (
    <nav className="fixed top-0 left-0 w-full h-[60px] bg-blue-600 flex justify-between items-center px-4 z-[9999]">
      <div className="flex space-x-6 items-center">
        {/* 1. Dashboard - Generate QR */}
        <Link
          to="/dashboard"
          className={`text-white font-semibold hover:bg-blue-800 px-3 py-2 rounded ${
            location.pathname === "/dashboard" ? "bg-blue-800" : ""
          }`}
        >
          Dashboard
        </Link>

        {/* 2. My QR Codes - List/Manage */}
        <Link
          to="/my-qr-codes"
          className={`text-white font-semibold hover:bg-blue-800 px-3 py-2 rounded ${
            location.pathname === "/my-qr-codes" ? "bg-blue-800" : ""
          }`}
        >
          My QR Codes
        </Link>

        {/* 3. Scan Analytics - Global Activity */}
        <Link
          to="/scan-analytics"
          className={`text-white font-semibold hover:bg-blue-800 px-3 py-2 rounded ${
            location.pathname === "/scan-analytics" ? "bg-blue-800" : ""
          }`}
        >
          Scan Analytics
        </Link>

        {/* 4. Verify QR - CDP Check */}
        <Link
          to="/verify-qr"
          className={`text-white font-semibold hover:bg-blue-800 px-3 py-2 rounded ${
            location.pathname === "/verify-qr" ? "bg-blue-800" : ""
          }`}
        >
          Verify QR
        </Link>

        {/* 5. Ferrari Demo */}
        <Link
          to="/ferrari-demo"
          className={`text-yellow-500 font-semibold hover:bg-yellow-700 px-3 py-2 rounded ${
            location.pathname === "/ferrari-demo" ? "bg-yellow-700" : ""
          }`}
        >
          🏎️ Ferrari Demo
        </Link>

        {/* Admin-only links */}
        {isAdmin && (
          <>
            <Link
              to="/admin/dashboard"
              className="text-white font-semibold hover:underline"
            >
              Admin Dashboard
            </Link>
            <Link
              to="/admin/users"
              className="text-white font-semibold hover:underline"
            >
              User Management
            </Link>
            <Link
              to="/admin/qr-management"
              className="text-white font-semibold hover:underline"
            >
              QR Management
            </Link>
          </>
        )}
      </div>

      {/* Logout button for any authenticated user */}
      {isAuthenticated && (
        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-700 text-white"
        >
          Logout
        </button>
      )}
    </nav>
  );
};

export default Navbar;
