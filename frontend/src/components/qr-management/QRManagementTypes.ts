import { Timestamp } from "../../utils/timestampUtils";

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  qrCount: number;
  totalScans: number;
}

export interface QRCode {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  data: string;
  intensity: number;
  image_url: string;
  scans: number;
  lastScan: Timestamp | null;
  title: string;
  type: QRType;
  contentType: string;
  campaign?: string;
  tags?: string[];
}

export type QRType = "static" | "dynamic";

export interface DailyScan {
  date: string;
  scans: number;
}

export interface QRManagementState {
  activeView: "grid" | "list";
  qrCodes: QRCode[];
  campaigns: Campaign[];
  selectedQR: QRCode | null;
  selectedCampaign: Campaign | null;
  searchTerm: string;
  showDeleteModal: boolean;
  showCreateCampaignModal: boolean;
  newCampaignName: string;
  newCampaignDescription: string;
  isLoading: boolean;
  error: string | null;
  sortField: keyof QRCode;
  sortDirection: "asc" | "desc";
  chartData: DailyScan[];
  dateRange: "7d" | "30d" | "90d" | "all";
}
