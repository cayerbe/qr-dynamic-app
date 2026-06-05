// src/types/qr-types.ts

// Import the new model types
import { QRModel, QRModelConfig } from "./qr-models";

// Your existing types (unchanged)
export type QRType = "dynamic" | "static" | "self-scanning" | "campaign";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type ContentType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "vcard"
  | "wifi"
  | "contact"
  | "location";

// ENHANCED: QRCode interface with model support
export interface QRCode {
  id: string;
  name: string;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  campaign?: string;
  contentType: string;
  tags?: string[];
  type: QRType;
  scans: number;
  lastScan?: string;
  imageUrl?: string;
  image_url?: string;
  data: string | any;
  userId: string;
  intensity?: number;

  // ENHANCED: metadata now includes model support
  metadata?: {
    // 🔐 NEW: Model information
    model?: QRModel;
    model_name?: string;
    model_config?: QRModelConfig["features"];

    // Your existing CDP config (now enhanced)
    cdp_config?: {
      size_mm?: number;
      cdp_density?: string;
      print_profile?: string;
      substrate_type?: string;
      // NEW: Additional model-specific CDP settings
      noise_layers?: number;
      frequency_bands?: number;
      correlation_threshold?: number;
      anti_ml_features?: boolean;
    };

    // Your existing fields
    bgColor?: string;
    fgColor?: string;
    errorLevel?: string;

    // 🔐 NEW: Enhanced security features
    security_features?: {
      anti_photocopy?: boolean;
      security_level?: string;
      max_scans?: number;
      scan_limit_enforced?: boolean;
      verification_required?: boolean;
      one_time_use?: boolean;
    };

    // 🔐 NEW: Lifecycle management
    lifecycle?: {
      expiration_days?: number;
      max_scans?: number;
      created_with_model?: QRModel;
      expires_at?: string;
      scan_count?: number;
    };

    [key: string]: any;
  };
}

// ENHANCED: QRApiService with model support
export interface QRApiService {
  // ENHANCED: Core QR Methods with model support
  generateQR: (
    data: string,
    intensity?: number,
    customization?: {
      bgColor?: string;
      fgColor?: string;
      errorLevel?: ErrorCorrectionLevel;
    },
  ) => Promise<any>;

  // ENHANCED: Enhanced QR generation now supports models
  generateEnhancedQR: (
    inputValue: string,
    options?: {
      size_mm?: number;
      intensity?: number;
      cdp_config?: any;
      admin_user?: boolean;
      // 🔐 NEW: Model support
      model?: QRModel;
      model_config?: QRModelConfig["features"];
    },
  ) => Promise<any>;
  updateEnhancedQR: (
    qrId: string,
    options: {
      cdp_config?: any;
      metadata?: Record<string, any>;
      admin_user?: boolean;
    },
  ) => Promise<any>;
  listQRCodes: () => Promise<any>;
  verifyQR: (qrId: string, formData: FormData) => Promise<any>;
  deleteQRCode: (qrId: string) => Promise<any>;

  // Statistics Methods
  getTotalScans: () => Promise<number>;
  getUserCount: () => Promise<number>;
  getQRCodeCount: () => Promise<number>;
  getUserGrowth: (timeRange: string) => Promise<any>;
  getScanTrend: (timeRange: string) => Promise<any>;
  getTodayStats: () => Promise<any>;
  getScanStatistics: (timeRange?: string) => Promise<any>;
  getScanLogsStats: (timeRange?: string) => Promise<any>;
  getScanLogsStatsEnhanced: (timeRange?: string) => Promise<any>;

  // User Management Methods
  getUsers: (filters?: object) => Promise<any>;
  getUserStats: (userId: string) => Promise<any>;
  createUser: (userForm: object) => Promise<any>;
  updateUser: (userId: string, userForm: object) => Promise<any>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserStatus: (userId: string, newStatus: string) => Promise<void>;
  resetUserPassword: (email: string) => Promise<any>;

  // Verification Methods
  verifyQRCode: (qrCodeData: string) => Promise<any>;
  verifyForgery: (qrId: string, formData: FormData) => Promise<any>;
  verifyPhotocopy: (qrId: string, formData: FormData) => Promise<any>; // ADD THIS LINE
  healthCheck: () => Promise<any>;
  verifyApiWithCors: () => Promise<{
    apiStatus: string;
    corsStatus?: string;
    message: string;
  }>;

  // CDP Methods
  getCdpInfo: (qrId: string) => Promise<any>;
  getQRDetails: (qrId: string) => Promise<any>;
  getSizeRecommendations: () => Promise<any>;
  calculateOptimalSize: (options: Record<string, any>) => Promise<any>;

  // URL Management Methods
  getUrls: (qrId: string) => Promise<any>;
  addUrl: (urlData: {
    qrId: string;
    url: string;
    name?: string;
    description?: string;
    active?: boolean;
  }) => Promise<any>;
  updateUrl: (
    urlId: string,
    urlData: {
      url?: string;
      name?: string;
      description?: string;
      active?: boolean;
    },
  ) => Promise<any>;
  deleteUrl: (urlId: string) => Promise<any>;
  setActiveUrl: (qrId: string, urlId: string) => Promise<any>;

  // Campaign Methods
  listCampaigns: () => Promise<any>;
  createCampaign: (name: string, description?: string) => Promise<any>;

  // Forgery and Logging Methods
  getForgeryLogs: () => Promise<any>;
  fetchForgeryLogs: () => Promise<ForgeryLog[]>;
  logQRScan: (scanData: {
    qr_id: string;
    device_info: any;
    location_info?: any;
  }) => Promise<any>;
  getAllScanLogs: (options?: {
    limit?: number;
    offset?: number;
    qr_id?: string;
  }) => Promise<any>;

  // Zecca Methods
  generateZeccaQR: (options: {
    data: string;
    cdp_density?: string;
    print_profile?: string;
    substrate_type?: string;
  }) => Promise<any>;
  generateZeccaBatch: (options: Record<string, any>) => Promise<any>;
}

// QR Code Data Structure - Fixed to use string dates for API compatibility
export interface QRCodeData {
  id: string;
  type: QRType;
  contentType: ContentType;
  content: string;
  createdAt: string; // Changed from Date to string
  lastScanned?: string; // Changed from Date to string
  totalScans?: number;
  cdpSignature?: string;
  metadata?: Record<string, any>;
}

// Scan Logging Types
export interface ScanLocation {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  accuracy?: number;
}

export interface NetworkInfo {
  ip_address?: string;
  isp?: string;
  connection_type?: "wifi" | "cellular" | "unknown";
}

export interface DeviceInfo {
  device_id?: string;
  user_agent?: string;
  device_type?: "mobile" | "desktop" | "tablet" | "unknown";
  os?: string;
  os_version?: string;
  browser?: string;
  browser_version?: string;
  is_mobile?: boolean;
}

// Enhanced Anti-Forgery Analysis Types
export interface CDPVerification {
  original_signature: string;
  scanned_signature?: string;
  similarity_score: number;
}

export interface PhotocopyDetection {
  is_photocopy: boolean;
  confidence: number;
  degradation_scores: {
    frequency_loss: number;
    microprint_degradation: number;
    moire_patterns: number;
    void_pantograph: number;
    edge_degradation: number;
    noise_pattern: number;
  };
}

export interface PatternAnalysis {
  recent_scans_count: number;
  scanning_frequency: "HIGH" | "NORMAL" | "LOW";
}

export interface AntiForgerryAnalysis {
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
  cdp_verification?: CDPVerification;
  photocopy_detection?: PhotocopyDetection;
  pattern_analysis?: PatternAnalysis;
}

// Enhanced Scan Log with Anti-Forgery Analysis
export interface AntiForgeryScanLog extends ScanLog {
  scan_type?: string;
  anti_forgery_analysis?: AntiForgerryAnalysis;
}

// Forgery Indicators
export interface ForgeryIndicators {
  rapid_scans?: number;
  geo_anomalies?: number;
  device_diversity?: number;
}

// Scan Log
export interface ScanLog {
  scan_id?: string;
  qr_id: string;
  user_id?: string;
  timestamp: string; // Changed from Date to string

  location?: ScanLocation;
  location_info?: ScanLocation; // Added for API compatibility
  network_info?: NetworkInfo;
  device_info: DeviceInfo;

  qr_metadata?: {
    cdp_signature?: string;
    original_url?: string;
    qr_type?: QRType;
  };

  forgery_detection?: {
    risk_score: number;
    is_potential_forgery: boolean;
    indicators?: ForgeryIndicators;
  };

  additional_context?: Record<string, any>;
}

// Enhanced Forgery Log
export interface EnhancedForgeryLog extends ScanLog {
  investigation_status?: "pending" | "investigated" | "resolved";
  notes?: string;
  reported_by?: string;
}

// Campaign-related Types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  start_date: string; // Changed from Date to string
  end_date?: string; // Changed from Date to string
  associated_qr_codes?: string[];
  status: "active" | "draft" | "completed" | "archived";
  qrCount?: number;
  created_at?: string;
  updated_at?: string;
}

// Forgery Log Type (for API responses)
export interface ForgeryLog {
  id?: string;
  qr_id: string;
  timestamp: string; // Changed from Date to string
  is_potential_forgery: boolean;
  risk_score: number;
  message?: string;
  indicators?: {
    rapid_scans?: number;
    geo_anomalies?: number;
    device_diversity?: number;
  };
}

// Conversion function for QRCodeData to QRCode
export function convertToQRCode(
  apiData: any,
  userId: string = "unknown",
): QRCode {
  try {
    const formatTimestamp = (timestamp: any): string => {
      if (!timestamp) return new Date().toISOString();
      if (typeof timestamp === "string") return timestamp;
      if (timestamp.seconds)
        return new Date(timestamp.seconds * 1000).toISOString();
      return new Date(timestamp).toISOString();
    };

    return {
      id: apiData.id || `qr_${Date.now()}`,
      userId: userId,
      name: apiData.name || "Untitled QR Code",
      title: apiData.title || "Untitled QR Code",
      description: apiData.description || "",
      createdAt: formatTimestamp(apiData.created_at),
      updatedAt: formatTimestamp(apiData.updated_at || apiData.created_at),
      data: apiData.data || "",
      intensity: apiData.intensity || 0.5,
      image_url: apiData.image_url || "",
      imageUrl: apiData.image_url || "",
      scans: apiData.scans || 0,
      lastScan: formatTimestamp(apiData.lastScan),
      type: apiData.type || "static",
      contentType: apiData.contentType || "url",
      campaign: apiData.campaign || "",
      tags: apiData.tags || [],

      // 🔐 ENHANCED: Handle model metadata
      metadata:
        {
          ...apiData.metadata,
          // Extract model information if present
          model: apiData.metadata?.model,
          model_name: apiData.metadata?.model_name,
          model_config: apiData.metadata?.model_config,
          // Preserve existing fields
          cdp_config: apiData.metadata?.cdp_config,
          bgColor: apiData.metadata?.bgColor,
          fgColor: apiData.metadata?.fgColor,
          errorLevel: apiData.metadata?.errorLevel,
          // New enhanced fields
          security_features: apiData.metadata?.security_features,
          lifecycle: apiData.metadata?.lifecycle,
        } || {},
    };
  } catch (error) {
    console.error("Error converting API data to QRCode:", error);
    return {
      id: `error_${Date.now()}`,
      userId: userId,
      name: "Error Loading QR Code",
      title: "Error Loading QR Code",
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: "",
      intensity: 0.5,
      image_url: "",
      imageUrl: "",
      scans: 0,
      lastScan: undefined,
      type: "static",
      contentType: "url",
      campaign: "",
      tags: [],
      metadata: {},
    };
  }
}

// Conversion function for Campaign
export function convertToCampaign(apiData: any): Campaign {
  try {
    const formatDate = (dateValue: any): string => {
      if (!dateValue) return new Date().toISOString();
      if (typeof dateValue === "string") return dateValue;
      if (dateValue.seconds)
        return new Date(dateValue.seconds * 1000).toISOString();
      return new Date(dateValue).toISOString();
    };

    return {
      id: apiData.id || `campaign_${Date.now()}`,
      name: apiData.name || "Untitled Campaign",
      description: apiData.description || "",
      start_date: formatDate(apiData.start_date),
      end_date: apiData.end_date ? formatDate(apiData.end_date) : undefined,
      status: apiData.status || "active",
      qrCount: apiData.qrCount || 0,
      associated_qr_codes: apiData.associated_qr_codes || [],
      created_at: formatDate(apiData.created_at),
      updated_at: formatDate(apiData.updated_at),
    };
  } catch (error) {
    console.error("Error converting API data to Campaign:", error);
    return {
      id: `error_campaign_${Date.now()}`,
      name: "Error Loading Campaign",
      description: "",
      start_date: new Date().toISOString(),
      status: "draft",
      qrCount: 0,
      associated_qr_codes: [],
    };
  }
}

// FERRARI QR GENEALOGY TYPES
export interface FerrariQR {
  qr_id: string;
  type: "mother" | "child";
  generation: number;
  children: string[];
  ferrari_metadata: {
    product_data?: {
      model: string;
      vin: string;
      year: string;
      color: string;
      engine_number?: string;
    };
    created_at: string;
    ferrari_certified: boolean;
    mint_count: number;
    max_children: number;
  };
  qr_image_url: string;
}

export interface FamilyNode {
  qr_id: string;
  generation: number;
  type: "mother" | "child";
  parent: { qr_id: string; generation: number } | null;
  children: string[];
  siblings: string[];
}

export interface ContrassegnoCertificate {
  certificate_id: string;
  product_identity: {
    mother_qr_id: string;
    manufacture_date: string;
    first_verification: string;
  };
  genealogy_chain: Array<{
    child_id: string;
    event: string;
    timestamp: string;
  }>;
  italian_state_signatures: {
    zecca_authority_signature: string;
    chain_integrity_signature: string;
    contrassegno_signature: string;
  };
  certificate_level: "ZECCA_GRADE_A" | "ZECCA_GRADE_B";
  transferable: boolean;
  nft_compatible: boolean;
}

// 🔐 NEW: Helper functions for working with models in existing QR codes

// Get model information from a QRCode
export function getQRCodeModel(qrCode: QRCode): QRModel | null {
  return qrCode.metadata?.model || null;
}

// Check if a QRCode was created with a specific model
export function isQRCodeModel(qrCode: QRCode, model: QRModel): boolean {
  return qrCode.metadata?.model === model;
}

// Get model configuration from a QRCode
export function getQRCodeModelConfig(
  qrCode: QRCode,
): QRModelConfig["features"] | null {
  return qrCode.metadata?.model_config || null;
}

// Check if QRCode has scan limits
export function hasQRCodeScanLimits(qrCode: QRCode): boolean {
  return !!(
    qrCode.metadata?.lifecycle?.max_scans ||
    qrCode.metadata?.security_features?.scan_limit_enforced
  );
}

// Get remaining scans for a QRCode
export function getRemainingScans(qrCode: QRCode): number | "unlimited" {
  const maxScans = qrCode.metadata?.lifecycle?.max_scans;
  if (!maxScans) return "unlimited";

  const currentScans = qrCode.scans || 0;
  return Math.max(0, maxScans - currentScans);
}

// Check if QRCode is expired
export function isQRCodeExpired(qrCode: QRCode): boolean {
  const expiresAt = qrCode.metadata?.lifecycle?.expires_at;
  if (!expiresAt) return false;

  return new Date(expiresAt) < new Date();
}

// QR Management State Interface
export interface QRManagementState {
  qrCodes: QRCode[];
  campaigns: Campaign[];
  selectedQR: QRCode | null;
  selectedCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;
  chartData: DailyScan[];
  filters: {
    search: string;
    contentType: ContentType | null;
    type: QRType | null;
    campaign: string | null;
  };
  viewPreferences: {
    view: ViewType;
    pageSize: number;
    sortField: SortField;
    sortDirection: SortDirection;
  };
}

// View Preferences Types
export type ViewType = "grid" | "list";
export type SortField = keyof QRCode;
export type SortDirection = "asc" | "desc";

// Daily Scan Data Interface
export interface DailyScan {
  date: string;
  scans: number;
}
