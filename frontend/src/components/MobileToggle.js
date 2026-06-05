import React from "react";

/**
 * Mobile Toggle Button Component
 * Shows a button to toggle the sidebar on mobile devices
 *
 * @param {Object} props - Component props
 * @param {boolean} props.sidebarOpen - Whether the sidebar is currently open
 * @param {Function} props.toggleSidebar - Function to toggle sidebar state
 */
const MobileToggle = ({ sidebarOpen, toggleSidebar }) => {
  return (
    <button
      className="mobile-toggle"
      onClick={toggleSidebar}
      aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
    >
      <i className={`fas fa-${sidebarOpen ? "times" : "bars"}`}></i>
    </button>
  );
};

export default MobileToggle;
