import React, { useState, useEffect } from "react";
import { Save, RotateCcw, Moon, Server } from "lucide-react";

/**
 * Settings Component for configuring application preferences
 */
const Settings = () => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

  const [settings, setSettings] = useState({
    apiUrl: API_BASE_URL,
    defaultIntensity: 0.2,
    notificationsEnabled: true,
    theme: "light",
  });

  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [activeTab, setActiveTab] = useState("api");

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("qrDashboardSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Save settings
  const saveSettings = () => {
    // Save to localStorage
    localStorage.setItem("qrDashboardSettings", JSON.stringify(settings));

    // Show success alert
    setAlert({
      show: true,
      type: "success",
      message: "Settings saved successfully!",
    });

    // Hide alert after 3 seconds
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 3000);
  };

  // Reset settings to defaults
  const resetSettings = () => {
    const defaultSettings = {
      apiUrl: API_BASE_URL,
      defaultIntensity: 0.2,
      notificationsEnabled: true,
      theme: "light",
    };

    setSettings(defaultSettings);
    localStorage.setItem(
      "qrDashboardSettings",
      JSON.stringify(defaultSettings),
    );

    setAlert({
      show: true,
      type: "success",
      message: "Settings reset to defaults",
    });

    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Settings</h2>
      </div>

      <div className="p-6">
        {alert.show && (
          <div
            className={`mb-6 p-4 rounded ${
              alert.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {alert.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left sidebar navigation */}
          <div className="md:col-span-1">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("api")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "api"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Server
                  size={20}
                  className={`mr-3 ${activeTab === "api" ? "text-blue-500" : "text-gray-400"}`}
                />
                API Configuration
              </button>

              <button
                onClick={() => setActiveTab("qrcode")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "qrcode"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mr-3 ${activeTab === "qrcode" ? "text-blue-500" : "text-gray-400"}`}
                >
                  <rect x="3" y="3" width="5" height="5" rx="1" />
                  <rect x="16" y="3" width="5" height="5" rx="1" />
                  <rect x="3" y="16" width="5" height="5" rx="1" />
                  <path d="M21 16v.01" />
                  <path d="M16 16v.01" />
                  <path d="M16 21v.01" />
                  <path d="M21 21v.01" />
                  <path d="M12 3v.01" />
                  <path d="M12 8v.01" />
                  <path d="M12 16v.01" />
                  <path d="M12 21v.01" />
                  <path d="M3 12v.01" />
                  <path d="M8 12v.01" />
                  <path d="M16 12v.01" />
                  <path d="M21 12v.01" />
                </svg>
                QR Code Defaults
              </button>

              <button
                onClick={() => setActiveTab("ui")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "ui"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Moon
                  size={20}
                  className={`mr-3 ${activeTab === "ui" ? "text-blue-500" : "text-gray-400"}`}
                />
                User Interface
              </button>
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200 flex space-x-3">
              <button
                onClick={saveSettings}
                className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Save size={16} className="mr-2" />
                Save
              </button>

              <button
                onClick={resetSettings}
                className="flex-1 flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <RotateCcw size={16} className="mr-2" />
                Reset
              </button>
            </div>
          </div>

          {/* Settings content */}
          <div className="md:col-span-2">
            {/* API Configuration */}
            {activeTab === "api" && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  API Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="apiUrl"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      API URL
                    </label>
                    <input
                      type="text"
                      id="apiUrl"
                      name="apiUrl"
                      value={settings.apiUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      URL of the QR Code generation API
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Connection Status
                    </h4>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Connected</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Last connected: {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Defaults */}
            {activeTab === "qrcode" && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  QR Code Defaults
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="defaultIntensity"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Default CDP Intensity: {settings.defaultIntensity}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        id="defaultIntensity"
                        name="defaultIntensity"
                        min="0.1"
                        max="0.5"
                        step="0.05"
                        value={settings.defaultIntensity}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-600">
                        {settings.defaultIntensity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Default intensity used for new QR codes
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border border-gray-200 rounded-md bg-white">
                      <div className="mx-auto w-24 h-24 border border-gray-300 rounded flex items-center justify-center mb-2">
                        <svg
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-gray-700"
                        >
                          <rect x="3" y="3" width="5" height="5" rx="1" />
                          <rect x="16" y="3" width="5" height="5" rx="1" />
                          <rect x="3" y="16" width="5" height="5" rx="1" />
                          <path d="M21 16v.01" />
                          <path d="M16 16v.01" />
                          <path d="M16 21v.01" />
                          <path d="M21 21v.01" />
                          <path d="M12 3v.01" />
                          <path d="M12 8v.01" />
                          <path d="M12 16v.01" />
                          <path d="M12 21v.01" />
                          <path d="M3 12v.01" />
                          <path d="M8 12v.01" />
                          <path d="M16 12v.01" />
                          <path d="M21 12v.01" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Low Intensity</p>
                      <p className="text-xs text-gray-500">
                        Better scannability
                      </p>
                    </div>

                    <div className="text-center p-4 border border-gray-200 rounded-md bg-white">
                      <div className="mx-auto w-24 h-24 border border-gray-300 rounded flex items-center justify-center mb-2">
                        <svg
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="text-gray-900"
                        >
                          <rect x="3" y="3" width="5" height="5" rx="1" />
                          <rect x="16" y="3" width="5" height="5" rx="1" />
                          <rect x="3" y="16" width="5" height="5" rx="1" />
                          <path d="M21 16v.01" />
                          <path d="M16 16v.01" />
                          <path d="M16 21v.01" />
                          <path d="M21 21v.01" />
                          <path d="M12 3v.01" />
                          <path d="M12 8v.01" />
                          <path d="M12 16v.01" />
                          <path d="M12 21v.01" />
                          <path d="M3 12v.01" />
                          <path d="M8 12v.01" />
                          <path d="M16 12v.01" />
                          <path d="M21 12v.01" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">High Intensity</p>
                      <p className="text-xs text-gray-500">More robust codes</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Interface */}
            {activeTab === "ui" && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  User Interface
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="theme"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={settings.theme}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose your preferred color theme
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notificationsEnabled"
                        name="notificationsEnabled"
                        checked={settings.notificationsEnabled}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="notificationsEnabled"
                        className="ml-2 block text-sm font-medium text-gray-700"
                      >
                        Enable Notifications
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 ml-6">
                      Show notifications for important events
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Theme Preview
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-4 rounded-md ${
                          settings.theme === "light" ||
                          (settings.theme === "system" &&
                            !window.matchMedia("(prefers-color-scheme: dark)")
                              .matches)
                            ? "border-2 border-blue-500 bg-white"
                            : "border border-gray-200 bg-white"
                        }`}
                      >
                        <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
                        <div className="h-2 w-24 bg-gray-200 rounded mb-1"></div>
                        <div className="h-2 w-20 bg-gray-200 rounded"></div>
                        <p className="text-xs text-center mt-2 text-gray-500">
                          Light Theme
                        </p>
                      </div>

                      <div
                        className={`p-4 rounded-md ${
                          settings.theme === "dark" ||
                          (settings.theme === "system" &&
                            window.matchMedia("(prefers-color-scheme: dark)")
                              .matches)
                            ? "border-2 border-blue-500 bg-gray-800"
                            : "border border-gray-200 bg-gray-800"
                        }`}
                      >
                        <div className="h-4 w-16 bg-gray-600 rounded mb-2"></div>
                        <div className="h-2 w-24 bg-gray-600 rounded mb-1"></div>
                        <div className="h-2 w-20 bg-gray-600 rounded"></div>
                        <p className="text-xs text-center mt-2 text-gray-400">
                          Dark Theme
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
