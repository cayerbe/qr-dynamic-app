// src/utils/userStorage.ts

// Type for cached user data
export interface CachedUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role?: string;
  firstName?: string;
  lastName?: string;
  lastLogin?: string;
  cachedAt: number; // Timestamp when cached
}

// Cache expiry time - 1 hour in milliseconds
const CACHE_EXPIRY = 60 * 60 * 1000;

// Key for storing the current user ID
const CURRENT_USER_KEY = "current_user_id";

/**
 * Saves user data to local storage and marks as current user
 */
export const saveUserToStorage = (user: any): void => {
  if (!user || !user.uid) return;

  try {
    const cachedUser: CachedUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      lastLogin:
        user.lastLogin instanceof Date
          ? user.lastLogin.toISOString()
          : undefined,
      cachedAt: Date.now(),
    };

    try {
      // Save the user data
      localStorage.setItem(`user_${user.uid}`, JSON.stringify(cachedUser));

      // Mark this user as the current user
      localStorage.setItem(CURRENT_USER_KEY, user.uid);

      console.log("User data cached to local storage and set as current user");
    } catch (e) {
      console.error("Failed to write to localStorage", e);
    }
  } catch (error) {
    console.error("Failed to cache user data:", error);
  }
};

/**
 * Retrieves the current user's data from local storage
 */
export const getCurrentUserFromStorage = (): CachedUser | null => {
  try {
    // Get the current user ID
    const currentUid = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentUid) {
      console.log("No current user ID found in storage");
      return null;
    }

    // Get the user data using the ID
    return getUserFromStorage(currentUid);
  } catch (error) {
    console.error("Failed to get current user from storage:", error);
    return null;
  }
};

/**
 * Retrieves cached user data from local storage
 */
export const getUserFromStorage = (uid: string): CachedUser | null => {
  try {
    const cachedUserJson = localStorage.getItem(`user_${uid}`);
    if (!cachedUserJson) return null;

    const cachedUser: CachedUser = JSON.parse(cachedUserJson);

    // Check if cache has expired
    if (Date.now() - cachedUser.cachedAt > CACHE_EXPIRY) {
      localStorage.removeItem(`user_${uid}`);
      return null;
    }

    return cachedUser;
  } catch (error) {
    console.error("Failed to retrieve cached user data:", error);
    return null;
  }
};

/**
 * Clears cached user data from local storage
 */
export const clearUserFromStorage = (uid?: string): void => {
  try {
    if (uid) {
      // Clear specific user
      localStorage.removeItem(`user_${uid}`);

      // If this was the current user, also clear that reference
      const currentUid = localStorage.getItem(CURRENT_USER_KEY);
      if (currentUid === uid) {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } else {
      // If no UID provided, clear the current user
      const currentUid = localStorage.getItem(CURRENT_USER_KEY);
      if (currentUid) {
        localStorage.removeItem(`user_${currentUid}`);
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }

    console.log("Cleared cached user data");
  } catch (error) {
    console.error("Failed to clear cached user data:", error);
  }
};

/**
 * Check if there is a cached authenticated user
 */
export const hasAuthenticatedUser = (): boolean => {
  return localStorage.getItem(CURRENT_USER_KEY) !== null;
};
