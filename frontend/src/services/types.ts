import { Timestamp } from "../utils/timestampUtils";
import {
  safeConvertToTimestamp,
  safeConvertToDate,
  safeConvertToISOString,
} from "../utils/timestampUtils";

// Basic types for QR codes
export type QRType = "static" | "dynamic";
export type ContentType = "url" | "text" | "email" | "phone" | "vcard" | "wifi";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

// View and sort types
export type ViewType = "grid" | "list";
export type SortField = "createdAt" | "title" | "scans";
export type SortDirection = "asc" | "desc";

// Flexible date input type
export type DateInput = Date | Timestamp | string | number | null | undefined;

// QR Code Input interface
export interface QRCodeInput {
  title: string;
  data: string;
  type?: QRType;
  contentType?: ContentType;
  campaign?: string | null;
  tags?: string[];
  lastScan?: DateInput;
  bgColor?: string;
  fgColor?: string;
}

// QR Code interface
export interface QRCode {
  id: string;
  name: string; // Name of the QR code
  title?: string; // Optional title
  createdAt: Date; // Date when the QR code was created
  updatedAt: Date; // Date when the QR code was last updated
  campaign: string; // Campaign ID associated with the QR code
  contentType: string; // Type of content (e.g., URL, text)
  tags?: string[]; // Optional tags for categorization
  type: QRType; // QR code type
  scans: number; // Total number of scans
  lastScan?: Date; // Optional date of the last scan
  imageUrl?: string; // Optional URL of the QR code image
  data: any; // Data associated with the QR code
  userId: string; // User ID of the owner
  intensity?: number; // Optional intensity value
}

// QR Code Data interface for API responses
export interface QRCodeData {
  qr_id: string;
  title?: string;
  type: string; // Required
  contentType: string; // Required
  userId: string; // Required
  campaign: string; // Required
  tags?: string[];
  lastScan?: string;
  createdAt: string;
  updatedAt?: string;
  data: string;
  imageUrl: string;
  intensity: number;
  name?: string;
  description?: string;
  scans?: number;
  bgColor?: string;
  fgColor?: string;
}

// Campaign interface
export interface Campaign {
  id: string; // Campaign ID
  userId: string; // User ID of the campaign owner
  name: string; // Name of the campaign
  description: string; // Description of the campaign
  createdAt: Date; // Date when the campaign was created
  updatedAt: Date; // Date when the campaign was last updated
  qrCount: number; // Number of QR codes in the campaign
  totalScans: number; // Total number of scans across all QR codes in the campaign
}

// QR Code Statistics interface
export interface QRCodeStats {
  qr_id?: string;
  totalScans: number;
  lastScan: string | null;
  dailyScans?: DailyScan[];
}

// ForgeryLog interface
export interface ForgeryLog {
  id: string; // Unique ID of the forgery log
  message: string; // Message describing the forgery
  timestamp: Date; // Date and time of the forgery log
  is_potential_forgery?: boolean; // Add this optional property
}

// Conversion utility for QRCode
export function convertToQRCode(data: QRCodeData): QRCode {
  return {
    id: data.qr_id,
    name: data.name || "",
    title: data.title ?? "",
    createdAt: new Date(data.createdAt),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    campaign: data.campaign ?? "",
    contentType: data.contentType || "",
    tags: data.tags ?? [],
    type: data.type as QRType,
    scans: data.scans || 0,
    lastScan: data.lastScan ? new Date(data.lastScan) : undefined,
    imageUrl: data.imageUrl || "",
    data: data.data || null,
    userId: data.userId || "",
    intensity: data.intensity,
  };
}

// Convert campaign data
export function convertToCampaign(data: any): Campaign {
  return {
    id: data.id || "",
    userId: data.userId || "",
    name: data.name || "",
    description: data.description || "",
    createdAt: new Date(data.createdAt || Date.now()),
    updatedAt: new Date(data.updatedAt || Date.now()),
    qrCount: data.qrCount || 0,
    totalScans: data.totalScans || 0,
  };
}

// Management State
export interface QRManagementState {
  qrCodes: QRCode[];
  campaigns: Campaign[];
  selectedQR: QRCode | null;
  selectedCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;
  chartData: DailyScan[];
  filters: {
    search?: string;
    contentType?: ContentType | null;
    type?: QRType | null;
    campaign?: string | null;
  };
  viewPreferences: {
    view: ViewType;
    pageSize: number;
    sortField: SortField;
    sortDirection: SortDirection;
  };
}

// Daily scan data for charts
export interface DailyScan {
  date: string;
  scans: number;
}
