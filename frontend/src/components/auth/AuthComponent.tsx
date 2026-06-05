// src/components/auth/AuthComponent.tsx
import React, { useState } from "react";
import { AuthService } from "../../supabase/authService";

enum AuthMode {
  LOGIN,
  REGISTER,
}

interface UserRole {
  role: "admin" | "inspector" | "manufacturer";
}

const AuthComponent: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [role, setRole] = useState<UserRole["role"]>("manufacturer");
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await AuthService.googleSignIn();
    } catch (error) {
      console.error("Google Sign-In Error", error);
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  const handleEmailSignUp = async () => {
    try {
      setError(null);
      const result = await AuthService.register(email, password, "");
      if (!result.success) {
        throw new Error(result.message);
      }
      // Note: With Supabase, roles are best managed via backend trigger or explicit backend call
      // The default register in AuthService creates a "user" role.
    } catch (error: any) {
      console.error("Sign Up Error", error);
      setError(error.message || "Failed to create account. Please try again.");
    }
  };

  const handleEmailSignIn = async () => {
    try {
      setError(null);
      const result = await AuthService.login(email, password);
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Sign In Error", error);
      setError(error.message || "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            {mode === AuthMode.LOGIN ? "Sign In" : "Create Account"}
          </h1>
        </div>

        {error && (
          <div className="p-3 mb-3 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {mode === AuthMode.REGISTER && (
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Account Type
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole["role"])}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="inspector">Inspector</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <div className="pt-2">
            {mode === AuthMode.LOGIN ? (
              <button
                onClick={handleEmailSignIn}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={handleEmailSignUp}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Register
              </button>
            )}
          </div>

          <div>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="mr-2">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
              </span>
              Sign In with Google
            </button>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={() => {
                setMode(
                  mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN,
                );
                setError(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {mode === AuthMode.LOGIN
                ? "Need an account? Register"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;
