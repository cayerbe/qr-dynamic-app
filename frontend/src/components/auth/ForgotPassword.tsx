// src/components/auth/ForgotPassword.tsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react"; // Removed CheckCircle

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("❌ Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email);
      setMessage("✅ Check your inbox for password reset instructions.");
    } catch (err) {
      setError("❌ Failed to send reset instructions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">
            Reset Your Password
          </h2>
          <p className="text-gray-600 mt-2">
            Enter your email and we’ll send a reset link.
          </p>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Display Error or Success Messages */}
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Reset Password"}
            </button>
          </div>
        </form>

        {/* ✅ Added Return to Login Button */}
        <div className="text-center mt-6">
          <Link to="/login" className="text-blue-600 hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
