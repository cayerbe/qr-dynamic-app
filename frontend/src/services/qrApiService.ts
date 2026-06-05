import {
  ForgeryLog,
  ContentType,
  QRType,
  ErrorCorrectionLevel,
  Campaign,
  QRCodeData,
  QRApiService as QRApiServiceType,
} from "../types/qr-types";
import { getAuthHeaders } from "./auth";

// Define the base URL for API calls - use the deployed backend
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

console.log(`QR API Service initialized with base URL: ${API_BASE_URL}`);

// Types for QR code data
export interface QRCodeMetadata {
  name?: string;
  description?: string;
  title?: string;
  type?: QRType;
  [key: string]: any;
}

export interface QRGenerateResponse {
  success: boolean;
  qr_id: string;
  download_url: string;
  created_at: string;
  intensity: number;
  message: string;
  cdp_result?: string;
}

export interface QRListResponse {
  success: boolean;
  count: number;
  qr_codes: QRCodeData[];
}

export interface QRDetailsResponse {
  success: boolean;
  qr_code: QRCodeData;
}

export interface URLEntry {
  url_id: string;
  url: string;
  active: boolean;
}

export interface URLsResponse {
  success?: boolean;
  qr_id?: string;
  urls: URLEntry[];
}

export interface AddURLResponse {
  success: boolean;
  message: string;
  url: URLEntry;
}

// Move the QRPayload interface outside the function
interface QRPayload {
  data: string;
  intensity: number;
  metadata: {
    bgColor: string;
    fgColor: string;
    errorLevel: ErrorCorrectionLevel;
  };
}

// Enhanced generateQR function with base64 support
const generateQR = async (
  inputValue: string, // Use the actual parameter passed into the function
  intensity: number = 0.3,
  customization: {
    bgColor?: string;
    fgColor?: string;
    errorLevel?: ErrorCorrectionLevel;
  } = {},
): Promise<{
  success: boolean;
  qr_id: string;
  download_url: string | null;
  base64_image: string | null;
}> => {
  console.log(
    `Generating QR code: data=${inputValue.substring(0, 20)}..., intensity=${intensity}`,
  );

  try {
    const headers = await getAuthHeaders();

    // Corrected payload block
    const payload = {
      data: inputValue, // ✅ Fixed: Use the actual parameter passed into the function
      intensity,
      metadata: {
        bgColor: customization.bgColor || "#FFFFFF", // Default to white
        fgColor: customization.fgColor || "#000000", // Default to black
        errorLevel: customization.errorLevel || "M", // Default to medium error correction
      },
    };

    const response = await fetch(`${API_BASE_URL}/qr/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `QR generation failed with status: ${response.status}, message: ${errorText}`,
      );

      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(
          errorJson.error || errorJson.message || "QR generation failed",
        );
      } catch {
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    }

    const responseData = await response.json();
    console.log("QR API result:", responseData);

    // Return both download_url and base64_image (if available)
    return {
      success: true,
      qr_id: responseData.qr_id,
      download_url: responseData.download_url || null,
      base64_image: responseData.base64_image
        ? `data:image/png;base64,${responseData.base64_image}`
        : null,
    };
  } catch (error) {
    console.error("QR Generation failed:", error);
    throw error;
  }
};

export const listQRCodes = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/list`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    // If response doesn't have qr_codes, throw an error
    if (!data || !data.qr_codes) {
      throw new Error("Invalid response format");
    }

    return data.qr_codes;
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    throw error;
  }
};

// Update the verifyQR function
export const verifyQR = async (qrId: string, formData: FormData) => {
  // Renamed from verifyQRCode to verifyQR
  try {
    const response = await fetch(`/api/qr/verify/${qrId}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error verifying QR code:", error);
    throw error;
  }
};

export const getTotalScans = async () => {
  try {
    const headers = await getAuthHeaders();
    // Fix: Use the correct endpoint from your backend
    const response = await fetch(`${API_BASE_URL}/scans/total`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.totalScans || 0; // Match your backend response
  } catch (error) {
    console.error("Error fetching total scans:", error);
    return 0; // Return 0 instead of throwing
  }
};

export const getUserCount = async () => {
  try {
    const headers = await getAuthHeaders();
    // Fix: Use the correct endpoint from your backend
    const response = await fetch(`${API_BASE_URL}/admin/user-count`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.userCount || 0; // Match your backend response
  } catch (error) {
    console.error("Error fetching user count:", error);
    return 0; // Return 0 instead of throwing
  }
};

export const getQRCodeCount = async () => {
  try {
    const headers = await getAuthHeaders();
    // Fix: Use the correct endpoint from your backend
    const response = await fetch(`${API_BASE_URL}/admin/qr-count`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.qrCodeCount || 0; // Match your backend response
  } catch (error) {
    console.error("Error fetching QR code count:", error);
    return 0; // Return 0 instead of throwing
  }
};

export const getUserGrowth = async (timeRange: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/admin/user-growth?range=${timeRange}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    return {
      thisMonth: data.data?.thisMonth ?? 0,
      lastMonth: data.data?.lastMonth ?? 0,
      percentChange: data.data?.percentChange ?? 0,
      ...(typeof data === "object" ? data : {}),
    };
  } catch (error) {
    console.error("Error fetching user growth:", error);
    return {
      thisMonth: 0,
      lastMonth: 0,
      percentChange: 0,
    };
  }
};

export const getScanTrend = async (timeRange: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/admin/scan-trend?range=${timeRange}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    return {
      thisMonth: data.data?.thisMonth ?? 0,
      lastMonth: data.data?.lastMonth ?? 0,
      percentChange: data.data?.percentChange ?? 0,
      ...(typeof data === "object" ? data : {}),
    };
  } catch (error) {
    console.error("Error fetching scan trend:", error);
    return {
      thisMonth: 0,
      lastMonth: 0,
      percentChange: 0,
    };
  }
};

export const getTodayStats = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/admin/today-stats`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Ensure the response has the expected properties
    if (typeof data === "object" && data !== null) {
      return {
        qrCodesGenerated: data.data?.qrCodesGenerated ?? 0,
        scans: data.data?.scans ?? 0,
        ...data, // Spread other properties
      };
    }

    throw new Error("Invalid response format for today's stats");
  } catch (error) {
    console.error("Error fetching today's stats:", error);
    throw error;
  }
};

// Add the getUsers method
export const getUsers = async (filters = {}) => {
  try {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams(
      filters as Record<string, string>,
    ).toString();
    const url = `${API_BASE_URL}/admin/users${queryParams ? `?${queryParams}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Fetch user stats
export const getUserStats = async (userId: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/admin/user-stats/${userId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
};

// Create user
export const createUser = async (userForm: object) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      body: JSON.stringify(userForm),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId: string, userForm: object) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userForm),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Update user status
export const updateUserStatus = async (userId: string, newStatus: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

// Reset user password
export const resetUserPassword = async (email: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};

// Verify API with CORS
export const verifyApiWithCors = async () => {
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      mode: "cors",
    });

    if (!healthResponse.ok) {
      console.error("API health check failed");
      return {
        apiStatus: "error",
        message: `API health check failed: ${healthResponse.status}`,
      };
    }

    return {
      apiStatus: "ok",
      corsStatus: "ok",
      message: "API and CORS are working correctly",
    };
  } catch (error) {
    console.error("API verification failed:", error);
    return {
      apiStatus: "error",
      corsStatus: "unknown",
      message: "API verification failed",
    };
  }
};

// Add the fetchForgeryLogs method
export const fetchForgeryLogs = async (): Promise<ForgeryLog[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/forgery_logs`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data.logs)) {
      return data.logs;
    } else if (Array.isArray(data.data?.logs)) {
      return data.data.logs;
    }

    return [];
  } catch (error) {
    console.error("Error fetching forgery logs:", error);
    return [];
  }
};

// Get all scan logs
export const getAllScanLogs = async (
  options: {
    limit?: number;
    offset?: number;
    qr_id?: string;
  } = {},
) => {
  try {
    const { limit = 50, offset = 0, qr_id = null } = options;
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    if (qr_id) params.append("qr_id", qr_id);

    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/all-scan-logs?${params}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch scan logs: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching all scan logs:", error);
    throw error;
  }
};

// Get scan logs statistics
export const getScanLogsStats = async (timeRange = "7d") => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/qr/scan-logs-stats?time_range=${timeRange}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch scan logs stats: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching scan logs statistics:", error);
    throw error;
  }
};

// Get scan statistics
export const getScanStatistics = async (timeRange = "7d") => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/qr/scan-statistics?time_range=${timeRange}`,
      {
        method: "GET",
        headers: await getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch scan statistics");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Scan statistics fetch error:", error);
    throw error;
  }
};

// Log QR scan
export const logQRScan = async (scanData: {
  qr_id: string;
  device_info: any;
  location_info?: any;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/qr/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify(scanData),
    });

    if (!response.ok) {
      throw new Error(`Scan logging failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("QR scan log error:", error);
    throw error;
  }
};

// Enhanced QR generation
export const generateEnhancedQR = async (
  inputValue: string,
  options: {
    size_mm?: number;
    intensity?: number;
    cdp_config?: any;
    admin_user?: boolean;
    notification_emails?: string; // ✅ ADD THIS
    metadata?: any;
    model?: string;
    model_config?: any;
    expiration_config?: any;
    // Add any other fields your API expects
  } = {},
) => {
  try {
    const headers = await getAuthHeaders();

    const payload = {
      data: inputValue,
      size_mm: options.size_mm,
      intensity: options.intensity,
      notification_emails: options.notification_emails, // ✅ EXPLICIT INCLUSION
      metadata: options.metadata,
      model: options.model,
      model_config: options.model_config,
      expiration_config: options.expiration_config,
      cdp_config: options.cdp_config,
      admin_user: options.admin_user,
    };

    console.log(
      "🔧 Service layer sending payload:",
      JSON.stringify(payload, null, 2),
    );

    const response = await fetch(`${API_BASE_URL}/qr/generate-enhanced`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Enhanced QR generation failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Enhanced QR Generation failed:", error);
    throw error;
  }
};

// Update enhanced QR
export const updateEnhancedQR = async (
  qrId: string,
  options: {
    cdp_config?: any;
    metadata?: Record<string, any>;
    admin_user?: boolean;
  },
) => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/qr/update-enhanced/${qrId}`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Failed to update QR code: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating enhanced QR code:", error);
    throw error;
  }
};

// Get size recommendations
export const getSizeRecommendations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/qr/size-recommendations`, {
      method: "GET",
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch size recommendations: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching size recommendations:", error);
    throw error;
  }
};

// Calculate optimal size
export const calculateOptimalSize = async (options: Record<string, any>) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/size-calculator`, {
      method: "POST",
      body: JSON.stringify(options),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate optimal size: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calculating optimal size:", error);
    throw error;
  }
};

// Generate Zecca QR
export const generateZeccaQR = async (options: {
  data: string;
  cdp_density?: string;
  print_profile?: string;
  substrate_type?: string;
}) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/generate-zecca`, {
      method: "POST",
      body: JSON.stringify(options),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to generate Zecca QR: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating Zecca QR:", error);
    throw error;
  }
};

// Generate Zecca batch
export const generateZeccaBatch = async (options: Record<string, any>) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/test-batch-zecca`, {
      method: "POST",
      body: JSON.stringify(options),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to generate Zecca batch: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating Zecca batch:", error);
    throw error;
  }
};

// Get enhanced scan logs stats
export const getScanLogsStatsEnhanced = async (timeRange = "7d") => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/qr/scan-logs-stats-enhanced?time_range=${timeRange}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch enhanced scan logs stats: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching enhanced scan logs statistics:", error);
    throw error;
  }
};

// Delete QR Code
export const deleteQRCode = async (qrId: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/${qrId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting QR code:", error);
    throw error;
  }
};

// Verify QR Code (different from verifyQR)
export const verifyQRCode = async (qrCodeData: string) => {
  try {
    const headers = await getAuthHeaders();
    const payload = {
      qr_data: qrCodeData,
    };

    const response = await fetch(`${API_BASE_URL}/qr/verify`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("QR Code Verification Error", error);
    throw error;
  }
};

// Verify Forgery
export const verifyForgery = async (qrId: string, formData: FormData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/qr/verify/${qrId}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Forgery Verification Error", error);
    throw error;
  }
};

// Health Check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health-check`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Health check failed", error);
    throw error;
  }
};

// Get CDP Info
export const getCdpInfo = async (qrId: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/details/${qrId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("CDP Info Retrieval Error", error);
    throw error;
  }
};

// Get URLs
export const getUrls = async (qrId: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/${qrId}/urls`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching URLs:", error);
    throw error;
  }
};

// Add URL
export const addUrl = async (urlData: {
  qrId: string;
  url: string;
  name?: string;
  description?: string;
  active?: boolean;
}) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/${urlData.qrId}/urls`, {
      method: "POST",
      body: JSON.stringify(urlData),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding URL:", error);
    throw error;
  }
};

// Update URL
export const updateUrl = async (
  urlId: string,
  urlData: {
    url?: string;
    name?: string;
    description?: string;
    active?: boolean;
  },
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/urls/${urlId}`, {
      method: "PUT",
      body: JSON.stringify(urlData),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating URL:", error);
    throw error;
  }
};

// Delete URL
export const deleteUrl = async (urlId: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/urls/${urlId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting URL:", error);
    throw error;
  }
};

// Set Active URL
export const setActiveUrl = async (qrId: string, urlId: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/${qrId}/urls/active`, {
      method: "PATCH",
      body: JSON.stringify({ url_id: urlId }),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error setting active URL:", error);
    throw error;
  }
};

// List Campaigns
export const listCampaigns = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      campaigns: data.data?.campaigns || data.campaigns || [],
    };
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return { campaigns: [] };
  }
};

// Create Campaign
export const createCampaign = async (
  name: string,
  description: string = "",
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: "POST",
      body: JSON.stringify({ name, description }),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
};

// Get Forgery Logs (different from fetchForgeryLogs)
export const getForgeryLogs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/qr/forgery_logs`, {
      method: "GET",
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch forgery logs");
    }

    return await response.json();
  } catch (error) {
    console.error("Forgery logs fetch error:", error);
    throw error;
  }
};

export const getQRDetails = async (qrId: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/qr/details/${qrId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch QR details: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching QR details:", error);
    throw error;
  }
};

// Verify Photocopy
export const verifyPhotocopy = async (qrId: string, formData: FormData) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_BASE_URL || ""}/qr/verify-photocopy/${qrId}`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Photocopy verification failed");
  }

  return await response.json();
};

// Add the method to the qrApiService object
const qrApiService: QRApiServiceType = {
  // Core QR Methods
  generateQR,
  generateEnhancedQR,
  updateEnhancedQR,
  listQRCodes,
  verifyQR,
  deleteQRCode,

  // Statistics Methods
  getTotalScans,
  getUserCount,
  getQRCodeCount,
  getUserGrowth,
  getScanTrend,
  getTodayStats,
  getScanStatistics,
  getScanLogsStats,
  getScanLogsStatsEnhanced,

  // User Management Methods
  getUsers,
  getUserStats,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  resetUserPassword,

  // Verification Methods
  verifyQRCode,
  verifyForgery,
  healthCheck,
  verifyApiWithCors,
  verifyPhotocopy, // Add this here

  // CDP Methods
  getCdpInfo,
  getQRDetails, // Added here
  getSizeRecommendations,
  calculateOptimalSize,

  // URL Management Methods
  getUrls,
  addUrl,
  updateUrl,
  deleteUrl,
  setActiveUrl,

  // Campaign Methods
  listCampaigns,
  createCampaign,

  // Forgery and Logging Methods
  getForgeryLogs,
  fetchForgeryLogs,
  logQRScan,
  getAllScanLogs,

  // Zecca Methods
  generateZeccaQR,
  generateZeccaBatch,
};

export default qrApiService;
