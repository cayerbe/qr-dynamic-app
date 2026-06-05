import React from "react";
import { QrCode, List, User, Settings as SettingsIcon } from "lucide-react";

const Sidebar = ({
  activeSection,
  onSectionChange,
  isOpen,
  className = "",
  style = {},
}) => {
  // Navigation items with icons
  const navItems = [
    { id: "generator", label: "QR Generator", icon: <QrCode size={20} /> },
    { id: "codes", label: "My QR Codes", icon: <List size={20} /> },
    { id: "profile", label: "Profile", icon: <User size={20} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={20} /> },
  ];

  return (
    <aside className={`w-64 bg-blue-700 text-white ${className}`} style={style}>
      {/* Logo and app name */}
      <div className="p-6 border-b border-blue-600">
        <div className="flex items-center space-x-3">
          <QrCode size={24} />
          <h1 className="text-xl font-bold">Dynamic QR</h1>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="mt-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.id} className="mb-2">
              <button
                onClick={() => onSectionChange(item.id)}
                className={`flex items-center w-full px-6 py-3 text-left transition-colors duration-200 ${
                  activeSection === item.id
                    ? "bg-blue-800 border-l-4 border-white"
                    : "hover:bg-blue-600"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer with version */}
      <div className="absolute bottom-0 w-full p-4 text-sm text-blue-300 border-t border-blue-600">
        <p>Version 1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
