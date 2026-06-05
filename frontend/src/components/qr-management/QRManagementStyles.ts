import { QRCode, QRType, Campaign } from "../../types/qr-types"; // Standardized imports
import {
  safeConvertToISOString,
  safeConvertToDate,
} from "../../utils/timestampUtils";

// Color Utility Functions
export const getQRTypeColorClasses = {
  dynamic: {
    background: "bg-green-500",
    text: "text-green-600",
    backgroundLight: "bg-green-100",
    borderLight: "border-green-200",
  },
  static: {
    background: "bg-blue-500",
    text: "text-blue-600",
    backgroundLight: "bg-blue-100",
    borderLight: "border-blue-200",
  },
};

// Updated selectQRTypeColor function
export const selectQRTypeColor = (
  type: QRType, // Ensure QRType is imported from types/qr-types
  style: "text" | "background" = "background",
) => {
  const qrType =
    type === "campaign" || type === "self-scanning" ? "dynamic" : type;

  const colorMap = {
    dynamic: {
      text: "text-blue-700",
      background: "bg-blue-500",
    },
    static: {
      text: "text-gray-700",
      background: "bg-gray-500",
    },
  };

  return colorMap[qrType][style];
};

// Calculation Utilities
export const calculateStatistics = {
  staticQRPercentage: (qrCodes: QRCode[]): string => {
    if (qrCodes.length === 0) return "0%";
    const staticCount = qrCodes.filter((qr) => qr.type === "static").length;
    return `${(staticCount / qrCodes.length) * 100}%`;
  },

  totalScans: (qrCodes: QRCode[]): number => {
    return qrCodes.reduce((sum, qr) => sum + qr.scans, 0);
  },

  campaignStats: (qrCodes: QRCode[], campaigns: Campaign[]) => {
    return campaigns.map((campaign) => ({
      ...campaign,
      totalQRs: qrCodes.filter((qr) => qr.campaign === campaign.id).length,
      totalScans: qrCodes
        .filter((qr) => qr.campaign === campaign.id)
        .reduce((sum, qr) => sum + qr.scans, 0),
    }));
  },
};

// Formatting Utilities
export const formatters = {
  date: (date: Date | string): string => {
    const formattedDate = safeConvertToDate(date);
    return formattedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  scanCount: (scans: number): string => {
    if (scans < 1000) return scans.toString();
    if (scans < 1000000) return `${(scans / 1000).toFixed(1)}K`;
    return `${(scans / 1000000).toFixed(1)}M`;
  },
};

// Icon and Content Type Utilities
export const iconSelectors = {
  contentTypeIcon: (contentType: string): string => {
    const iconMap: { [key: string]: string } = {
      url: "ExternalLink",
      vcard: "Calendar",
      text: "FileText",
      contact: "User",
      wifi: "Wifi",
      default: "Eye",
    };
    return iconMap[contentType] || iconMap["default"];
  },

  qrTypeIcon: (type: "dynamic" | "static"): string => {
    return type === "dynamic" ? "Zap" : "Lock";
  },
};

// Chart and Data Visualization Utilities
export const chartHelpers = {
  calculateBarHeight: (scans: number, maxScans: number): number => {
    return maxScans ? (scans / maxScans) * 100 : 0;
  },

  generateChartColors: (length: number): string[] => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-purple-500",
    ];
    return Array.from({ length }, (_, i) => colors[i % colors.length]);
  },
};

// Sorting and Filtering Utilities
export const sortingHelpers = {
  sortQRCodes: (
    qrCodes: QRCode[],
    field: keyof QRCode,
    direction: "asc" | "desc",
  ): QRCode[] => {
    return [...qrCodes].sort((a, b) => {
      const valueA = a[field];
      const valueB = b[field];

      if (valueA instanceof Date && valueB instanceof Date) {
        return direction === "asc"
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      if (
        typeof valueA === "string" &&
        typeof valueB === "string" &&
        valueA.includes("T") &&
        valueB.includes("T")
      ) {
        return direction === "asc"
          ? new Date(valueA).getTime() - new Date(valueB).getTime()
          : new Date(valueB).getTime() - new Date(valueA).getTime();
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      return direction === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
  },
};

// Additional Utility Functions
export const generateDynamicHeightClass = (heightPercentage: number): string =>
  heightPercentage > 0 ? `h-[${heightPercentage}%]` : "h-0";
