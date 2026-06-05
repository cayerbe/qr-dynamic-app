// src/models/users.ts
import { Timestamp } from "../utils/timestampUtils";

export interface UserPreferences {
  theme: "light" | "dark";
  notifications: boolean;
  language?: string;
}

export interface User {
  uid: string; // Firebase UID
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  createdAt: Date | Timestamp; // ✅ Allow both Firestore Timestamp and JavaScript Date
  lastLogin?: Date | Timestamp; // ✅ Support both Timestamp and Date
  qrCodeCount: number;
  status: "active" | "suspended";
  preferences: UserPreferences;
}

// Utility type for creating a new user
export interface NewUserData {
  email: string;
  password: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

// Type for user update operations
export type UserUpdateFields = Partial<Omit<User, "uid" | "createdAt">>;

// Helper function to create initial user document
export function createInitialUserDocument(
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
  },
  additionalData?: Partial<User>,
): User {
  return {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || additionalData?.displayName || "",
    firstName: additionalData?.firstName || "",
    lastName: additionalData?.lastName || "",
    role: "user",
    createdAt: Timestamp.fromDate(new Date()), // ✅ Firestore-compatible timestamp
    qrCodeCount: 0,
    status: "active",
    preferences: {
      theme: "light",
      notifications: true,
      language: "en",
    },
    ...additionalData,
  };
}

// Type guard to check if a user is an admin
export function isAdmin(user?: User | null): boolean {
  return user?.role === "admin";
}
