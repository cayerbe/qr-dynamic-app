// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, firestore } from "../firebase/firebase";
import {
  saveUserToStorage,
  getCurrentUserFromStorage,
  clearUserFromStorage,
} from "../utils/userStorage";

// User Role Types
export type UserRole = "user" | "admin" | "manufacturer" | "inspector";

// User Interface
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  lastLogin?: Date;
}

// New User Data Interface
export interface NewUserData {
  email: string;
  password: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

// User Update Fields
export interface UserUpdateFields {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

// Authentication Context Type
export interface AuthContextType {
  currentUser: User | null;
  userProfile: User | null;
  login: (email: string, password: string) => Promise<void>;
  googleSignup: () => Promise<void>;
  signup: (userData: NewUserData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: UserUpdateFields) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

// Create Authentication Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fetch user document from Firestore
const getUserDocument = async (uid: string): Promise<User> => {
  try {
    const userRef = doc(firestore, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        uid: userSnap.id,
        email: userData.email || null,
        displayName: userData.displayName || null,
        firstName: userData.firstName,
        lastName: userData.lastName,
        lastLogin: userData.lastLogin?.toDate?.() || new Date(),
        role: userData.role || "user",
      };
    }

    throw new Error(`User document for UID ${uid} not found.`);
  } catch (error) {
    console.error("Error fetching user document:", error);
    throw error;
  }
};

// Reset Password Function
const resetPassword = async (email: string): Promise<void> => {
  try {
    console.log(`🔵 Sending password reset email to: ${email}`);
    await sendPasswordResetEmail(auth, email);
    console.log("✅ Password reset email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw error;
  }
};

// Authentication Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore authentication from storage
  useEffect(() => {
    const restoreAuthFromStorage = () => {
      try {
        const cachedUser = getCurrentUserFromStorage();
        if (cachedUser) {
          console.log(
            "Found cached user, restoring auth state",
            cachedUser.email,
          );
          const restoredUser: User = {
            uid: cachedUser.uid,
            email: cachedUser.email,
            displayName: cachedUser.displayName || null,
            role: (cachedUser.role as UserRole) || "user",
            firstName: cachedUser.firstName,
            lastName: cachedUser.lastName,
            lastLogin: cachedUser.lastLogin
              ? new Date(cachedUser.lastLogin)
              : undefined,
          };
          setCurrentUser(restoredUser);
          setIsAuthenticated(true);
          console.log("Auth state restored from cache");
        } else {
          console.log("No cached user found");
        }
      } catch (error) {
        console.error("Failed to restore auth from storage:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreAuthFromStorage();
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    console.log("Setting up Firebase auth state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Firebase auth state changed:", user?.email);

      // Reset loading state while processing
      setLoading(true);

      if (user) {
        // Try to get the user document from Firestore
        const userRef = doc(firestore, "users", user.uid);
        getDoc(userRef)
          .then(async (userSnap) => {
            if (!userSnap.exists()) {
              // ✅ Auto-create user document if not exists
              const newUser: User = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || null,
                role: "user",
              };

              const firestoreUserData = {
                ...newUser,
                created_at: serverTimestamp(),
              };

              await setDoc(userRef, firestoreUserData);
              console.log("✅ New user document created in Firestore");
            }
            return getUserDocument(user.uid);
          })
          .then((userDoc) => {
            setCurrentUser(userDoc);
            setIsAuthenticated(true);
            saveUserToStorage(userDoc);
            console.log("✅ Auth state updated from Firebase: authenticated");
          })
          .catch(async (error) => {
            console.error("🔥 Failed to initialize user document:", error);

            // Create basic user object as fallback
            const basicUser: User = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || null,
              role: "user",
            };

            const firestoreUserData = {
              ...basicUser,
              created_at: serverTimestamp(),
            };

            try {
              const userRef = doc(firestore, "users", user.uid);
              await setDoc(userRef, firestoreUserData);
              console.log("✅ New user document created in Firestore");
            } catch (creationError) {
              console.error(
                "❌ Failed to create user document:",
                creationError,
              );
            }

            // Proceed to set local user
            setCurrentUser(basicUser);
            setIsAuthenticated(true);
            saveUserToStorage(basicUser);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        // User is signed out
        setCurrentUser(null);
        setIsAuthenticated(false);
        clearUserFromStorage();
        console.log("✅ Auth state updated from Firebase: not authenticated");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log(`🔵 Attempting login for: ${email}`);
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;
      if (!firebaseUser) throw new Error("User authentication failed.");

      const userDoc = await getUserDocument(firebaseUser.uid);
      setCurrentUser(userDoc);
      setIsAuthenticated(true);

      // Save user to storage
      saveUserToStorage(userDoc);

      console.log("✅ Login successful!");
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      console.log("Attempting to log out...");
      const uid = currentUser?.uid;
      if (uid) {
        clearUserFromStorage(uid);
      }
      await signOut(auth);
      setCurrentUser(null);
      setIsAuthenticated(false);
      console.log("Successfully logged out.");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    currentUser,
    userProfile: currentUser,
    login,
    googleSignup: async () => {
      console.log("Google signup not implemented yet.");
    },
    signup: async (userData: NewUserData) => {
      console.log("Signup not implemented yet.");
    },
    logout,
    updateProfile: async (updates: UserUpdateFields) => {
      console.log("Update profile not implemented yet.");
    },
    resetPassword,
    isAuthenticated,
    isAdmin: currentUser?.role === "admin",
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
