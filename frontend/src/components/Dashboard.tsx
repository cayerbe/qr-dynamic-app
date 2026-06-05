import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import QRCode from "qrcode";
import {
  QrCode,
  Globe,
  Text,
  Mail,
  Phone,
  Contact,
  Wifi,
  Palette,
  Shield,
  Download,
  Plus,
  X,
} from "lucide-react";
import { getAuthHeaders } from "../services/auth";
import {
  QRModel,
  QR_MODEL_CONFIGS,
  createModelMetadata,
  EnhancedQRGenerationPayload,
} from "../types/qr-models";
import { generateEnhancedQR } from "../services/qrApiService"; // Add this import

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "");

// QR Size Options
const QR_SIZE_OPTIONS = [
  {
    value: "12.0",
    label: "12mm (Small - Business Cards)",
    description: "Suitable for business cards, small labels",
  },
  {
    value: "20.0",
    label: "20mm (Medium - Standard)",
    description: "Most common size for general use",
  },
  {
    value: "30.0",
    label: "30mm (Large - Posters)",
    description: "Good for posters, signage",
  },
  {
    value: "50.0",
    label: "50mm (XL - Display)",
    description: "Large displays, banners",
  },
  {
    value: "custom",
    label: "Custom Size",
    description: "Specify your own size",
  },
];

// Type Definitions
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

// Content Type Configuration
const CONTENT_TYPES = [
  {
    type: "url",
    icon: Globe,
    label: "Website URL",
    placeholder: "https://example.com",
  },
  {
    type: "text",
    icon: Text,
    label: "Plain Text",
    placeholder: "Enter your message",
  },
  {
    type: "email",
    icon: Mail,
    label: "Email",
    placeholder: "email@example.com",
  },
  {
    type: "phone",
    icon: Phone,
    label: "Phone Number",
    placeholder: "+1234567890",
  },
  {
    type: "vcard",
    icon: Contact,
    label: "Contact Card",
    placeholder: "Business Contact",
  },
  {
    type: "wifi",
    icon: Wifi,
    label: "WiFi Network",
    placeholder: "Network Details",
  },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const qrCodeRef = useRef<HTMLCanvasElement | null>(null);

  // State variables
  const [selectedModel, setSelectedModel] = useState<QRModel>("commodity");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(CONTENT_TYPES[0]);
  const [customization, setCustomization] = useState({
    bgColor: "#FFFFFF",
    fgColor: "#000000",
    errorLevel: "M" as ErrorCorrectionLevel,
    intensity: 0.3,
    size: "20.0", // Default 20mm
    customSize: "",
  });
  const [inputValue, setInputValue] = useState("");
  const [qrPreview, setQRPreview] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<any>(null);

  const [additionalFields, setAdditionalFields] = useState({
    email: { subject: "", body: "" },
    vcard: { firstName: "", lastName: "", organization: "", phone: "" },
    wifi: { networkName: "", password: "", security: "WPA" },
  });

  // Additional URLs state
  const [additionalUrls, setAdditionalUrls] = useState<string[]>([]);

  // QR Codes state
  const [qrCodes, setQrCodes] = useState<any[]>([]);

  // Expiration settings state
  const [expirationSettings, setExpirationSettings] = useState({
    enabled: true,
    type: "relative" as "relative" | "absolute" | "never",
    relativeDays: 30,
    absoluteDate: "",
    customDays: "",
  });

  // Scan limits state
  const [scanLimits, setScanLimits] = useState({
    fintech: 1, // Fixed, non-editable
    luxury: 10, // Default 10, editable
    commodity: 100, // Default 100, editable
  });

  // Email notifications state
  const [notificationEmails, setNotificationEmails] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Additional URL Handler
  const handleAddUrl = () => {
    setAdditionalUrls([...additionalUrls, ""]);
  };

  // Update Additional URL
  const updateAdditionalUrl = (index: number, value: string) => {
    const updatedUrls = [...additionalUrls];
    updatedUrls[index] = value;
    setAdditionalUrls(updatedUrls);
  };

  // Remove Additional URL
  const removeAdditionalUrl = (index: number) => {
    const updatedUrls = additionalUrls.filter((_, i) => i !== index);
    setAdditionalUrls(updatedUrls);
  };

  // Generate QR Content based on type
  const generateQRContent = () => {
    switch (selectedType.type) {
      case "email":
        let emailContent = `mailto:${inputValue}`;
        if (additionalFields.email.subject) {
          emailContent += `?subject=${encodeURIComponent(additionalFields.email.subject)}`;
        }
        if (additionalFields.email.body) {
          emailContent += `${additionalFields.email.subject ? "&" : "?"}body=${encodeURIComponent(additionalFields.email.body)}`;
        }
        return emailContent;
      case "phone":
        return `tel:${inputValue}`;
      case "vcard":
        return `BEGIN:VCARD
VERSION:3.0
FN:${additionalFields.vcard.firstName} ${additionalFields.vcard.lastName}
ORG:${additionalFields.vcard.organization}
TEL:${additionalFields.vcard.phone || inputValue}
END:VCARD`;
      case "wifi":
        return `WIFI:T:${additionalFields.wifi.security};S:${additionalFields.wifi.networkName || inputValue};P:${additionalFields.wifi.password};;`;
      default:
        return inputValue;
    }
  };

  // Render Additional Fields based on Content Type
  const renderAdditionalFields = () => {
    switch (selectedType.type) {
      case "email":
        return (
          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Subject (Optional)"
              value={additionalFields.email.subject}
              onChange={(e) =>
                setAdditionalFields((prev) => ({
                  ...prev,
                  email: { ...prev.email, subject: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Body (Optional)"
              value={additionalFields.email.body}
              onChange={(e) =>
                setAdditionalFields((prev) => ({
                  ...prev,
                  email: { ...prev.email, body: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );
      case "vcard":
        return (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="First Name"
              value={additionalFields.vcard.firstName}
              onChange={(e) =>
                setAdditionalFields((prev) => ({
                  ...prev,
                  vcard: { ...prev.vcard, firstName: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={additionalFields.vcard.lastName}
              onChange={(e) =>
                setAdditionalFields((prev) => ({
                  ...prev,
                  vcard: { ...prev.vcard, lastName: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Organization"
              value={additionalFields.vcard.organization}
              onChange={(e) =>
                setAdditionalFields((prev) => ({
                  ...prev,
                  vcard: { ...prev.vcard, organization: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Phone"
              value={additionalFields.vcard.phone}
              onChange={(e) =>
                setAdditionalFields((prev) => ({
                  ...prev,
                  vcard: { ...prev.vcard, phone: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      case "wifi":
        return (
          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Network Name (SSID)"
              value={additionalFields.wifi.networkName}
              onChange={(e) =>
                setAdditionalFields((prev) => ({
                  ...prev,
                  wifi: { ...prev.wifi, networkName: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password (Optional)"
              value={additionalFields.wifi.password}
              onChange={(e) =>
                setAdditionalFields((prev) => ({
                  ...prev,
                  wifi: { ...prev.wifi, password: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={additionalFields.wifi.security}
              onChange={(e) =>
                setAdditionalFields((prev) => ({
                  ...prev,
                  wifi: { ...prev.wifi, security: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No Password</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  // Generate QR Code Handler (Enhanced)
  const handleGenerateQR = async () => {
    console.log(
      "📧 FRONTEND DEBUG - notificationEmails value:",
      notificationEmails,
    );
    console.log(
      "📧 FRONTEND DEBUG - notificationEmails type:",
      typeof notificationEmails,
    );
    console.log(
      "📧 FRONTEND DEBUG - notificationEmails empty?:",
      !notificationEmails?.trim(),
    );

    if (!inputValue.trim()) {
      alert("Please enter a valid input.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      let qrSize =
        customization.size === "custom"
          ? parseFloat(customization.customSize) || 20.0
          : parseFloat(customization.size);

      if (qrSize < 5.0 || qrSize > 100.0) {
        throw new Error("QR code size must be between 5mm and 100mm");
      }

      console.log("📧 Sending notification emails:", notificationEmails);

      // ✅ USE THE SERVICE LAYER INSTEAD OF DIRECT API CALL
      const result = await generateEnhancedQR(generateQRContent(), {
        size_mm: qrSize,
        intensity: customization.intensity,
        notification_emails: notificationEmails, // ✅ PASS EMAILS TO SERVICE
        metadata: {
          bgColor: customization.bgColor,
          fgColor: customization.fgColor,
          errorLevel: customization.errorLevel,
          contentType: selectedType.type,
          additionalUrls,
          model: selectedModel,
          model_config: {
            ...QR_MODEL_CONFIGS[selectedModel].features,
            max_scans: scanLimits[selectedModel],
          },
        },
        model: selectedModel,
        model_config: {
          ...QR_MODEL_CONFIGS[selectedModel].features,
          max_scans: scanLimits[selectedModel],
        },
        expiration_config: {
          type: expirationSettings.type,
          relative_days: expirationSettings.relativeDays,
          absolute_date: expirationSettings.absoluteDate,
        },
      });

      console.log("🔐 Service response:", result);

      if (result.success) {
        const proxyUrl = `${API_BASE_URL}/proxy/qr-image/${result.qr_id}`;
        setGeneratedQRCode(proxyUrl);
        setQrId(result.qr_id);
        setQrData(result);
        setQRPreview(true);

        // Refresh the QR codes list
        fetchQRCodes();
      } else {
        throw new Error(result.error || "Enhanced QR generation failed");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Unknown error");
      setGeneratedQRCode(null);
      setQRPreview(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Download QR Code Handler
  const handleDownload = () => {
    if (!qrId) return;
    const downloadUrl = `${API_BASE_URL}/proxy/qr-image/${qrId}?download=true`;
    window.open(downloadUrl, "_blank");
  };

  // Fetch QR codes
  const fetchQRCodes = async () => {
    try {
      console.log("Fetching QR codes...");
      const headers = await getAuthHeaders();
      console.log("Auth headers:", headers);

      const response = await fetch(`${API_BASE_URL}/qr/list`, {
        method: "GET",
        headers: headers,
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("QR codes data:", data);

      if (data.success && data.qr_codes) {
        setQrCodes(data.qr_codes);
      }
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    }
  };

  useEffect(() => {
    if (user) {
      console.log("✅ Auth ready, fetching QR codes...");
      fetchQRCodes();
    } else {
      console.log("⏳ Waiting for auth...");
    }
  }, [user]);

  // Canvas QR generation effect
  useEffect(() => {
    if (qrPreview && qrId && qrCodeRef.current) {
      QRCode.toCanvas(qrCodeRef.current, generateQRContent(), {
        width: 192,
        margin: 4,
        color: {
          dark: customization.fgColor,
          light: customization.bgColor,
        },
        errorCorrectionLevel: customization.errorLevel,
      }).catch((error) => {
        console.error("Error generating QR code:", error);
      });
    }
  }, [qrPreview, qrId, inputValue, customization, additionalFields]);

  // Model Selector Component
  const ModelSelector: React.FC<{
    selectedModel: QRModel;
    onSelect: (model: QRModel, config: any) => void;
  }> = ({ selectedModel, onSelect }) => {
    const models = [
      {
        type: "fintech" as QRModel,
        title: "💳 Fintech Model",
        description: "One-time use for payments & tickets",
        config: QR_MODEL_CONFIGS.fintech,
        scanLimit: scanLimits.fintech,
        isEditable: false, // Fintech is always 1 scan
      },
      {
        type: "luxury" as QRModel,
        title: "💎 Luxury Model",
        description: "Multi-scan for high-value authentication",
        config: QR_MODEL_CONFIGS.luxury,
        scanLimit: scanLimits.luxury,
        isEditable: true,
      },
      {
        type: "commodity" as QRModel,
        title: "🏭 Commodity Model",
        description: "Unlimited scans for mass production",
        config: QR_MODEL_CONFIGS.commodity,
        scanLimit: scanLimits.commodity,
        isEditable: true,
      },
    ];

    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        {models.map((model) => (
          <div
            key={model.type}
            onClick={() => {
              console.log(`🔐 Selected model: ${model.type}`);
              onSelect(model.type, {
                ...model.config.features,
                max_scans: model.scanLimit,
              });
            }}
            className={`
              border-2 rounded-lg p-4 cursor-pointer transition-all
              ${
                selectedModel === model.type
                  ? "border-blue-500 bg-blue-50 shadow-lg"
                  : "border-gray-200 hover:border-blue-300"
              }
            `}
          >
            <h3 className="text-lg font-bold mb-2">{model.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{model.description}</p>

            {/* Scan Limit Input */}
            <div className="mt-3">
              <label className="text-xs text-gray-600">Max Scans:</label>
              <div className="flex items-center gap-2 mt-1">
                {model.isEditable ? (
                  <input
                    type="number"
                    value={model.scanLimit}
                    onChange={(e) => {
                      e.stopPropagation(); // Prevent card selection
                      const value = parseInt(e.target.value) || 1;
                      setScanLimits((prev) => ({
                        ...prev,
                        [model.type]: value,
                      }));
                    }}
                    onClick={(e) => e.stopPropagation()} // Prevent card selection
                    min="1"
                    max={model.type === "luxury" ? "1000" : "10000"}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {model.scanLimit}
                    </span>
                    <span className="text-xs text-gray-500">🔒 Fixed</span>
                  </span>
                )}
              </div>
            </div>

            {selectedModel === model.type && (
              <div className="mt-2 text-xs text-blue-600 font-semibold">
                ✓ SELECTED
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Generate QR Code
  const generateQR = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Get model configuration
      const modelConfig = QR_MODEL_CONFIGS[selectedModel];

      // Build request payload
      const requestData = {
        data: url,
        model: selectedModel, // ADD THIS - Critical!
        size_mm: modelConfig.features.size_mm,
        intensity: modelConfig.features.intensity,
        anti_photocopy: modelConfig.features.anti_photocopy,
        max_scans: modelConfig.features.max_scans,
        metadata: {
          model: selectedModel,
          bgColor: customization.bgColor,
          fgColor: customization.fgColor,
          errorLevel: customization.errorLevel,
          contentType: selectedType.type,
          additionalUrls,
        },
      };

      console.log("Generating QR with model:", selectedModel); // Debug log

      // API call
      const response = await fetch(`${API_BASE_URL}/qr/generate-enhanced`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate QR code: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log("QR generated successfully:", result);
        setGeneratedQRCode(result.image_url);
        setQrId(result.qr_id);
        setQrData(result);
        setQRPreview(true);

        // Refresh the QR codes list
        fetchQRCodes();
      } else {
        throw new Error(result.error || "QR generation failed");
      }
    } catch (error: any) {
      console.error("Error generating QR code:", error);
      setErrorMessage(error.message || "Unknown error");
      setGeneratedQRCode(null);
      setQRPreview(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle model selection
  const handleModelSelect = (model: QRModel, config: any) => {
    setSelectedModel(model);

    // Update customization based on model config
    const modelConfig = QR_MODEL_CONFIGS[model];
    setCustomization((prev) => ({
      ...prev,
      size: modelConfig.features.size_mm.toString(),
      intensity: modelConfig.features.intensity,
      errorLevel: modelConfig.features.errorCorrectionLevel || "M", // Provide fallback to "M"
    }));

    // Update expiration based on model
    if (model === "fintech") {
      setExpirationSettings({
        enabled: true,
        type: "relative",
        relativeDays: 1, // 24 hours for fintech
        absoluteDate: "",
        customDays: "",
      });
    } else if (model === "luxury") {
      setExpirationSettings({
        enabled: true,
        type: "relative",
        relativeDays: 90, // 3 months for luxury
        absoluteDate: "",
        customDays: "",
      });
    } else if (model === "commodity") {
      setExpirationSettings({
        enabled: false,
        type: "never",
        relativeDays: 0,
        absoluteDate: "",
        customDays: "",
      });
    }

    console.log(`🔐 Model ${model} selected with config:`, modelConfig);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🚀 Enhanced QR Generator
            </h1>
            <p className="text-gray-600">
              Create high-quality QR codes with size-adaptive CDP security
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-6 rounded relative">
              <span className="block sm:inline">❌ {errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="absolute top-0 right-0 px-4 py-3"
              >
                <X size={16} className="text-red-700" />
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Left Column - QR Code Configuration */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                🔧 QR Code Configuration
              </h2>

              {/* Content Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Content Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CONTENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.type}
                        onClick={() => {
                          setSelectedType(type);
                          setInputValue("");
                        }}
                        className={`flex flex-col items-center p-3 rounded-lg transition-all text-xs ${
                          selectedType.type === type.type
                            ? "bg-blue-100 text-blue-600 border-2 border-blue-500"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs mt-2">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedType.label}{" "}
                  {selectedType.type === "vcard"
                    ? "(Main Contact Info)"
                    : "Content"}
                </label>
                <input
                  type="text"
                  placeholder={selectedType.placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Additional Type-Specific Fields */}
              {renderAdditionalFields()}

              {/* URLs Management */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    🔗 Associated URLs
                  </label>
                  <button
                    onClick={handleAddUrl}
                    className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                  >
                    <Plus className="mr-1" size={16} /> Add URL
                  </button>
                </div>
                {additionalUrls.map((url, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      placeholder="Enter additional URL"
                      value={url}
                      onChange={(e) =>
                        updateAdditionalUrl(index, e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeAdditionalUrl(index)}
                      className="ml-2 px-3 py-2 text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📏 QR Code Physical Size
                </label>
                <select
                  value={customization.size}
                  onChange={(e) =>
                    setCustomization((prev) => ({
                      ...prev,
                      size: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {QR_SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {customization.size === "custom" && (
                  <input
                    type="number"
                    placeholder="Enter size in mm (5-100)"
                    value={customization.customSize}
                    onChange={(e) =>
                      setCustomization((prev) => ({
                        ...prev,
                        customSize: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="5"
                    max="100"
                  />
                )}
              </div>

              {/* Customization Options */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">
                  🎨 Customization Options
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Palette className="h-5 w-5 mr-2" />
                      Color Customization
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <span className="mr-2 text-sm">Background</span>
                        <input
                          type="color"
                          value={customization.bgColor}
                          onChange={(e) =>
                            setCustomization((prev) => ({
                              ...prev,
                              bgColor: e.target.value,
                            }))
                          }
                          className="h-8 w-8 rounded border border-gray-300"
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2 text-sm">Foreground</span>
                        <input
                          type="color"
                          value={customization.fgColor}
                          onChange={(e) =>
                            setCustomization((prev) => ({
                              ...prev,
                              fgColor: e.target.value,
                            }))
                          }
                          className="h-8 w-8 rounded border border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Shield className="h-5 w-5 mr-2" />
                      Error Correction
                    </label>
                    <select
                      value={customization.errorLevel}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          errorLevel: e.target.value as ErrorCorrectionLevel,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="L">Low (7%)</option>
                      <option value="M">Medium (15%)</option>
                      <option value="Q">Quartile (25%)</option>
                      <option value="H">High (30%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Shield className="h-5 w-5 mr-2" />
                      Security Intensity
                    </label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={customization.intensity}
                        onChange={(e) =>
                          setCustomization((prev) => ({
                            ...prev,
                            intensity: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <span className="ml-2 text-sm font-medium">
                        {customization.intensity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Higher values provide more security but may affect
                      compatibility
                    </p>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateQR}
                  disabled={!inputValue || isLoading}
                  className={`
                    w-full py-3 rounded-md transition-colors flex justify-center items-center mt-4
                    ${
                      !inputValue || isLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }
                  `}
                >
                  {isLoading
                    ? "🔄 Generating Enhanced QR..."
                    : "🚀 Generate Enhanced QR Code"}
                </button>
              </div>

              {/* Expiration Control */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">
                  🗓️ Smart Expiration Control
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="relative"
                      checked={expirationSettings.type === "relative"}
                      onChange={(e) =>
                        setExpirationSettings((prev) => ({
                          ...prev,
                          type: "relative",
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="mr-2">Expire after</span>
                    <select
                      value={expirationSettings.relativeDays}
                      onChange={(e) =>
                        setExpirationSettings((prev) => ({
                          ...prev,
                          relativeDays: parseInt(e.target.value),
                        }))
                      }
                      className="px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value={1}>24 hours</option>
                      <option value={7}>1 week</option>
                      <option value={30}>1 month (default)</option>
                      <option value={90}>3 months</option>
                      <option value={365}>1 year</option>
                    </select>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="absolute"
                      checked={expirationSettings.type === "absolute"}
                      onChange={(e) =>
                        setExpirationSettings((prev) => ({
                          ...prev,
                          type: "absolute",
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="mr-2">Expire on</span>
                    <input
                      type="datetime-local"
                      value={expirationSettings.absoluteDate}
                      onChange={(e) =>
                        setExpirationSettings((prev) => ({
                          ...prev,
                          absoluteDate: e.target.value,
                        }))
                      }
                      min={new Date().toISOString().slice(0, 16)}
                      className="px-2 py-1 border border-gray-300 rounded"
                      disabled={expirationSettings.type !== "absolute"}
                    />
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="never"
                      checked={expirationSettings.type === "never"}
                      onChange={(e) =>
                        setExpirationSettings((prev) => ({
                          ...prev,
                          type: "never",
                        }))
                      }
                      className="mr-2"
                    />
                    Never expire
                    <span className="ml-2 text-yellow-600 text-sm">
                      ⚠️ Less secure
                    </span>
                  </label>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Set automatic expiration to enhance security and control
                  access
                </p>
              </div>

              {/* Model Selector */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">
                  🛠️ Model Configuration
                </h3>
                <ModelSelector
                  selectedModel={selectedModel}
                  onSelect={handleModelSelect}
                />

                {/* Model Configuration Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    Current Model Configuration: {selectedModel.toUpperCase()}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                    <div>
                      Size: {QR_MODEL_CONFIGS[selectedModel].features.size_mm}mm
                    </div>
                    <div>
                      Intensity:{" "}
                      {(
                        QR_MODEL_CONFIGS[selectedModel].features.intensity * 100
                      ).toFixed(0)}
                      %
                    </div>
                    <div>
                      Security:{" "}
                      {QR_MODEL_CONFIGS[selectedModel].features.security_level}
                    </div>
                    <div>
                      Max Scans:{" "}
                      {scanLimits[selectedModel] === -1
                        ? "Unlimited"
                        : scanLimits[selectedModel]}
                    </div>
                  </div>
                </div>
              </div>

              {/* 📧 EMAIL NOTIFICATIONS - ADD THIS NEW SECTION */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📧 Email Notifications
                </label>
                <input
                  type="text"
                  placeholder="paulsmith@company.com, jane@company.com"
                  value={notificationEmails}
                  onChange={(e) => setNotificationEmails(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Receive scan reports via email when this QR is scanned
                  (comma-separated)
                </p>
              </div>
            </div>

            {/* Right Column - Preview & Download */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                👁️ Preview & Download
              </h2>
              {qrPreview ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                    {generatedQRCode ? (
                      <img
                        src={generatedQRCode}
                        alt="Generated QR Code"
                        className="h-48 w-48 object-contain"
                      />
                    ) : qrCodeRef.current ? (
                      <canvas ref={qrCodeRef} className="h-48 w-48"></canvas>
                    ) : (
                      <div className="h-48 w-48 bg-gray-100 flex items-center justify-center text-gray-500">
                        ❌ QR Code Not Available
                      </div>
                    )}
                  </div>

                  {/* QR Details */}
                  {qrData && (
                    <div className="bg-white p-3 rounded-lg shadow-sm mb-4 w-full text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Size:</span>{" "}
                          {qrData.size_mm || customization.size}mm
                        </div>
                        <div>
                          <span className="font-medium">Security:</span>{" "}
                          {qrData.security_level || "Standard"}
                        </div>
                        <div>
                          <span className="font-medium">Intensity:</span>{" "}
                          {customization.intensity}
                        </div>
                        <div>
                          <span className="font-medium">Error Correction:</span>{" "}
                          {customization.errorLevel}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Download Button */}
                  {qrId && (
                    <button
                      onClick={handleDownload}
                      className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download QR Code
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-500">
                  <div>
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-lg mb-2">Enhanced QR Preview</p>
                    <p className="text-sm">
                      Your QR code preview will appear here after generation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generated QR Codes Table */}
          <div className="border-t border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">📋 Generated QR Codes</h2>
            {qrCodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No QR codes generated yet</p>
                <p className="text-sm">
                  Generate your first QR code to see it here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="p-3 text-left font-medium text-gray-700">
                        QR ID
                      </th>
                      <th className="p-3 text-left font-medium text-gray-700">
                        Content
                      </th>
                      <th className="p-3 text-left font-medium text-gray-700">
                        Created
                      </th>
                      <th className="p-3 text-left font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {qrCodes.map((qr) => {
                      const qrId = qr.qr_id || qr.id;
                      return (
                        <tr key={qrId} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono text-sm text-blue-600">
                            {qrId
                              ? qrId.substring(0, 20) +
                                (qrId.length > 20 ? "..." : "")
                              : "—"}
                          </td>
                          <td className="p-3 text-sm max-w-xs truncate">
                            {qr?.data?.original_url ||
                              qr?.original_url ||
                              qr?.content ||
                              (typeof qr?.data === "string"
                                ? qr.data
                                : JSON.stringify(qr?.data)) ||
                              "—"}
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {qr.created_at
                              ? (() => {
                                  try {
                                    // Handle both Firestore timestamp and ISO string formats
                                    const date = qr.created_at.seconds
                                      ? new Date(qr.created_at.seconds * 1000) // Firestore timestamp
                                      : new Date(qr.created_at); // ISO string or Date object

                                    return date.toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });
                                  } catch (error) {
                                    console.error("Date parsing error:", error);
                                    return qr.created_at; // Show raw value if parsing fails
                                  }
                                })()
                              : "—"}
                          </td>
                          <td className="p-3">
                            {qrId ? (
                              <button
                                onClick={
                                  () => navigate(`/qr-details/${qrId}`) // ✅ Updated navigation
                                }
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm font-medium"
                              >
                                📊 View Details {/* ✅ Updated button text */}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
