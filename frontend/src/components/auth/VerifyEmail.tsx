import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "../../supabase/client";

type VerificationStatus =
  | "verifying"
  | "success"
  | "error"
  | "resending"
  | "resent";

const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        if (user.email_confirmed_at) {
          setStatus("success");
          setTimeout(() => navigate("/dashboard"), 5000);
        } else {
          setStatus("error");
          setError("Your email is not verified. Please check your inbox.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setError("Verification failed. Try again.");
      }
    };

    checkVerification();
  }, [navigate]);

  const handleResendVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      setError("You must log in before resending the verification email.");
      return;
    }

    try {
      setStatus("resending");
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (error) throw error;
      setStatus("resent");
    } catch (error) {
      console.error("Resend error:", error);
      setStatus("error");
      setError("Failed to resend verification email. Please try again.");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-blue-500 animate-pulse mb-4" />
            <p className="text-xl">Verifying your email address...</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
              <CheckCircle className="mr-2 h-6 w-6" />
              <div>
                <p className="font-bold">Email Verified Successfully!</p>
                <p>Redirecting to dashboard in 5 seconds...</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-6 w-6" />
              <div>
                <p className="font-bold">Verification Required</p>
                <p>{error}</p>
              </div>
            </div>
            <button
              onClick={handleResendVerification}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <RefreshCw className="mr-2" />
              Resend Verification Email
            </button>
            <div className="mt-4">
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:underline"
              >
                Return to Login
              </button>
            </div>
          </div>
        );

      case "resending":
        return (
          <div className="text-center">
            <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-xl">Resending verification email...</p>
          </div>
        );

      case "resent":
        return (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
              <CheckCircle className="mr-2 h-6 w-6" />
              <div>
                <p className="font-bold">Verification Email Sent!</p>
                <p>Check your inbox and verify your email.</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline"
            >
              Return to Login
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Email Verification
          </h1>
        </header>

        <main>{renderContent()}</main>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} Dynamic QR Code Platform. All rights
            reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default VerifyEmail;
