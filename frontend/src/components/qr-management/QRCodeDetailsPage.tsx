import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import qrApiService from "../../services/qrApiService";
import {
  ArrowLeft,
  Download,
  Copy,
  Shield,
  MapPin,
  Clock,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Globe,
  Palette,
  Settings,
  QrCode,
  BarChart3,
  Eye,
  RefreshCw,
  Share2,
  FileText,
  Camera,
  Fingerprint,
  XCircle,
  Activity,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Printer,
  ExternalLink,
  User,
  Calendar,
  Zap,
  Database,
  Target,
  Layers,
  Hash,
  Info,
} from "lucide-react";

// Enhanced Interfaces
interface AntiForgeryScanLog {
  scan_id: string;
  timestamp: string;
  device_info: {
    browser?: string;
    platform?: string;
    is_mobile?: boolean;
    device_id?: string;
    user_agent?: string;
  };
  network_info: {
    ip_address?: string;
    geo?: any;
  };
  location_info?: {
    city?: string;
    country?: string;
    region?: string;
    timezone?: string;
    isp?: string;
    risk_score?: number;
    threat_level?: string;
  };
  anti_forgery_analysis?: {
    overall_authenticity: "AUTHENTIC" | "SUSPICIOUS" | "FORGERY";
    confidence_score: number;
    total_risk_score: number;
    methods_applied: string[];
    risk_indicators: string[];
    forgery_pattern_detection?: any;
    geolocation_analysis?: any;
    device_analysis?: any;
    photocopy_detection?: any;
    cdp_verification?: any;
    behavioral_analysis?: any;
  };
  image_analysis_result?: {
    image_processed: boolean;
    is_photocopy: boolean;
    size_mismatch: boolean;
    confidence_score: number;
    size_verification?: {
      original_size_mm: number;
      expected_pixels: number;
      scanned_pixels: number;
      size_difference_percent: number;
      size_mismatch: boolean;
    };
  };
}

interface QRReportDetails {
  qr_id: string;
  data: {
    original_url: string;
    redirect_url: string;
    verification_url?: string;
  };
  created_at: string;
  qr_image_url: string;
  physical_properties?: {
    size_mm: number;
    dpi: number;
    pixel_dimensions: string;
  };
  security_features?: {
    cdp_signature: string;
    security_level: string;
    intensity: number;
    anti_photocopy_enabled?: boolean;
  };
  scan_statistics?: {
    total_scans: number;
    authentic_scans: number;
    suspicious_scans: number;
    forgery_attempts: number;
    unique_devices: string[];
    unique_locations: string[];
    first_scanned_at?: string;
    last_scanned_at?: string;
    latest_risk_score?: number;
    latest_authenticity?: string;
  };
  metadata?: {
    bgColor?: string;
    fgColor?: string;
    errorLevel?: string;
    model?: string;
    owner?: string;
    description?: string;
  };
  alert_config?: {
    phone_numbers: Array<{
      country_code: string;
      number: string;
      label?: string;
    }>;
    email_addresses: string[];
    alert_enabled: boolean;
  };
}

const QRCodeDetailsPage: React.FC = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const navigate = useNavigate();

  const [qrDetails, setQrDetails] = useState<QRReportDetails | null>(null);
  const [scanLogs, setScanLogs] = useState<AntiForgeryScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "scans" | "security" | "analytics"
  >("overview");
  const [isPublicView, setIsPublicView] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">(
    "7d",
  );

  useEffect(() => {
    // Check if this is a public view (no auth required)
    const urlParams = new URLSearchParams(window.location.search);
    const publicParam = urlParams.get("public");

    // DEBUG: Add these console logs
    console.log("🔍 Current URL:", window.location.href);
    console.log("🔍 URL Params:", urlParams.toString());
    console.log("🔍 Public param:", publicParam);
    console.log("🔍 Is public view:", publicParam === "true");

    if (urlParams.get("public") === "true") {
      setIsPublicView(true);
      console.log("✅ Setting public view to true");
    }

    if (!qrId) return;
    fetchQRDetails();
  }, [qrId]);

  const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "");

  const fetchQRDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch QR details
      const detailsResponse = await fetch(`${API_BASE_URL}/qr/details/${qrId}`);
      const detailsData = await detailsResponse.json();

      if (detailsData.success) {
        setQrDetails(detailsData.qr_details);
      }

      // Fetch scan logs with anti-forgery data
      const logsResponse = await fetch(
        `${API_BASE_URL}/qr/all-scan-logs?qr_id=${qrId}&limit=100`,
      );
      const logsData = await logsResponse.json();

      if (logsData.success && logsData.logs) {
        setScanLogs(logsData.logs);

        // Calculate statistics from logs
        const stats = calculateStatistics(logsData.logs);
        if (detailsData.qr_details) {
          setQrDetails((prev) => ({
            ...prev!,
            scan_statistics: {
              ...prev?.scan_statistics,
              ...stats,
            },
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching QR report:", err);
      setError("Failed to load QR report");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (logs: AntiForgeryScanLog[]) => {
    const authentic = logs.filter(
      (log) => log.anti_forgery_analysis?.overall_authenticity === "AUTHENTIC",
    ).length;

    const suspicious = logs.filter(
      (log) => log.anti_forgery_analysis?.overall_authenticity === "SUSPICIOUS",
    ).length;

    const forgeries = logs.filter(
      (log) => log.anti_forgery_analysis?.overall_authenticity === "FORGERY",
    ).length;

    const uniqueDevices = new Set(
      logs.map((log) => log.device_info?.device_id).filter(Boolean),
    );
    const uniqueLocations = new Set(
      logs
        .map((log) =>
          log.location_info
            ? `${log.location_info.city}, ${log.location_info.country}`
            : null,
        )
        .filter(Boolean),
    );

    return {
      total_scans: logs.length,
      authentic_scans: authentic,
      suspicious_scans: suspicious,
      forgery_attempts: forgeries,
      unique_devices: Array.from(uniqueDevices).filter(Boolean) as string[],
      unique_locations: Array.from(uniqueLocations).filter(Boolean) as string[],
      first_scanned_at: logs[logs.length - 1]?.timestamp,
      last_scanned_at: logs[0]?.timestamp,
    };
  };

  const getShareableUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/qr-report/${qrId}?public=true`;
  };

  const copyShareableUrl = () => {
    copyToClipboard(getShareableUrl(), "share-url");
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAuthenticityIcon = (authenticity: string) => {
    switch (authenticity) {
      case "AUTHENTIC":
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case "SUSPICIOUS":
        return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
      case "FORGERY":
        return <AlertOctagon className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAuthenticityColor = (authenticity: string) => {
    switch (authenticity) {
      case "AUTHENTIC":
        return "text-green-600 bg-green-50 border-green-200";
      case "SUSPICIOUS":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "FORGERY":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const generatePrintableReport = () => {
    window.print();
  };

  const filterLogsByTime = (logs: AntiForgeryScanLog[]) => {
    const now = new Date();
    const filterDate = new Date();

    switch (timeFilter) {
      case "24h":
        filterDate.setDate(now.getDate() - 1);
        break;
      case "7d":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        filterDate.setDate(now.getDate() - 30);
        break;
      default:
        return logs;
    }

    return logs.filter((log) => new Date(log.timestamp) >= filterDate);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4">
            <RefreshCw className="h-12 w-12" />
          </div>
          <p className="text-gray-600">Loading QR Security Report...</p>
        </div>
      </div>
    );
  }

  if (error || !qrDetails) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              Error Loading Report
            </h2>
            <p className="text-red-600">{error || "QR Code not found"}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredLogs = filterLogsByTime(scanLogs);
  const stats = qrDetails.scan_statistics || {
    total_scans: 0,
    authentic_scans: 0,
    suspicious_scans: 0,
    forgery_attempts: 0,
    unique_devices: [],
    unique_locations: [],
  };

  // Calculate security score
  const securityScore =
    stats.total_scans > 0
      ? Math.round((stats.authentic_scans / stats.total_scans) * 100)
      : 100;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Hide navbar/header for public view */}
      {isPublicView && (
        <style>{`
          nav, header, .navbar, .header, [role="banner"] {
            display: none !important;
          }
          body { 
            padding-top: 0 !important; 
            margin-top: 0 !important; 
          }
        `}</style>
      )}
      <div className="max-w-7xl mx-auto p-6 print:p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 print:shadow-none print:border-0">
          {/* Public View Banner */}
          {isPublicView && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-semibold text-blue-900">
                      Public Security Report
                    </h2>
                    <p className="text-sm text-blue-700">
                      This is a public view of the QR security analysis. Some
                      internal features are hidden.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {!isPublicView && (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors print:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    QR Security Report
                  </h1>
                  {isPublicView && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Public View
                    </span>
                  )}
                </div>
                <p className="text-gray-600">
                  {isPublicView
                    ? `QR Security Report for ID: ${qrId}`
                    : `Comprehensive security analysis for QR ID: `}
                  {!isPublicView && (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {qrId}
                    </code>
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Report generated on {new Date().toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 print:hidden">
              {!isPublicView && (
                <>
                  <button
                    onClick={copyShareableUrl}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copiedField === "share-url" ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    {copiedField === "share-url" ? "Copied!" : "Share Report"}
                  </button>
                </>
              )}
              <button
                onClick={generatePrintableReport}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </button>
              <button
                onClick={() => window.open(qrDetails.qr_image_url, "_blank")}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View QR Image
              </button>
            </div>
          </div>

          {/* Overall Security Status */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Security Score
                  </p>
                  <p className="text-3xl font-bold text-blue-700">
                    {securityScore}%
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {securityScore >= 90
                      ? "Excellent"
                      : securityScore >= 70
                        ? "Good"
                        : "Needs Attention"}
                  </p>
                </div>
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-blue-200">
                    <div
                      className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center"
                      style={{
                        background: `conic-gradient(from 0deg, #3B82F6 ${securityScore * 3.6}deg, #E5E7EB 0deg)`,
                      }}
                    >
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Authentic Scans
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.authentic_scans}
                  </p>
                </div>
                <ShieldCheck className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">
                    Suspicious
                  </p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {stats.suspicious_scans}
                  </p>
                </div>
                <ShieldAlert className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Forgeries</p>
                  <p className="text-2xl font-bold text-red-700">
                    {stats.forgery_attempts}
                  </p>
                </div>
                <AlertOctagon className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Eye className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {stats.total_scans}
              </div>
              <div className="text-sm text-gray-600">Total Scans</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Smartphone className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {stats.unique_devices?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Unique Devices</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {stats.unique_locations?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Locations</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {stats.first_scanned_at
                  ? Math.ceil(
                      (new Date().getTime() -
                        new Date(stats.first_scanned_at).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Days Active</div>
            </div>
          </div>
        </div>

        {/* Time Filter - Hide for public view */}
        {!isPublicView && (
          <div className="flex justify-between items-center mb-6 print:hidden">
            <div className="flex space-x-2">
              {(["24h", "7d", "30d", "all"] as const).map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeFilter(time)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeFilter === time
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50 border"
                  }`}
                >
                  {time === "all" ? "All Time" : `Last ${time}`}
                </button>
              ))}
            </div>
            <button
              onClick={fetchQRDetails}
              className="flex items-center px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - QR Info & Security */}
          <div className="space-y-6">
            {/* QR Code Display */}
            <div className="bg-white rounded-lg shadow-sm border p-6 print:break-inside-avoid">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                QR Code Details
              </h3>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img
                    src={qrDetails.qr_image_url}
                    alt="QR Code"
                    className="w-48 h-48 border rounded-lg shadow-sm"
                  />
                  <div className="absolute -top-2 -right-2 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                    SECURE
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <Hash className="h-4 w-4 mr-1" />
                    ID:
                  </span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {qrDetails.qr_id}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    Size:
                  </span>
                  <span className="font-medium">
                    {qrDetails.physical_properties?.size_mm || "N/A"}mm
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Security:
                  </span>
                  <span className="font-medium capitalize">
                    {qrDetails.security_features?.security_level || "Standard"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created:
                  </span>
                  <span className="font-medium">
                    {new Date(qrDetails.created_at).toLocaleDateString()}
                  </span>
                </div>

                {qrDetails.data?.original_url && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium mb-1">
                      Target URL:
                    </div>
                    <div className="text-xs font-mono break-all text-blue-700">
                      {qrDetails.data.original_url}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Features */}
            <div className="bg-white rounded-lg shadow-sm border p-6 print:break-inside-avoid">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <Layers className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-700">
                      CDP Protection
                    </span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                {qrDetails.security_features?.anti_photocopy_enabled && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <Camera className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-700">
                        Anti-Photocopy
                      </span>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Fingerprint className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-700">
                      Digital Fingerprinting
                    </span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="font-medium text-purple-700">
                      Real-time Monitoring
                    </span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="font-medium text-orange-700">
                      Geo-Location Analysis
                    </span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-orange-500" />
                </div>
              </div>

              {qrDetails.security_features?.cdp_signature && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium mb-1">
                    CDP Signature:
                  </div>
                  <div className="text-xs font-mono break-all text-gray-700">
                    {qrDetails.security_features.cdp_signature.substring(0, 32)}
                    ...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Scan Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Critical Alerts */}
            {(stats.forgery_attempts > 0 || stats.suspicious_scans > 3) && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 print:break-inside-avoid">
                <div className="flex items-start">
                  <AlertOctagon className="h-6 w-6 text-red-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-700 mb-2">
                      🚨 Security Alert
                    </h3>
                    {stats.forgery_attempts > 0 && (
                      <p className="text-red-700 font-medium mb-2">
                        <strong>{stats.forgery_attempts}</strong> potential
                        forgery attempts detected
                      </p>
                    )}
                    {stats.suspicious_scans > 3 && (
                      <p className="text-red-700 font-medium">
                        <strong>{stats.suspicious_scans}</strong> suspicious
                        scanning patterns identified
                      </p>
                    )}
                    <p className="text-red-600 text-sm mt-2">
                      Immediate investigation recommended. Contact your security
                      team.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Scan Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6 print:break-inside-avoid">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Scan Activity
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredLogs.length} scans in selected period)
                </span>
              </h3>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No scans recorded in this time period</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredLogs.slice(0, 20).map((log, index) => (
                    <div
                      key={log.scan_id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        log.anti_forgery_analysis?.overall_authenticity ===
                        "FORGERY"
                          ? "border-red-300 bg-red-50 shadow-md"
                          : log.anti_forgery_analysis?.overall_authenticity ===
                              "SUSPICIOUS"
                            ? "border-yellow-300 bg-yellow-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getAuthenticityIcon(
                              log.anti_forgery_analysis?.overall_authenticity ||
                                "UNKNOWN",
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">
                                Scan #{filteredLogs.length - index}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getAuthenticityColor(log.anti_forgery_analysis?.overall_authenticity || "")}`}
                              >
                                {log.anti_forgery_analysis
                                  ?.overall_authenticity || "Unknown"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>{formatDate(log.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Smartphone className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {log.device_info?.platform} •{" "}
                                  {log.device_info?.browser}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {log.location_info?.city},{" "}
                                  {log.location_info?.country}
                                </span>
                              </div>
                              {log.network_info?.ip_address && (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-4 w-4 flex-shrink-0" />
                                  <span className="font-mono text-xs">
                                    {log.network_info.ip_address}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Risk Indicators */}
                            {log.anti_forgery_analysis?.risk_indicators &&
                              log.anti_forgery_analysis.risk_indicators.length >
                                0 && (
                                <div className="mt-2 mb-2">
                                  <div className="text-xs font-medium text-red-700 mb-1">
                                    Risk Indicators:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {log.anti_forgery_analysis.risk_indicators.map(
                                      (indicator, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded border border-red-200"
                                        >
                                          {indicator}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Image Analysis Results */}
                            {log.image_analysis_result?.image_processed && (
                              <div className="mt-2 p-3 bg-white rounded border">
                                <div className="font-medium text-xs text-gray-700 mb-2 flex items-center">
                                  <Camera className="h-3 w-3 mr-1" />
                                  Image Analysis Results:
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div
                                    className={`flex items-center gap-1 ${log.image_analysis_result.is_photocopy ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {log.image_analysis_result.is_photocopy
                                      ? "⚠️"
                                      : "✅"}{" "}
                                    Photocopy:{" "}
                                    {log.image_analysis_result.is_photocopy
                                      ? "Detected"
                                      : "Not detected"}
                                  </div>
                                  <div
                                    className={`flex items-center gap-1 ${log.image_analysis_result.size_mismatch ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {log.image_analysis_result.size_mismatch
                                      ? "⚠️"
                                      : "✅"}{" "}
                                    Size:{" "}
                                    {log.image_analysis_result.size_mismatch
                                      ? "Mismatch"
                                      : "OK"}
                                  </div>
                                  {log.image_analysis_result
                                    .size_verification && (
                                    <div className="col-span-2 text-gray-600">
                                      Size Difference:{" "}
                                      {log.image_analysis_result.size_verification.size_difference_percent.toFixed(
                                        1,
                                      )}
                                      %
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-4">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAuthenticityColor(log.anti_forgery_analysis?.overall_authenticity || "")}`}
                          >
                            {log.anti_forgery_analysis?.confidence_score?.toFixed(
                              1,
                            ) || "0"}
                            % confidence
                          </div>
                          {log.anti_forgery_analysis?.total_risk_score !==
                            undefined && (
                            <div className="text-xs text-gray-500 mt-1">
                              Risk:{" "}
                              {log.anti_forgery_analysis.total_risk_score.toFixed(
                                1,
                              )}
                              %
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredLogs.length > 20 && (
                    <div className="text-center text-sm text-gray-500 py-3 border-t">
                      Showing latest 20 scans of {filteredLogs.length} total
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Executive Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6 print:break-inside-avoid">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Executive Summary
              </h3>
              <div className="prose prose-sm max-w-none space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    Scan Overview
                  </h4>
                  <p className="text-blue-800 text-sm">
                    This QR code has been scanned{" "}
                    <strong>{stats.total_scans}</strong> times since its
                    creation on{" "}
                    <strong>
                      {new Date(qrDetails.created_at).toLocaleDateString()}
                    </strong>
                    . Scans originated from{" "}
                    <strong>{stats.unique_devices?.length || 0}</strong> unique
                    devices across{" "}
                    <strong>{stats.unique_locations?.length || 0}</strong>{" "}
                    different locations.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    Security Status
                  </h4>
                  <p className="text-green-800 text-sm">
                    <strong>{stats.authentic_scans}</strong> scans (
                    {(
                      (stats.authentic_scans / Math.max(stats.total_scans, 1)) *
                      100
                    ).toFixed(1)}
                    %) have been verified as authentic, demonstrating the
                    effectiveness of the implemented security measures.
                  </p>
                </div>

                {stats.suspicious_scans > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                      <ShieldAlert className="h-4 w-4 mr-1" />
                      Suspicious Activity
                    </h4>
                    <p className="text-yellow-800 text-sm">
                      <strong>{stats.suspicious_scans}</strong> scans have been
                      flagged as suspicious due to anomalies in device
                      fingerprinting, geolocation patterns, or image analysis.
                      While not definitively classified as forgeries, these
                      warrant closer monitoring.
                    </p>
                  </div>
                )}

                {stats.forgery_attempts > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                      <AlertOctagon className="h-4 w-4 mr-1" />
                      Forgery Detection
                    </h4>
                    <p className="text-red-800 text-sm">
                      <strong>{stats.forgery_attempts}</strong> potential
                      forgery attempts have been detected and blocked. These
                      attempts showed clear signs of counterfeit materials,
                      including photocopy detection triggers, size mismatches,
                      or CDP signature failures.
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    Active Security Technologies
                  </h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>
                      <strong>Copy Detection Pattern (CDP)</strong> - Embedded
                      anti-counterfeiting technology
                    </li>
                    {qrDetails.security_features?.anti_photocopy_enabled && (
                      <li>
                        <strong>Anti-Photocopy Protection</strong> - Detects
                        unauthorized reproduction attempts
                      </li>
                    )}
                    <li>
                      <strong>Real-time Forgery Detection</strong> - AI-powered
                      authenticity verification
                    </li>
                    <li>
                      <strong>Geolocation Risk Analysis</strong> -
                      Location-based threat assessment
                    </li>
                    <li>
                      <strong>Device Fingerprinting</strong> - Unique device
                      identification and tracking
                    </li>
                    <li>
                      <strong>Behavioral Pattern Analysis</strong> - Anomaly
                      detection in scanning behavior
                    </li>
                    <li>
                      <strong>Image Analysis</strong> - Physical document
                      verification
                    </li>
                  </ul>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-1" />
                    Compliance & Audit Trail
                  </h4>
                  <p className="text-indigo-800 text-sm">
                    All scan activities are logged with cryptographic integrity,
                    maintaining a complete audit trail for regulatory
                    compliance. Security analysis employs multiple verification
                    methods to ensure the highest level of document authenticity
                    verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 print:mt-12 border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div>
              <p className="font-medium">Report Generated</p>
              <p>{new Date().toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium">QR Dynamic CDP</p>
              <p>Security System v2.0</p>
            </div>
            <div>
              <p className="font-medium">Report ID</p>
              <p className="font-mono">{qrId}</p>
            </div>
          </div>
          {isPublicView && (
            <p className="mt-4 text-xs">
              This is a public security report. Some internal controls and
              sensitive operational details are hidden for security purposes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeDetailsPage;
