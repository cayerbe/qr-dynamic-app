import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const auth = getAuth();
const provider = new GoogleAuthProvider();

const AuthService = {
  login: async (email: string, password: string) => {
    console.log(`Logging in user: ${email}`);
    return { user: { email } };
  },

  googleSignIn: async () => {
    try {
      console.log("Google Login Initiated");
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful", result.user);
      return result.user;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  },
};

// Function to get authentication headers
export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await auth.currentUser?.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export default AuthService;
