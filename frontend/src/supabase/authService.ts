import { supabase } from "./client";

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: "user" | "admin";
}

const defaultProfile: UserProfile = {
  id: "",
  email: "unknown@example.com",
  displayName: "Guest",
  photoURL: undefined,
  role: "user",
};

export const AuthService = {
  async register(email: string, password: string, displayName?: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            displayName: displayName || "",
          },
        },
      });

      if (error) throw error;

      // The user is created in auth.users.
      // We will also insert into our public.users table if we need to.
      if (data.user) {
        const { error: dbError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          displayName: displayName || null,
          role: "user",
          created_at: new Date().toISOString(),
        });

        if (dbError && dbError.code !== "23505") {
          // Ignore unique violation if it already exists
          console.error("Error creating user profile in DB:", dbError);
        }
      }

      return { success: true, user: data.user, session: data.session };
    } catch (error: any) {
      console.error("🚨 Registration error:", error.message);
      return {
        success: false,
        message: error.message || "An error occurred during registration.",
      };
    }
  },

  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error("🚨 Login error:", error.message);
      return {
        success: false,
        message: error.message || "An error occurred during login.",
      };
    }
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("🚨 Logout error:", error);
      throw error;
    }
  },

  async resetPassword(email: string) {
    try {
      console.log("🟢 Attempting to send reset password email to:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      console.log("✅ Password reset email sent successfully!");
    } catch (error: any) {
      console.error("🚨 Password Reset Error:", error.message);
      throw error;
    }
  },

  async getCurrentUserProfile(): Promise<UserProfile> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn(
        "⚠️ No authenticated user found. Returning default profile.",
      );
      return defaultProfile;
    }

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userData) {
        return {
          id: user.id,
          email: user.email ?? defaultProfile.email,
          displayName:
            user.user_metadata?.displayName ||
            userData.displayName ||
            defaultProfile.displayName,
          photoURL: user.user_metadata?.avatar_url || undefined,
          role: userData.role || defaultProfile.role,
        };
      }

      console.warn(
        `⚠️ User document for UID ${user.id} not found. Returning default profile.`,
      );
      return defaultProfile;
    } catch (error) {
      console.error("🚨 Error fetching user profile:", error);
      return defaultProfile;
    }
  },

  onAuthStateChanged(callback: (user: any | null) => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
    // Return unsubscribe function
    return () => subscription.unsubscribe();
  },

  async googleSignIn() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("🚨 Google Sign-In error:", error);
      throw error;
    }
  },
};
