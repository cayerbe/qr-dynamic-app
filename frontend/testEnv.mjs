// testEnv.js
import { initializeApp, getApps, getApp } from "firebase/app";
import "dotenv/config"; // Load environment variables

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Check if Firebase is already initialized, else initialize it
if (!getApps().length) {
  initializeApp(firebaseConfig);
  console.log("✅ Firebase has been initialized.");
} else {
  console.log("✅ Firebase is already initialized.");
}

console.log("🔥 Firebase Apps:", getApps());
console.log("🗝️ Firebase API Key:", process.env.REACT_APP_FIREBASE_API_KEY);
console.log(
  "🔑 FIREBASE AUTH DOMAIN:",
  process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
);
console.log(
  "🔑 FIREBASE PROJECT ID:",
  process.env.REACT_APP_FIREBASE_PROJECT_ID,
);

// Remove `module.exports` (ES modules use `export` instead)
export {};
