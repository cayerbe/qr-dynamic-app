import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthService, UserProfile } from "../supabase/authService";

export interface NewUserData {
  email: string;
  password: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserUpdateFields {
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthContextType {
  currentUser: UserProfile | null;
  user: UserProfile | null; // Compatibility with old code
  userProfile: UserProfile | null;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (userSession) => {
      setLoading(true);
      if (userSession) {
        const profile = await AuthService.getCurrentUserProfile();
        setCurrentUser(profile);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const result = await AuthService.login(email, password);
    if (!result.success) {
      setLoading(false);
      throw new Error(result.message);
    }
    const profile = await AuthService.getCurrentUserProfile();
    setCurrentUser(profile);
    setIsAuthenticated(true);
    setLoading(false);
  };

  const signup = async (userData: NewUserData) => {
    setLoading(true);
    const result = await AuthService.register(
      userData.email, 
      userData.password, 
      userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
    );
    if (!result.success) {
      setLoading(false);
      throw new Error(result.message);
    }
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await AuthService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const googleSignup = async () => {
    await AuthService.googleSignIn();
  };

  const updateProfile = async (updates: UserUpdateFields) => {
    // Implement update profile logic if needed
  };

  const contextValue: AuthContextType = {
    currentUser,
    user: currentUser,
    userProfile: currentUser,
    login,
    googleSignup,
    signup,
    logout,
    updateProfile,
    resetPassword,
    isAuthenticated,
    isAdmin: currentUser?.role === "admin",
    loading,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
