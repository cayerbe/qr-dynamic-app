// src/types/qr-models.ts
// This extends your existing qr-types.ts

import { QRType, ContentType, ErrorCorrectionLevel, QRCode } from "./qr-types";

// 🔐 NEW: Model types that extend your existing system
export type QRModel = "fintech" | "luxury" | "commodity";

export type SecurityLevel = "micro" | "standard" | "large" | "industrial";

export interface QRModelConfig {
  name: string;
  icon: string;
  description: string;
  scansLimit: number | "unlimited";

  features: {
    // Physical properties
    size_mm: number;
    intensity: number;

    // Security features
    anti_photocopy: boolean;
    security_level: SecurityLevel;
    print_profile: "offset_industrial" | "digital_press" | "large_format";
    substrate_type: "security_paper" | "standard_paper" | "synthetic_paper";

    // QR Code properties - ADD THIS
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";

    // Lifecycle management
    expiration_days?: number;
    max_scans?: number;

    // CDP Configuration
    cdp_config: {
      pattern_density: number;
      noise_layers: number;
      frequency_bands: number;
      correlation_threshold: number;
      anti_ml_features: boolean;
    };

    // Genealogy features - FIX THIS (make can_mint_children optional)
    genealogy?: {
      enabled: boolean;
      can_mint_children?: boolean; // Changed from required to optional
      max_children?: number;
      generation_limit?: number;
    };
  };

  // Pricing and business logic
  pricing: {
    setup_fee: number;
    monthly_fee: number;
    per_scan_fee: number;
    overage_fee?: number;
  };

  // UI configuration
  ui: {
    primary_color: string;
    secondary_color: string;
    show_analytics: boolean;
    custom_branding: boolean;
  };

  // Restrictions and permissions
  restrictions: {
    max_qr_codes?: number;
    allowed_content_types: string[];
    admin_approval_required: boolean;
  };
}

// 🔐 Model configurations that work with your existing QRCode interface
export const QR_MODEL_CONFIGS: Record<QRModel, QRModelConfig> = {
  fintech: {
    name: "Fintech Model",
    icon: "💳",
    description: "One-time use for payments & tickets",
    scansLimit: 1,
    features: {
      size_mm: 15.0,
      intensity: 0.8,
      anti_photocopy: true,
      security_level: "industrial", // Maps to your size-adaptive CDP
      print_profile: "offset_industrial",
      substrate_type: "security_paper",
      expiration_days: 1,
      max_scans: 1,
      cdp_config: {
        pattern_density: 10,
        noise_layers: 8,
        frequency_bands: 10,
        correlation_threshold: 0.95,
        anti_ml_features: true,
      },
      genealogy: {
        enabled: true,
        can_mint_children: true,
        max_children: 5,
        generation_limit: 3,
      },
    },
    pricing: {
      setup_fee: 50,
      monthly_fee: 10,
      per_scan_fee: 0.5,
    },
    ui: {
      primary_color: "#00ADEF",
      secondary_color: "#FFFFFF",
      show_analytics: true,
      custom_branding: true,
    },
    restrictions: {
      max_qr_codes: 1000,
      allowed_content_types: ["text/plain", "application/json"],
      admin_approval_required: true,
    },
  },

  luxury: {
    name: "Luxury Model",
    icon: "💎",
    description: "Multi-scan for high-value authentication",
    scansLimit: 10,
    features: {
      size_mm: 25.0,
      intensity: 0.9,
      anti_photocopy: true,
      security_level: "large", // Maps to your size-adaptive CDP
      print_profile: "offset_industrial",
      substrate_type: "security_paper",
      expiration_days: 30,
      max_scans: 10,
      cdp_config: {
        pattern_density: 7,
        noise_layers: 6,
        frequency_bands: 7,
        correlation_threshold: 0.92,
        anti_ml_features: true,
      },
      genealogy: {
        enabled: true,
        can_mint_children: true,
        max_children: 3,
        generation_limit: 2,
      },
    },
    pricing: {
      setup_fee: 200,
      monthly_fee: 50,
      per_scan_fee: 2.0,
    },
    ui: {
      primary_color: "#FFD700",
      secondary_color: "#FFFFFF",
      show_analytics: true,
      custom_branding: true,
    },
    restrictions: {
      max_qr_codes: 500,
      allowed_content_types: ["text/plain", "application/json", "image/png"],
      admin_approval_required: true,
    },
  },

  commodity: {
    name: "Commodity Model",
    icon: "📦",
    description: "Unlimited scans for mass production",
    scansLimit: "unlimited",
    features: {
      size_mm: 20.0,
      intensity: 0.6,
      anti_photocopy: true,
      security_level: "standard", // Maps to your size-adaptive CDP
      print_profile: "digital_press",
      substrate_type: "standard_paper",
      cdp_config: {
        pattern_density: 5,
        noise_layers: 4,
        frequency_bands: 5,
        correlation_threshold: 0.9,
        anti_ml_features: true,
      },
      genealogy: {
        enabled: false,
      },
    },
    pricing: {
      setup_fee: 10,
      monthly_fee: 5,
      per_scan_fee: 0.01,
    },
    ui: {
      primary_color: "#FFFFFF",
      secondary_color: "#000000",
      show_analytics: false,
      custom_branding: false,
    },
    restrictions: {
      max_qr_codes: 10000,
      allowed_content_types: ["text/plain"],
      admin_approval_required: false,
    },
  },
};

// 🔐 Helper function to extend your existing QRCode.metadata with model config
export function createModelMetadata(
  model: QRModel,
  additionalData?: Partial<QRCodeMetadata>,
): QRCodeMetadata {
  const config = QR_MODEL_CONFIGS[model];

  return {
    model,
    model_config: config.features,
    model_lifecycle: {
      scan_limit: config.scansLimit,
      can_expire: !!config.features.expiration_days,
      default_expiry_days: config.features.expiration_days || 0,
    },
    model_pricing: config.pricing || {},

    // CDP config
    cdp_config: {
      size_mm: config.features.size_mm,
      intensity: config.features.intensity,
      anti_photocopy: config.features.anti_photocopy,
      security_level: config.features.security_level,
      print_profile: config.features.print_profile,
      substrate_type: config.features.substrate_type,
      ...config.features.cdp_config,
    },

    // Security features
    security_features: {
      anti_forgery: config.features.anti_photocopy,
      noise_layers: config.features.cdp_config.noise_layers,
      frequency_bands: config.features.cdp_config.frequency_bands,
      correlation_threshold: config.features.cdp_config.correlation_threshold,
      anti_ml_features: config.features.cdp_config.anti_ml_features,
    },

    // Genealogy settings
    enable_genealogy: config.features.genealogy?.enabled ?? false,
    can_mint_children: config.features.genealogy?.can_mint_children ?? false,

    // Merge any additional data
    ...additionalData,
  } as QRCodeMetadata;
}

// 🔐 Type guard to check if QRCode uses a specific model
export function isModelQRCode(qrCode: any, model: QRModel): boolean {
  return qrCode?.metadata?.model === model;
}

// 🔐 Helper to get model config from existing QRCode
export function getModelFromQRCode(qrCode: any): QRModel | null {
  return qrCode?.metadata?.model || null;
}

// 🔐 Validation function for model configurations
export function validateModelConfig(model: QRModel): boolean {
  const config = QR_MODEL_CONFIGS[model];
  if (!config) return false;

  // Validate required fields
  return !!(
    config.features.size_mm > 0 &&
    config.features.intensity >= 0 &&
    config.features.intensity <= 1 &&
    config.features.cdp_config &&
    config.features.errorCorrectionLevel
  );
}

// 🔐 Function to merge model config with custom parameters
export function mergeModelWithCustom(
  model: QRModel,
  customizations: Partial<QRModelConfig["features"]>,
): QRModelConfig["features"] {
  const baseConfig = QR_MODEL_CONFIGS[model].features;

  return {
    ...baseConfig,
    ...customizations,
    // Ensure CDP config is properly merged
    cdp_config: {
      ...baseConfig.cdp_config,
      ...(customizations.cdp_config || {}),
    },
  };
}

// 🔐 Export for Dashboard component integration
export interface ModelSelectionState {
  selectedModel: QRModel;
  modelConfig: QRModelConfig;
  isModelOverridden: boolean;
  customizations: Partial<QRModelConfig["features"]>;
}

// 🔐 Hook-style interface for React components
export interface UseModelSelection {
  selectedModel: QRModel;
  modelConfig: QRModelConfig;
  setModel: (model: QRModel) => void;
  updateCustomization: (updates: Partial<QRModelConfig["features"]>) => void;
  getEffectiveConfig: () => QRModelConfig["features"];
  resetToDefaults: () => void;
}

// 🔐 Integration with your existing API payload structure
export interface EnhancedQRGenerationPayload {
  // Your existing fields
  data: string;
  size_mm?: number;
  intensity?: number;
  metadata?: Record<string, any>;
  admin_user?: boolean;
  anti_photocopy?: boolean;

  // NEW: Model-specific fields
  model: QRModel;
  model_config: QRModelConfig["features"];

  // Enhanced expiration (extends your existing expiration_config)
  expiration_config: {
    type: "relative" | "absolute" | "never";
    relative_days?: number;
    absolute_date?: string;
    max_scans?: number; // NEW: scan-based expiration
  };
}

// 🔐 Response type that extends your existing API responses
export interface EnhancedQRGenerationResponse {
  success: boolean;
  qr_id: string;
  verification_id: string;
  verification_url: string;
  image_url: string;
  security_features: Record<string, any>;
  size_mm: number;
  security_level: string;

  // NEW: Model information
  model: QRModel;
  model_config: QRModelConfig["features"];
  scan_limits: {
    max_scans: number | "unlimited";
    current_scans: number;
    expires_at?: string;
  };

  message: string;
  base64_image?: string;
}

// 🔐 Extended QRCode metadata interface
export interface QRCodeMetadata {
  model?: QRModel;
  model_config?: any;
  model_lifecycle?: any;
  model_pricing?: any;
  cdp_config?: any;
  security_features?: any;
  scan_limit?: number;
  can_expire?: boolean;
  default_expiry_days?: number;
  enable_genealogy?: boolean;
  can_mint_children?: boolean;
  [key: string]: any;
}
