import React, { useState, useEffect } from "react";

// Icon components remain the same...
const Shield = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const AlertTriangle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const XCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const History = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const Eye = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const BarChart4 = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const MapPin = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const Smartphone = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const Monitor = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const Search = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

// Updated interface to match CDP-focused backend
interface AntiForgeryScanLog {
  scan_id: string;
  qr_id?: string;
  timestamp: any;
  user_id?: string;
  device_info?: {
    device_id?: string;
    browser?: string;
    user_agent?: string;
    platform?: string;
    is_mobile?: boolean;
  };
  location_info?: {
    city?: string;
    country?: string;
    country_code?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
    risk_score?: number;
    threat_level?: string;
  };
  network_info?: {
    ip_address?: string;
  };
  scan_type?: string;

  // Updated anti-forgery analysis structure
  anti_forgery_analysis?: {
    methods_applied: string[];
    overall_authenticity:
      | "AUTHENTIC"
      | "SUSPICIOUS"
      | "FORGERY"
      | "PENDING"
      | "ERROR";
    confidence_score: number;
    total_risk_score: number;
    risk_indicators: string[];

    // Updated CDP verification structure
    cdp_verification?: {
      cdp_verified?: boolean;
      cdp_score?: number;
      cdp_threshold?: number;
      pattern_integrity?: string;
      error?: string;
      degradation_analysis?: {
        frequency_preservation?: number;
        pattern_correlation?: number;
        structural_integrity?: number;
      };
    };

    // Pattern analysis from backend
    forgery_pattern_detection?: {
      is_potential_forgery?: boolean;
      forgery_risk_score?: number;
      indicators?: any;
      scan_count?: number;
    };

    // Other analysis results
    geolocation_analysis?: {
      risk_score?: number;
      threat_level?: string;
      location?: string;
    };

    device_analysis?: {
      is_bot?: boolean;
      user_agent_risk?: string;
    };

    behavioral_analysis?: {
      scan_timing?: string;
      scan_pattern?: string;
      user_behavior_score?: number;
    };
  };
}

interface ScanTrackingProps {
  qrId?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

const EnhancedScanTracking: React.FC<ScanTrackingProps> = ({ qrId }) => {
  const [scanLogs, setScanLogs] = useState<AntiForgeryScanLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filters and search
  const [authenticityFilter, setAuthenticityFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    totalScans: 0,
    authenticScans: 0,
    suspiciousScans: 0,
    forgeryScans: 0,
    averageConfidence: 0,
  });

  // Function to validate the scan token
  const validateScanToken = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/pwa/validate-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_token: token }),
      });

      if (!res.ok) {
        throw new Error(`Validation failed: ${res.status}`);
      }

      const data = await res.json();
      console.log("Token validation result:", data);
    } catch (err) {
      console.error("Scan token validation error:", err);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      validateScanToken(token);
    }
  }, []);

  useEffect(() => {
    fetchComprehensiveScanLogs();
  }, [qrId, authenticityFilter]);

  const fetchComprehensiveScanLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching scan logs...");

      const limit = 50;
      const offset = 0;

      const response = await fetch(
        `${API_BASE_URL}/qr/all-scan-logs?limit=${limit}&offset=${offset}${
          qrId ? `&qr_id=${qrId}` : ""
        }`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received scan logs data:", data);

      if (data.success && Array.isArray(data.logs)) {
        setScanLogs(data.logs);
        calculateStats(data.logs);
        setLastRefresh(new Date());
      } else {
        console.warn("Unexpected data format:", data);
        setScanLogs([]);
      }
    } catch (err) {
      console.error("Error fetching scan logs:", err);
      setError(
        `Failed to load scan logs: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const processTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();

    if (timestamp instanceof Date) return timestamp;

    if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
      return new Date(
        timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000,
      );
    }

    if (typeof timestamp === "string") return new Date(timestamp);
    if (typeof timestamp === "number") return new Date(timestamp);

    return new Date();
  };

  const calculateStats = (logs: AntiForgeryScanLog[]) => {
    const totalScans = logs.length;
    const authenticScans = logs.filter(
      (log) => log.anti_forgery_analysis?.overall_authenticity === "AUTHENTIC",
    ).length;
    const suspiciousScans = logs.filter(
      (log) => log.anti_forgery_analysis?.overall_authenticity === "SUSPICIOUS",
    ).length;
    const forgeryScans = logs.filter(
      (log) => log.anti_forgery_analysis?.overall_authenticity === "FORGERY",
    ).length;

    const confidenceScores = logs
      .map((log) => log.anti_forgery_analysis?.confidence_score || 0)
      .filter((score) => score > 0);

    const averageConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((sum, score) => sum + score, 0) /
          confidenceScores.length
        : 0;

    setStats({
      totalScans,
      authenticScans,
      suspiciousScans,
      forgeryScans,
      averageConfidence,
    });
  };

  const handleRefresh = () => {
    fetchComprehensiveScanLogs();
  };

  const formatDateTime = (timestamp: any) => {
    try {
      const date = processTimestamp(timestamp);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const getAuthenticityIcon = (authenticity: string) => {
    switch (authenticity) {
      case "AUTHENTIC":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "SUSPICIOUS":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "FORGERY":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAuthenticityColor = (authenticity: string) => {
    switch (authenticity) {
      case "AUTHENTIC":
        return "bg-green-50 border-green-200 text-green-800";
      case "SUSPICIOUS":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "FORGERY":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  // Filter logs based on search term
  const filteredLogs = scanLogs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.qr_id?.toLowerCase().includes(searchLower) ||
      log.location_info?.city?.toLowerCase().includes(searchLower) ||
      log.device_info?.browser?.toLowerCase().includes(searchLower) ||
      log.anti_forgery_analysis?.overall_authenticity
        ?.toLowerCase()
        .includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Shield className="mr-3 text-blue-600" />
            CDP-Enhanced Security Tracking
            {qrId && (
              <span className="ml-2 text-sm text-gray-500">
                ({qrId.substring(0, 12)}...)
              </span>
            )}
          </h2>
          <p className="text-gray-600 mt-1">
            Copy Detection Pattern (CDP) verification for every QR code scan
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <AlertCircle className="inline mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Scans</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalScans}
              </p>
            </div>
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Authentic</p>
              <p className="text-2xl font-bold text-green-900">
                {stats.authenticScans}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Suspicious</p>
              <p className="text-2xl font-bold text-yellow-900">
                {stats.suspiciousScans}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Forgeries</p>
              <p className="text-2xl font-bold text-red-900">
                {stats.forgeryScans}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Avg Confidence
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.averageConfidence.toFixed(1)}%
              </p>
            </div>
            <BarChart4 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by QR ID, location, device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <select
          value={authenticityFilter}
          onChange={(e) => setAuthenticityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Results</option>
          <option value="AUTHENTIC">Authentic Only</option>
          <option value="SUSPICIOUS">Suspicious Only</option>
          <option value="FORGERY">Forgeries Only</option>
        </select>
      </div>

      {/* Scan Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold flex items-center">
            <History className="mr-2" />
            CDP Security Scan Results ({filteredLogs.length} records)
          </h3>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading CDP verification results...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No scan results found</p>
            <p className="text-gray-400 text-sm mt-2">
              QR codes with CDP verification will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Security Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CDP Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location & Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Indicators
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log, index) => {
                  const analysis = log.anti_forgery_analysis;
                  const authenticity =
                    analysis?.overall_authenticity || "UNKNOWN";
                  const cdpData = analysis?.cdp_verification;

                  return (
                    <tr key={log.scan_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getAuthenticityColor(authenticity)}`}
                        >
                          {getAuthenticityIcon(authenticity)}
                          <span className="ml-2">{authenticity}</span>
                          {analysis?.confidence_score !== undefined && (
                            <span className="ml-2 text-xs">
                              ({analysis.confidence_score.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {log.qr_id
                            ? `${log.qr_id.substring(0, 12)}...`
                            : "Unknown QR"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Risk Score:{" "}
                          {analysis?.total_risk_score?.toFixed(1) || "N/A"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {cdpData ? (
                            <div>
                              <div className="flex items-center">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    cdpData.cdp_verified
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  CDP:{" "}
                                  {cdpData.cdp_verified ? "VERIFIED" : "FAILED"}
                                </span>
                              </div>
                              {cdpData.cdp_score !== undefined && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Score: {(cdpData.cdp_score * 100).toFixed(1)}%
                                  {cdpData.cdp_threshold && (
                                    <span className="text-gray-400">
                                      {" "}
                                      (threshold:{" "}
                                      {(cdpData.cdp_threshold * 100).toFixed(0)}
                                      %)
                                    </span>
                                  )}
                                </div>
                              )}
                              {cdpData.error && (
                                <div className="text-xs text-red-600 mt-1">
                                  Error: {cdpData.error}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">
                              No CDP data
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Methods: {analysis?.methods_applied?.length || 0}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span>
                              {log.location_info?.city &&
                              log.location_info?.country
                                ? `${log.location_info.city}, ${log.location_info.country}`
                                : "Unknown Location"}
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            {log.device_info?.is_mobile ? (
                              <Smartphone className="h-4 w-4 text-gray-400 mr-1" />
                            ) : (
                              <Monitor className="h-4 w-4 text-gray-400 mr-1" />
                            )}
                            <span className="text-gray-600">
                              {log.device_info?.browser || "Unknown"} •{" "}
                              {log.device_info?.platform || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {analysis?.risk_indicators?.length ? (
                            analysis.risk_indicators.map((indicator, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                              >
                                {indicator.replace(/_/g, " ")}
                              </span>
                            ))
                          ) : (
                            <span className="text-green-600 text-xs">
                              No Risk Indicators
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDateTime(log.timestamp)}</div>
                        <div className="text-xs">
                          {log.user_id || "Anonymous"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">
          🔒 CDP-Enhanced Security Protection
        </h4>
        <p className="text-sm text-blue-700">
          Every QR code scan is protected by Copy Detection Pattern (CDP)
          technology:
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>
            • <strong>CDP Verification:</strong> Compares scanned pattern with
            original security signature (90% threshold)
          </li>
          <li>
            • <strong>Pattern Integrity:</strong> Analyzes frequency
            preservation and structural integrity
          </li>
          <li>
            • <strong>Geolocation Risk:</strong> Flags scans from high-risk
            locations
          </li>
          <li>
            • <strong>Device Fingerprinting:</strong> Detects suspicious
            scanning devices and bots
          </li>
          <li>
            • <strong>Behavioral Analysis:</strong> Identifies unusual scanning
            patterns
          </li>
        </ul>
        <p className="text-sm text-blue-700 mt-2 font-medium">
          CDP patterns degrade significantly when photocopied, providing
          reliable forgery detection.
        </p>
      </div>
    </div>
  );
};

export default EnhancedScanTracking;
