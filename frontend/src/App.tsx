import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RecentQRProvider } from "./contexts/RecentQRContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Auth Components
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import EnhancedLoginUI from "./components/auth/Login";
import Register from "./components/auth/Registration";
import PasswordResetSuccess from "./components/auth/PasswordResetSuccess";

// Main Components
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";

// QR Management Components
import QRManagement from "./components/qr-management/QRManagement";
import ManualVerification from "./components/qr-management/ManualVerification";
import CDPVisualizationWrapper from "./components/qr-management/CDPVisualizationWrapper";
import CDPVisualization from "./components/qr-management/CDPVisualization";
import QRCodeDetailsPage from "./components/qr-management/QRCodeDetailsPage";
import ScanTracking from "./components/qr-management/ScanTracking";
import QRVerification from "./components/qr-management/QRVerification";

// Admin Components
import AdminDashboard from "./components/admin/AdminDashboard";
import UserManagement from "./components/admin/UserManagement";

// Public Components
import PublicQRVerification from "./components/public/PublicQRVerification";
import AutoVerification from "./components/public/AutoVerification";

// Ferrari Components
import FerrariDashboard from "./components/ferrari/FerrariDashboard";

// Import CSS
import "./index.css";

// Hook to detect public view
const useIsPublicView = () => {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  return urlParams.get("public") === "true";
};

// Main App Layout
const AppLayout: React.FC = () => {
  const isPublicView = useIsPublicView();

  return (
    <div className="App">
      {/* Only render navbar for non-public users */}
      {!isPublicView && <Navbar />}

      {/* Main content with conditional styling */}
      <main className={isPublicView ? "public-main" : "main-content"}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<EnhancedLoginUI />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/password-reset-success"
            element={<PasswordResetSuccess />}
          />
          <Route path="/verify" element={<PublicQRVerification />} />
          <Route path="/auto-verify" element={<AutoVerification />} />
          <Route path="/ferrari-demo" element={<FerrariDashboard />} />

          {/* Protected Routes - Main Navigation */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* My QR Codes - List/Management */}
          <Route
            path="/my-qr-codes"
            element={
              <ProtectedRoute>
                <QRManagement />
              </ProtectedRoute>
            }
          />

          {/* Scan Analytics - Using QRVerification which has scan tracking */}
          <Route
            path="/scan-analytics"
            element={
              <ProtectedRoute>
                <QRVerification />
              </ProtectedRoute>
            }
          />

          {/* Verify QR - Manual CDP Verification */}
          <Route
            path="/verify-qr"
            element={
              <ProtectedRoute>
                <ManualVerification />
              </ProtectedRoute>
            }
          />

          {/* Detail Pages (accessed from other pages) */}
          <Route
            path="/qr-details/:qrId"
            element={
              isPublicView ? (
                <QRCodeDetailsPage />
              ) : (
                <ProtectedRoute>
                  <QRCodeDetailsPage />
                </ProtectedRoute>
              )
            }
          />
          <Route
            path="/cdp-visualization/:qrId"
            element={
              <ProtectedRoute>
                <CDPVisualizationWrapper />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly={true}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Conditional styles */}
      <style>{`
        .public-main {
          width: 100%;
          min-height: 100vh;
          padding: 0;
          margin: 0;
        }

        .main-content {
          /* Your existing main content styles */
          padding-top: 64px; /* Adjust based on your navbar height */
        }

        /* Ensure public view has no navbar artifacts */
        .public-main * {
          box-sizing: border-box;
        }

        @media print {
          .main-content {
            padding-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <RecentQRProvider>
          <AppLayout />
        </RecentQRProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
