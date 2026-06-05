import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


// Import types from a single source
import {
  QRManagementState,
  QRCode,
  Campaign,
  QRType,
  ContentType,
  SortField,
  SortDirection,
  DailyScan,
  convertToQRCode,
} from "../../types/qr-types";

import qrApiService from "../../services/qrApiService";
import { useAuth } from "../../contexts/AuthContext";
import { convertToCampaign } from "../../services/types";

// Utility function for generating chart data (consider moving to a separate utility file)
const generateChartData = (
  qrCodes: QRCode[],
  range: "7d" | "30d" | "90d" | "all" = "30d",
): DailyScan[] => {
  const days =
    range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 180;
  const data: DailyScan[] = [];

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dailyScans = qrCodes.reduce((total, qr) => {
      // Distribute scans evenly across days
      return total + qr.scans / days;
    }, 0);

    data.push({
      date: date.toISOString().split("T")[0],
      scans: Math.round(dailyScans),
    });
  }

  return data;
};

// Type guard for date comparison
const isDateObject = (value: unknown): value is Date =>
  value instanceof Date ||
  (typeof value === "object" &&
    value !== null &&
    "getTime" in value &&
    typeof (value as Date).getTime === "function");

export const useQRManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Create initial state as a separate function for clarity
  const createInitialState = (): QRManagementState => ({
    qrCodes: [],
    campaigns: [],
    selectedQR: null,
    selectedCampaign: null,
    isLoading: true,
    error: null,
    chartData: [], // Will be populated on load
    filters: {
      search: "",
      contentType: null,
      type: null,
      campaign: null,
    },
    viewPreferences: {
      view: "grid",
      pageSize: 12,
      sortField: "createdAt",
      sortDirection: "desc",
    },
  });

  const [state, setState] = useState<QRManagementState>(createInitialState());

  // Fetch QR Codes and Campaigns
  const loadQRCodes = useCallback(async () => {
    if (!currentUser) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Add console.log to debug QR structure
      const userQRCodes = await qrApiService.listQRCodes();
      console.log("Raw QR codes from API:", userQRCodes); // ADD THIS

      // Handle campaigns endpoint that doesn't exist
      const userCampaigns = await qrApiService
        .listCampaigns()
        .catch((error) => {
          console.warn("Campaigns endpoint not available:", error);
          return { campaigns: [] }; // Return empty campaigns on error
        });

      const processedQRCodes = userQRCodes.map((qr: any) => {
        console.log("Processing QR:", qr); // ADD THIS to see structure
        return convertToQRCode(qr);
      });

      const processedCampaigns = userCampaigns.campaigns.map(convertToCampaign);

      setState((prev) => ({
        ...prev,
        qrCodes: processedQRCodes,
        campaigns: processedCampaigns,
        chartData: generateChartData(processedQRCodes),
        isLoading: false,
      }));
    } catch (err) {
      console.error("Error loading QR codes:", err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to load QR codes.",
        isLoading: false,
      }));
      toast.error("Failed to load QR codes");
    }
  }, [currentUser]);

  // Filter and sort QR codes
  const getFilteredQRCodes = useCallback((): QRCode[] => {
    const { qrCodes } = state;
    const { search, contentType, type, campaign } = state.filters;
    const { sortField, sortDirection } = state.viewPreferences;

    // Filter QR Codes
    let filteredCodes = qrCodes.filter((qr) => {
      const matchesSearch =
        !search ||
        qr.name.toLowerCase().includes(search.toLowerCase()) || // Use name
        qr.contentType.toLowerCase().includes(search.toLowerCase()) ||
        (qr.tags &&
          qr.tags.some((tag) =>
            tag.toLowerCase().includes(search.toLowerCase()),
          ));

      const matchesContentType = !contentType || qr.contentType === contentType;
      const matchesType = !type || qr.type === type;
      const matchesCampaign = !campaign || qr.campaign === campaign;

      return (
        matchesSearch && matchesContentType && matchesType && matchesCampaign
      );
    });

    // Sort filtered codes
    return filteredCodes.sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];

      // Improved date handling
      if (
        typeof valueA === "string" &&
        typeof valueB === "string" &&
        valueA.includes("T") &&
        valueB.includes("T")
      ) {
        return sortDirection === "asc"
          ? new Date(valueA).getTime() - new Date(valueB).getTime()
          : new Date(valueB).getTime() - new Date(valueA).getTime();
      }

      // If values are numbers, sort numerically
      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }

      // Default to string sorting
      return sortDirection === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
  }, [state.qrCodes, state.filters, state.viewPreferences]);

  // Event Handlers - Updated Functions
  const handleCreateQR = useCallback(() => {
    // Fix: Navigate to dashboard instead of dashboard/generate
    navigate("/dashboard");
  }, [navigate]);

  const handleEditQR = useCallback(
    (qr: QRCode) => {
      console.log("✏️ Navigating to QR edit:", qr.id); // Debug log
      navigate(`/dashboard?edit=${qr.id}`);
    },
    [navigate],
  );

  const handleViewQR = useCallback(
    (qr: QRCode) => {
      console.log("🔍 Navigating to QR details (public view):", qr.id); // Debug log
      navigate(`/qr-details/${qr.id}?public=true`);
    },
    [navigate],
  );

  const handleDeleteQR = useCallback(async (qr: QRCode) => {
    try {
      await qrApiService.deleteQRCode(qr.id);

      setState((prev) => ({
        ...prev,
        qrCodes: prev.qrCodes.filter((q) => q.id !== qr.id),
        selectedQR: null,
      }));

      toast.success("QR code deleted successfully");
    } catch (err) {
      console.error("Error deleting QR code:", err);
      toast.error("Failed to delete QR code");
    }
  }, []);

  // Campaign-related handlers
  const handleCreateCampaign = useCallback(
    async (
      name: string,
      description: string,
    ): Promise<Campaign | undefined> => {
      if (!currentUser) {
        console.warn("No authenticated user found. Cannot create campaign.");
        return undefined;
      }

      try {
        const newCampaign = await qrApiService.createCampaign(
          name,
          description,
        );

        const campaignToAdd: Campaign = {
          id: newCampaign?.id ?? "unknown-id",
          name,
          description,
          start_date: new Date().toISOString(), // ← FIXED: Convert Date to string
          status: "active",
          qrCount: 0,
          associated_qr_codes: [],
        };

        setState((prev) => ({
          ...prev,
          campaigns: [...prev.campaigns, campaignToAdd],
        }));

        toast.success("Campaign created successfully");
        return campaignToAdd;
      } catch (err) {
        console.error("Error creating campaign:", err);
        toast.error("Failed to create campaign");

        return {
          id: "error",
          name,
          description,
          start_date: new Date().toISOString(), // ← FIXED: Convert Date to string
          status: "draft",
          qrCount: 0,
          associated_qr_codes: [],
        };
      }
    },
    [currentUser],
  );

  return {
    state,
    setState,
    loadQRCodes,
    getFilteredQRCodes,
    handleCreateQR,
    handleEditQR,
    handleViewQR,
    handleDeleteQR,
    handleCreateCampaign,
    // Add explicit type annotations
    updateFilters: (newFilters: Partial<QRManagementState["filters"]>) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, ...newFilters },
      }));
    },
    updateViewPreferences: (
      newPreferences: Partial<QRManagementState["viewPreferences"]>,
    ) => {
      setState((prev) => ({
        ...prev,
        viewPreferences: { ...prev.viewPreferences, ...newPreferences },
      }));
    },
    calculateStaticQRPercentage: (qrCodes: QRCode[]): string => {
      if (qrCodes.length === 0) return "0%";
      const staticCount = qrCodes.filter(
        (qr: QRCode) => qr.type === "static",
      ).length;
      return `${(staticCount / qrCodes.length) * 100}%`;
    },
  };
};
