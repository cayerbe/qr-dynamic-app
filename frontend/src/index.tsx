import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Add this line

// ✅ Explicitly attach React & ReactDOM to window (for debugging)
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;

// ✅ Ensure the #root element exists before rendering
const rootElement = document.getElementById("root");

if (rootElement) {
  console.log("✅ React is initializing...");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  // ✅ REMOVE the static loading spinner manually after rendering
  const loader = document.getElementById("root-loader");
  if (loader) {
    loader.remove();
    console.log("✅ Removed #root-loader after React rendered");
  }
} else {
  console.error("❌ Root element (#root) not found in index.html!");
}
