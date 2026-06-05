// src/components/admin/EnhancedUserManagement.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Users, UserPlus } from "lucide-react";
import Spinner from "../common/Spinner";
import Alert from "../common/Alert";
import qrApiService from "../../services/qrApiService";
import { supabase } from "../../supabase/client";
import {
  QRType,
  ContentType,
  QRCodeData,
  Campaign,
} from "../../types/qr-types";

// Define the base URL for API calls - use the deployed backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

console.log(`QR API Service initialized with base URL: ${API_BASE_URL}`);

// Interfaces for admin-specific use
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

// Define the health check type
interface HealthCheckResponse {
  status: string;
}

// Define API functions
export const generateQR = async (data: string) => {
  const response = await qrApiService.generateQR(data); // ✅ Updated to use qrApiService
  return response;
};

export const listQRCodes = async () => {
  const response = await qrApiService.listQRCodes(); // ✅ Updated to use qrApiService
  return response;
};

export const verifyQR = async (qrId: string, formData: FormData) => {
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
    console.error("Error verifying QR code:", error);
    throw error;
  }
};

export const getTotalScans = async () => {
  // 🔧 This function is not yet implemented in qrApiService.ts
  // Commented out until implemented
  // const response = await qrApiService.getTotalScans();
  // return response;

  console.warn("getTotalScans is not implemented in qrApiService.ts");
  return 0; // Placeholder
};

export const getUserCount = async () => {
  const response = await qrApiService.getUserCount();
  return response;
};

export const getQRCodeCount = async () => {
  const response = await qrApiService.getQRCodeCount();
  return response;
};

export const getForgeryLogs = async () => {
  const response = await qrApiService.getForgeryLogs();
  return response;
};

export const getUserGrowth = async (timeRange: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/user-growth?range=${timeRange}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      thisMonth: data?.thisMonth ?? 0,
      lastMonth: data?.lastMonth ?? 0,
      percentChange: data?.percentChange ?? 0,
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
    const response = await fetch(
      `${API_BASE_URL}/admin/scan-trend?range=${timeRange}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      thisMonth: data?.thisMonth ?? 0,
      lastMonth: data?.lastMonth ?? 0,
      percentChange: data?.percentChange ?? 0,
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
    const response = await fetch(`${API_BASE_URL}/admin/today-stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching today's stats:", error);
    throw error;
  }
};

export const getUsers = async (filters = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add query parameters from filters
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Implement the healthCheck method
export const healthCheck = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Health check failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Health check error:", error);
    throw error;
  }
};

// Interfaces
interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "User" | "Moderator" | "Manufacturer";
  status: "Active" | "Inactive" | "Suspended";
  lastLogin?: string;
  qr_codes_generated: number;
  createdAt: string;
  phone?: string;
}

interface UserStats {
  totalQRCodes: number;
  totalScans: number;
  lastActivity?: string;
  activeCampaigns: number;
  activityHistory: Array<{ date: string; count: number }>;
}

interface FilterOptions {
  search: string;
  role: string | null;
  status: string | null;
}

const EnhancedUserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // States
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    role: null,
    status: null,
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "User" as "Admin" | "User" | "Moderator" | "Manufacturer",
    status: "Active" as "Active" | "Inactive" | "Suspended",
    password: "",
  });

  // Fetch users on component mount and when filters change
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        // In a real implementation, filters would be sent to the API
        const response = await qrApiService.getUsers(filters);
        setUsers(response);
        setError(null);
      } catch (err) {
        console.error("Failed to load users:", err);
        setError("Failed to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, navigate, filters]);

  // Handle form submission for creating/updating users
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedUser) {
        // Update existing user
        await qrApiService.updateUser(selectedUser.id.toString(), userForm);
        setUsers(
          users.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  name: userForm.name,
                  email: userForm.email,
                  role: userForm.role as
                    | "Admin"
                    | "User"
                    | "Moderator"
                    | "Manufacturer",
                  status: userForm.status as
                    | "Active"
                    | "Inactive"
                    | "Suspended",
                  password: undefined,
                }
              : user,
          ),
        );
      } else {
        // Create new user
        const newUser = await qrApiService.createUser(userForm);
        setUsers([...users, newUser]);
      }

      setShowUserModal(false);
    } catch (err) {
      console.error("Failed to save user:", err);
      setError("Failed to save user. Please try again.");
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await qrApiService.deleteUser(userId.toString());
      setUsers(users.filter((user) => user.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError("Failed to delete user. Please try again.");
    }
  };

  // Handle user status toggle
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "Active" ? "Suspended" : "Active";

    try {
      await qrApiService.updateUserStatus(user.id.toString(), newStatus);
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, status: newStatus as any } : u,
        ),
      );

      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, status: newStatus as any });
      }
    } catch (err) {
      console.error("Failed to update user status:", err);
      setError("Failed to update user status. Please try again.");
    }
  };

  // Fetch user stats when a user is selected
  useEffect(() => {
    if (selectedUser) {
      const fetchUserStats = async () => {
        try {
          const stats = await qrApiService.getUserStats(
            selectedUser.id.toString(),
          ); // 🔧 Converted userId to string
          setUserStats(stats);
        } catch (err) {
          console.error("Failed to load user stats:", err);
        }
      };

      fetchUserStats();
    } else {
      setUserStats(null);
    }
  }, [selectedUser]);

  // Initialize form when editing a user
  useEffect(() => {
    if (selectedUser && showUserModal) {
      setUserForm({
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        status: selectedUser.status,
        password: "", // We don't populate the password field for security
      });
    } else if (!showUserModal) {
      // Reset form when modal is closed
      setUserForm({
        name: "",
        email: "",
        role: "User" as "Admin" | "User" | "Moderator" | "Manufacturer",
        status: "Active" as "Active" | "Inactive" | "Suspended",
        password: "",
      });
    }
  }, [selectedUser, showUserModal]);

  // Filter users based on search term and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      filters.search === "" ||
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());

    const matchesRole = filters.role === null || user.role === filters.role;
    const matchesStatus =
      filters.status === null || user.status === filters.status;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <Users className="mr-3 text-blue-600" />
          User Management
        </h1>
        <button
          onClick={() => {
            setSelectedUser(null);
            setShowUserModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <UserPlus className="mr-2" />
          Add New User
        </button>
      </div>

      {/* User table and other components would go here */}
    </div>
  );
};

export default EnhancedUserManagement;
