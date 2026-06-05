import * as Yup from "yup";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthService } from "../../supabase/authService";
import Alert from "../common/Alert";

// Validation Schema
const validationSchema = Yup.object({
  firstName: Yup.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters")
    .matches(/^[A-Za-z]+$/, "First name can only contain alphabetic characters")
    .required("First name is required"),
  lastName: Yup.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters")
    .matches(
      /^[A-Za-z\s]+$/,
      "Last name can only contain alphabetic characters and spaces",
    )
    .required("Last name is required"),
  displayName: Yup.string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters")
    .required("Display name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

// More specific error interface
interface RegistrationErrors {
  [key: string]: string | undefined;
  general?: string;
}

// Type for form data
interface RegistrationFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

const Register: React.FC = () => {
  // Explicitly type state with RegistrationFormData
  const [formData, setFormData] = useState<RegistrationFormData>({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  // Use the RegistrationErrors interface
  const [error, setError] = useState<RegistrationErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    try {
      await validationSchema.validateAt(name, { [name]: value });
      setError((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    } catch (validationError) {
      if (validationError instanceof Yup.ValidationError) {
        setError((prev) => ({
          ...prev,
          [name]: (validationError as { message: string }).message,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError({});
    setSuccess(false);

    try {
      // Validate form fields using the validation schema
      await validationSchema.validate(formData, { abortEarly: false });

      // IMPORTANT CHANGE: Use Firebase directly instead of mixing API and Firebase
      try {
        // Use AuthService for registration
        await AuthService.register(
          formData.email,
          formData.password,
          formData.displayName,
        );

        console.log("✅ Registration successful!");
        setSuccess(true);

        // Wait a bit before redirecting
        setTimeout(() => {
          navigate("/dashboard");
        }, 200);
      } catch (authError: any) {
        console.error("Auth registration error:", authError);

        // Handle specific errors
        if (authError.message?.includes("already in use")) {
          setError({ email: "This email is already registered. Please log in." });
        } else {
          setError({
            general:
              authError.message || "Registration failed. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);

      if (error instanceof Yup.ValidationError) {
        // Validation error occurred
        const validationErrors: RegistrationErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            validationErrors[err.path] = err.message;
          }
        });
        setError(validationErrors);
      } else {
        // Fallback error message
        setError({
          general:
            "Registration failed. Please check your information and try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const user = await AuthService.googleSignIn();
      console.log("✅ Google sign-in successful:", user);

      // Wait a bit before redirecting
      setTimeout(() => {
        navigate("/dashboard");
      }, 200);
    } catch (error: any) {
      console.error("❌ Google sign-in error:", error);

      // Handle specific Google Sign-In errors
      if (error.code === "auth/account-exists-with-different-credential") {
        setError({
          general: "An account already exists with a different credential",
        });
      } else if (error.code === "auth/popup-blocked") {
        setError({
          general: "Popup blocked. Please enable popups for this site",
        });
      } else if (error.code === "auth/popup-closed-by-user") {
        setError({
          general: "Google Sign-Up was cancelled",
        });
      } else {
        setError({
          general: "Google Sign-Up failed. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 font-serif text-gray-900">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-black">
          Dynamic QR Code Platform
        </h1>
        <p className="text-xl text-gray-600">
          Create your account to manage QR codes
        </p>
      </header>

      <main className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
        {error.general && (
          <Alert type="error" message={error.general || "An error occurred"} />
        )}

        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
            <p className="font-bold">Registration successful!</p>
            <p>
              A verification email has been sent. Please check your inbox and
              click the verification link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  error.firstName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error.firstName && (
                <p className="mt-2 text-sm text-red-600">{error.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  error.lastName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error.lastName && (
                <p className="mt-2 text-sm text-red-600">{error.lastName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700"
              >
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  error.displayName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error.displayName && (
                <p className="mt-2 text-sm text-red-600">{error.displayName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  error.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error.email && (
                <p className="mt-2 text-sm text-red-600">{error.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    error.password ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              {error.password && (
                <p className="mt-2 text-sm text-red-600">{error.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    error.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              {error.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {error.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </div>
          </form>
        )}

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <span className="sr-only">Sign up with Google</span>
            <svg
              className="h-5 w-5 mr-2"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-0.138-2.65-0.389-3.917z"
                fill="#FFC107"
              />
              <path
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                fill="#FF3D00"
              />
              <path
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                fill="#4CAF50"
              />
              <path
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-0.138-2.65-0.389-3.917z"
                fill="#1976D2"
              />
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className="mt-8 text-center text-base">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>
          © {new Date().getFullYear()} Dynamic QR Code Platform. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
};

export default Register;
