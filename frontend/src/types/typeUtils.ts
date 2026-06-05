import { QRType as ServiceQRType } from "../services/types";
import {
  QRType as TypesQRType,
  QRCode as TypesQRCode,
} from "../types/qr-types";
import { QRCode as ServiceQRCode } from "../services/types";

// Convert QRType from types/qr-types.ts to services/types.ts
export function convertQRType(type: TypesQRType): ServiceQRType {
  const typeMap: Record<TypesQRType, ServiceQRType> = {
    static: "static",
    dynamic: "dynamic",
    campaign: "dynamic",
    "self-scanning": "dynamic",
  };
  return typeMap[type];
}

// Convert QRCode from types/qr-types.ts to services/types.ts
export function convertQRCode(qrCode: TypesQRCode): ServiceQRCode {
  // Helper function to safely convert dates
  const convertDate = (dateValue: any): string => {
    if (!dateValue) return new Date().toISOString();
    if (typeof dateValue === "string") return dateValue;
    if (
      dateValue &&
      typeof dateValue === "object" &&
      dateValue instanceof Date
    ) {
      return dateValue.toISOString();
    }
    // Handle Firestore timestamp objects
    if (dateValue && typeof dateValue === "object" && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000).toISOString();
    }
    return new Date().toISOString();
  };

  return {
    id: qrCode.id,
    type: convertQRType(qrCode.type),
    name: qrCode.name || qrCode.title || "", // Ensure name is always present
    title: qrCode.title, // Include title for backward compatibility
    contentType: qrCode.contentType,
    createdAt: convertDate(qrCode.createdAt), // Use helper function
    lastScan: qrCode.lastScan, // Include lastScan if present
    scans: qrCode.scans, // Include scans
    campaign: qrCode.campaign, // Include campaign if present
    tags: qrCode.tags, // Include tags if present
    metadata: qrCode.metadata, // Include metadata if present

    // Handle data and userId with fallbacks
    data: "name" in qrCode ? qrCode.name : "", // Fallback to name if available
    userId: "", // Default empty string
    updatedAt: convertDate(qrCode.updatedAt || qrCode.createdAt), // Add a default updatedAt
  } as unknown as ServiceQRCode; // Use unknown as intermediate type
}
