import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const PasswordResetSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Password Changed</h2>
        <p className="text-gray-600 mt-2">
          You can now sign in with your new password.
        </p>

        {/* Button to Navigate Back to Login */}
        <button
          onClick={() => navigate("/login")}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md text-lg hover:bg-blue-700 transition-colors"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default PasswordResetSuccess;
